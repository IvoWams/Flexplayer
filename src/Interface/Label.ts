import Interface from './Interface';
import InterfaceElement from './InterfaceElement';
import { Position, Dimension } from '../Draw';
import Draw from '../Draw';

export default class Label extends InterfaceElement {
    
    caption: string;

    constructor(position: Position, caption: string){
        super();
        this.position = position;
        this.dimension = {
            "width": caption.length,
            "height": 1
        };
        this.caption = caption;
        this.is_selectable = false;
    }

    setCaption(caption: string){
        this.caption = caption;
        this.event('changed');
    }

    paint(){

        if(!this.is_visible)
            return;

        let position: Position = this.relativePosition();

        let caption: string = this.caption;
        if(caption.length > this.dimension.width)
            caption = caption.substr(0, this.dimension.width);

        Interface.setColor(Interface.COLOR_ELEMENT);
        Draw.setCursor(position.left, position.top);
        Draw.paintText(caption, this.dimension.width);
    }
}