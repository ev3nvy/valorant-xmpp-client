// confident - I'm 100% or almost 100% sure that I named this region correctly
// unsure - I'd need someone with this xmpp region to tell me where exactly the 
//          server resides so that I can give a non-generic name

export class XmppRegions {
    static Asia1 = {affinity: "jp1", domain: "jp1", lookupName: "asia", region: "ap"} // unsure
    static Asia2 = {affinity: "as2", domain: "as2", lookupName: "as2", region: "ap"} // unsure
    static Brasil = {affinity: "br", domain: "br1", lookupName: "br1", region: "na"} // confident
    static Europe1 = {affinity: "ru1", domain: "ru1", lookupName: "eu", region: "eu"} // unsure - possibly central eu
    static Europe2 = {affinity: "eu3", domain: "eu3", lookupName: "eu3", region: "eu"} // unsure
    static EuropeNordicAndEast = {affinity: "eun1", domain: "eu2", lookupName: "eun1", region: "eu"} // confident
    static EuropeWest = {affinity: "euw1", domain: "eu1", lookupName: "euw1", region: "eu"} // confident
    static Japan = {affinity: "jp1", domain: "jp1", lookupName: "jp1", region: "ap"} // confident
    static LatinAmericaNorth = {affinity: "la1", domain: "la1", lookupName: "la1", region: "na"} // confident
    static LatinAmericaSouth = {affinity: "la2", domain: "la2", lookupName: "la2", region: "na"} // confident
    static NorthAmerica1 = {affinity: "na2", domain: "na1", lookupName: "na1", region: "na"} // unsure
    static NorthAmerica2 = {affinity: "la1", domain: "la1", lookupName: "us", region: "na"} // unsure
    static NorthAmerica3 = {affinity: "br", domain: "br1", lookupName: "us-br1", region: "na"} // unsure
    static NorthAmerica4 = {affinity: "la2", domain: "la2", lookupName: "us-la2", region: "na"} // unsure
    static NorthAmerica5 = {affinity: "us2", domain: "us2", lookupName: "us2", region: "na"} // unsure
    static Oceania = {affinity: "oc1", domain: "oc1", lookupName: "oc1", region: "ap"} // confident
    static PBE = {affinity: "pbe1", domain: "pb1", lookupName: "pbe1", region: "pbe"} // confident
    static Russia = {affinity: "ru1", domain: "ru1", lookupName: "ru1", region: "eu"} // confident
    static SouthEastAsia1 = {affinity: "sa1", domain: "sa1", lookupName: "sea1", region: "ap"} // unsure
    static SouthEastAsia2 = {affinity: "sa2", domain: "sa2", lookupName: "sea2", region: "ap"} // unsure
    static SouthEastAsia3 = {affinity: "sa3", domain: "sa3", lookupName: "sea3", region: "ap"} // unsure
    static SouthEastAsia4 = {affinity: "sa4", domain: "sa4", lookupName: "sea4", region: "ap"} // unsure
    static SouthKorea = {affinity: "kr1", domain: "kr1", lookupName: "kr1", region: "kr"} // confident
    static Turkey = {affinity: "tr1", domain: "tr1", lookupName: "tr1", region: "eu"} // confident
}

export type Affinities = ("as2" | "jp1" | "br" | "ru1" | "eu3" | "eun1" | "euw1" | "kr1" | "la1" | "la2" | "na2" | "oc1" | "pbe1" | "sa1" | "sa2" | "sa3" | "sa4" | "tr1" | "us2") | (string & {});
export type Domains = ("as2" | "jp1" | "br1" | "ru1" | "eu3" | "eu2" | "eu1" | "kr1" | "la1" | "la2" | "na1" | "oc1" | "pb1" | "sa1" | "sa2" | "sa3" | "sa4" | "tr1" | "us2") | (string & {});
export type LookupName = ("as2" | "asia" | "br1" | "eu" | "eu3" | "eun1" | "euw1" | "jp1" | "kr1" | "la1" | "la2" | "na1" | "oc1" | "pbe1" | "ru1" | "sea1" | "sea2" | "sea3" | "sea4" | "tr1" | "us" | "us-br1" | "us-la2" | "us2") | (string & {});

export class Endpoints {
    static Auth = () => `https://auth.riotgames.com`;
    static Entitlements = () => `https://entitlements.auth.riotgames.com/api/token/v1`;
    static Pas = () => `https://riot-geo.pas.si.riotgames.com`;
    static ValorantApi = () => `https://valorant-api.com`;
}

export interface XmppRegionObject {
    affinity: Affinities,
    domain: Domains,
    lookupName?: LookupName
}
