// https://valorant-api.com/v1/maps
export class Maps {
    static Ascent: MapObject = {
        name: 'Ascent',
        uuid: '7eaecc1b-4337-bbf6-6ab9-04b8f06b3319',
        url: '/Game/Maps/Ascent/Ascent'
    }
    static Bind: MapObject = {
        name: 'Bind',
        uuid: '2c9d57ec-4431-9c5e-2939-8f9ef6dd5cba',
        url: '/Game/Maps/Duality/Duality'
    }
    static Breeze: MapObject = {
        name: 'Breeze',
        uuid: '2fb9a4fd-47b8-4e7d-a969-74b4046ebd53',
        url: '/Game/Maps/Foxtrot/Foxtrot'
    }
    static Fracture: MapObject = {
        name: 'Fracture',
        uuid: 'b529448b-4d60-346e-e89e-00a4c527a405',
        url: '/Game/Maps/Canyon/Canyon'
    }
    static Haven: MapObject = {
        name: 'Haven',
        uuid: '2bee0dc9-4ffe-519b-1cbd-7fbe763a6047',
        url: '/Game/Maps/Triad/Triad'
    }
    static Icebox: MapObject = {
        name: 'Icebox',
        uuid: 'e2ad5c54-4114-a870-9641-8ea21279579a',
        url: '/Game/Maps/Port/Port'
    }
    static Split: MapObject = {
        name: 'Split',
        uuid: 'd960549e-485c-e861-8d71-aa9d1aed12a2',
        url: '/Game/Maps/Bonsai/Bonsai'
    }
    static TheRange: MapObject = {
        name: 'The Range',
        uuid: 'ee613ee9-28b7-4beb-9666-08db13bb2244',
        url: '/Game/Maps/Poveglia/Range'
    }
}

export type MapUrls = ('/Game/Maps/Ascent/Ascent' | '/Game/Maps/Duality/Duality' | '/Game/Maps/Foxtrot/Foxtrot'
    | '/Game/Maps/Canyon/Canyon' | '/Game/Maps/Triad/Triad' | '/Game/Maps/Port/Port'
    | '/Game/Maps/Bonsai/Bonsai' | '/Game/Maps/Poveglia/Range') | (string & {});

export interface MapObject {
    name: string
    uuid: string
    url: MapUrls
}