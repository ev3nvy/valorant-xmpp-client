import Axios, { AxiosRequestConfig, Method } from 'axios'

export class GenericRequest {
    url: string;
    method: Method;
    headers: any;
    params: any | URLSearchParams;
    body: any;

    constructor() {
        return this;
    }
    
    setUrl(url: string) {
        this.url = url;
        return this
    }

    setMethod(method: Method) {
        this.method = method;
        return this;
    }

    setHeaders(headers: any) {
        this.headers = { 
            ...this.headers,
            ...headers
        };
        return this;
    }

    setParams(params: any | URLSearchParams) {
        this.params = params;
        return this;
    }

    setBody(body: any) {
        this.body = body;
        return this;
    }

    async send(options?: AxiosRequestConfig) {
        return await Axios({
            url: this.url,
            method: this.method,
            headers: this.headers,
            data: this.body,
            params: this.params,
            ...options
        });
    }
}