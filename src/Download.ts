/*
    DownloadManager    
    Author: Ivo Wams, Anyflex
    
    Provides the base for adding downloads.
*/

// import MessageListener from '../Message/MessageListener';
// import MessageEmitter from '../Message/MessageEmitter';

import Disk from './Disk';

// import Download from './Download';

import Authorization from './Authorization';
import { EventEmitter } from './EventEmitter';

import Player from './Player';
import { Device, Content } from './Device';

import fs = require('fs');
import http = require('http');
import net = require('net');
import url = require('url');
import querystring = require('querystring');

import Draw from './Draw';

var settings = require('../settings.json');

const WAIT_FOR_NEXT_DOWNLOAD = 0;
const WAIT_WHEN_IDLE = 1000;

// http.globalAgent.maxSockets = Infinity;

export class Download extends EventEmitter {
    from: string;
    to: string;

    constructor(from?: string, to?: string){
        super();
        this.from = from;
        this.to = to;
    }

    public name: string = '';
    public size: number;
    
    public filename: string;  
    
    // Temp storage
    public folder_temp: string;
    
    public downloading: boolean = false;      // Is currently busy downloading
    public pending: boolean = true;           // If item is pending, dont allow new download
    public progress: number = 0;
    public available: boolean = false;        // File is available locally
    public overwrite: boolean = false;        // Overwrite existing target files (ie. playlist)
    public error: boolean = false;
    public status: string = '';
}

export class DownloadManager {

	private static event_transmitter: EventEmitter = new EventEmitter();
    public static on: Function = DownloadManager.event_transmitter.on;
    public static event: Function = DownloadManager.event_transmitter.event;

    static download_queue = Array<Download>();
    static downloading: Download = null;

    private static paused: boolean = false;

    private static process_queue(){
        if(this.download_queue.length > 0)
            this.download(this.download_queue.shift());
    }

    static post(post_data: any){

        try {

            var data = querystring.stringify(post_data);

            var options = {
                host: 'http://'+ settings.server,   // Include http!
                port: 80,
                path: '/data/devices/',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(data)
                }
            };

            var req = http.request(options, (res: http.IncomingMessage) : void => {
                res.setEncoding('utf8');
                res.on('data', (chunk: any) => {})
            });

            req.write(data);
            req.end();

        } catch(e){
            this.event('error', 'Unable to post: '+ e.message);
        }
    }
      
    static download(download: Download){

        if(this.download_queue.some((d: Download) => { return d.from == download.from; }))
            return;

        // Already downloading something ? Push download request to the queue
        if(this.downloading){
            this.download_queue.push(download);
            return;
        }

        // Set download status
        this.downloading = download;
        download.downloading = true;

        let self = this;

        try {

            this.event('debug', 'Download: '+ download.to);

            let from_url: url.Url = url.parse(download.from);

            let client_request: http.ClientRequest = http.get({
                host: from_url.host,
                port: '80',
                path: from_url.path
            });

            client_request.on('error', (e: any) => {
                download.event('error', 'Unable to download ['+ from_url.path +']');
                DownloadManager.event('error', 'Unable to download ['+ from_url.path +']');

                download.downloading = false;
                download.available = false;
                download.status = e.message;
                self.downloading = null;          

                self.process_queue();
            });

            // Socket timeout
            client_request.on('socket', (socket: net.Socket) => {
                socket.setTimeout(10000, () => {
                    DownloadManager.event('error', 'Socket timeout ['+ download.to +']');

                    // Remove whatever downloaded
                    if(fs.existsSync(download.to))
                        fs.unlinkSync(download.to);

                    self.downloading = null;
                    download.downloading = false;
                    download.available = false;
                    download.status = 'Socket timeout';

                    try {

                        socket.end();
                        socket.destroy();

                    } catch(e){
                        self.event('error', e);
                    }
                });
            });

            client_request.on('response', (incoming_message: http.IncomingMessage) => {
                
                if (incoming_message.headers['content-length'])
                    download.size = parseInt(incoming_message.headers['content-length'].toString());

                incoming_message.on('end', () => {
                    DownloadManager.event('debug', 'Connection closed ['+ download.to +']');

                    self.downloading = null;
                    download.downloading = false;
                    self.process_queue();
                });
                    

                if (Disk.storage.free < download.size){

                    try {

                        client_request.abort();

                    } catch(e){
                        self.event('error', e);
                    }

                    download.available = false;
                    download.error = true;
                    download.status = 'Disk full';
                    DownloadManager.event('error', 'Disk is full');

                    setTimeout(() => {
                        self.downloading = null;
                        self.process_queue();
                    }, 10000);
                }

                else if (incoming_message.statusCode == 200) {

                    incoming_message.on('data', (data: Buffer) => {
                        download.progress += data.length;
                        if(download.size > 0) download.status = (100 * download.progress / download.size).toFixed(0) + '%';
                        else download.status = 'Downloading';
        
                        DownloadManager.event('progress', download);
                        // MessageEmitter.emit('download', 'on_progress', download);
                    });

                    try {
                    
                        let write_stream: fs.WriteStream  = fs.createWriteStream(download.to);
                        incoming_message.pipe(write_stream);

                        write_stream.on('error', (error: Error) => {
                            DownloadManager.event('error', error);
                        });

                        write_stream.on('finish', () => {
                            write_stream.close();
                            download.available = true;
                            download.event('success');
                        });

                    } catch(e){
                        self.event('error', e);
                    }


                } else {

                    download.error = true;
                    
                    var message: string = '';

                    incoming_message.on('data', (data: Buffer) => {
                        message += data.toString();
                    });

                    incoming_message.on('end', () => {

                        var error_message: string = String(incoming_message.statusCode);

                        try { 
                            error_message = JSON.parse(message).error;
                        } catch(e){}

                        DownloadManager.event('error', error_message);
            
                        self.downloading = null;
                        download.downloading = false;
                        download.error = true;
                        download.status = error_message;
                        download.event('error', incoming_message.statusCode, error_message);
                        self.event('debug', 'Problem downloading: '+ error_message);

                        self.process_queue();
                    });
        
                }

            });

            client_request.end();

        } catch(e){
            this.event('error', 'Error downloading ['+ download.from +']: '+ e.message);
        }
    };


    // Remote location
    static getURL(content: Content){
        return 'http://'+ settings.server +'/data/device/content/'+ Player.auth_key +'/'+ content.url +'/';
        // return 'http://'+ settings.server +'/players/flexplayer_nodejs/'+ settings.version +'/download.php?auth_key='+ Player.auth_key +'&content='+ content.id;
    }

    // Local
    static getFilename(content: any){
        return settings.cache_folder + content.url + '.' + content.type;
    }

}