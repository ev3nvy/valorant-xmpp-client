import { XmppRegionObject } from '../helpers/endpoints';

// does not work due to the way parser currently handles non empty unpaired nodes
// export const xmlDeclaration = (region: XmppRegionObject) => new Object({
//     '?xml': {
//         '@_version': "1.0",
//     },
//     'stream:stream': {
//         '@_to': `${region.domain}.pvp.net`,
//         '@_xmlns:stream': "http://etherx.jabber.org/streams"
//     },
// });

export const xmlDeclaration = (region: XmppRegionObject) => `
    <?xml version="1.0"?>
    <stream:stream to="${region.domain}.pvp.net" version="1.0" xmlns:stream="http://etherx.jabber.org/streams">
`;

export const mechanism = (authToken: string, pasToken: string) => new Object({
    'auth': {
        '@_mechanism': "X-Riot-RSO-PAS",
        '@_xmlns': "urn:ietf:params:xml:ns:xmpp-sasl",
        'rso_token': authToken,
        'pas_token': pasToken
    }
});

export const clientName = () => new Object({
    'iq': {
        '@_id': "_xmpp_bind1",
        '@_type': "set",
        'bind': {
            '@_xmlns': "urn:ietf:params:xml:ns:xmpp-bind",
            'puuid-mode': {
                '@_enabled': "true"
            },
            'resource': "RC-VALORANT-NODE"
        }
    }
});

export const setEntitlements = (entitlementsToken: string) => new Object({
    'iq': {
        '@_id': "xmpp_entitlements_0",
        '@_type': "set",
        'entitlements': {
            '@_xmlns': "urn:riotgames:entitlements",
            'token': entitlementsToken
        }
    }
});

export const rxep = () => new Object({
    'iq': {
        '@_id': "set_rxep_1",
        '@_type': "set",
        'rxcep': {
            '@_xmlns': "urn:riotgames:rxep",
            'last-online-state': {
                '@_enabled': "true"
            }
        }
    }
})

export const setupSession = () => new Object({
    'iq': {
        '@_id': "_xmpp_session1",
        '@_type': "set",
        'session': {
            '@_xmlns': "urn:ietf:params:xml:ns:xmpp-session"
        }
    }
});

export const fetchFriends = () => new Object({
    'iq': {
        '@_type': "get",
        'query': {
            '@_xmlns': "jabber:iq:riotgames:roster"
        }
    }
});

export const sendFriendRequest = (username: string, tagline: string) => new Object({
    'iq': {
        '@_type': "set",
        '@_id': "roster_add_10",
        'query': {
            '@_xmlns': "jabber:iq:riotgames:roster",
            'item': {
                '@_subscription': "pending_out",
                'id': {
                    '@_name': username,
                    '@_tagline': tagline
                }
            }
        }
    }
});

export const removeOutgoingFriendRequest = (jid: string) => new Object({
    'iq': {
        '@_type': "set",
        '@_id': "roster_remove_1",
        'query': {
            '@_xmlns': "jabber:iq:riotgames:roster",
            'item': {
                '@_subscription': "remove",
                '@_jid': jid
            }
        }
    }
});