import { EventEmitter } from '../EventEmitter';
import InterfaceElement from './InterfaceElement';
import BindableInterfaceElement from './BindableInterfaceElement';
import Document from './Document';
import Window from './Window';
import Keyboard from './Keyboard';
import Button from './Button';
import Input from './Input';
import Label from './Label';
import Parameter from './Parameter';
import Draw from '../Draw';

export interface InterfaceColor {
    text: number;
    background: number;
}

export default class Interface {

	private static event_transmitter: EventEmitter = new EventEmitter();
	public static on: Function = Interface.event_transmitter.on;
	public static event: Function = Interface.event_transmitter.event;    

    private static document: Document = new Document();
    // public static focus_window: Window = null;
    // public static focus_window_index: number = -1;
    public static enabled: boolean = false;

    // Bind variables
    private static bind_variables: any;

    // Bind functions
    private static bind_functions: any;

    static readonly COLOR_CLEAR: InterfaceColor = {"text": 15, "background": 0};
    static readonly COLOR_ELEMENT: InterfaceColor = {"text": 15, "background": 0};
    static readonly COLOR_BLUR: InterfaceColor = {"text": 15, "background": 12};
    static readonly COLOR_FOCUS: InterfaceColor = {"text": 0, "background": 14};
    static readonly COLOR_SELECT: InterfaceColor = {"text": 15, "background": 0};

    static readonly COMMAND_UP: string = 'up';
    static readonly COMMAND_DOWN: string = 'down';
    static readonly COMMAND_LEFT: string = 'left';
    static readonly COMMAND_RIGHT: string = 'right';
    static readonly COMMAND_CLICK: string = 'click';
    static readonly COMMAND_CANCEL: string = 'cancel';
    static readonly COMMAND_KEYDOWN: string = 'keydown';

    static readonly COMMAND_START: string = 'start';

    static setColor(color: InterfaceColor){
        Draw.customColor(color.text);
        Draw.customBGColor(color.background);
    }

    static setDocument(document: Document){
        this.document = document;
    }

    static showKeyboard(){
        let keyboard: Keyboard = <Keyboard>this.document.findChild('keyboard');
        this.document.setChildFocus(this.document.children.indexOf(keyboard));
        this.document.child_focus.show(); /* is_visible = true;
        this.document.child_focus.paint(); */
    }

    static hideKeyboard(){
        this.document.child_focus.hide(); /* is_visible = false; */
        this.document.setChildFocus(this.document.child_previous_index);    // Refocus previous window
        this.document.child_focus.setChildFocus(this.document.child_focus.child_focus_index);   // Refocus previous element in previous window
    }

    static shiftKeyboard(){
        let keyboard: Keyboard = <Keyboard>this.document.findChild('keyboard');
        keyboard.shift = !keyboard.shift;
        keyboard.paint();
    }

    static command(command: string) {
        if(!this.document)
            throw Error('Command before document');

        if(command == this.COMMAND_UP) this.up();
        else if(command == this.COMMAND_DOWN) this.down();
        else if(command == this.COMMAND_LEFT) this.left();
        else if(command == this.COMMAND_RIGHT) this.right();
        else if(command == this.COMMAND_CLICK) this.click();
        else if(command == this.COMMAND_CANCEL) this.cancel();

        else throw Error('Unknown command: '+ command);
    }

    static up(){
        if(!this.document.on_up())
            throw Error('Command not handled');
    }

    static down(){
        if(!this.document.on_down())
            throw Error('Command not handled');
    }

    static left(){
        if(!this.document.on_left())
            throw Error('Command not handled');
    }

    static right(){
        if(!this.document.on_right())
            throw Error('Command not handled');
    }

    static click(){
        if(!this.document.on_click())
            throw Error('Command not handled');
    }

    static cancel(){
        if(!this.document.on_cancel())
            throw Error('Command not handled');
    }

    static keydown(char: string){
        if(!this.document.on_keydown(char))
            throw Error('Command not handled');
    }

    static setBindVariables(model: any){
        this.bind_variables = model;
    }

    static setBindFunctions(model: any){
        this.bind_functions = model;
    }

    static evokeBoundFunction(name: string, ...parameters: any[]){
        if(!this.bind_functions[name])
            throw Error('Function ['+ name +'] not bound');
            
        this.bind_functions[name](...parameters);
    }

    static updateBinds(){

        let cb: Function = (node: BindableInterfaceElement) => {

            try {
                if(node.bind && node.bind != '')
                    node.readBind(this.bind_variables);
            }

            catch(e){
                Interface.event('error', e.message);
            }

            node.children.forEach((ie: InterfaceElement) => { cb(ie); });
        }

        cb(Interface.document);

    }

    static start(){
        this.enabled = true;
        this.updateBinds();
        Draw.clear();        
        this.paint();
    }

    static stop(){
        this.enabled = false;
        Interface.setColor(Interface.COLOR_CLEAR);
        Draw.clear();
    } 

    static paint(){
        if(!this.enabled)
            return;

        this.document.paint();
    }



    // Pretty

    static Bytes(n: number) : string {
        if(n > 1073741824) return (n / 1073741824).toFixed(2) + ' GB';
        if(n > 1048576) return (n / 1048576).toFixed(2) + ' MB';
        if(n > 1024) return (n / 1024).toFixed(2) + ' KB';
        return n + ' B';
    }

    static Time(n: number) : string {
        let hours: string = (n / 3600).toFixed() + 'h ';
        let minutes: string = ( (n / 60) % 60 ).toFixed() + 'm ';
        let seconds: string = (n % 60).toFixed() + 's ';

        return hours + minutes + seconds;
    }

}
