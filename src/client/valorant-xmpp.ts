import { TLSSocket } from "tls";
import { EventEmitter } from "events";

import { CookieAuth, PasswordAuth, TokenAuth, TokenStorage, ValorantAuth, ValorantAuthConfig } from "./valorant-auth";
import { XmppClient } from "./xmpp";
import { clientName, fetchFriends, mechanism, rxep, setupSession, xmlDeclaration } from "./xml-objects";
import { formatPresence, PresenceOutput } from "./presence/presence";
import { Jid, parseJid } from "../helpers/parsers";
import { PresenceBuilder, KeystonePresenceBuilder } from "../builders/builders";
import { formatRoster, RosterOutput } from "./friends/friends";

const defaultConfig: ValorantXmppConfig = {
    autoReconnect: true,
    maxReconnectAttempts: 5,
    reconnectAttemptsTimeframe: 15000,
    updatePresenceInterval: 120000
}

const buildConfig = (options: ValorantXmppConfig) => new Object({ ...defaultConfig, ...options });

export class ValorantXmppClient extends EventEmitter {
    _reconnects: Array<number>;

    _authInstance: ValorantAuth;
    _xmppInstance: XmppClient;
    
    _config: ValorantXmppConfig;

    _presence: PresenceBuilder;

    self: Account;

    friends: Array<Friend> | null;

    get presence() {
        if(typeof this._presence === 'undefined' || !(this._presence instanceof PresenceBuilder))
            this.presence = new PresenceBuilder()
                .addKeystonePresence(new KeystonePresenceBuilder());
        return this._presence;
    }
    set presence(presence: PresenceBuilder) {
        this._presence = presence;
    }

    get tokenStorage() {
        if(typeof this._authInstance === 'undefined')
            throw new Error('could not get auth instance, please run .login() first')
        if(typeof this.self.tokenStorage === 'undefined')
            throw new Error('could not get token storage, did you forget to await?')
        return this.self.tokenStorage;
    }
    set tokenStorage(tokenStorage) {
        this.self.tokenStorage = tokenStorage;
    }

    get reconnects() {
        this._reconnects =
            this._reconnects.filter(date => date + this._config.reconnectAttemptsTimeframe > Date.now());
        return this._reconnects;
    }

    constructor(config?: ValorantXmppConfig) {
        super();
        this._config = buildConfig(config);
        // this._eventEmitter = new EventEmitter();
        this.self = new Account();
        this._reconnects = new Array();
    }

    async _mainLoop() {
        let sendPresence: NodeJS.Timer;
        try {
            sendPresence = setInterval(async () => { await this.sendPresence(); },
                typeof this._config.updatePresenceInterval === 'number'
                    ? this._config.updatePresenceInterval
                    : this._config.updatePresenceInterval());
            
            while(true) {
                const responses: Array<[string, any]>
                    = Object.entries(await this._xmppInstance.readXml());
                
                for (const response of responses) {
                    const [ type, data ]  = response;

                    switch(type) {
                        case "presence":
                            if(Array.isArray(data)) {
                                for(const presence of data)
                                    this.emit('presence', formatPresence(presence));
                                break;
                            }
        
                            this.emit('presence', formatPresence(data));
                            break;
                        case "message":
                            this.emit('message', data);
                            break;
                        case "iq":
                            if(Array.isArray(data)) {
                                for(const roster of data)
                                    this.emit('roster', formatRoster(roster));
                                break;
                            }

                            const roster = formatRoster(data);
                            this.emit('roster', roster);

                            // if(roster.type === 'result')
                            //     this.friends = roster.roster;
                            // else if (roster.type === 'set') {
                            //     if(typeof this.friends === 'undefined')
                            //         throw new Error('friends list is undefined, did you forget to await somewhere?');
                            //     // if(this.friends === null)
                                    
                            // }
                            // else throw new Error('unknown type');
                            break;
                    }
                }
            }
        } catch(err) {
            // stop sending presence
            clearInterval(sendPresence);

            // clean up everything just in case
            this._xmppInstance.destroy();

            if(this.reconnects.length > this._config.maxReconnectAttempts)
                return this.emit('error',
                    new Error('There have been too many reconnects within specified timeframe.'));
            
            // if we have auto reconnect enabled and the connection was closed try reconnecting
            if(((err.type === 'error' && err.error.code === 'EPIPE') || err.type === 'close')
                && this._config?.autoReconnect) return await this.login();

            this.emit('error', err);
        }
    }

