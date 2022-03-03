import { AxiosRequestConfig } from "axios";
import { ReadLine, createInterface } from "readline";

import { Auth } from "../errors/errors";
import { XmppRegionObject, XmppRegions } from "../helpers/endpoints";
import { Authorization } from "../helpers/authorization";
import { ValorantXmppClient } from "./valorant-xmpp";

const { InvalidCredentials, AuthFailure, Invalid2faCode, MissingArguments, InvalidRegion } = Auth;

let _stdin: ReadLine;
const stdin = () => {
    if(typeof _stdin === 'undefined')
        _stdin = createInterface({ input: process.stdin, output: process.stdout });
    return _stdin;
};

// 2fa logic -> fetch from standard input aka console
const input2faCode = (login: any) => new Promise(resolve => stdin().question(
    `You have 2fa enabled, please input the 2fa code (sent to ${login.multifactor.email}):`,
    code => resolve(code)
));

const defaultOptions: ValorantAuthConfig = {
    custom2faLogic: input2faCode,
    sessionAuthBody: {
        client_id: "play-valorant-web-prod",
        nonce: 1,
        redirect_uri: "https://playvalorant.com/opt_in",
        response_type: "token id_token",
        response_mode: "query",
        scope: "account openid"
    }
}

const buildOptions = (options: ValorantAuthConfig) => new Object({ ...defaultOptions, ...options });

const initWithUsernamePassword = async (tokenStorage: TokenStorage, { username, password }: PasswordAuth, config: ValorantAuthConfig) => {
    // initial request required for creating a session
    const session = await Authorization.createSession(config.sessionAuthBody, undefined, config.axiosConfig);
    let asidCookie = session.headers['set-cookie'].find((cookie: string) => /^asid/.test(cookie));
    // attempt to exchange username and password for an access token
    const login = (await Authorization.login(asidCookie, username, password));

    // auth failed - most likely incorrect login info
    if(typeof login.data.error !== 'undefined') {
        if(login.data.error === 'auth_failure')
            throw new InvalidCredentials(login);
        throw new AuthFailure(login);
    }

    asidCookie = login.headers['set-cookie'].find((cookie: string) => /^asid/.test(cookie));
    
    // check if 2fa is enabled and ask for code
    const response = login.data.type === 'multifactor'
        ? (await Authorization.send2faCode(asidCookie, await config.custom2faLogic(login.data)))
        : login;
    
    // auth failed - most likely invalid code
    if(typeof response.data.error !== 'undefined') {
        if(response.data.error === 'auth_failure')
            throw new Invalid2faCode(response);
        throw new AuthFailure(response);
    }

    // extract ssid cookie
    tokenStorage.ssidCookie = response.headers['set-cookie'].find((cookie: string) => /^ssid/.test(cookie));

    // extract tokens from the url
    const loginResponseURI = new URL(response.data.response.parameters.uri);
    tokenStorage.accessToken = loginResponseURI.searchParams.get('access_token');

    return await initWithAccessToken(tokenStorage, {
        accessToken: tokenStorage.accessToken
    }, config);
}

const initWithAccessToken = async (tokenStorage: TokenStorage, { accessToken, pasToken, entitlementsToken }: TokenAuth, config: ValorantAuthConfig) => {
    tokenStorage.pasToken = typeof pasToken === 'undefined'
        ? (await Authorization.fetchXmppRegion(accessToken)).data
        : pasToken;

    tokenStorage.entitlementsToken = typeof entitlementsToken === 'undefined'
        ? (await Authorization.fetchEntitlements(accessToken)).data.entitlements_token
        : entitlementsToken;

    // decode the pas token
    const decodedJwt = JSON.parse(Buffer.from(tokenStorage.pasToken.split('.')[1], 'base64').toString());
    // get puuid
    tokenStorage.puuid = decodedJwt.sub;

    // try automatically determening the region 
    if(typeof config.region === 'undefined') {
        // find region
        for(const region in XmppRegions) {
            if(XmppRegions[region].lookupName === decodedJwt.affinity) {
                tokenStorage.region = XmppRegions[region];
                break;
            }
        }
        if(typeof tokenStorage.region == 'undefined')
            throw new InvalidRegion(decodedJwt);
    }
    else
        tokenStorage.region = config.region;
    
    return tokenStorage;
}

