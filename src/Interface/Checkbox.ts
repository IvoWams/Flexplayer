import Interface from './Interface';
import BindableInterfaceElement from './BindableInterfaceElement';
import { Position } from '../Draw';
import Draw from '../Draw';

export default class Checkbox extends BindableInterfaceElement {
    
        caption: string = '';
        checked: boolean = false;
    
        constructor(position: Position, caption: string, bind: string){
            super(bind);
            this.caption = caption;
            this.position = position;
        }
   
        paint(){
    
            if(!this.is_visible)
                return;
    
            let position: Position = this.relativePosition();
    
            Interface.setColor(this.has_focus ? Interface.COLOR_FOCUS : Interface.COLOR_BLUR);           
            Draw.setCursor(position.left, position.top);     
            Draw.paintText(" "+ (this.checked ? "X" : " ") + " ");
    
            Interface.setColor(Interface.COLOR_ELEMENT);
            Draw.paintText(" "+ this.caption);
        }

        on_click(){
            this.checked = !this.checked;
            this.value = this.checked ? "true" : "false";

            // Trigger

            this.event('change');
            this.paint();

            return true;
        }
    }
    
    
    