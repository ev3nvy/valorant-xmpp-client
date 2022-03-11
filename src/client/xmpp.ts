import { Socket } from "net";
import { ConnectionOptions, connect } from "tls";
import { XMLParser, XMLBuilder, XMLValidator } from 'fast-xml-parser';

const defaultBuilderOptions = { 
    ignoreAttributes: false,
    suppressBooleanAttributes: false,
    suppressEmptyNode: true,
    suppressUnpairedNode: true,
};
const xmlBuilder = new XMLBuilder(defaultBuilderOptions);

const defaultParserOptions = { 
    ignoreAttributes: false,
    suppressEmptyNode: true,
    suppressUnpairedNode: true,
    attributeNamePrefix: ''
};
const xmlParser = new XMLParser(defaultParserOptions);

export class XmppClient {
    _socket: Socket;

    _dataChunk: Buffer;

    constructor() {
        return this;
    }

    connect = (options: ConnectionOptions): Promise<XmppClient> => {
        this._socket = connect(options);
        this._socket.setKeepAlive(true);
        this._dataChunk = Buffer.from('');

        return new Promise((resolve, reject) => {
            // clean up prevous event listeners
            const cleanupListeners = () => {
                this._socket.removeListener('ready', handleReady);
                this._socket.removeListener('error', handleError);
            }

            // define handlers
            const handleReady = () => {
                cleanupListeners();
                return resolve(this);
            };
            const handleError = (error: Error) => {
                cleanupListeners();
                return reject({ type: 'error', error });
            };

            this._socket.once('error', handleError);
            this._socket.once('ready', handleReady);
        });
    };

    send = (data: any) => new Promise((resolve, reject) => {
        // console.log(`OUT | ${data}`);
        // clean up prevous event listeners
        const cleanupListeners = () => {
            this._socket.removeListener('data', writeData);
            this._socket.removeListener('error', handleError);
            this._socket.removeListener('close', handleClose);
        }

        // define handlers
        const writeData = () => {
            cleanupListeners();
            return resolve(null);
        };
        const handleError = (error: Error) => {
            cleanupListeners();
            return reject({ type: 'error', error });
        };
        const handleClose = (hadError: boolean) => {
            cleanupListeners();
            return reject({ type: 'close', hadError });
        };


        this._socket.once('error', handleError);
        this._socket.once('close', handleClose);
        this._socket.write(data, writeData);
    });

    sendXml = (data: any) => this.send(xmlBuilder.build(data));

    read = (): Promise<any> => new Promise((resolve, reject) => {
        // clean up prevous event listeners
        const cleanupListeners = () => {
            this._socket.removeListener('data', handleData);
            this._socket.removeListener('timeout', handleTimeout);
            this._socket.removeListener('error', handleError);
            this._socket.removeListener('close', handleClose);
        };

        // define handlers
        const handleData = (data: Buffer) => {
            // console.log(`IN | ${data}`);
            cleanupListeners();
            return resolve(data);
        };
        const handleTimeout = () => {
            cleanupListeners();
            return reject({ type: 'timeout' });
        };
        const handleError = (error: Error) => {
            cleanupListeners();
            return reject({ type: 'error', error });
        };
        const handleClose = (hadError: boolean) => {
            cleanupListeners();
            return reject({ type: 'close', hadError });
        };

        this._socket.once('timeout', handleTimeout);
        this._socket.once('error', handleError);
        this._socket.once('close', handleClose);
        this._socket.on('data', handleData);
    });

    readXml = async () => {
        this._dataChunk = Buffer.from('');
        
        // large data such as presences can be sent in multiple byte chunks
        // so we handle that
        do {
            const data = await this.read();
            this._dataChunk = Buffer.concat([ this._dataChunk, data ], this._dataChunk.length + data.length);

        // this xml validator throws an error with multiple xml root elements
        // because xml structures with multiple root elements aren't valid
        // and there is no option to disable this check - so we just wrap the
        // structure with some random tag
        } while(XmppClient.validateXml('<lmao>' + this._dataChunk.toString() + '</lmao>') !== true);

        return xmlParser.parse(this._dataChunk);
    };

    readMultiple = async (count: number) => {
        while(count > 0) {
            await this.read();
            count--;
        }
    }

    destroy = () => {
        this._socket.destroy();
        this._socket.removeAllListeners();
    }

    end = () => {
        this._socket.end();
        this._socket.removeAllListeners();
    }

    static buildXml = (data: any) => xmlBuilder.build(data);

    static parseXml = (data: any) => xmlParser.parse(data);

    static validateXml = (data: any) => XMLValidator.validate(data);
}
