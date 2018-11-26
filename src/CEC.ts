/*
	CEC Handler
	Supplies handler/listener design pattern for CEC communication
	(c)2016 Ivo Wams, Anyflex
*/

import { EventEmitter } from './EventEmitter';

var spawn = require('child_process').spawn;

export default class CEC {

	private static event_transmitter: EventEmitter = new EventEmitter();
	public static on: Function = CEC.event_transmitter.on;
	public static event: Function = CEC.event_transmitter.event;

	private static cec_client: any;

	/*
		Cec button commands look like this
		01:44:01
	*/

	private static wait_for_release: boolean = false;

	public static CEC_PRESS: string = '44';
	public static CEC_RELEASE: string = '8b';

	public static CEC_SELECT: string = '00';
	public static CEC_UP: string = '01';
	public static CEC_DOWN: string = '02';
	public static CEC_LEFT: string = '03';
	public static CEC_RIGHT: string = '04';
	public static CEC_SETUP: string = '0a';
	public static CEC_RETURN: string = '0d';
	public static CEC_PLAY: string = '44';
	public static CEC_STOP: string = '45';
	public static CEC_RECORD: string = '47';
	public static CEC_REWIND: string = '48';
	public static CEC_FORWARD: string = '49';

	private static available_commands: string[] = [
		CEC.CEC_SELECT,
		CEC.CEC_UP,
		CEC.CEC_DOWN,
		CEC.CEC_LEFT,
		CEC.CEC_RIGHT,
		CEC.CEC_SETUP,
		CEC.CEC_RETURN,
		CEC.CEC_PLAY,
		CEC.CEC_STOP,
		CEC.CEC_RECORD,
		CEC.CEC_REWIND,
		CEC.CEC_FORWARD
	];

	static start(): void {

		var self = this;

		this.cec_client = spawn('cec-client', ['--osd-name', 'OptiekTV']);

		this.cec_client.on('error', (error: string) => { self.event('error', error); });

		this.cec_client.stdout.on('data', function (data: string) {

			var regex = /01:([0-9a-f]+):([0-9a-f]+)/;
			var match = String(data).match(regex);

			if (match != null){

				if(match[1] == self.CEC_PRESS && !self.wait_for_release) {

					self.wait_for_release = true;

					self.available_commands.forEach(function (command: string) {
						if (match[2] == command)
							self.event('command', command);
					});

				}

				if(match[1] == self.CEC_RELEASE)
					self.wait_for_release = false;
			}

		});

		this.cec_client.on('close', function () {
			self.event('debug', 'CECHandler has closed');
			self.event('exit');
		});
	}


	// Send commands

	static tv_mute(){
		CEC.event('debug', 'Muting TV');
		this.cec_client.stdin.write("tx f0:44:43\n");
	}

	static tv_on(){
		CEC.event('debug', 'Welcome!');
		this.cec_client.stdin.write("on 0\n");
	}

	static tv_standby(){
		CEC.event('debug', 'Goodbye! :(');
		this.cec_client.stdin.write("standby 0\n");
	}

}