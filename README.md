# Unofficial Valorant XMPP Client

This project is not endorsed or sponsored by Riot Games in any way. It simply an unofficial library that uses xmpp to communicate with Riot's official servers.

## info

this readme is a draft because I promised a test version

no npm release for this version as it is incomplete and I wouldn't even consider it alpha

## building

Copy the project
```console
$ git clone https://github.com/ev3nvy/valorant-xmpp-client.git
```

Install dependencies
```console
$ npm i
```

Start typescript compilation
```console
$ npm run build
```

Make it globally available on your system
```console
$ npm link
```
---

To use it in another project
```console
$ npm link valorant-xmpp-client
```

## examples

<details>
<summary>single user - javascript</summary>
  
```node
const { Builders, ValorantXmppClient } = require('valorant-xmpp-client');

const { PresenceBuilder, KeystonePresenceBuilder, ValorantPresenceBuilder } = Builders;

const xmppClient = new ValorantXmppClient();

xmppClient.presence = new PresenceBuilder()
    .addKeystonePresence(new KeystonePresenceBuilder())
    .addValorantPresence(new ValorantPresenceBuilder());

xmppClient.once('ready', () => {
    console.log('ready');
});

xmppClient.on('presence', (data) => {
    console.log(data);
});

xmppClient.on('error', (error) => {
    console.log(error);
});

// xmppClient.login({ username: '', password: '' });
// xmppClient.login({ accessToken: '' });
xmppClient.login({ ssidCookie: '' });
```
</details>

<details>
<summary>single user - typescript</summary>
  
```node
import { Builders, ValorantXmppClient } from 'valorant-xmpp-client';

const { PresenceBuilder, KeystonePresenceBuilder, ValorantPresenceBuilder } = Builders;

const xmppClient = new ValorantXmppClient();

xmppClient.presence = new PresenceBuilder()
    .addKeystonePresence(new KeystonePresenceBuilder())
    .addValorantPresence(new ValorantPresenceBuilder());

xmppClient.once('ready', () => {
    console.log('ready');
});

xmppClient.on('presence', (data) => {
    console.log(data);
});

xmppClient.on('error', (error) => {
    console.log(error);
});

// xmppClient.login({ username: '', password: '' });
// xmppClient.login({ accessToken: '' });
xmppClient.login({ ssidCookie: '' });
```
</details>

## Contributing

open an issue or a pull request, you can also dm me at ev3nvy#9996 on Discord

## Acknowledgements

[narkdev](https://github.com/narkdev) for the initial [implementation in C#](https://github.com/narkdev/ValorantSharp)

[giorgi-o](https://github.com/giorgi-o) for the [amazing documentation](https://github.com/giorgi-o/CrossPlatformPlaying/wiki/Riot-Games)

...and other amazing people at https://discord.gg/a9yzrw3KAm

## Legal

Unofficial Valorant XMPP Client was created under Riot Games' "Legal Jibber Jabber" policy using assets owned by Riot Games.  Riot Games does not endorse or sponsor this project.

This project is published under the [MIT](https://opensource.org/licenses/MIT) license. See the [LICENSE](https://github.com/ev3nvy/valorant-xmpp-client/blob/master/LICENSE) file in the root directory.