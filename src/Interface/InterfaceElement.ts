import Interface from './Interface';
import { EventEmitter } from '../EventEmitter';
import { Position, Dimension } from '../Draw';
import Draw from '../Draw';

export default class InterfaceElement extends EventEmitter {
    
        id: string;
        index: number;
        name: string;

        protected is_visible: boolean = true;
        protected has_focus: boolean = false;
        protected is_selectable: boolean = true;
        protected is_readonly: boolean = false
        
        position: Position = {"left": 0, "top": 0};
        dimension: Dimension = {"width": 0, "height": 0};
    
        parent: InterfaceElement;
        children: Array<InterfaceElement>;

        child_focus: InterfaceElement;
        child_previous: InterfaceElement;
        child_focus_index: number;
        child_previous_index: number;
    
        constructor(){
            super();
            this.children = new Array<InterfaceElement>();
        }
    
        relativePosition(): Position {
            if(this.parent){
                let parent_position = this.parent.relativePosition();
                return {
                    "left": parent_position.left + this.position.left,
                    "top": parent_position.top + this.position.top
                };
            }
            
            return this.position;
        }
    
        addChild(ie: InterfaceElement){
            ie.index = this.children.length;
            ie.parent = this;
            this.children.push(ie);
        }
        
        removeChild(ie: InterfaceElement){
            let index_of = this.children.indexOf(ie);
            if(index_of != -1){
                this.children.splice(index_of, 1);
                for(let i = 0; i < this.children.length; i++)
                    this.children[i].index = i;
            } else throw Error('Cannot remove child element');
        }

        remove(){
            if(!this.parent)
                return; // awww

            this.parent.removeChild(this);
        }

        findChild(id: string): InterfaceElement {
            if(this.id == id) return this;

            for(let i = 0; i < this.children.length; i++){
                let child: InterfaceElement = this.children[i].findChild(id);
                if(child)
                    return child;
            }

            return null;
        }


        protected focus(){

            if(this.has_focus)
                return;

            this.has_focus = true;

            if(this.parent){

                if(this.parent.child_focus && this.parent.child_focus != this)
                    this.parent.child_focus.blur();

                this.parent.child_previous = this.parent.child_focus;
                this.parent.child_previous_index = this.parent.child_focus_index;

                this.parent.child_focus = this;
                this.parent.child_focus_index = this.parent.children.indexOf(this);

                this.parent.focus();
            }

            this.is_visible = true;

            this.paint();
        }

        protected blur(){
            if(!this.has_focus)
                return;

            this.has_focus = false;

            this.paint();

            this.children.forEach( (child: InterfaceElement) => { child.blur(); });
        }

        focused(b ?: boolean) : boolean {
            if(b != undefined)

                if(b)
                    this.focus();
                else
                    this.blur();
            
            return this.has_focus;
        }

        visible(b ?: boolean) : boolean {
            if(b != undefined){

                if(b && !this.is_visible){
                    this.is_visible = true;
                    this.paint();
                }

                else if(!b && this.is_visible){
                    this.is_visible = false;
                    Interface.setColor(Interface.COLOR_CLEAR);
                    Draw.clearBox([ this.position.left, this.position.top, this.dimension.width, this.dimension.height ]);                        
                }
            }

            return this.is_visible;
        }

        show(){
            this.visible(true);
        }

        hide(){
            this.visible(false);
        }

        readonly(b ?: boolean) : boolean {
            if(b != undefined) this.is_readonly = b;
            return this.is_readonly;
        }

        selectable(b ?: boolean) : boolean {
            if(b != undefined) this.is_selectable = b;
            return this.is_selectable;
        }



        setChildFocus(index: number): boolean {

            if(index < 0 || index > this.children.length - 1)
                return false;

            this.children[index].focus();
            return true;
        }

        private childIterate(candidate: number, ascending: boolean): boolean {
            while(ascending ? ( ++ candidate <= this.children.length - 1 ) : ( -- candidate >= 0 ))
                if(
                    this.children[candidate].is_selectable &&
                    this.children[candidate].is_visible &&
                    !this.children[candidate].is_readonly
                )
                    return this.setChildFocus(candidate);   

            return false;
        }

        focusFirstChild(): boolean {
            return this.childIterate(-1, true);
        }

        focusLastChild(): boolean {
            return this.childIterate(this.children.length, false);
        }

        focusNextChild(): boolean {
            return this.child_focus ? this.childIterate(this.child_focus_index, true) : false;
        }

        focusPreviousChild(): boolean {
            return this.child_focus ? this.childIterate(this.child_focus_index, false) : false;
        }

        // Return false to bubble command up the chain
        on_up(): boolean { return false; }
        on_down(): boolean {
            return false;
        }
        on_left(): boolean { return false; }
        on_right(): boolean { return false; }
        on_click(): boolean { return false; }
        on_cancel(): boolean { return false; }
        on_keydown(char: string): boolean { return false; }
        
        paint(){
            if(!this.is_visible)
                return;

            this.children.forEach((child: InterfaceElement) => {
                child.paint();
            });
        }
    }