    async login(options?: PasswordAuth | TokenAuth | CookieAuth) {
        this.reconnects.push(Date.now());

        this._authInstance = new ValorantAuth(this, this._config?.authConfig);
        await this._authInstance.login(options);
        
        // connect to xmpp
        this._xmppInstance = await new XmppClient()
            .connect({ port: 5223, host: `${this.tokenStorage.region.affinity}.chat.si.riotgames.com` });
        
        // send declaration
        await this._xmppInstance.send(xmlDeclaration(this.tokenStorage.region).replace(/\s\s+/gi, ''));
        
        // read declaration and mechanism request
        if(typeof XmppClient.parseXml(await this._xmppInstance.read())['stream:features'] === 'undefined')
            await this._xmppInstance.read();

        // send mechanism
        await this._xmppInstance.sendXml(mechanism(this.tokenStorage.accessToken, this.tokenStorage.pasToken));
        
        // check if auth was succesful
        const { success } = await this._xmppInstance.readXml();
        if(typeof success === 'undefined')
            throw new Error('auth error');
        
        await this._xmppInstance.send(xmlDeclaration(this.tokenStorage.region).replace(/\s\s+/gi, ''));
        
        if(typeof XmppClient.parseXml(await this._xmppInstance.read())['stream:features'] === 'undefined')
            await this._xmppInstance.read();

        await this._xmppInstance.sendXml(clientName());
        
        const { jid } = (await this._xmppInstance.readXml()).iq.bind;

        this.self.jid = { jid, ...parseJid(jid) };

        await this._xmppInstance.sendXml(rxep());

        await this._xmppInstance.read();

        await this._xmppInstance.sendXml(setupSession());

        const { name, tagline } = (await this._xmppInstance.readXml()).iq.session.id;

        this.self.name = name;
        this.self.tagline = tagline;

        await this.sendPresence()

        await this._xmppInstance.sendXml(fetchFriends());
        
        this.emit('ready');
        this._mainLoop();
    }

    sendPresence = () => this._xmppInstance.send(XmppClient.buildXml(this.presence._toXmlObject()))

    fetchFriends = async () => {
        await this._xmppInstance.sendXml(fetchFriends());
        return this.friends;
    };
}

interface ValorantXmppClientEvents {
    'ready': () => void;
    'presence': (presence: PresenceOutput) => void;
    'message': (message: any) => void;
    'roster': (roster: RosterOutput) => void;
    'error': (error: Error) => void;
}

export declare interface ValorantXmppClient {
    on<U extends keyof ValorantXmppClientEvents>(
        event: U, listener: ValorantXmppClientEvents[U]
    ): this;

    once<U extends keyof ValorantXmppClientEvents>(
        event: U, listener: ValorantXmppClientEvents[U]
    ): this;
  
    emit<U extends keyof ValorantXmppClientEvents>(
        event: U, ...args: Parameters<ValorantXmppClientEvents[U]>
    ): boolean;
}

export interface JidObject extends Jid {
    jid: string
}

export class Account {
    jid: JidObject;
    name: string;
    tagline: string;
    tokenStorage: TokenStorage;

    constructor() {
        for(const element in this) {
            if(typeof this[element] !== 'function')
                this[element] = null;
        }

        return this;
    }

    from = (obj: AccountObject) => {
        const accountInstance = new Account();

        for(const element in accountInstance) {
            if(typeof accountInstance[element] !== 'function')
                this[element] = obj[element];
        }

        return this;
    }
}

export class Friend {
    jid: JidObject;
    puuid: string;
    name: string;
    tagline: string;
    lolName: string;
    preferredName: string;
    lastPresence: PresenceOutput | null;
    isFriend: boolean;
    isIncoming: boolean;
    isOutgoing: boolean;

    constructor() {
        for(const element in this) {
            if(typeof this[element] !== 'function')
                this[element] = null;
        }

        return this;
    }

    from = (obj: FriendObject) => {
        const friendInstance = new Friend();

        for(const element in friendInstance) {
            if(typeof friendInstance[element] !== 'function')
                this[element] = obj[element];
        }

        return this;
    }
}

interface ValorantXmppConfig {
    autoReconnect?: boolean
    maxReconnectAttempts?: number
    reconnectAttemptsTimeframe?: number
    authConfig?: ValorantAuthConfig
    updatePresenceInterval?: number | Function
}

interface AccountObject {
    jid?: JidObject
    name?: string
    tagline?: string
    tokenStorage?: TokenStorage
}

interface FriendObject {
    jid?: JidObject
    puuid?: string
    name?: string
    tagline?: string
    lolName?: string
    preferredName?: string
    isFriend?: boolean
    isIncoming?: boolean
    isOutgoing?: boolean
}