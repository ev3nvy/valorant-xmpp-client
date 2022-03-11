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
    },
    automaticReauth: true
}

const buildOptions = (options: ValorantAuthConfig) => new Object({ ...defaultOptions, ...options });

const isPasswordAuth = (options: PasswordAuth | TokenAuth | CookieAuth): options is PasswordAuth =>
    (options as PasswordAuth).username !== undefined && (options as PasswordAuth).password !== undefined;

const isTokenAuth = (options: PasswordAuth | TokenAuth | CookieAuth): options is TokenAuth =>
    (options as TokenAuth).accessToken !== undefined;

const isCookieAuth = (options: PasswordAuth | TokenAuth | CookieAuth): options is CookieAuth =>
    (options as CookieAuth).ssidCookie !== undefined;

export class ValorantAuth {
    _xmppClientInstance: ValorantXmppClient;
    _config: ValorantAuthConfig;

    _reauthInterval: NodeJS.Timer; 

    get tokenStorage() {
        return this._xmppClientInstance.tokenStorage;
    }

    set tokenStorage(tokenStorage) {
        this._xmppClientInstance.tokenStorage = {
            ...this.tokenStorage,
            ...tokenStorage
        };
    }

    constructor(client: ValorantXmppClient, config?: ValorantAuthConfig) {
        this._xmppClientInstance = client;
        this._config = buildOptions(config);
        return this;
    }

    _initWithUsernamePassword = async ({ username, password }: PasswordAuth) => {
        // initial request required for creating a session
        const session = await Authorization.createSession(this._config.sessionAuthBody, undefined, this._config.axiosConfig);
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
            ? (await Authorization.send2faCode(asidCookie, await this._config.custom2faLogic(login.data)))
            : login;
        
        // auth failed - most likely invalid code
        if(typeof response.data.error !== 'undefined') {
            if(response.data.error === 'auth_failure')
                throw new Invalid2faCode(response);
            throw new AuthFailure(response);
        }
    
        // extract ssid cookie
        this.tokenStorage = {
            ssidCookie: response.headers['set-cookie'].find((cookie: string) => /^ssid/.test(cookie))
        };
    
        // extract tokens from the url
        const loginResponseURI = new URL(response.data.response.parameters.uri);
        const accessToken = loginResponseURI.searchParams.get('access_token');
    
        return await this._initWithAccessToken({ accessToken });
    }
    
    _initWithAccessToken = async ({ accessToken, pasToken, entitlementsToken }: TokenAuth) => {
        this.tokenStorage = {
            accessToken,
            pasToken: typeof pasToken === 'undefined'
                ? (await Authorization.fetchPas(accessToken)).data
                : pasToken,
            entitlementsToken: typeof entitlementsToken === 'undefined'
                ? (await Authorization.fetchEntitlements(accessToken)).data.entitlements_token
                : entitlementsToken
        };
    
        // decode the pas token
        const decodedJwt = JSON.parse(
            Buffer.from(this.tokenStorage.pasToken.split('.')[1], 'base64').toString());
        // get puuid
        this.tokenStorage = { puuid: decodedJwt.sub };
    
        // try automatically determening the region 
        if(typeof this._config.region === 'undefined') {
            // find region
            for(const region in XmppRegions) {
                if(XmppRegions[region].lookupName === decodedJwt.affinity) {
                    this.tokenStorage = { region: XmppRegions[region] };
                    break;
                }
            }
            if(typeof this.tokenStorage.region == 'undefined')
                throw new InvalidRegion(decodedJwt);
        }
        else
            this.tokenStorage = { region: this._config.region };
    }
    
    _initWithCookie = async ({ ssidCookie }: CookieAuth) => {
        const session = await Authorization.createSession(this._config.sessionAuthBody,
            { Cookie: ssidCookie }, this._config.axiosConfig);
        
        this.tokenStorage = {
            ssidCookie: session.headers['set-cookie'].find((cookie: string) => /^ssid/.test(cookie))
        };

        const loginResponseURI = new URL(session.data.response.parameters.uri);
        const accessToken = loginResponseURI.searchParams.get('access_token')
        
        return await this._initWithAccessToken({ accessToken });
    }

    _reauth = async () => {
        const session = await Authorization.createSession(this._config.sessionAuthBody, 
            { Cookie: this.tokenStorage.ssidCookie }, this._config.axiosConfig);

        const loginResponseURI = new URL(session.data.response.parameters.uri);
        const accessToken = loginResponseURI.searchParams.get('access_token');


        this.tokenStorage = {
            accessToken,
            ssidCookie: session.headers['set-cookie'].find((cookie: string) => /^ssid/.test(cookie)),
            pasToken: (await Authorization.fetchPas(accessToken)).data
        };
    }

    async login(options?: PasswordAuth | TokenAuth | CookieAuth) {
        if(typeof options !== 'undefined') {
            if(isCookieAuth(options))
                await this._initWithCookie(options);
            else if(isPasswordAuth(options))
                await this._initWithUsernamePassword(options);
            else if(isTokenAuth(options))
                await this._initWithAccessToken(options);
            else
                throw new MissingArguments(options);
        }

        if(this._config.automaticReauth)
            this._reauthInterval = setInterval(async () =>
                await this._reauth(), (3600 - 300) * 1000);

        return this;
    }

    destroy() {
        clearInterval(this._reauthInterval);
    }
}

export interface TokenStorage {
    accessToken?: string;
    pasToken?: string;
    entitlementsToken?: string;
    puuid?: string;
    region?: XmppRegionObject;
    ssidCookie?: string;
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