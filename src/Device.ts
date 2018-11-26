const Player = require('./Player');
const settings = require('../settings.json');

export class Language {
    id: number;
    short: string;
    long: string;
    available: boolean;

    constructor(data: any){
        if(data != null){
            this.id = data.id;
            this.short = data.short;
            this.long = data.long;
            this.available = data.available == '1';
        }
    }
}

export class Branche {
    id: number;
    name: string;

    constructor(data: any){
        this.id = data.id;
        this.name = data.name;
    }
}

export class Brand {
    id: number;
    name: string;
    url: string;
    description: string;

    constructor(data: any){
        this.id = data.id;
        this.name = data.name;
        this.url = data.url;
        this.description = data.description;
    }
}

export class PlaylistNode {
    id: number;
    order: number;
    content: Content;
    play_from: Date;
    play_until: Date;
    deleted: boolean;
    created_on: Date;
    status: string;

    // Additional metadata
    available: boolean;
    file_exists: boolean;
    is_playing: boolean;
    downloading: boolean;

    constructor(data: any){
        this.id = data.id;
        this.order = data.order;
        this.content = data.content ? new Content(data.content) : null;
        this.play_from = data.play_from ? new Date(data.play_from.date) : null;
        this.play_until = data.play_until ? new Date(data.play_until.date) : null;
        this.deleted = data.deleted == '1';
        this.created_on = data.created_on ? new Date(data.created_on.date) : null;
        this.file_exists = false;
        this.is_playing = false;
        this.downloading = false;
        this.available = false;
    }

}

export class Playlist {
    id: number;
    name: string;
    url: string;
    owner: Account;
    duration: number;
    file_size: number;
    deleted: boolean;
    last_modified: Date;
    nodes: Array<PlaylistNode> = new Array<PlaylistNode>();

    constructor(data: any){
        if(data){
            this.id = data.id;
            this.name = data.name;
            this.url = data.url;
            this.owner = data.owner ? new Account(data.owner) : null;
            this.duration = data.duration;
            this.file_size = data.file_size;
            this.deleted = data.deleted == '1';
            this.last_modified = data.last_modified ? new Date(data.last_modified.date) : null;
            data.nodes.forEach((node: any) => {
                this.nodes.push(new PlaylistNode(node));
            });
        }
    }
}

export class Content {
    id: number;
    title: string;
    url: string;
    owner: Account;
    brand: Brand;
    branche: Branche;
    description: string;
    language: Language;
    type: string;
    playlist: Playlist;
    duration: number;
    width: number;
    height: number;
    views: number;
    replacement: Content;
    available_from: Date;
    available_until: Date;
    created_on: Date;
    last_modified: Date;

    constructor(data: any){
        this.id = data.id;
        this.title = data.title;
        this.url = data.url;
        this.owner = data.owner ? new Account(data.owner) : null;
        this.brand = data.brand ? new Brand(data.brand) : null;
        this.branche = data.branche ? new Branche(data.branche) : null;
        this.description = data.description;
        this.language = data.language ? new Language(data.language) : null;
        this.type = data.type;
        this.playlist = data.playlist ? new Playlist(data.playlist) : null;
        this.duration = data.duration;
        this.width = data.width;
        this.height = data.height;
        this.views = data.views;
        this.replacement = data.replacement ? new Content(data.replacement) : null;
        this.available_from = data.available_from ? new Date(data.available_from.date) : null;
        this.available_until = data.available_until ? new Date(data.available_until.date) : null;
        this.created_on = data.created_on ? new Date(data.created_on.date) : null;
        this.last_modified = data.last_modified ? new Date(data.last_modified) : null;        
    }
    

}

export class Account {
    id: number;
    name: string;

    constructor(data: any){
        this.id = data.id;
        this.name = data.name;
    }
}

export class DeviceInfo {
    id: number;
    name: string;
    manufacturer: string;
    image: string;
    available_from: Date;
    conversion_rule: ConversionRule;

    constructor(data: any){
        this.id = data.id;
        this.name = data.name;
        this.manufacturer = data.manufacturer;
        this.image = data.image;
        this.available_from = data.available_from ? new Date(data.available_from.date) : null;
        this.conversion_rule = data.conversion_rule ? new ConversionRule(data.conversion_rule) : null;
    }
}

export class ConversionRule {
    id: number;
    description: string;
    type: string;
    scaling: string;
    frame_dx: number;
    frame_dy: number;
    bitrate_video: string;
    bitrate_audio: string;
    orientation: string;

    constructor(data: any){
        this.id = data.id;
        this.description = data.description;
        this.type = data.type;
        this.scaling = data.scaling;
        this.frame_dx = data.frame_dx;
        this.frame_dy = data.frame_dy;
        this.bitrate_video = data.bitrate_video;
        this.bitrate_audio = data.bitrate_audio;
        this.orientation = data.orientation;
    }
}

export class Device {
    id: number; 
    device_info: DeviceInfo;
    mac: string;
    auth_key: string;
    description: string;
    owner: Account;
    ip_remote: string;
    ip_eth0: string;
    ip_wlan0: string;
    last_contact: Date;
    storage: number;
    storage_free: number;
    playing: Content;
    progress: number;
    playlist: Playlist;
    conversion_rule: ConversionRule;

    use_wifi: boolean;
    use_dhcp: boolean;

    constructor(data: any){
        this.id = data.id;
        this.device_info = data.device_info ? new DeviceInfo(data.device_info) : null;
        this.mac = data.mac;
        this.auth_key = data.auth_key;
        this.description = data.description;
        this.owner = data.owner ? new Account(data.owner) : null;
        this.ip_remote = data.ip_remote;
        this.ip_eth0 = data.ip_eth0;
        this.ip_wlan0 = data.ip_wlan0;
        this.last_contact = data.last_contact ? new Date(data.last_contact.date) : null;
        this.storage = data.storage;
        this.storage_free = data.storage_free;
        this.playing = data.playing ? new Content(data.playing) : null;
        this.progress = data.progress;
        this.playlist = new Playlist(data.playlist);
        this.conversion_rule = data.conversion_rule ? new ConversionRule(data.conversion_rule) : null;
    }

}