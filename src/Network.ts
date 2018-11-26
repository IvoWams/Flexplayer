import Web from './Web';

import { EventEmitter } from './EventEmitter';
import Config from './Config';

import * as child_process from 'child_process';
import * as util from 'util';
import * as fs from 'fs';

export interface SSID {
    signal: number;
    name: string;
};

export interface NetworkInterface {
    wired: boolean;
    wireless: boolean;
    simulation: boolean;
    connected: boolean;
    name: string;
    ip: string;
    mac: string;
    subnet: string;
    gateway: string;
    dns1: string;
    dns2: string;
    connected_ssid: string;
    connected_ssid_signal_strength: string;
    list_ssid: Array<SSID>;
}

export default class Network {

    private static event_transmitter: EventEmitter = new EventEmitter();
    public static on: Function = Network.event_transmitter.on;
    public static event: Function = Network.event_transmitter.event;

    private static simulation: boolean = true;
    public static listeners: Array<any> = new Array<any>();

    public static nic_wired: NetworkInterface = {} as NetworkInterface;
    public static nic_wireless: NetworkInterface = {} as NetworkInterface;

    private static config_file_template: string = "\
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev\n\
update_config=1\n\
\n\
network={\n\
ssid=\"%s\"\n\
psk=\"%s\"\n\
proto=RSN\n\
key_mgmt=WPA-PSK\n\
pairwise=CCMP\n\
auth_alg=OPEN\n\
}\
\
";



    static async updateNetworkInterface(network_interface: NetworkInterface): Promise<NetworkInterface> {
        await Network.getIP(network_interface);
        await Network.getDNS(network_interface);
        if (!network_interface.wired) await Network.getWireless(network_interface);
        return network_interface;
    }



    private static async getIP(network_interface: NetworkInterface): Promise<NetworkInterface> {
        return new Promise<NetworkInterface>((resolve: Function, reject: Function) => {

            var self = this;
            var spawn = child_process.spawn('ifconfig', [network_interface.name]);
            var data = '';

            spawn.stdout.on('data', (chunk: string) => {
                data += chunk;
            });

            spawn.on('error', (error: string) => {
                reject('Could not run ifconfig on interface ' + network_interface.name);
            });

            spawn.on('close', () => {
                var regex_hw: RegExp = /HWaddr ([0-9a-f:]+)/;
                var match = regex_hw.exec(data);
                network_interface.mac = match ? match[1] : '';

                var regex_ip: RegExp = /inet addr:([0-9\.]+)/;
                var match = regex_ip.exec(data);
                network_interface.ip = match ? match[1] : '';

                var regex_mask: RegExp = /Mask:([0-9\.]+)/;
                var match = regex_mask.exec(data);
                network_interface.subnet = match ? match[1] : '';

                resolve(network_interface);
            });
        })
    }


    public static async getGateway(network_interface: NetworkInterface): Promise<NetworkInterface> {
        return new Promise<NetworkInterface>((resolve: Function, reject: Function) => {

            var self = this;
            var data: string = "";
            var spawn = child_process.spawn("ip", ["route"]);

            spawn.stdout.on('data', (chunk: string) => {
                data += chunk;
            });

            spawn.on('error', (error: string) => {
                reject(error);
            });

            spawn.on('close', () => {
                var str = "default via ([0-9\\.]+) dev " + network_interface.name;

                var r: RegExp = RegExp(str, "m");   // Dit parsed nog niet lekker ....
                var match = r.exec(data);
                network_interface.gateway = match ? match[1] : '';

                resolve(network_interface);
            });

        });
    }

    private static async getDNS(network_interface: NetworkInterface): Promise<NetworkInterface> {       
        return new Promise<NetworkInterface>((resolve: Function, reject: Function) => {

            var self = this;
            var data: string = "";
            var result = Array();
            var spawn = child_process.spawn('cat', ["/etc/resolv.conf"]);

            spawn.stdout.on('data', function (chunk: string) {
                data += chunk;
            });

            spawn.on('error', function (error: string) {
                reject(error);
            });

            spawn.on('close', function () {

                var dns: RegExp = /nameserver ([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})/g;
                var match: any;

                while (match = dns.exec(data)) {
                    result.push(match[1]);
                }

                network_interface.dns1 = result[0] ? result[0] : '';
                network_interface.dns2 = result[1] ? result[1] : '';

                resolve(network_interface);
            });
        })
    }

