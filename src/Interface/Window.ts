import Interface from './Interface';
import InterfaceElement from './InterfaceElement';
import { Position, Dimension } from '../Draw';
import Draw from '../Draw';

export default class Window extends InterfaceElement {

    caption: string;

    constructor(position: Position, dimension: Dimension, caption: string){
        super();
        this.position = position;
        this.dimension = dimension;
        this.caption = caption;
        this.is_selectable = true;
        this.is_visible = false;
    }

    on_up(): boolean {
        if(this.child_focus && this.child_focus.on_up())
            return true;

        return this.focusPreviousChild();
    }

    on_down(): boolean {
        if(this.child_focus && this.child_focus.on_down())
            return true;

        return this.focusNextChild();
    }

    on_left(): boolean {
        if(this.child_focus && this.child_focus.on_left())
            return true;
        
        return this.focusPreviousChild();
    }

    on_right(): boolean {
        if(this.child_focus && this.child_focus.on_right())
            return true;
        
        return this.focusNextChild();
    }

    on_click(): boolean {
        return this.child_focus && this.child_focus.on_click();
    }

    on_keydown(char: string): boolean {        
        return this.child_focus && this.child_focus.on_keydown(char);
    }

    paint(){
        if(!this.visible())
            return;

        Interface.setColor(Interface.COLOR_CLEAR);
        Draw.clearBox([ this.position.left, this.position.top, this.dimension.width, this.dimension.height ]);

        super.paint();
    }

}
