import Interface from './Interface';
import InterfaceElement from './InterfaceElement';
import Document from './Document';
import Window from './Window';
import Keyboard from './Keyboard';
import Button from './Button';
import Parameter from './Parameter';
import Input from './Input';
import Password from './Password';
import Checkbox from './Checkbox';
import Label from './Label';
import List from './List';

import fs = require('fs');

export default class InterfaceBuilder {

    static fromFile(file: string) : Document {
        if(!fs.existsSync(file))
            throw Error('Interface file not found');

        let interface_raw: string = fs.readFileSync(file).toString('utf8');
        let interface_json: any = JSON.parse(interface_raw);

        return InterfaceBuilder.build(interface_json);
    }

    static build(json: any) : Document {
        let document: Document = new Document();

        if(!json.windows)
            throw Error('Document is missing windows');

        for(let i = 0; i < json.windows.length; i++)
            document.addChild(this.buildWindow(json.windows[i]));

        return document;
    }

    static buildWindow(json: any) : Window {

        let element: Window;

        if(json.id == 'keyboard')   // other way to differentiate between TYPES of windows ...
            element = new Keyboard(json.position, json.dimension);
        else
            element = new Window(json.position, json.dimension, json.id);

        if(json.id) element.id = json.id;
        if(json.name) element.name = json.name;
        if(json.visible) element.visible(json.visible);

        if(json.children)
            for(let i = 0; i < json.children.length; i++)
                element.addChild(this.buildElement(json.children[i]));

        return element;
    }

    static buildElement(json: any) : InterfaceElement {

        let obj: InterfaceElement;

        switch(json.type){
            case "button":
                obj = this.buildButton(obj, json);
                break;

            case "checkbox":
                obj = this.buildCheckbox(json);
                break;

            case "input":
                obj = this.buildInput(json);
                break;

            case "password":
                obj = this.buildPassword(json);
                break;

            case "label":
                obj = this.buildLabel(json);
                break;

            case "list":
                obj = this.buildList(json);
                break;

            case "parameter":
                obj = this.buildParameter(json);
                break;

            default:
                throw Error('Unknown interface type ['+ json.type +']');
        }

        if(json.id) obj.id = json.id;
        if(json.name) obj.name = json.name;

        return obj;
    }

    static buildKeyboard(json: any): Keyboard {
        return new Keyboard(json.position, json.dimension);
    }

    static buildButton(obj: InterfaceElement, json: any) : Button {
        let button: Button = new Button(json.position, json.dimension, json.caption);

        if(json.on_click)
            button.on('click', () => {
                Interface.evokeBoundFunction(json.on_click);
            });

        return button;
    }

    static buildInput(json: any): Input {
        let input: Input = new Input(json.position, json.dimension, json.caption, json.indent, json.bind);

        if(json.on_change)
            input.on('change', () => {
                Interface.evokeBoundFunction(json.on_change, input.value);
            });

        return input;
    }

    static buildPassword(json: any): Input {
        let password: Password = new Password(json.position, json.dimension, json.caption, json.indent, json.bind);

        if(json.on_change)
            password.on('change', () => {
                Interface.evokeBoundFunction(json.on_change, password.value);
            });

        return password;
    }

    static buildList(json: any) : List {
        let list: List = new List(json.position, json.dimension, json.id);
        return list;
    }

    static buildParameter(json: any): Parameter {
        let parameter: Parameter = new Parameter(json.position, json.dimension, json.caption, json.indent, json.bind);

        if(json.bind){
        }

        return parameter;
    }

    static buildCheckbox(json: any): Checkbox {
        let checkbox: Checkbox = new Checkbox(json.position, json.caption, json.bind);

        if(json.on_change)
            checkbox.on('change', () => {
                Interface.evokeBoundFunction(json.on_change, checkbox.checked);
            });

        return checkbox;
    }

    static buildLabel(json: any): Label {
        let label: Label = new Label(json.position, json.caption);
        return label;
    }


}