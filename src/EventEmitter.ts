/*

    Extend this to for event subscription service

*/

/*

export interface IEventTransmitter {
    on(name: string, call: Function): void;
    event(name: string, ...args: any[]): void;
}

*/

export class EventEmitter {
    private events: { [name: string]: Array<Function> }; // = {};
    public on(name: string, call: Function){
        if(!this.events)
            this.events = {};
        if(!this.events[name])
            this.events[name] = Array<Function>();
        this.events[name].push(call);
    }
    public event(name: string, ...args: any[]){
        
        if(!this.events)
            return;

        if(this.events[name])
            this.events[name].forEach((event: Function) => { event(...args); });
        }
}

/*
export class StaticEventTransmitter {
    private static events: { [name: string]: Array<Function> } = {};
    public static on(name: string, call: Function){
        console.log(typeof this);
        if(!this.events[name])
            this.events[name] = Array<Function>();
        this.events[name].push(call);
    }
    public static event(name: string, ...args: any[]){
        if(this.events[name])
//            this.events[name].forEach((event: Function) => { setImmediate(() => { event(args); }); });
            this.events[name].forEach((event: Function) => { event(...args); });
        }
}
*/