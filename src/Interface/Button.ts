import Interface from './Interface';
import InterfaceElement from './InterfaceElement';
import Draw from '../Draw';
import { Position, Dimension } from '../Draw';

export default class Button extends InterfaceElement {

    caption: string;
    clicked: boolean;
    
    constructor(position: Position, dimension: Dimension, caption: string){
        super();
        this.position = position;
        this.dimension = dimension;
        this.caption = caption;
        
        if(dimension.width == 0 && dimension.height == 0){
            this.dimension.width = this.caption.length + 6;
            this.dimension.height = 3;
        }    

        this.is_selectable = true;
    }

    paint(){
        
        if(!this.is_visible)
            return;

        let position: Position = this.relativePosition();

        if(this.clicked) Interface.setColor(Interface.COLOR_SELECT);
        else if(this.is_readonly) Interface.setColor(Interface.COLOR_ELEMENT);
        else Interface.setColor(this.has_focus ? Interface.COLOR_FOCUS : Interface.COLOR_BLUR);
        
        Draw.paintTextBox(position, this.dimension, this.caption, 'center', 'middle');
    }

    on_click(){
        this.clicked = true;
        var self = this;
        self.paint();
        self.event('click');
        
        setTimeout(() => { self.clicked = false; self.paint(); }, 200);

        return true;
    }

}
    