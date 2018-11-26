import Network from './Network';
import { Download, DownloadManager } from './Download';

const settings = require('../settings.json');
const fs = require('fs');

export default class Authorization {

    private static readAuthToken(): string {
        let raw: string = fs.readFileSync(settings.cache_folder + 'auth_key');
        let json: any = JSON.parse(raw);

        if(json.error)
            throw Error(json.error);

        return json.auth_key;
    }
    
    // Reads the auth_key, if not existing or not useful (ie. already registered), try to download new auth_key
    static async getAuthKey(): Promise<string> {
        return new Promise<string>((resolve: Function, reject: Function) => {
   
            if(fs.existsSync(settings.cache_folder + 'auth_key'))

                try {
                    resolve(Authorization.readAuthToken());
                    return;
                }
                catch(e){
                    // auth token not useful, try to download
                }

            if(Network.nic_wired.mac == '')
                throw Error('Network not initialized');
    
            // Download auth_key
            let auth_key_download: Download = new Download(
                'http://'+ settings.server + '/data/device/register/'+ Network.nic_wired.mac +'/',
                // settings.server + '/players/flexplayer_nodejs/'+ settings.version +'/register.php?mac='+ Network.nic_wired.mac,
                settings.cache_folder + 'auth_key'
            );
    
            auth_key_download.on('success', () => {
                try {
                    resolve(Authorization.readAuthToken());
                }
                catch(e){
                    reject(e);
                }
            });
    
            auth_key_download.on('error', (error: string) => {
                
                if(error == '404')
                    reject(Error('Version not supported'));

                else if(error == '500')
                    reject(Error('Server error'));

                else
                    reject(Error(error));
            });
    
            DownloadManager.download(auth_key_download);

        });
    }

}