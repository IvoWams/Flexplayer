import Network from './Network';
import { EventEmitter } from './EventEmitter';
import { Download, DownloadManager } from './Download';

import Player from './Player';

/*
    Runs a webserver
*/

import http = require('http');
import url = require('url');
import querystring = require('querystring');
import path = require('path');
import fs = require('fs');

const settings = require('../settings.json');

export default class Web {

    private static server: http.Server;
    
    static event_transmitter: EventEmitter = new EventEmitter();
    public static on : Function = Player.event_transmitter.on;
    public static event : Function = Player.event_transmitter.event;    

    public static startServer(): void {
        // MessageEmitter.emit("debug", "Starting webserver");

        try {

            this.server = http.createServer(this.handleRequest);

            this.server.on('clientError', (err: any, socket: any) => {
                Web.event('debug', 'Client error !');
                socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
            });

            this.server.listen(80);

            Web.event('start');
            
        } catch(e){
            Web.event('error', 'Unable to start Web: '+ e.message);
        }

    }

    public static stopServer(): void {
        Web.event('stop');
        Web.server.close();
    }

    // Rest style
    private static handleRequest(request: http.IncomingMessage, response: any): void {

        let path: string = url.parse(request.url).pathname;

        Web.event('debug', '['+ request.method +' '+ path +'] from ['+ request.socket.remoteAddress +']');
        
        try {
        
            if(request.method == 'POST'){

                switch(path){
                    case "/config/":
                        throw new Error('NYI');
                        // break;
                    case "/connect_wifi/":
                        throw new Error('NYI');
                        // break;
                    default:
                        throw new Error('Illegal POST');
                }

                
            } else if(request.method == 'GET'){


                switch(path){

                    case "/player/next/":
                        Player.next(); 
                        break;

                    case "/statusp/":
                        let str: string[] = request.url.split('?');
                        let qstring: any = querystring.parse(str[1]);
                        Web.serveJSONP(qstring['callback'], {
                            device: Player.device,
                            playing: Player.playing,
                            downloading: DownloadManager.downloading,
                            download_queue: DownloadManager.download_queue,
                            time: new Date().getTime()
                        }, response);
                        break;

                    case "/status/":
                        Web.serveJSON({
                            device: Player.device,
                            playing: Player.playing,
                            downloading: DownloadManager.downloading,
                            download_queue: DownloadManager.download_queue,
                            time: new Date().getTime()
                        }, response);
                        break;

                    case "/config/"+ Network.nic_wired.name + "/":
                        Web.serveJSON(Network.nic_wired, response);
                        break;

                    case "/config/"+ Network.nic_wireless.name +"/":
                        Web.serveJSON(Network.nic_wireless, response);
                        break;

                    case "/config/":
                        Web.serveJSON(settings, response);
                        break;

                    case "/wifi/":

                        // Scan wifi ?

                        break;

                    default:
                        Web.serveFile(path, response);
                }
            }

        } catch(e){

            response.writeHead(500, {'Content-Type': 'text/html'});
            response.write(e.message);
            response.end();

        }
    }

    public static serveJSON(data: any, response: any){
        response.writeHead(200, {"Content-Type": "text/json"});
        response.write(JSON.stringify(data));
        response.end();
    }

    public static serveJSONP(callback: string, data: any, response: any){
        response.writeHead(200, {"Content-Type": "application/javascript"});
        response.write(callback +'('+ JSON.stringify(data) +');');
        response.end();
    }

    public static serveFile(filename: any, response: any){

        if(filename == '/') filename = 'status.html';

        fs.readFile('/home/pi/webapp/'+ filename, 'binary', (err: any, file: any) => {
            
            if(err){
                response.writeHead(500, {"Content-Type": "text/plain"});
                response.write('Message:'+ err + "\n");
                response.write('Path: '+ path.dirname(fs.realpathSync(__filename)) + "\n");
                response.write('Request: '+ filename + "\n");
                response.end();
                return;
            }

            response.writeHead(200);
            response.write(file, "binary");
            response.end();
        });

    }        

}