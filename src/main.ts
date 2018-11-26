/*

Anyflex flexplayer
(c)2016-17
Author: Ivo Wams

Plays a playlist from OptiekTV and in the future AnyTV.

Old:
git clone http://www.bitbucket.com/amakanski/flexplayer_release/    for source code
git clone http://www.bitbucket.com/amakanski/flexplayer_update/     for update repository

New:
git to anytv.anyflex.nl

*/

const fs = require('fs');
const os = require('os');

import Authorization from './Authorization';
import Player from './Player';
import CEC from './CEC';
import DeviceBuilder from './DeviceBuilder';
import Network from './Network';
import { SSID } from './Network';
import Disk from './Disk';
import Keybinds from './Keybinds';
import Interface from './Interface/Interface';
import InterfaceElement from './Interface/InterfaceElement';
import InterfaceBuilder from './Interface/InterfaceBuilder';
import Document from './Interface/Document';
import Window from './Interface/Window';
import Input from './Interface/Input';
import Parameter from './Interface/Parameter';
import Button from './Interface/Button';
import Checkbox from './Interface/Checkbox';
import Config from './Config';
import Draw from './Draw';

import { Download, DownloadManager } from './Download';
import { Content, PlaylistNode } from './Device';
import { PlaylistView, DebugView } from './Views';

import List from './Interface/List';
import { ListItem } from './Interface/List';

import Web from './Web';
import Scheduler from './Scheduler';
import { EIDRM } from 'constants';
import BindableInterfaceElement from './Interface/BindableInterfaceElement';

const settings = require('../settings.json');

// *** Debugging views

let playlist_view: PlaylistView = new PlaylistView({ "top": 0, "left": 90 }, { "width": 125, "height": 10 });
let debug_view: DebugView = new DebugView({ "top": 11, "left": 90 }, { "width": 125, "height": 37 });

playlist_view.visible = false;
// debug_view.visible = false;
  
let debug = function (message: any, nr ?: number) {
    if (typeof message == 'string')
        debug_view.write(nr || 0, message);

    else {
        JSON.stringify(message, null, 2).split("\n").forEach((line: string) => {
            debug_view.write(1, line);
        });
    }
}

process.on('unhandledRejection', r => { debug(r, 2); });

let halt = function (error: Error) {

    Draw.clear();

    Draw.customBGColor(9);
    Draw.customColor(15);

    Draw.paintTextBox(
        { "left": 20, "top": 1 },
        { "width": 135, "height": 9 },
        String(error.message),
        "center",
        "middle"
    );

    if(error.stack){

        let stack_height: number = error.stack.split('\n').length;

        Draw.customBGColor(0);
        Draw.customColor(15);
    
        Draw.paintTextBox(
            { "left": 20, "top": 12 },
            { "width": 135, "height": 20 },
            error.stack,
            "left",
            "top"
        );

    }

    if(settings.support_message){
    
        Draw.customBGColor(12);
        Draw.customColor(15);

        Draw.paintTextBox(
            { "left": 20, "top": 35 },
            { "width": 135, "height": 11 },
            String(settings.support_message),
            "center",
            "middle"
        );

    }

    Draw.customBGColor(0);
    Draw.customColor(15);
    Draw.setCursor(0, 55);

    process.exit(0);
}

// Debugging output

if(settings.test){
    /*
    Player.on('debug', (str_debug: string) => { debug('[Player] ' + str_debug); });
    DownloadManager.on('debug', (str_debug: string) => { debug('[Download] ' + str_debug); });
    CEC.on('debug', (str_debug: string) => { debug('[CEC] '+ str_debug); });
    Web.on('debug', (str_debug: string) => { debug('[Web] '+ str_debug); });
    Interface.on('debug', (str_debug: string) => { debug('[Interface] '+ str_debug); });
    */
    Network.on('debug', (str_debug: string) => { debug('[Network] '+ str_debug); });
}

