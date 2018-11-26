let fs = require('fs');

export default class Config {

	private static settings: {[key: string]: any};
	private static is_loaded: boolean = false;
	private static file = './config.json';

	public static get(key: string) : any {
		this.load();

		if(!this.settings[key])
			return false;

		return this.settings[key];
	}

	public static set(key: string, value: any){
		this.load();
		this.settings[key] = value;
		this.save();
	}

	private static load(){
		if(!this.is_loaded){
			this.settings = fs.existsSync(this.file) ? JSON.parse(fs.readFileSync(this.file, 'utf8')) : {};

			this.is_loaded = true;
		}
	}

	private static save(){
		if(!this.is_loaded)
			throw Error('Save before load!');

		try {
			fs.writeFileSync(this.file, JSON.stringify(this.settings));
		} catch(e){
			console.log(this.settings);
			process.exit(0);
		}
	}
}