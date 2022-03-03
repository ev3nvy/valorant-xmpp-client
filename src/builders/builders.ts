import { ValorantPresenceBuilder } from './valorant';
import { KeystonePresenceBuilder } from './keystone';

export { ValorantPresenceBuilder, KeystonePresenceBuilder };

const defaultConfig: PresenceBuilderConfig = {
    mergeDefaultPresenceObject: true,
    mergeGamesObject: true
} 

const defaultPresence = (presenceCount: number): Presence => new Object({
    '@_id': 'presence_' + presenceCount,
    show: 'chat',
    status: ''
});

export class PresenceBuilder {
    _presenceCount: number;

    _config: PresenceBuilderConfig;

    _presence: Presence;
    _keystonePresence: KeystonePresenceBuilder;
    _valorantPresence: ValorantPresenceBuilder;

    get presenceCount() {
        if(typeof this._presenceCount === 'undefined')
            this._presenceCount = 0;
        this._presenceCount++;
        return this._presenceCount;
    }

    get keystonePresence() {
        if(!(this._keystonePresence instanceof KeystonePresenceBuilder))
            return undefined;
        return this._keystonePresence._toXmlObject();
    }

    get valorantPresence() {
        if(!(this._valorantPresence instanceof ValorantPresenceBuilder))
            return undefined;
        return this._valorantPresence._toXmlObject();
    }

    constructor(config?: PresenceBuilderConfig) {
        this._config = { ...defaultConfig, ...config };
        return this;
    }

    addKeystonePresence = (presence: KeystonePresenceBuilder) => {
        this._keystonePresence = presence;
        return this;
    }

    addValorantPresence = (presence: ValorantPresenceBuilder) => {
        this._valorantPresence = presence;
        return this;
    }

    _buildDefaultPresence = () => this._config.mergeDefaultPresenceObject
        ? typeof this._config.defaultPresence === 'function'
            ? { ...defaultPresence(this.presenceCount), ...this._config.defaultPresence(this.presenceCount) }
            : { ...defaultPresence(this.presenceCount), ...this._config.defaultPresence }
        : typeof this._config.defaultPresence === 'function'
            ? this._config.defaultPresence(this.presenceCount)
            : this._config.defaultPresence;

    _buildPresenceObject = () => this._config.mergeGamesObject ? {
        ...this._buildDefaultPresence(),
        games: {
            ...this.keystonePresence,
            ...this.valorantPresence
        }
    } : this._buildDefaultPresence();

    _toXmlObject = () => new Object({ presence: this._buildPresenceObject() });
}

interface PresenceBuilderConfig {
    defaultPresence?: ((presenceCount?: number) => Presence) | Presence
    mergeDefaultPresenceObject?: boolean
    mergeGamesObject?: boolean
}

interface Presence {
    '@_id'?: string,
    show?: ('chat' | 'away' | 'dnd' | 'mobile') | (string & {}),
    status?: string,
    games?: any
}