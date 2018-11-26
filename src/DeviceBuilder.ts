import { Device, PlaylistNode } from './Device';
import Player from './Player';

import Disk from './Disk';
import Network from './Network';
import { Download, DownloadManager } from './Download';

const fs = require('fs');

var settings = require('../settings.json');

export default class DeviceBuilder {

    static async fetch(){
       
        let device: Device = await DeviceBuilder.downloadDevice();
        device.storage = Disk.storage.total;
        device.storage_free = Disk.storage.free;
        device.ip_eth0 = Network.nic_wired.ip;
        device.ip_wlan0 = Network.nic_wireless.ip;

        Player.setNextDevice(device);
    }

    private static async readDevice(): Promise<Device> {

        return new Promise<Device>((resolve: Function, reject: Function) => {
            try {
                let raw_json: string = fs.readFileSync(settings.cache_folder + settings.device_file, 'utf8');
                let json: any = JSON.parse(raw_json);
                let device: Device = new Device(json);

                resolve(device);
            }
            catch(e){
                console.log(e.message);
                reject(e);
            }
        });
    }
    
    private static async downloadDevice(): Promise<Device> {
        
        return new Promise<Device>((resolve: Function, reject: Function) => {

            // var url: string = 'http://'+ settings.server +'/players/flexplayer_nodejs/'+ settings.version +'/device.php?auth_key='+ Player.auth_key;
            var url: string = 'http://'+ settings.server +'/data/device/status/'+ Player.auth_key +'/';
            var download: Download = new Download(url, settings.cache_folder + settings.device_file);

            download.on('success', () => {

                try {
                    resolve(DeviceBuilder.readDevice());
                }
                catch(e){
                    reject(e);
                }

            });

            download.on('error', (error: string) => {

                try {
                    resolve(DeviceBuilder.readDevice());
                }
                catch(e){
                    console.log('! Error reading old device, reason: ', e.message);
                    reject(e);
                }
            });

            DownloadManager.download(download);

        });
    }
}




/*




class DeviceBuilder {

    // If auth_key exists, return that, else download it and try again. On error whils/after downloading, total failure

    async fetchAuthKey(): Promise<string> {
        return new Promise<string>((resolve: Function, reject: Function) => {
            if(fs.existsSync(settings.cache_folder + 'auth_key'))
                resolve(fs.readFileSync(settings.cache_folder + 'auth_key'));
            else {
                let url = "http://domain/path/";
                let download: Download = new Download(url + 'auth_key', settings.cache_folder + settings.device_file);
                download.on('error', (error: string) => { reject(error); });
                download.on('success', () => {                    
                    resolve(fs.readFileSync(settings.cache_folder + 'auth_key'));
                });
                DownloadManager.download(download);
            }
        });
    }

    // Try to download the device file and return its content. Failing that, try if there's still a local file, else total failure

    async fetchDeviceModel(): Promise<string> {
        return new Promise<string>((resolve: Function, reject: Function) => {

            let url = "http://domain/path/";
            let download: Download = new Download(url + auth_key, settings.cache_folder + settings.device_file);
            download.on('error', (error: string) => {
                if(!fs.existsSync(settings.cache_folder + settings.device_file))
                    reject('Could not retrieve device model');
                else
                    resolve(fs.readFileSync(settings.cache_folder + settings.device_file));
            });
            download.on('success', () => {
                resolve(fs.readFileSync(Settings.cache_folder + settings.device_file));
            });
            DownloadManager.download(download);            
        });
    }




    // ...


    buildDeviceFromJSON(json: any){

        let device: Device = new Device(json);
        device.storage = DiskManager.storage_total;
        device.storage_free = DiskManager.storage_free;
        device.ip_eth0 = Network.nic_eth0.ip;
        device.ip_wlan0 = Network.nic_wlan0.ip;
        
        return device;
    }


}

*/