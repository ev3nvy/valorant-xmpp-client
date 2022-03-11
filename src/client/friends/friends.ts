import { Friend, JidObject } from "../valorant-xmpp";
import { parseJid } from "../../helpers/parsers";

const formatRosterInfo = ({ id, lol, jid, name, subscription, puuid }): Friend => new Object({
    jid: { jid, ...parseJid(jid) },
    puuid: puuid,
    name: typeof id === 'undefined' ? null : id.name || null,
    tagline: typeof id === 'undefined' ? null : id.tagline || null,
    lolName: typeof lol === 'undefined' ? null : lol.name || null,
    preferredName: typeof name === 'undefined' ? null : name,
    isFriend: subscription === 'both',
    isIncoming: subscription === 'pending_in',
    isOutgoing: subscription === 'pending_out'
});

const parseRosterInfo = (friends: any) => Array.isArray(friends)
    ? friends.map(friend => formatRosterInfo(friend))
    : formatRosterInfo(friends);

export const formatRoster = (presence: RosterInput) => {
    const { from, to, type, id, query, ...other } = presence;

    const rosterObj: RosterOutput = {
        // sender jid
        sender: typeof from === 'undefined' ? null : { jid: from, ...parseJid(from) },
        // recipient jid 
        recipient: typeof to === 'undefined' ? null : { jid: to, ...parseJid(to) },
        // 
        roster: typeof query.item === 'undefined' ? null : parseRosterInfo(query.item),
        // result - when fetching friends list
        // set - when changing it (e.g. sending friend request) 
        type: type || null,
        // event id
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
        rosterObj.other = uncapturedData;
    
    return rosterObj;
}

export interface RosterInput {
    from?: string
    to?: string
    type?: ('result' | 'set') | (string & {})
    query?: any
    id?: string
    [propName: string]: any
}

export interface RosterOutput {
    sender: JidObject
    recipient: JidObject
    type: ('result' | 'set') | (string & {}) | null
    id: string | null
    [propName: string]: any
}