const initWithCookie = async (tokenStorage: TokenStorage, { ssidCookie }: CookieAuth, config: ValorantAuthConfig) => {
    const session = await Authorization.createSession(config.sessionAuthBody, { Cookie: ssidCookie }, config.axiosConfig);
    
    tokenStorage.ssidCookie = session.headers['set-cookie'].find((cookie: string) => /^ssid/.test(cookie));
    
    const loginResponseURI = new URL(session.data.response.parameters.uri);
    tokenStorage.accessToken = loginResponseURI.searchParams.get('access_token');

    return await initWithAccessToken(tokenStorage, {
        accessToken: tokenStorage.accessToken
    }, config);
}

const isPasswordAuth = (options: PasswordAuth | TokenAuth | CookieAuth): options is PasswordAuth =>
    (options as PasswordAuth).username !== undefined && (options as PasswordAuth).password !== undefined;

const isTokenAuth = (options: PasswordAuth | TokenAuth | CookieAuth): options is TokenAuth =>
    (options as TokenAuth).accessToken !== undefined;

const isCookieAuth = (options: PasswordAuth | TokenAuth | CookieAuth): options is CookieAuth =>
    (options as CookieAuth).ssidCookie !== undefined;

export class ValorantAuth {
    _xmppClientInstance: ValorantXmppClient;
    _config: ValorantAuthConfig;

    get tokenStorage() {
        return this._xmppClientInstance.self.tokenStorage;
    }

    set tokenStorage(tokenStorage) {
        this._xmppClientInstance.self.tokenStorage = tokenStorage;
    }

    constructor(player: ValorantXmppClient, config?: ValorantAuthConfig) {
        this._xmppClientInstance = player;
        this._config = buildOptions(config);
        return this;
    }

    async login(options: PasswordAuth | TokenAuth | CookieAuth) {
        if(typeof this.tokenStorage !== 'undefined' && this.tokenStorage instanceof TokenStorage) {
            return this;
        }
        
        if(isCookieAuth(options))
            this.tokenStorage = await initWithCookie(new TokenStorage(), options, this._config);
        else if(isPasswordAuth(options))
            this.tokenStorage = await initWithUsernamePassword(new TokenStorage(), options, this._config);
        else if(isTokenAuth(options))
            this.tokenStorage = await initWithAccessToken(new TokenStorage(), options, this._config);
        else
            throw new MissingArguments(options);

        return this;
    }
}

export class TokenStorage {
    accessToken: string;
    pasToken: string;
    entitlementsToken: string;
    puuid: string;
    region: XmppRegionObject;
    clientVersion: string;
    ssidCookie: string;

    constructor() {
        this.accessToken = null;
        this.pasToken = null;
        this.entitlementsToken = null;
        this.puuid = null;
        this.region = null;
        this.clientVersion = null;
    }
}

export interface ValorantAuthConfig {
    /**
     * if not defined, it is determined automatically
     */
    region?: XmppRegionObject
    /**
     * function that gets executed when/if 2fa is triggered
     * @warning has no effect unless you use username/password login
     */
    custom2faLogic?: Function
    /**
     * custom json body for POST `auth.riotgames.com/api/v1/authorization`
     */
    sessionAuthBody?: SessionAuthBody
    /**
     * additional options you can pass through to axios
     * @warning affects all of the non-xmpp endpoints
     */
    axiosConfig?: AxiosRequestConfig
    /**
     * whether to automatically reauthenticate before token expiration (every 55 min)
     * @warning token auth does not support reauth since it's impossible to obtain new tokens
     */
    automaticReauth?: boolean
}

export interface CookieAuth {
    ssidCookie: string
}

export interface PasswordAuth {
    username: string
    password: string
}

/**
 * @warning this auth method does not support reauth and reconnect since it's impossible to obtain new tokens
 */
export interface TokenAuth {
    accessToken: string
    pasToken?: string
    entitlementsToken?: string
}

interface SessionAuthBody {
    client_id: 'play-valorant-web-prod' | (string & {}),
	nonce: string | number,
	redirect_uri: 'https://playvalorant.com/opt_in' | (string & {}),
    response_mode?: ('query' | 'fragment') | (string & {})
	response_type: ('code' | 'token' | 'id_token' | 'token id_token' | 'code id_token' | 'code id_token token') | (string & {})
	scope?: 'account openid' | (string & {}),
    [propName: string]: any,
}