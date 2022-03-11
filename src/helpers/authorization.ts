import { AxiosRequestConfig } from "axios";
import { Agent } from "https";

import { Endpoints } from "./endpoints";
import { GenericRequest } from "./requests";

// instead of ciphers, a custom axios adapter can be created that
// exposes https options, where you can set custom signature
// algorithms, and by not including sha1 we get past 1020 error
const ciphers = [
    "TLS_CHACHA20_POLY1305_SHA256",
    "TLS_AES_128_GCM_SHA256",
    "TLS_AES_256_GCM_SHA384"
];

const agent = new Agent({ ciphers: ciphers.join(':'), honorCipherOrder: true, minVersion: 'TLSv1.2' });

export class Authorization {
    static createSession = (options: any, headers?: any, axiosConfig?: AxiosRequestConfig) => new GenericRequest()
        .setUrl(Endpoints.Auth() + '/api/v1/authorization')
        .setMethod('POST')
        .setHeaders({
            'User-Agent': 'RiotClient/43.0.1.4195386.4190634 rso-auth (Windows; 10;;Professional, x64)',
            ...headers
        })
        .setBody({
            ...options
        })
        .send({
            httpsAgent: agent,
            ...axiosConfig
        });

    static login = (cookie: string, username: string, password: string, language: string = 'en_US', remember: boolean = false, options?: any) => new GenericRequest()
        .setUrl(Endpoints.Auth() + '/api/v1/authorization')
        .setMethod('PUT')
        .setHeaders({
            Cookie: cookie,
            'User-Agent': 'RiotClient/43.0.1.4195386.4190634 rso-auth (Windows; 10;;Professional, x64)'
        })
        .setBody({
            type: 'auth',
            username,
            password,
            language,
            remember,
            ...options
        })
        .send({
            httpsAgent: agent
        });

    static send2faCode = (cookie: string, code: string, rememberDevice: boolean = true, options?: any) => new GenericRequest()
        .setUrl(Endpoints.Auth() + '/api/v1/authorization')
        .setMethod('PUT')
        .setHeaders({
            Cookie: cookie,
            'User-Agent': 'RiotClient/43.0.1.4195386.4190634 rso-auth (Windows; 10;;Professional, x64)'
        })
        .setBody({
            type: 'multifactor',
            code,
            rememberDevice,
            ...options
        })
        .send({
            httpsAgent: agent
        });

    static fetchEntitlements = (accessToken: string) => new GenericRequest()
        .setUrl(Endpoints.Entitlements())
        .setMethod('POST')
        .setHeaders({
            Authorization: `Bearer ${accessToken}`
        })
        .setBody({})
        .send();

    static fetchPas = (accessToken: string) => new GenericRequest()
        .setUrl(Endpoints.Pas() + '/pas/v1/service/chat')
        .setMethod('GET')
        .setHeaders({
            Authorization: `Bearer ${accessToken}`
        })
        .send();
}