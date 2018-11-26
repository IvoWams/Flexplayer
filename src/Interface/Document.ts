import Interface from './Interface';
import InterfaceElement from './InterfaceElement';

export default class Document extends InterfaceElement {
    // assert parent == null
    constructor(){
        super();
        this.id = "Document";
        this.name = "Document";
        this.position = {
            "left": 0,
            "top": 0
        }
        // Font size 11x22
        // Screen dimension 1920x1080
        // Char width/height: 
        this.dimension = {
            "width": 174,
            "height": 49
        }
    }

    on_up(): boolean {
        if(this.child_focus && this.child_focus.on_up())
            return true;

        if(this.focusPreviousChild() || this.focusLastChild())
            if(this.child_focus.focusLastChild())
                return true;

        return false;
    }

    on_down(): boolean {
      
        // If focusing a window, if that window handled the event
        if(this.child_focus && this.child_focus.on_down())
            return true;

        // If we can focus the next window, or focus the first window
        if(this.focusNextChild() || this.focusFirstChild())

            // if so, can we focus something at the beginning in that window
            if(this.child_focus.focusFirstChild())
                return true;

        return false;
    }

    on_left(): boolean {
        if(this.child_focus && this.child_focus.on_left())
            return true;

        if(this.focusPreviousChild() || this.focusLastChild())
            if(this.child_focus.focusLastChild())
                return true;

        return false;
    }

    on_right(): boolean {
        if(this.child_focus && this.child_focus.on_right())
            return true;

        if(this.focusNextChild() || this.focusFirstChild())
            if(this.child_focus.focusFirstChild())
                return true;

        return false;
    }

    on_click(): boolean {
        return this.child_focus && this.child_focus.on_click();
    }

    on_cancel(): boolean {
        return this.child_focus && this.child_focus.on_cancel();
    }

    on_keydown(char: string): boolean {
        // Send the keydown trigger down the previously selected window
        return this.child_previous && this.child_previous.on_keydown(char);
    }
}
    
