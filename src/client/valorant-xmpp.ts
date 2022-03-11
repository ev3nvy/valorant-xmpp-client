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

const defaultTokenStorage: TokenStorage = {
    accessToken: null,
    pasToken: null,
    entitlementsToken: null,
    puuid: null,
    region: null,
    ssidCookie: null
}

const defaultAccount: Account = {
    jid: null,
    name: null,
    tagline: null,
    tokenStorage: null
}

const buildConfig = (options: ValorantXmppConfig) => new Object({ ...defaultConfig, ...options });

export class ValorantXmppClient extends EventEmitter {
    _isReady: boolean;
    _isCloseRequested: boolean;

    _reconnects: Array<number>;

    _authInstance: ValorantAuth;
    _xmppInstance: XmppClient;
    
    _config: ValorantXmppConfig;

    _presence: PresenceBuilder;
    _presenceInterval: NodeJS.Timer; 

    _account: Account;
    friends: Array<Friend>;

    getXmppInstance = async (): Promise<XmppClient> => new Promise((resolve) => {
        const onReady = () => {
            this.removeListener('ready', onReady);
            resolve(this._xmppInstance);
        }
         
        if(!this._isReady) {
            this.on('ready', onReady);
        }
        resolve(this._xmppInstance);
    });

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
        return { ...defaultTokenStorage, ...this.account.tokenStorage };
    }
    set tokenStorage(tokenStorage) {
        this.account = { tokenStorage: { ...this.tokenStorage, ...tokenStorage }};
    }

    get account() {
        return { ...defaultAccount, ...this._account };
    }

    set account(account) {
        this._account = { ...this.account, ...account };
    }

    get reconnects() {
        this._reconnects =
            this._reconnects.filter(date => date + this._config.reconnectAttemptsTimeframe > Date.now());
        return this._reconnects;
    }

    constructor(config?: ValorantXmppConfig) {
        super();
        this._isReady = false;
        this._isCloseRequested = false;
        this._config = buildConfig(config);
        this._reconnects = new Array();
    }

    async _handleData(type: string, data: any) {
        switch(type) {
            case "presence":
                this.emit('presence', formatPresence(data));
                break;
            case "message":
                this.emit('message', data);
                break;
            case "iq":
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

    async _mainLoop() {
        try {
            this._presenceInterval = setInterval(async () => { await this.sendPresence(); },
                typeof this._config.updatePresenceInterval === 'number'
                    ? this._config.updatePresenceInterval
                    : this._config.updatePresenceInterval());
            
            while(true) {
                const responses: Array<[string, any]>
                    = Object.entries(await this._xmppInstance.readXml());
                
                for (const response of responses) {
                    const [ type, data ]  = response;
                    
                    if(Array.isArray(data))
                        for(const xmlObj of data)
                            this._handleData(type, xmlObj);
                    
                    else this._handleData(type, data);
                }
            }
        } catch(err) {
            this._isReady = false;

            // condition - so that if statement isn't enormous
            const isError = err.type === 'error'
                && (err.error.code === 'EPIPE' || err.error.code === 'ECONNRESET');

            // stop sending presence
            clearInterval(this._presenceInterval);

            // if an error was thrown destroy the instance
            if(isError || (err.type === 'close' && err.hadError))
                this._xmppInstance.destroy();
            this._authInstance.destroy();

            if(this.reconnects.length > this._config.maxReconnectAttempts)
                return this.emit('error',
                    new Error('There have been too many reconnects within specified timeframe.'));
            
            // this disconnect was intentional so don't reconnect/throw error 
            if(this._isCloseRequested) return;
            
            // if we have auto reconnect enabled and the connection was closed try reconnecting
            if(this._config?.autoReconnect && (err.type === 'close' || isError))
                return await this.login();

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

        this.account = { jid: { jid, ...parseJid(jid) } };

        await this._xmppInstance.sendXml(rxep());

        await this._xmppInstance.read();

        await this._xmppInstance.sendXml(setupSession());

        const { name, tagline } = (await this._xmppInstance.readXml()).iq.session.id;

        this.account = { name, tagline };

        await this.sendPresence()

        await this._xmppInstance.sendXml(fetchFriends());
        
        this.emit('ready');
        this._isReady = true;
        this._mainLoop();
    }

    sendPresence = async () => (await this.getXmppInstance()).send(XmppClient.buildXml(this.presence._toXmlObject()))

    fetchFriends = async () => {
        await (await this.getXmppInstance()).sendXml(fetchFriends());
        return this.friends;
    };

    end = () => {
        this._isCloseRequested = true;
        this._xmppInstance.end();     
        this.removeAllListeners();
    }
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

interface ValorantXmppConfig {
    autoReconnect?: boolean
    maxReconnectAttempts?: number
    reconnectAttemptsTimeframe?: number
    authConfig?: ValorantAuthConfig
    updatePresenceInterval?: number | Function
}

interface Account {
    jid?: JidObject
    name?: string
    tagline?: string
    tokenStorage?: TokenStorage
}

export interface Friend {
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