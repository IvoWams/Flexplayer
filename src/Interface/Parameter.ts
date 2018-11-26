import Interface from './Interface';
import BindableInterfaceElement from './BindableInterfaceElement';
import Input from './Input';
import { Position, Dimension } from '../Draw';
import Draw from '../Draw';

export default class Parameter extends Input {
         
    constructor(position: Position, dimension: Dimension, caption: string, indent: number, bind: string){
        super(position, dimension, caption, indent, bind);
        this.is_readonly = true;
    }

    readonly(b ?: boolean) : boolean {
        return false;
    }
    
}

