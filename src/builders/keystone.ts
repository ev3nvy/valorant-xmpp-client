const defaultPresence = (): KeystonePresence => new Object({
    st: 'chat',
    's.t': new Date().getTime(),
    m: '',
    's.p': 'keystone'
});

const defaultConfig: KeystonePresenceBuilderConfig = {
    mergeDefaultPresence: true
}

export class KeystonePresenceBuilder {
    _config: KeystonePresenceBuilderConfig;

    constructor(config?: KeystonePresenceBuilderConfig) {
        this._config = { ...defaultConfig, ...config };
        return this;
    }

    _buildDefaultPresence = () => this._config.mergeDefaultPresence
        ? typeof this._config.defaultPresence === 'function'
            ? { ...defaultPresence(), ...this._config.defaultPresence() }
            : { ...defaultPresence(), ...this._config.defaultPresence }
        : typeof this._config.defaultPresence === 'function'
            ? this._config.defaultPresence()
            : this._config.defaultPresence;
        
    _toXmlObject = () => new Object({ keystone: this._buildDefaultPresence() });
}

interface KeystonePresenceBuilderConfig {
    defaultPresence?: (() => KeystonePresence) | KeystonePresence
    mergeDefaultPresence?: boolean
}

interface KeystonePresence {
    st?: ('away' | 'chat') | (string & {})
    's.t'?: number
    m?: string
    's.p'?: ('keystone') | (string & {})
    [propName: string]: any
}