// Reading disk usage from linux

import { Device, Playlist, PlaylistNode } from './Device';

var child_process = require('child_process');
var fs = require('fs');
var path = require('path');

var settings = require('../settings.json');

interface DiskUsage {
    total: number;
    free: number;
    used: number;
}

export default class Disk {

    static storage: DiskUsage = { total: 0, free: 0, used: 0 };

    static async updateDiskUsage(): Promise<DiskUsage> {
        return new Promise<DiskUsage> ((resolve: Function, reject: Function) => {
            child_process.exec('df', (error  : any, stdout: any, stderr: any) => {

                var lines = stdout.split("\n");

                if(lines.length < 2){
                    reject('Unable to read linux command. Are we running linux?');
                    return;
                }

                var root = lines[1];
                var values = root.split(/\s/).filter((v: string) => { return v != ''; });

                if(values.length < 3){
                    reject('Unable to read output of [df] command');
                    return
                }

                Disk.storage = {
                    free: 1000 * parseInt(values[3]),
                    total: 1000 * parseInt(values[1]),
                    used: 1000 * parseInt(values[2])
                }

                resolve(Disk.storage);
            });
        });
    }

    static cleanUp(device: Device){

        // Remove /var/log/*.gz (do this on startup ?)
        // child_process.spawn('rm', ['-rf', '/var/log/*.gz']);

        // Cross reference /cache/*.movie with current playlist
        fs.readdirSync(settings.cache_folder).forEach((file: string) => {

            var file_split = file.split('.');

            if(file_split.length < 2 || (file_split[1] != 'movie' && file_split[1] != 'image'))
                return;

            var url = file_split[0];
            // MessageEmitter.emit('diskmanager', '['+ file +']');
            
            // Find url in playlist
            if(device && device.playlist && device.playlist.nodes){
                var find_nodes = device.playlist.nodes.filter((node: PlaylistNode) => {
                    return node.content.url == url;
                });

                if(find_nodes.length == 0){
                    // MessageEmitter.emit('diskmanager', '['+ file +'] is not used');
                    // MessageEmitter.emit('debug', 'Removing '+ file);
                    fs.unlink(settings.cache_folder + file);
                }
            }

        });

    }

}