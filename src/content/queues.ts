export class Queues {
    static Competitive: QueueObject = {
        id: 'competitive',
        name: 'Competitive',
    }
    static Custom: QueueObject = {
        id: 'custom',
        name: 'Custom',
    }
    static Deathmatch: QueueObject = {
        id: 'deathmatch',
        name: 'Deathmatch',
    }
    static Escalation: QueueObject = {
        id: 'ggteam',
        name: 'Escalation',
    }
    static NewMap: QueueObject = {
        id: 'newmap',
        name: 'New Map',
    }
    static Replication: QueueObject = {
        id: 'onefa',
        name: 'Replication',
    }
    static SnowballFight: QueueObject = {
        id: 'snowball',
        name: 'Snowball Fight',
    }
    static SpikeRush: QueueObject = {
        id: 'spikerush',
        name: 'Spike Rush',
    }
    static Unrated: QueueObject = {
        id: 'unrated',
        name: 'Unrated'
    }
}

export interface QueueObject {
    id: QueueIds
    name: string
}

export type QueueIds = ('competitive' | 'custom' | 'deathmatch' | 'ggteam' | 'newmap'
    | 'onefa' | 'snowball' | 'spikerush' | 'unrated') | (string & {});