Player.on('error', (str_error: string) => { debug('[Player] ' + str_error); });
DownloadManager.on('error', (str_error: string) => { debug('[Download] '+ str_error); });
CEC.on('error', (str_error: string) => { debug('[CEC] '+ str_error); });
Web.on('error', (str_error: string) => { debug('[Web] '+ str_error); });
Interface.on('error', (str_error: string) => { debug('[Interface] '+ str_error); });
Network.on('error', (str_error: string) => { debug('[Network] '+ str_error); });

debug('Flexplayer');
debug('(c)2016-17 Anyflex');
debug('Author: Ivo Wams');
debug('');

/******************
 *** KEYBINDING ***
 ******************/

// CEC -> Interface
Keybinds.add('cec_interface', CEC.CEC_UP, Interface.COMMAND_UP);
Keybinds.add('cec_interface', CEC.CEC_DOWN, Interface.COMMAND_DOWN);
Keybinds.add('cec_interface', CEC.CEC_LEFT, Interface.COMMAND_LEFT);
Keybinds.add('cec_interface', CEC.CEC_RIGHT, Interface.COMMAND_RIGHT);
Keybinds.add('cec_interface', CEC.CEC_SELECT, Interface.COMMAND_CLICK);
Keybinds.add('cec_interface', CEC.CEC_RETURN, Interface.COMMAND_CANCEL);

// CEC -> Player
Keybinds.add('cec_player', CEC.CEC_REWIND, Player.COMMAND_PREVIOUS);
Keybinds.add('cec_player', CEC.CEC_FORWARD, Player.COMMAND_NEXT);
Keybinds.add('cec_player', CEC.CEC_STOP, Player.COMMAND_STOP);
Keybinds.add('cec_player', CEC.CEC_PLAY, Player.COMMAND_PLAY);

// CEC -> Swap Interface and Player
Keybinds.add('main', CEC.CEC_SETUP, Interface.COMMAND_START);






/*****************
 *** INTERFACE ***
 *****************/

let document: Document = InterfaceBuilder.fromFile('./interface/interface.json');
Interface.setDocument(document);


Interface.setBindVariables({
    "Player": Player,
    "Network": Network
});

// let window_header: Window = <Window>document.findChild('header');
let window_wired: Window = <Window>document.findChild('wired');
let window_wireless: Window = <Window>document.findChild('wireless');
let window_wifi_setup: Window = <Window>document.findChild('wifi_setup');
let window_search_ssid: Window = <Window>document.findChild('window_search_ssid');

let button_search_ssid: Button = <Button>document.findChild('button_search_ssid');

// let button_tv_mute = <Button>document.findChild('button_tv_mute');
// let button_tv_off = <Button>document.findChild('button_tv_off');
// let button_save = <Button>document.findChild('button_save');
// let button_cancel = <Button>document.findChild('button_cancel');

let list_ssid: List = <List>document.findChild('ssid_list');

let checkbox_use_wireless: Checkbox = <Checkbox>document.findChild('use_wireless');
let checkbox_use_dhcp: Checkbox = <Checkbox>document.findChild('use_dhcp');

let parameter_ssid: Parameter = <Parameter>document.findChild('parameter_ssid');
let parameter_signal_strength: Parameter = <Parameter>document.findChild('parameter_signal_strength');
let parameter_memory: Parameter = <Parameter>document.findChild('parameter_memory');
let parameter_disk: Parameter = <Parameter>document.findChild('parameter_disk');
let parameter_uptime: Parameter = <Parameter>document.findChild('parameter_uptime');
let parameter_mac: Parameter = <Parameter>document.findChild('parameter_mac');
let parameter_ssid_status: Parameter = <Parameter>document.findChild('parameter_ssid_status');

/*
let input_ip: Input = <Input>document.findChild('ip');
let input_subnet: Input = <Input>document.findChild('subnet');
let input_gateway: Input = <Input>document.findChild('gateway');
let input_dns1: Input = <Input>document.findChild('dns1');
let input_dns2: Input = <Input>document.findChild('dns2');
*/

