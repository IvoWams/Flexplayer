import Interface from './Interface';
import BindableInterfaceElement from './BindableInterfaceElement';
import Draw from '../Draw';
import { Position, Dimension } from '../Draw';

export default class Input extends BindableInterfaceElement {

    caption: string;
    indent: number;
    value: string;
    maxsize: number = 100;

    constructor(position: Position, dimension: Dimension, caption: string, ident: number, bind: string){
        super(bind);
        this.position = position;
        this.dimension = dimension;
        this.caption = caption;
        this.indent = ident;
    }

    paint(){
        let position: Position = this.relativePosition();
        let value: string = this.value || '';
        let value_length: number = this.dimension.width - this.indent;    

        Interface.setColor(Interface.COLOR_ELEMENT);
        Draw.paintTextBox(
            position,
            { "width": this.indent, "height": 1 },
            this.caption
        );

        if(this.is_readonly) Interface.setColor(Interface.COLOR_ELEMENT);
        else Interface.setColor(this.has_focus ? Interface.COLOR_FOCUS : Interface.COLOR_BLUR);

        Draw.paintTextBox(
            { "left": position.left + this.indent, "top": position.top },
            { "width": this.dimension.width - this.indent, "height": 1 },
            value
        );
    }

    on_click(){
        Interface.showKeyboard();
        return true;
    }

    on_keydown(char: string){        
        switch(char){
            case 'enter':
                Interface.hideKeyboard();
                this.event('change');
                break;
            case "shift":
                Interface.shiftKeyboard();
                break;
            case 'space':
                if(this.value.length < this.maxsize)
                    this.value += ' ';
                break;
            case 'backspace':
                if(this.value.length > 0)
                    this.value = this.value.substr(0, this.value.length - 1);
                break;
            default:
                if(this.value.length < this.maxsize)
                    this.value += char;
        }

        this.paint();

        return true;
    }
}

