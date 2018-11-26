/*
    Player
    Author: Ivo Wams, Anyflex
    Date: 2016-2017
*/

import { Playlist, PlaylistNode } from './Device';
import { Device, Content } from './Device';
import { Download, DownloadManager } from './Download';
import { EventEmitter } from './EventEmitter';

import http = require('http');
import ChildProcess = require('child_process');
import fs = require('fs');

const settings = require('../settings.json');

export default class Player {

    static event_transmitter: EventEmitter = new EventEmitter();
    public static on : Function = Player.event_transmitter.on;
    public static event : Function = Player.event_transmitter.event;

    static readonly COMMAND_PREVIOUS: string = 'previous';
    static readonly COMMAND_STOP: string = 'stop';
    static readonly COMMAND_PAUSE: string = 'pause';
    static readonly COMMAND_PLAY: string = 'play';
    static readonly COMMAND_NEXT: string = 'next';

    static auth_key: string;
    static device: Device;              // Holds all device info
    private static next_device: Device; // After playlist nodes have been played, move to this device

    static play_index: number = 0;      // Index number of playing
    static playing: PlaylistNode;       // Pointing to Player.device.playlist.nodes[...]
    static process: any;                // Process involved in the playing

    private static allowed_content_types: Array<string> = ["movie", "image", "slide"];

    static is_playing: boolean = false;

    // Set the device model (in JSON) for the next loop
    static setNextDevice(device: Device){
        // this.event('debug', 'Player.setNextDevice()');

        if(!this.next_device)
            this.event('error', 'Player has no next device');

        this.next_device = device;

    }

    static startNextDevice(){
        // this.event('debug', 'Player.startNextDevice()');
        if(!this.next_device)
            this.event('error', '! There is no next device');

        else {
            this.device = this.next_device;
            Player.event('playlist_change', this.device.playlist);
            this.start();
        }
    }

    static stop(): void {
        // Player.event('debug', 'Player.stop()');

        this.is_playing = false;
        
        if(this.process){
            ChildProcess.spawn('sh', ['./stop.sh']);
            // this.process.kill('SIGKILL');
            this.process = null;
        }

        if(this.playing){
            this.playing = null;
            this.event('stopped');
        }

    }

    // 
    static start(){
        // this.event('debug', 'Player.start()');

        if(this.playing)
            this.stop();

        this.event('started');

        this.play_index = 0;
        this.play();
    }

    // Start playing current item pointer
    static play(): void {
        // this.event('debug', 'Player.play()');

        // Already playing ?
        if(this.playing)
            return this.event('error', 'Already playing');

        // Require current device, and this device having a playlist
        if(!this.device)
            return this.event('error', 'Device not set');

        if(!this.device.playlist)
            return this.event('error', 'Device has no playlist');

        if(!this.device.playlist.nodes)
            return this.event('error', 'Playlist has no nodes');

        if(this.device.playlist.nodes.length == 0)
            return this.event('error', 'Playlist is empty');

        // playlist pointer out of bounds ?
        if(this.play_index < 0 || this.play_index >= this.device.playlist.nodes.length)
            return this.event('error', 'Playing out of bounds');

        // Get the playlist we're currently pointing at
        let playing: PlaylistNode = this.device.playlist.nodes[this.play_index];

        if(!playing)
            return this.event('error', 'Node is empty');

        // Check play from and play until settings
        if(playing.play_from && playing.play_from.getTime() > new Date().getTime())
            return this.event('item_unavailable', 'Node will be available in the future');

        if(playing.play_until && playing.play_until.getTime() < new Date().getTime())
            return this.event('item_unavailable', 'Node is no longer available');

        if(playing.content && playing.content.available_from && playing.content.available_from.getTime() > new Date().getTime())
            return this.event('item_unavailable', 'Content will be available in the future');

        if(playing.content && playing.content.available_until && playing.content.available_until.getTime() < new Date().getTime())
            return this.event('item_unavailable', 'Content is no longer available');

        if(!playing.content)
            return this.event('item_unavailable', 'Content unavailable');

        let filename: string = DownloadManager.getFilename(playing.content);

        // Check if the file to play is available
        if(!fs.existsSync(filename)){
            this.event('file_missing', playing.content);
            this.event('item_unavailable', 'File missing');
            return;
        }

        // Check if the file available is up to date
        let file_created_on: Date = new Date(fs.statSync(filename).ctime);

        if(playing.content.last_modified && file_created_on < playing.content.last_modified){
            this.event('file_expired', playing.content);    // 
            this.event('item_unavailable', 'File out of date');
            return;
        }
       
        // if(Player.allowed_content_types.indexOf(playing.content.type) == -1)
        //     return Player.event('item_unavailable', 'Illegal content type');

        // All checks okay, start playing

        this.playing = playing;
        this.device.playing = playing.content;
        this.is_playing = true;
        playing.is_playing = true;
        
        this.event('playing', playing);

        // Invoke process
        this.process = ChildProcess.spawn('sh', ['./play_'+ playing.content.type +'.sh', playing.content.url +'.'+ playing.content.type, String(playing.content.duration)]);
       
        Player.event('playlist_change', Player.device.playlist);

        // DownloadManager.post_player_status();      
        // this.sendStatus();

        // Trigger finished when process is done
        var self = this;
        this.process.on('close', (code: number) => {
            if(self.playing)
                self.playing.is_playing = false;

            self.playing = null;
            self.event('item_finished', code);
        });
    }

    