let input_ssid_password: Input = <Input>document.findChild('ssid_password');
let input_timer_tv_on: Input = <Input>document.findChild('input_timer_tv_on');
let input_timer_tv_off: Input = <Input>document.findChild('input_timer_tv_off');

// From config ?
input_timer_tv_on.value = Config.get('timer_tv_on') || '9:00';
input_timer_tv_off.value = Config.get('timer_tv_off') || '17:00';

checkbox_use_wireless.checked = Config.get('use_wireless') || true;
checkbox_use_dhcp.checked = Config.get('use_dhcp') || true;

// This updates the information shown on the upper left corner of the interface menu
setInterval(() => {
    parameter_memory.value = Interface.Bytes(os.freemem()) +' / '+ Interface.Bytes(os.totalmem());
    parameter_disk.value = Interface.Bytes(Disk.storage.free) +' / '+ Interface.Bytes(Disk.storage.total);
    parameter_uptime.value = Interface.Time(os.uptime());
    parameter_mac.value = Network.nic_wired.mac;

    if(Interface.enabled){
        parameter_memory.paint();
        parameter_disk.paint();
        parameter_uptime.paint();
        parameter_mac.paint();
    }
}, 1000);

Scheduler.on(() => { return input_timer_tv_on.value; }, () => { CEC.tv_on(); });
Scheduler.on(() => { return input_timer_tv_off.value; }, () => { CEC.tv_standby(); }) ;

function signal_strength(value: number): string {
    if(value < -80) return '*';
    if(value < -70) return '**';
    if(value < -60) return '***';
    if(value < -50) return '****';
    return '*****';
}

list_ssid.on('select', (li: ListItem) => {
    // Interface.event('debug', li.value);
    window_search_ssid.hide();
    window_wifi_setup.visible(true);
    button_search_ssid.focused(true);
    
    // Connect to ...
    parameter_ssid.value = li.data.name;
    parameter_signal_strength.value = String(li.data.signal);

    parameter_ssid.paint();
    parameter_signal_strength.paint();
});

list_ssid.on('cancel', () => {
    window_search_ssid.hide();
    button_search_ssid.focused(true);
});

// Put network status in parameter_ssid_status
let update_ssid_status = (status_message: string) => {
    parameter_ssid_status.value = status_message;
    parameter_ssid_status.paint();
};
    
Interface.setBindFunctions({

    "use_wireless()": (b: boolean) => {
        window_wifi_setup.visible(b);

        if(b){
            window_wired.hide();
            window_wireless.show();
        } else {
            window_wireless.hide();
            window_wired.show();
        }
    },

    "use_dhcp()": (b: boolean) => {

        window_wired.children.forEach((ie: InterfaceElement) => { ie.readonly(b); });
        window_wireless.children.forEach((ie: InterfaceElement) => { ie.readonly(b); });
        Interface.paint();
        
    },

    "search_ssid()": () => {

        Network.scanWireless().then(() => {

            while(list_ssid.children.length > 0)
                list_ssid.children.pop();
   
            Network.nic_wireless.list_ssid.forEach((ssid: SSID) => {
                list_ssid.addItem(ssid.name + ' '+ signal_strength(ssid.signal), ssid.name, ssid);
            });
    
            list_ssid.focusFirstChild();
    
        });
        
    },

    "connect_to_ssid()": async () => {

        update_ssid_status('Bezig met verbinden...');

        try {

            update_ssid_status('Bezig met verbinden...');

            if(!await Network.connectToSSID(parameter_ssid.value, input_ssid_password.value))
                throw Error('Geen verbinding');

            if(checkbox_use_dhcp.checked){
                update_ssid_status('Ophalen IP adres...');
                await Network.startDHCP(Network.nic_wireless);
            }

            await Network.updateNetworkInterface(Network.nic_wireless);

            Interface.paint();

            update_ssid_status('Verbonden');

        } catch(e){
            update_ssid_status(e.message);
        }

    },

    "save()" : () => {
        // Do save business...
        Config.set('use_dhcp', checkbox_use_dhcp.checked);
        Config.set('use_wireless', checkbox_use_wireless.checked);
        Config.set('timer_tv_off', input_timer_tv_off.value);
        Config.set('timer_tv_on', input_timer_tv_on.value);

        // Write changes to binds
        [
            'wired_ip', 'wired_subnet', 'wired_gateway', 'wired_dns1', 'wired_dn2',
            'wireless_ip', 'wireless_subject', 'wireless_gateway', 'wireless_dns1', 'wireless_dns2'
        ].forEach((str: string) => {
            let elm: BindableInterfaceElement = <BindableInterfaceElement>document.findChild(str);
            if(!elm)
                debug('Unable to find element ['+ str +']');

            else
                elm.writeBind();
        });

        // Apply network configuration
        Network.writeConfig();

        // Restart dclient ?
        
        // Close interface after animation
        setTimeout(() => { 
            // Debug
            // Interface.stop();
            // Player.start();
        }, 500);

    },

    "cancel()": () => {
        setTimeout(() => {
            Interface.stop();
            Player.start();
        }, 500);
    },

    "tv_standby()": () => { CEC.tv_standby(); },
    "tv_mute()": () => { CEC.tv_mute(); }

});