    private static async getWireless(network_interface: NetworkInterface): Promise<NetworkInterface> {
        return new Promise<NetworkInterface>((resolve: Function, reject: Function) => {

            // Spawn iwconfig device.name
            var self = this;
            var data: string = "";
            var spawn = child_process.spawn('iwconfig', [network_interface.name]);

            spawn.stdout.on('data', (chunk: string) => { data += chunk; });
            spawn.on('error', (error: string) => {
                reject(error);
            });

            spawn.on('close', () => {
                var regex: RegExp = /ESSID:"([^"]+)"/g;
                var match: RegExpExecArray = regex.exec(data);
                if (match) network_interface.connected_ssid = match[1];   // Connected to this
                else network_interface.connected_ssid = '';  // Not connected

                resolve(network_interface);
            });

        });
    }



    // *** Wireless ***

    public static scanWireless(): Promise<NetworkInterface> {
        return new Promise<NetworkInterface>((resolve: Function, reject: Function) => {

            let scan_spawn = child_process.spawn('iw', ['dev', Network.nic_wireless.name, 'scan']);
            let scan_data: any;

            Network.nic_wireless.list_ssid = new Array<SSID>();

            scan_spawn.stdout.on('data', (data: string) => { scan_data += data; });
            scan_spawn.on('error', (error: string) => { reject(error); });
            scan_spawn.on('close', () => {

                let regex = /signal:.([-\d\.]+).*\n.*\n.SSID: ([^\n]+)/g;
                let matches: any;

                var insert = (i: SSID): void => {
                    let sublist: SSID[] = Network.nic_wireless.list_ssid.filter((s: SSID) => { return s.name == i.name; });
                    if (sublist.length == 0)
                        Network.nic_wireless.list_ssid.push(i);
                    else
                        if (sublist[0].signal < i.signal)
                            sublist[0].signal = i.signal;
                }

                while ((matches = regex.exec(scan_data)) != null)
                    insert({ "signal": parseInt(matches[1]), "name": matches[2] });

                Network.nic_wireless.list_ssid = Network.nic_wireless.list_ssid.sort((a: SSID, b: SSID) => {
                    return a.signal < b.signal ? 1 : -1;
                });

                resolve(Network.nic_wireless);
            });

        })
    }




    static getPassphrase(ssid: string, passcode: string): Promise<string> {
        return new Promise<string>((resolve: Function, reject: Function) => {

            let spawn: child_process.ChildProcess = child_process.spawn('wpa_passphrase', ['"' + ssid + '"', '"' + passcode + '"']);
            let result: string = '';

            spawn.stdout.on('data', (data: string) => {
                result += data;
            });

            spawn.on('error', (error: string) => {
                reject(error);
            });

            spawn.on('close', () => {

                var regex = /\spsk=([^\n]+)/;
                var match = String(result).match(regex);

                if (match != null)
                    resolve(match[1]);
            });

        });
    }


    static async connectToSSID(ssid: string, passcode: string): Promise<boolean> {
        if(passcode.length < 8) throw Error('Wachtwoord is te kort (minimaal 8 tekens)');
        if(passcode.length > 63) throw Error('Wachtwoord is te lang (maximaal 63 tekens)');

        // Passphrase not used ?
        // let passphrase: string = await this.getPassphrase(ssid, passcode);
        await this.writeSupplicantConfig(ssid, passcode);

        let tries: number = 3;

        while(tries-- > 0){
            await this.runSupplicant();
            if(await this.supplicantResponse()){
                this.event('debug', 'yes');
                return true;
            } else {
                this.event('debug', 'no');
            }
        }

        return false;        
        // throw Error('Kan niet verbinden');
    }


    static writeSupplicantConfig(ssid: string, passphrase: string): Promise<void> {
        return new Promise<void> ((resolve: Function, reject: Function) => {            
            try {

                let wpa_supplicant_config_file: string = '/etc/wpa_supplicant/wpa_supplicant.conf';
                let wpa_supplicant_config = util.format(Network.config_file_template, ssid, passphrase);

                if(fs.existsSync(wpa_supplicant_config_file)) 
                    fs.unlinkSync(wpa_supplicant_config_file);

                fs.writeFileSync(wpa_supplicant_config_file, wpa_supplicant_config);

            } catch(e){
                reject(e.message);
            }

            resolve();

        });

    }

    static supplicantResponse(): Promise<boolean> {
        this.event('debug', 'supplicantResponse()');

        var self = this;
        
        return new Promise<boolean>((resolve: Function, reject: Function) => {
            
            let tail_process: child_process.ChildProcess = child_process.spawn('tail', ['-f', 'wpa_supplicant.log']);

            tail_process.stdout.on('data', (str: string) => {

                self.event('debug', 'wpa_supplicant: '+ str);

                let success_reg: Array<RegExp> = [
                    /CTRL-EVENT-CONNECTED/g
                ];

                let fail_reg: Array<RegExp> = [
                    /4-Way Handshake failed/g,
                    /CONN_FAILED/g
                ];

                for(let reg_exp of fail_reg)
                    if(reg_exp.exec(str.toString()) != null){
                        tail_process.kill();
                        resolve(false);
                    }

                for(let reg_exp of success_reg)
                    if(reg_exp.exec(str.toString()) != null){
                        tail_process.kill();
                        resolve(true);
                    }
            });

            /*
            tail_process.on('close', () => {
                reject('closed');
            });
            */

            tail_process.on('error', (error: string) => {
                reject(error);
            });

        });
    }

    public static runSupplicant() {
        this.event('debug', 'runSupplicant()');
        return new Promise<void>((resolve: Function, reject: Function) => {
            
            try {
                child_process.execSync('killall wpa_supplicant > /dev/null');
                if(fs.existsSync('/var/run/wpa_supplicant/'+ Network.nic_wireless.name))
                    fs.unlinkSync('/var/run/wpa_supplicant/'+ Network.nic_wireless.name);
                
            } catch(e){
                reject('Unable to stop wpa_supplicant: '+ e.message);
            }

            if(fs.existsSync('wpa_supplicant.log'))
                fs.unlinkSync('wpa_supplicant.log');

            let wpa_supplicant_spawn: child_process.ChildProcess = child_process.spawn(
                'wpa_supplicant',
                [
                    '-i' + Network.nic_wireless.name,
                    '-c' + '/etc/wpa_supplicant/wpa_supplicant.conf',
                    '-B',
                    '-f' + 'wpa_supplicant.log'
                ],
                {
                    detached: true
                }
            );

            wpa_supplicant_spawn.on('error', (error: string) => {
                reject(error);
            });

            wpa_supplicant_spawn.on('close', () => {
                resolve();
            });

        });
    }

    public static startDHCP(network_interface: NetworkInterface): Promise<void> {
        return new Promise<void>((resolve: Function, reject: Function) => {
            
            let dhclient_spawn: child_process.ChildProcess = child_process.spawn('dhclient', [network_interface.name]);

            var ip_spawn = child_process.spawn('dhclient', [network_interface.name]);    // -x ?
    
            ip_spawn.on('error', (error: string) => {
                reject(error);
            });
    
            ip_spawn.on('close', () => {
                resolve();
            });                

        });
    }

    // Generate a string for Linux configuration
    public static generateInterfaceString(): string {

        let use_wireless: boolean = Config.get('use_wireless');
        let use_dhcp: boolean = Config.get('use_dhcp');

        var str = "# IP Config template for Anyflex Flexplayer\n\n\# Loopback interface\n\auto lo\niface lo inet loopback\n";
        
        if (!use_wireless) {
            str += "#auto " + Network.nic_wired.name + "\nallow-hotplug " + Network.nic_wired.name + "\n";

            if (use_dhcp)
                str += "iface " + Network.nic_wired.name + " inet dhcp\n";

            else {
                str += "iface " + Network.nic_wired.name + " inet static\n";
                str += "	address " + Network.nic_wired.ip + "\n";
                str += "	netmask " + Network.nic_wired.subnet + "\n";
                str += "	gateway " + Network.nic_wired.gateway + "\n";
                str += "	dns-nameservers " + Network.nic_wired.dns1 + " " + Network.nic_wired.dns2 + "\n";
                str += "	dns-search local\n";
            }

            str += "#auto " + Network.nic_wireless.name + "\nallow-hotplug " + Network.nic_wireless.name + "\n";
            str += "iface " + Network.nic_wireless.name + " inet static\n";
            str += "    address 0.0.0.0\n";

            

        } else {

            str += "#auto " + Network.nic_wireless.name + "\nallow-hotplug " + Network.nic_wireless.name + "\n";

            if (use_dhcp)
                str += "iface " + Network.nic_wireless.name + " inet dhcp\n";

            else {
                str += "iface " + Network.nic_wireless.name + " inet static\n";
                str += "	address " + Network.nic_wireless.ip + "\n";
                str += "	netmask " + Network.nic_wireless.subnet + "\n";
                str += "	gateway " + Network.nic_wireless.gateway + "\n";
                str += "	dns-nameservers " + Network.nic_wireless.dns1 + " " + Network.nic_wireless.dns2 + "\n";
                str += "	dns-search local\n";
            }

            str += "wpa-conf /etc/wpa_supplicant/wpa_supplicant.conf\n";

            str += "#auto " + Network.nic_wired.name + "\nallow-hotplug " + Network.nic_wired.name + "\n";
            str += "iface " + Network.nic_wired.name + " inet dhcp\n";

        }

        return str;
    }

    // Stops supplicant and downs eth0 and wlan0
    // We're not rejecting on fail, just run the commands
    public static down(): Promise<void> {
        return new Promise<void>((resolve: Function, reject: Function) => {
            // wpa_action [name] stop does maybe a better job ?
            child_process.exec(
                'killall wpa_supplicant & ifdown ' + Network.nic_wireless.name + ' ' + Network.nic_wired.name,
                (error: Error, stdout: string, stderr: string) => {

                    if(stdout != '')
                        Network.event('debug', 'Network.down() => ['+ stdout +']');

                    if(stderr != '')
                        Network.event('error', 'Network.down() => ['+ stderr +']');

                    if(error)
                        Network.event('error', error.message);

                    // reject(error.message);
                    // else

                    resolve();
                }
            );
        });
    }

    // Ups eth0 and wlan0 (not supplicant?)
    public static up(): Promise<void> {
        return new Promise<void>((resolve: Function, reject: Function) => {
            child_process.exec(
                'ifup ' + Network.nic_wireless.name + ' ' + Network.nic_wired.name,
                (error: Error, stdout: string, stderr: string) => {

                    if(stdout != '')
                        Network.event('debug', 'Network.up() => ['+ stdout +']');

                    if(stderr != '')
                        Network.event('error', 'Network.up() => ['+ stderr +']');
                    
                    if(error)
                        Network.event('error', 'Network.up() => ['+ stderr +']');

                    // reject(error.message);
                    // else
                    resolve();
                }
            );
        });
    }


    // Save configuration to /etc/network/interface
    // And force the interfaces to re-read the config

    public static async writeConfig(){

        Network.event('debug', 'Stopping webserver');
        Web.stopServer();

        Network.event('debug', 'Generating interface config');
        let interfacing: string = Network.generateInterfaceString();

        Network.event('debug', 'Halting services');        // Stop wpa_supplicant and bring down interfaces first
        await Network.down();

        Network.event('debug', 'Writing config');           // Linux:
        fs.writeFileSync('/etc/network/interfaces', interfacing);

        Network.event('debug', 'Starting services');    // Try to bring interfaces back up
        await Network.up();
        await Network.runSupplicant();

        Network.event('debug', 'Start webserver');
        Web.startServer();
    }

}

// Get the network interface names from the settings file
const settings = require('../settings.json');
Network.nic_wired.name = settings.network.wired;
Network.nic_wireless.name = settings.network.wireless;
