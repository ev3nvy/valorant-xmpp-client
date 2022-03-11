// https://datatracker.ietf.org/doc/html/rfc7622#section-3.2
export const parseJid = (jid: string): Jid => {
    const [ restOfJid, ...resourcePart ] = jid.split('/');
    const resource = resourcePart.join('/') || null;

    const [ local, ...rest ] = restOfJid.split('@');

    const domain = rest.join('@') || local;
    return { local: rest.length === 0 ? null : local, domain, resource };
}

// inefficient but makes the code look cleaner as I don't have to manually
// parse every date element (arguments "need" to be string)
export const parseLastOnline = (dateString: string): Date => {
    const [ date, time ] = dateString.trim().split(/\ +/g);
    const [ year, month, day ] = date.trim().split('-').map(element => parseInt(element));
    const [ hour, min, sec, ms ] = time.trim().split('.').join(':').split(':').map(element => parseInt(element));

    return new Date(Date.UTC(year, month-1, day, hour, min, sec, ms));
}

export interface Jid {
    local?: string
    domain: string
    resource?: string
}