export const formatValorantPresence = (presence: any) => {
    const {
        st,
        's.t': timestamp,
        's.d': unknown1,
        's.l': unknown2,
        m,
        's.a': unknown3,
        p,
        's.p': presenceType,
        ...other
    } = presence;

    const presenceObj: any = new Object({
        status: st,
        statusMessage: m,
        timestamp,
        presence: JSON.parse(Buffer.from(p, 'base64').toString('utf8')),
        presenceType,
        unknown: new Object({
            info: 'Data inside of this object is not formatted as I have no idea what'
            + ' it does. If any of the values in the data object have anything other than'
            + ' a name property please open an issue or DM me on discord at ev3nvy#9996.',
            data: {
                unknown1: { name: 's.d', ...unknown1 },
                unknown2: { name: 's.l', ...unknown2 },
                unknown3: { name: 's.a', ...unknown3 }
            }
        })
    });

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