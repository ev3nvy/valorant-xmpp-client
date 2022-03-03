# Unofficial Valorant XMPP Client

This project is not endorsed or sponsored by Riot Games in any way. It simply an unofficial library that uses xmpp to communicate with Riot's official servers.

## info

this readme is a draft because I promised a test version

no npm release for this version as it is incomplete and I wouldn't even consider it alpha

## building

Start typescript compilation
```
npm run build
```

To make it globally available on your system
```
npm link
```

To use it in another project
```
npm link valorant-xmpp-client
```

## examples

<details>
<summary>single user - javascript</summary>
  
```node
const { Builders, ValorantXmppClient } = require('valorant-xmpp-client');

const { PresenceBuilder, KeystonePresenceBuilder, ValorantPresenceBuilder } = Builders;

(async () => {
    ValorantXmppClient.once('ready', () => {
        console.log('ready');
    });

    ValorantXmppClient.on('presence', (data) => {
        console.log(data);
    });

    ValorantXmppClient.on('error', (error) => {
        console.log(error);
    });

    try {
        ValorantXmppClient.presence = new PresenceBuilder()
            .addKeystonePresence(new KeystonePresenceBuilder())
            .addValorantPresence(new ValorantPresenceBuilder());
        
        // await ValorantXmppClient.login({ username: '', password: '' });
        // await ValorantXmppClient.login({ accessToken: '' });
        await ValorantXmppClient.login({ ssidCookie: '' });

        const friends = await ValorantXmppClient.fetchFriends();
        console.log(friends);
    } catch (err) {
        console.log(err)
    }
})();
```
</details>

<details>
<summary>single user - typescript</summary>
  
```node
import { Builders, ValorantXmppClient } from 'valorant-xmpp-client';

const { PresenceBuilder, KeystonePresenceBuilder, ValorantPresenceBuilder } = Builders;

(async () => {
    ValorantXmppClient.once('ready', () => {
        console.log('ready');
    });

    ValorantXmppClient.on('presence', (data) => {
        console.log(data);
    });

    ValorantXmppClient.on('error', (error) => {
        console.log(error);
    });

    try {
        ValorantXmppClient.presence = new PresenceBuilder()
            .addKeystonePresence(new KeystonePresenceBuilder())
            .addValorantPresence(new ValorantPresenceBuilder());
        
        // await ValorantXmppClient.login({ username: '', password: '' });
        // await ValorantXmppClient.login({ accessToken: '' });
        await ValorantXmppClient.login({ ssidCookie: '' });

        const friends = await ValorantXmppClient.fetchFriends();
        console.log(friends);
    } catch (err) {
        console.log(err)
    }
})();
```
</details>

## Contributing

open an issue or a pull request, you can also dm me at ev3nvy#9996 on Discord

## Legal

Unofficial Valorant XMPP Client was created under Riot Games' "Legal Jibber Jabber" policy using assets owned by Riot Games.  Riot Games does not endorse or sponsor this project.

This project is published under the [MIT](https://opensource.org/licenses/MIT) license. See the [LICENSE](https://github.com/ev3nvy/valorant-xmpp-client/blob/master/LICENSE) file in the root directory.