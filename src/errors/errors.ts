export class UnknownValorantXmppError extends Error {
    response: any;

    constructor(response: any, message: string = 'Unknown valorant xmpp error! Please open an issue or DM ev3nvy#9996 on discord.') {
        super(message);
        this.name = this.constructor.name;
        this.response = response;
    }
}

export * as Auth from './auth';