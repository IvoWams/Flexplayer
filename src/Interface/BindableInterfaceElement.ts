import Interface from './Interface';
import InterfaceElement from './InterfaceElement';

export default class BindableInterfaceElement extends InterfaceElement {
    
        bind: string;
        value: any;
    
        constructor(bind: string){
            super();
            this.bind = bind;
            this.value = '';
            // this.readBind(model);
        }
    
        // Read bound variable to value
        readBind(model: any){
            if(this.bind == "")
                return;
    
            try {
    
                this.value = eval('model.'+ this.bind);
    
            } catch(e){

                this.value = '';

                Interface.event('error', 'Bind: ['+ this.bind +'] -> ['+ e.message +']');
                /*
                process.stderr.write("* Could not read from bind\n");
                process.stderr.write("Bind: "+ this.bind +"\n");
                process.stderr.write("Error: "+ e.message +"\n");
                process.exit(-1);
                */
            }
    
        }
    
        // Write value to bound variable
        writeBind(){
            if(this.bind == "")
                return;
    
            try {
    
                eval('model.'+ this.bind + ' = "'+ this.value.replace('"', '\"') +'"');
    
            } catch(e){

                this.bind = '';

                Interface.event('error', 'Could not write to bind');
                /*
                process.stderr.write("* Could not write to bind\n");
                process.stderr.write("Bind: "+ this.bind +"\n");
                process.stderr.write("Value: "+ this.value +"\n");
                process.stderr.write("Error: "+ e.message +"\n");
                process.exit(-1);
                */
            }
        }
    
    }