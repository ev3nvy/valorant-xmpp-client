import { UnknownValorantXmppError } from "./errors";

export class AuthFailure extends UnknownValorantXmppError {
    constructor(response: any, message: string = 'Unknown login error! Please open an issue or DM ev3nvy#9996 on discord.') {
        super(response, message);
        this.name = this.constructor.name;
    }
}
export class MissingArguments extends AuthFailure {
    constructor(response: any, message: string = 'Not all arguments were given.') {
        super(response, message);
        this.name = this.constructor.name;
    }
}
export class InvalidRegion extends AuthFailure {
    constructor(response: any, message: string = 'Region could not be determined automatically! Please open an issue or DM ev3nvy#9996 on discord.') {
        super(response, message);
        this.name = this.constructor.name;
    }
}
export class InvalidCredentials extends AuthFailure {
    constructor(response: any) {
        super(response, 'Username + password combination is incorrect.');
        this.name = this.constructor.name;
    }
}
export class Invalid2faCode extends AuthFailure {
    constructor(response: any) {
        super(response, '2FA code is invalid.');
        this.name = this.constructor.name;
    }
}