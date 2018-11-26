/*
	Basic ANSI commands and other paint tools
	(c)2016 Ivo Wams, Anyflex
*/

export interface Position {
    left: number;
    top: number;
}

export interface Dimension {
    width: number;
    height: number;
}

export interface Box {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

export type AlignY = ["top", "middle", "bottom"];
export type AlignX = ["left", "center", "right"];

export type Align = ["top", "right", "bottom", "left"];

export default class Draw {

    constructor() { }

    public static use_rgb: boolean = false;
    private static ansi: string = "\u001b";

    // Clears the screen
    public static clear() {
        process.stdout.write(this.ansi + "[2J"+ this.ansi + "[;H");
    }

    // Hides / Shows the blinker
    public static showCursor(bool: boolean) {
        if (bool)
            process.stdout.write(this.ansi + "[?25h");
        else
            process.stdout.write(this.ansi + "[?25l");
    }

    // Set cursor at position
    // Ansi uses 1 and up, so add 1 to use 0 and up
    public static setCursor(x: number, y: number) {
        process.stdout.write(this.ansi + "[" + (y + 1) + ";" + (x + 1) + "H");
    }

    public static colors = {
        "black": 0,
        "red": 1,
        "green": 2,
        "yellow": 3,
        "blue": 4,
        "magenta": 5,
        "cyan": 6,
        "white": 7
    }

    // Use 0 - 7 as seen above
    public static setColor(f: number, b: number, intense: boolean) {

        //	if(use_rgb){


        //	} else {
        if (intense)
            process.stdout.write(this.ansi + "[1m");
        else
            process.stdout.write(this.ansi + "[2m");

        process.stdout.write(this.ansi + "[" + (30 + f) + ";" + (40 + b) + "m");
        //	}
    }

    static customColor(i: number){
        process.stdout.write(this.ansi + "[38;5;"+ i +"m");
    }

    static customBGColor(i: number){
        process.stdout.write(this.ansi + "[48;5;"+ i +"m");
    }

    // Doesn't work in windows console nor ssh terminal
    public static setRGB(foreground: number[], background: number[]) {
        if (foreground)
            process.stdout.write(this.ansi + "[38;2;" + foreground[0] + ";" + foreground[1] + ";" + foreground[2] + "m");

        if (background)
            process.stdout.write(this.ansi + "[48;2;" + background[0] + ";" + background[1] + ";" + background[2] + "m");
    }

    /* Other draw functions */

    private static BOX = {
        "lefttop": String.fromCharCode(0x250c),
        "top": String.fromCharCode(0x2500),
        "righttop": String.fromCharCode(0x2510),
        "left": String.fromCharCode(0x2502),
        "right": String.fromCharCode(0x2502),
        "leftbottom": String.fromCharCode(0x2514),
        "bottom": String.fromCharCode(0x2500),
        "rightbottom": String.fromCharCode(0x2518)
    };

    private static replaceAt(source: string, index: number, target: string): string {
        return source.substr(0, index) + target + source.substr(index + target.length);
    }

    public static padString = function (str: string, length: number, mask?: string) {
        if(str == undefined) str = 'Undefined';
        
        var result = str.substring(0, length);
        while (result.length < length) result += " ";

        if (mask && mask != '')

            for (var i = 0; i < result.length; i++)

                if (result.substr(i, 1) != ' ')
                    result = result.substr(0, i) +  mask.substr(i % mask.length, 1) + result.substr(i + 1); //result.length);

        return result;
    }
    
    public static clearBox(box: number[]){

        var left = box[0];
        var top = box[1];
        var width = box[2];
        var height = box[3];

        Draw.paintTextBox({"left": left, "top": top}, {"width": width, "height": height}, "");
    }

    public static paintBox(box: number[]) {

        var left = box[0];
        var top = box[1];
        var width = box[2];
        var height = box[3];

        if(width < 2) width = 2;

        this.setCursor(left, top);
        this.paintText(Draw.BOX.lefttop + new Array(width - 2).join(Draw.BOX.top) + Draw.BOX.righttop);
        var line = Draw.BOX.left + new Array(width - 2).join(' ') + Draw.BOX.right;
        for(var y = 1; y < height; y++){    // from 1 UNtil height
            this.setCursor(left, top + y);
            this.paintText(Draw.BOX.left);
            this.setCursor(left + width - 2, top + y);
            this.paintText(Draw.BOX.right);
        }

        this.setCursor(left, top + height);
        this.paintText(Draw.BOX.leftbottom + new Array(width - 2).join(Draw.BOX.bottom) + Draw.BOX.rightbottom);
    }

    public static paintText(str: string, length?: number) {
        try {
            if(length && str.length > length) str = str.substr(0, length);
            if(length && str.length < length) str += Array(length - str.length + 1).join(' ');
            process.stdout.write(str);
        } catch(e){
            console.log(str);
            process.exit(0);
        }
    }

    public static getSeconds(i: number) : string {
        if(isNaN(i))
            return '-';

        var secs = Math.floor(0.001 * i);
        var minutes = Math.floor(secs / 60);
        var hours = Math.floor(secs / (60 * 60));
        var days = Math.floor(secs / (60 * 60 * 24));
        var seconds = secs % 60;

        if(Math.abs(days) > 0) return days + ' d';
        if(Math.abs(hours) > 0) return hours + ' h';
        if(Math.abs(minutes) > 0) return minutes + ' m';
        return seconds + ' s';
    }

    public static getBytes(i: number) : string {
        if(i < 1024) return i + ' B';
        else if(i < 1024 * 1024) return (i / 1024).toFixed(2) + ' KB';
        else if(i < 1024 * 1024 * 1024) return (i / (1024 * 1024)).toFixed(2) + ' MB';
        else return (i / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    }




    public static paintTextBox(position: Position, dimension: Dimension, text: string, align_x?: string, align_y?: string){

        const lines: Array<string> = text.split("\n");
        let dx, dy: number = 0;

        if(align_y == 'middle') dy = Math.round(0.5 * (dimension.height - lines.length));
        else if(align_y == 'bottom') dy = dimension.height - lines.length;
        else dy = 0;

        for(let y = 0; y < dimension.height; y++){

            let line_nr: number = y - dy;
            let line: string = line_nr < 0 || line_nr >= lines.length ? '' : lines[line_nr];

            if(align_x == 'center') dx = Math.round(0.5 * (dimension.width - line.length));
            else if(align_x == 'right') dx = dimension.width - line.length;
            else dx = 0;

            if(dx < 0) line = line.substr(- (dx - 1));
            else if(dx > 0) line = Array(dx).join(' ') + line

            if(line.length < dimension.width)
                line += Array(dimension.width - line.length).join(' ');
            else if(line.length > dimension.width - 1)
                line = line.substr(0, dimension.width - 1);

            Draw.setCursor(position.left, position.top + y);
            Draw.paintText(line);
        }
    }



}