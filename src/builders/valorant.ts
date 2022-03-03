import { MapUrls } from "../content/maps";
import { QueueIds } from "../content/queues";
import { Ranks } from "../content/ranks";

const defaultPresence = (): ValorantPresence => new Object({
    st: 'chat',
    's.t': new Date().getTime(),
    's.d': '',
    's.l': '',
    m: '',
    's.a': '',
    's.p': 'valorant'
});

const defaultConfig: ValorantPresenceBuilderConfig = {
    mergeDefaultPresence: true,
    mergeDefaultPresenceObject: true
}

const defaultPresenceObject = (): ValorantPresenceObject => new Object({
    isValid: true,
    sessionLoopState: 'MENUS',
    partyOwnerSessionLoopState: 'MENUS',
    customGameName: '',
    customGameTeam: '',
    partyOwnerMatchMap: '',
    partyOwnerMatchCurrentTeam: '',
    partyOwnerMatchScoreAllyTeam: 0,
    partyOwnerMatchScoreEnemyTeam: 0,
    partyOwnerProvisioningFlow: 'Invalid',
    provisioningFlow: 'Invalid',
    matchMap: '',
    // party id is required so that you appear in the online group
    partyId: '00000000-0000-0000-0000-000000000000',
    isPartyOwner: true,
    partyState: 'DEFAULT',
    partyAccessibility: 'CLOSED',
    maxPartySize: 5,
    queueId: 'unrated',
    partyLFM: false,
    partyClientVersion: 'release-04.03-shipping-6-671292',
    partySize: 1,
    tournamentId: '',
    rosterId: '',
    partyVersion: new Date().getTime(),
    queueEntryTime: '0001.01.01-00.00.00',
    playerCardId: '9fb348bc-41a0-91ad-8a3e-818035c4e561',
    playerTitleId: '',
    preferredLevelBorderId: '',
    accountLevel: 1,
    competitiveTier: Ranks.IRON1,
    leaderboardPosition: 0,
    isIdle: false
});

export class ValorantPresenceBuilder {
    _presence: (() => ValorantPresenceObject) | ValorantPresenceObject;
    _config: ValorantPresenceBuilderConfig;

    constructor(config?: ValorantPresenceBuilderConfig) {
        this._config = { ...defaultConfig, ...config };
        return this;
    }

    setPresence = (presence?: (() => ValorantPresenceObject) | ValorantPresenceObject) => {
        this._presence = presence;
        return this;
    }

    _buildDefaultPresence = () => this._config.mergeDefaultPresence
        ? typeof this._config.defaultPresence === 'function'
            ? { ...defaultPresence(), ...this._config.defaultPresence() }
            : { ...defaultPresence(), ...this._config.defaultPresence }
        : typeof this._config.defaultPresence === 'function'
            ? this._config.defaultPresence()
            : this._config.defaultPresence;

    _buildDefaultPresenceObject = () => this._config.mergeDefaultPresenceObject
        ? typeof this._presence === 'function'
            ? { ...defaultPresenceObject(), ...this._presence() }
            : { ...defaultPresenceObject(), ...this._presence }
        : typeof this._presence === 'function'
            ? this._presence()
            : this._presence;

    _toJSON = (replacer?: (this: any, key: string, value: any) => any, space?: string | number) =>
        JSON.stringify(this._buildDefaultPresenceObject(), replacer, space);
    _toBase64 = () => Buffer.from(this._toJSON()).toString('base64');
    _toXmlObject = () => new Object({ valorant: { ...this._buildDefaultPresence(), p: this._toBase64() }});
}

type LoopStates = ('MENUS' | 'PREGAME' | 'INGAME') | (string & {});
type PartyState = ('DEFAULT' | 'MATCHMAKING' | 'MATCHMADE_GAME_STARTING' | 'CUSTOM_GAME_SETUP' | 'CUSTOM_GAME') | (string & {});
type PartyAccessibility = ('OPEN' | 'CLOSED') | (string & {});
type TeamName = ('Blue' | 'Red') | (string & {});
type CustomTeamName = ('TeamOne' | 'TeamTwo' | 'TeamSpectate' | 'TeamOneCoaches' | 'TeamTwoCoaches') | (string & {});
type ProvisioningFlow = ('Invalid' | 'Matchmaking') | (string & {});

interface ValorantPresenceBuilderConfig {
    defaultPresence?: (() => ValorantPresence) | ValorantPresence
    mergeDefaultPresence?: boolean
    mergeDefaultPresenceObject?: boolean
}

interface ValorantPresence {
    st?: ('away' | 'chat') | (string & {})
    's.t'?: number
    's.d'?: string
    's.l'?: string
    m?: string
    's.a'?: string
    p?: ValorantPresenceObject
    's.p'?: ('valorant') | (string & {})
    [propName: string]: any
}

interface ValorantPresenceObject {
    isValid?: boolean
    sessionLoopState?: LoopStates
    partyOwnerSessionLoopState?: LoopStates
    customGameName?: string
    customGameTeam?: CustomTeamName
    partyOwnerMatchMap?: MapUrls
    partyOwnerMatchCurrentTeam?: TeamName
    partyOwnerMatchScoreAllyTeam?: number
    partyOwnerMatchScoreEnemyTeam?: number
    partyOwnerProvisioningFlow?: ProvisioningFlow
    provisioningFlow?: ProvisioningFlow
    matchMap?: MapUrls
    partyId?: string
    isPartyOwner?: boolean
    partyState?: PartyState
    partyAccessibility?: PartyAccessibility
    maxPartySize?: number
    queueId?: QueueIds
    partyLFM?: boolean
    partyClientVersion?: string
    partySize?: number
    tournamentId?: string
    rosterId?: string
    partyVersion?: number
    queueEntryTime?: string
    playerCardId?: string
    playerTitleId?: string
    preferredLevelBorderId?: string
    accountLevel?: number
    competitiveTier?: Ranks | number
    leaderboardPosition?: number
    isIdle?: boolean
    [propName: string]: any
}