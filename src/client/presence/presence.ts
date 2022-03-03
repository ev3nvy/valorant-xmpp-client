import { JidObject } from "../valorant-xmpp";
import { parseLastOnline, parseJid } from "../../helpers/parsers";
import { formatValorantPresence } from "./valorant";

const formatGamePresence = (type: string, presence: any) => {
    switch(type) {
        case 'keystone':
            return { type, presence }
        case 'league_of_legends':
            return { type, presence }
        case 'valorant':
            return { type, ...formatValorantPresence(presence) };
        default:
            return new Object()[type] = presence;
    }
}

const parseGamePresence = (games: any) => Object.entries(games).map(
    ([ type, presence ]) => formatGamePresence(type, presence));

export const formatPresence = (presence: PresenceInput) => {
    const { from, to, show, type, games, status, last_online, id, ...other } = presence;

    const presenceObj: PresenceOutput = {
        // sender jid
        sender: { jid: from, ...parseJid(from) },
        // recipient jid 
        recipient: { jid: to, ...parseJid(to) },
        // online status
        status: show || null,
        // status message
        statusMessage: status || null,
        // various game presences
        gamePresence: typeof games === 'undefined' ? null : parseGamePresence(games),
        // when user was last online - or null if they are online
        last_online: typeof last_online === 'undefined' ? null : parseLastOnline(last_online),
        // available, unavailable or null - once the user goes offline presence
        // with type unavailable is sent 
        type: type || null,
        // schema: presence_count -> count is in ascending order but
        // some numbers may get skipped
        id: id || null
    };

    // data I didn't come across while making this, please report
    // it to me (ev3nvy#9996) so that I can properly format it 
    const uncapturedData = Object.entries(other).length === 0 ? null
        : new Object({
            info: 'Data inside of this object is not formatted as I have never encountered'
            + ' it during development. Please open an issue or DM me on discord at ev3nvy#9996.',
            data: other
        });

    if(uncapturedData !== null)
        presenceObj.other = uncapturedData;
    
    return presenceObj;
}

export interface PresenceInput {
    from: string
    to: string
    show?: string
    type?: string
    games?: any
    status?: string
    last_online?: string
    id?: string
    [propName: string]: any
}

export interface PresenceOutput {
    sender: JidObject
    recipient: JidObject
    status: string | null
    statusMessage: string | null
    gamePresence: any | null
    last_online: Date | null
    type: string | null
    id: string | null
    [propName: string]: any
}