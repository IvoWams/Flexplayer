export interface Keybind {
    group: string;
    bind: string;
    command: string;
}

export default class Keybinds {
    public static bindings: Array<Keybind> = new Array<Keybind>();

    static add(group: string, bind: string, command: string): void {
        Keybinds.bindings.push({ "group": group, "bind": bind, "command": command });
    }

    static get(group: string, bind: string): string {
        for(let i = 0; i < this.bindings.length; i++)
            if(this.bindings[i].group == group && this.bindings[i].bind == bind)
                return this.bindings[i].command;

        throw Error('Keybind not found: '+ group +':'+ bind);
    }
}