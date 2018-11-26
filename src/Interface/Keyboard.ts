import Interface from './Interface';
import InterfaceElement from './InterfaceElement';
import Window from './Window';
import { Position, Dimension } from '../Draw';
import Draw from '../Draw';

export default class Keyboard extends Window {

    cursor: Position = {"left": 0, "top": 0}
    shift: boolean = false;

    keys: string[][][] = [      // y, x, shift

        [
            ["`", "~"], 
            ["1", "!"], 
            ["2", "@"], 
            ["3", "#"], 
            ["4", "$"], 
            ["5", "%"], 
            ["6", "^"], 
            ["7", "&"], 
            ["8", "*"], 
            ["9", "("], 
            ["0", ")"], 
            ["-", "_"], 
            ["=", "+"], 
            ["backspace", "backspace"]
        ],

        [
            ["q", "Q"], 
            ["w", "W"], 
            ["e", "E"],
            ["r", "R"],
            ["t", "T"],
            ["y", "Y"],
            ["u", "U"],
            ["i", "I"],
            ["o", "O"],
            ["p", "P"],
            ["[", "{"],
            ["]", "}"],
            ["\\", "|"]
        ],

        [
            ["a", "A"],
            ["s", "S"],
            ["d", "D"],
            ["f", "F"],
            ["g", "G"],
            ["h", "H"],
            ["j", "J"],
            ["k", "K"],
            ["l", "L"],
            [";", ":"],
            ["'", "\""],
            ["enter", "enter"]
        ],

        [
            ["shift", "shift"],
            ["z", "Z"],
            ["x", "X"],
            ["c", "C"],
            ["v", "V"],
            ["b", "B"],
            ["n", "N"],
            ["m", "M"],
            [",", "<"],
            [".", ">"],
            ["\/", "?"]
        ],

        [
            ["space", "space"]
        ]
    ];

    constructor(position: Position, dimension: Dimension){
        super(position, dimension, 'keyboard');
    }

    blur(){        
        Interface.setColor(Interface.COLOR_CLEAR);
        Draw.clearBox([ this.position.left, this.position.top, this.dimension.width, this.dimension.height ]);
        super.blur();
    }
    
    paint(){

        if(!this.is_visible)
            return;

        let button_size: Dimension = {"width": 8, "height": 1};
        let margin: number = 1;
        let row_width: number;
        let indent: number;
        let width: number;
        let value: string;

        for(let y = 0; y < this.keys.length; y++)
            for(let x = 0; x < this.keys[y].length; x++){

                row_width = this.keys[y].length * (margin + button_size.width);
                indent = Math.round(0.5 * (this.dimension.width - row_width));
                width = button_size.width;
                value = this.keys[y][x][this.shift ? 1 : 0];
                
                if(value == 'backspace') width += 10;
                else if(value == 'space') width += 25;

                Interface.setColor(x == this.cursor.left && y == this.cursor.top ? Interface.COLOR_FOCUS : Interface.COLOR_BLUR)
                Draw.paintTextBox(
                    { "left":  this.position.left + indent + ((button_size.width + margin) * x), "top": this.position.top + ((button_size.height + margin) * y) },
                    { "width": width, "height": button_size.height },
                    value,
                    'center',
                    'middle'
                );
            }
    }


    on_up(): boolean {

        // Move up
        this.cursor.top --;

        // If above keyboard, go to bottom of keyboard
        if(this.cursor.top < 0)
            this.cursor.top = this.keys.length - 1;

        // Move cursor to last key if its far out
        if(this.cursor.left > this.keys[this.cursor.top].length - 1)
            this.cursor.left = this.keys[this.cursor.top].length - 1

        this.paint();

        return true;
    }

    on_down(): boolean {
        this.cursor.top ++;

        if(this.cursor.top > this.keys.length - 1)
            this.cursor.top = 0;

        if(this.cursor.left > this.keys[this.cursor.top].length - 1)
            this.cursor.left = this.keys[this.cursor.top].length - 1
        
        this.paint();
            
        return true;
    }

    on_left(): boolean {
        this.cursor.left --;
        if(this.cursor.left < 0)
            this.cursor.left = this.keys[this.cursor.top].length - 1;

        this.paint();
            
        return true;
    }

    on_right(): boolean {
        this.cursor.left ++;
        if(this.cursor.left > this.keys[this.cursor.top].length - 1)
            this.cursor.left = 0;

        this.paint();
            
        return true;
    }

    on_click(): boolean {       
        Interface.keydown(this.keys[this.cursor.top][this.cursor.left][this.shift ? 1 : 0]);
        return true;
    }

    on_cancel(): boolean {
        // When editing input, revert to old value ?
        Interface.hideKeyboard();
        return true;
    }


}