interface ScheduledTask {
	time: Function;
	task: Function;
}

export default class Scheduler {

	private static is_running: boolean = false;
	private static tasks: Array<ScheduledTask> = new Array<ScheduledTask>();

	private static parse_timer(value: string) : number[] {
		let result: number[] = [0, 0];
	
		let str: string[] = value.split(':');
		if(str.length < 2)
			throw Error('Could not parse time');
	
		result[0] = parseInt(str[0]);
		result[1] = parseInt(str[1]);
	
		return result;
	}	

	private static start(){
		this.is_running = true;
		
		setInterval( () => {

			let time = new Date();
			
			try {

				Scheduler.tasks.forEach((st: ScheduledTask) => {
					let task_time = Scheduler.parse_timer(st.time());		// We do it here cause it might change during runtime
					if(time.getHours() == task_time[0] && time.getMinutes() == task_time[1])
						st.task();
				});
		
			} catch(e){
				// debug(e.message);
			}

		}, 60000);	// Every minute

	}

	static on(time: Function, task: Function){
		this.tasks.push({ "time": time, "task": task });
		if(!this.is_running) this.start();
	}


}