    static previous(): void {
        // this.event('debug', 'Player.previous()');

        this.stop();

        setTimeout(() => {

            if(this.device.playlist.nodes.length != 0){
                this.play_index --;
                if(this.play_index < 0)
                    this.play_index = this.device.playlist.nodes.length;
                this.play();
            }

        }, 500);
    }

    static next(): void {
        // this.event('debug', 'Player.next()');

        this.stop();

        setTimeout(() => {  // Wait for triggers to lapse

            this.play_index ++;
            if(this.play_index >= this.device.playlist.nodes.length)
                return this.event('playlist_finished');


            this.play();

        }, 500);
    }

    static rewind() : void {
        // this.event('debug', 'Player.rewind()');
        
        this.stop();

        setTimeout(() => {
            this.play_index = 0;
            this.play();
        }, 500);
    }


    // Send the player model back to the server
    static sendStatus(): void {
        // this.event('debug', 'Sending status');

        try {
    
            var data = JSON.stringify(this.device);

            var options = {
                host: settings.server,
                port: 80,
                path: '/data/device/status/'+ Player.device.auth_key + '/',                  // New version WEB
                // path: '/players/flexplayer_nodejs/'+ settings.version +'/status.php?auth_key='+ this.auth_key,   // Old OptiekTV
                method: 'POST',
                headers: {
                    // 'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Type': 'application/json',
                    // 'Cache-Control': 'no-cache',
                    'Content-Length': Buffer.byteLength(data)
                }
            };

            var req = http.request(options, (res: http.IncomingMessage) : void => {
                res.setEncoding('utf8');
                // Consume data so it closes the request
                res.on('data', (chunk: any) => {});
            });

            var self = this;

            req.on('error', (e: any) => {
                self.event('error', 'Error sending status: '+ e.message);
            });

            req.write(data);
            req.end();

        } catch(e){
            self.event('error', 'Could not send status: '+ e.message);
        }
    }

    static command(command: string): void {
        switch(command){
            case Player.COMMAND_NEXT:
                Player.next();
                break;
                
            case Player.COMMAND_PAUSE:
                // Player.pause();
                break;

            case Player.COMMAND_PLAY:
                Player.play();
                break;

            case Player.COMMAND_PREVIOUS:
                Player.previous();
                break;

            case Player.COMMAND_STOP:
                Player.stop();
                break;

            default:
                throw Error('Unknown player command ('+ command +')');
        }
    }

}