(async () => {

    try {
        await Disk.updateDiskUsage();
        await Network.updateNetworkInterface(Network.nic_wireless);
        await Network.updateNetworkInterface(Network.nic_wired);
        Player.auth_key = await Authorization.getAuthKey();
        await DeviceBuilder.fetch();

    } catch(e){
        halt(e);
    }

    // Interval for device update
    setInterval(() => {
        DeviceBuilder.fetch();
    }, settings.timers.device_update);

    setInterval(() => {
        Player.sendStatus();
    }, settings.timers.send_status);

    // *** CEC Logic ***

    CEC.on('command', (command: string) => {

        if(command == CEC.CEC_SETUP){

            if(Interface.enabled){
                Interface.stop();
                Player.start();

            } else {
                Interface.start();
                Player.stop();

                // Trigger this to show wireless or wired window
                Interface.evokeBoundFunction("use_wireless()", checkbox_use_wireless.checked);

                // Trigger to update readonly input fields
                Interface.evokeBoundFunction("use_dhcp()", checkbox_use_dhcp.checked);
            }
        }

        else

            try {
            
                if(Interface.enabled) Interface.command(Keybinds.get('cec_interface', command));
                else Player.command(Keybinds.get('cec_player', command));

            } catch(e){
                debug(e.message);
            }
    });     

    // *** Player logic

    // On playlist node finish, play next
    Player.on('item_finished', () => {
        
        if(Player.is_playing)
            Player.next();

    });

    // On playlist node unavailable, play next
    Player.on('item_unavailable', (node: PlaylistNode, message: String) => {
        Player.next();
    });

    let new_download = (content: Content) => {
        let download: Download = new Download(DownloadManager.getURL(content), DownloadManager.getFilename(content));
        download.name = content.title;
        download.on('success', () => {});
        download.on('error', (e: Error) => {
            debug('! Error downloading: ' + e.message);
        });
        DownloadManager.download(download);
    }

    // On content file missing, start download
    Player.on('file_missing', new_download); /*  (content: Content) => {
        let download: Download = new Download(DownloadManager.getURL(content), DownloadManager.getFilename(content));
        download.name = content.title;
        download.on('success', () => {});
        download.on('error', (e: Error) => {
            debug('! Error downloading: ' + e.message);
        });
        DownloadManager.download(download);
    }); */

    Player.on('file_expired', new_download);

    // On finishing playlist, build new playlist
    Player.on('playlist_finished', () => {
        Player.startNextDevice();
    });

    /*
    Player.on('started', () => {});
    Player.on('stopped', () => {});
    Player.on('playlist_change', (playlist: any) => {});
    */

    // Start CEC processes
    CEC.start();

    // Start Webserver
    Web.startServer();

    // Start player
    Player.startNextDevice();

})();
