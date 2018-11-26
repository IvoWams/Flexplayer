import Interface from './Interface';
import InterfaceElement from './InterfaceElement';
import Window from './Window';
import Draw from '../Draw';
import { Position, Dimension } from '../Draw';

export interface ListItem {
    index: number;
    caption: string;
    value: string;
}

export class ListItem extends InterfaceElement {

    caption: string;
    value: string;
    data: any;

    constructor(caption: string, value: string, data ?: any){
        super();
        this.caption = caption;
        this.value = value;
        this.data = data;
    }
}

export default class List extends InterfaceElement {

    constructor(position: Position, dimension: Dimension, caption: string){
        super();
        this.position = position;
        this.dimension = dimension;
        this.is_visible = false;
    }

    addItem(caption: string, value: string, data?: any): void {
        let li: ListItem = new ListItem(caption, value, data);

        /*
        li.position.left = 0;
        li.position.top = this.children.length;
        li.dimension.width = this.dimension.width;
        li.dimension.height = 1;
        */

        this.addChild(li);
        this.paint();
    }

    on_left(): boolean {
        this.focusPreviousChild() || this.focusLastChild();
        this.paint();
        return true;
    }

    on_up(): boolean {
        this.focusPreviousChild() || this.focusLastChild();
        this.paint();
        return true;
    }

    on_right(): boolean {
        this.focusNextChild() || this.focusFirstChild();
        this.paint();
        return true;
    }

    on_down(): boolean {
        this.focusNextChild() || this.focusFirstChild();
        this.paint();
        return true;
    }

    on_click(): boolean {
        this.event('select', this.child_focus);
        return true;
    }

    on_cancel(): boolean {
        this.event('cancel');
        return true;
    }

    paint(){

        if(!this.is_visible)
            return;

        // Scroll items in a 'window'
        let window_top : number = 0;
        
        if(this.children.length > this.dimension.height){
            window_top = this.child_focus_index - Math.round(0.5 * this.dimension.height);
            if(window_top < 0) window_top = 0;
            else if(window_top > this.children.length - this.dimension.height)
                window_top = this.children.length - this.dimension.height;
        }

        let position: Position = this.relativePosition();

        for(let y = 0; y < this.dimension.height; y++)

            if(window_top + y < this.children.length){

                let item: ListItem = <ListItem>this.children[window_top + y];                
                Interface.setColor(item.focused() ? Interface.COLOR_FOCUS : Interface.COLOR_BLUR);
                Draw.paintTextBox(
                    { "left": position.left, "top": position.top + y },
                    { "width": this.dimension.width, "height": 1},
                    item.caption,
                    "center", "middle"
                );

            } else {

                Interface.setColor(Interface.COLOR_BLUR);
                Draw.paintTextBox(
                    { "left": position.left, "top": position.top + y },
                    { "width": this.dimension.width, "height": 1},
                    '',
                    "center", "middle"
                );

            }
            
    }

}
