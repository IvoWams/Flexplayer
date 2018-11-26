import Interface from './Interface';
import Input from './Input';

import { Position } from '../Draw';
import Draw from '../Draw';

export default class Password extends Input {

    paint(){
        let position: Position = this.relativePosition();
		let value: string = this.value || '';
		value = Array(value.length).join('*');	// Mask
        let value_length: number = this.dimension.width - this.indent;

        Interface.setColor(Interface.COLOR_ELEMENT);
        Draw.paintTextBox(
            position,
            { "width": this.indent, "height": 1 },
            this.caption
        );

        if(this.is_readonly) Interface.setColor(Interface.COLOR_ELEMENT);
        else Interface.setColor(this.has_focus ? Interface.COLOR_FOCUS : Interface.COLOR_BLUR);

        Draw.paintTextBox(
            { "left": position.left + this.indent, "top": position.top },
            { "width": this.dimension.width - this.indent, "height": 1 },
            value
        );
    }

}