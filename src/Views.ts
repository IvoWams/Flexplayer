import Draw from './Draw';
import { Position, Dimension } from './Draw';
import Player from './Player';
import { Playlist, PlaylistNode } from './Device';

export class PlaylistView {

    // Box to render
    position: Position;
    dimension: Dimension;

    // Visible ?
    visible: boolean;

    constructor(position: Position, dimension: Dimension){
        this.position = position;
        this.dimension = dimension;
        this.visible = true;        

        Player.on('playlist_change', (playlist: Playlist) => {
            this.paint(playlist);
        });
    }

    paint(playlist: Playlist){
        if(!this.visible)
            return;

        Draw.customColor(255);
        Draw.customBGColor(0);

        let str: string = '';
        let i: number = 0;
        playlist.nodes.forEach((node: PlaylistNode) => {
            str += (Player.play_index == i ++ ? '> ' + node.content.title +' <' : node.content.title) +"\n";
        });

        Draw.paintTextBox(this.position, this.dimension, str, "center", "top");


        // for(let y: number = 0; y < this.dimension.height; y++)
        //     if(y < playlist.nodes.length){
        //         Draw.setCursor(this.position.left, y);
        //         Draw.paintText((Player.play_index == y ? '> ' : '')+  playlist.nodes[y].content.title, this.box.right - this.box.left);
        //     }
    }

}

interface DebugLine {
    verbosity: number;
    line: string;    
}

export class DebugView {

    position: Position;
    dimension: Dimension;
    lines: Array<DebugLine>;

    visible: boolean;

    constructor(position: Position, dimension: Dimension){
        this.position = position;
        this.dimension = dimension;
        this.lines = new Array<DebugLine>();
        this.visible = true;
    }

    write(verbosity: number, lines: string){
        let self = this;
        lines.split("\n").forEach((line: string) => {
            self.lines.push({ verbosity, line });
        });
        this.paint();
    }

    verbosityColor(verbosity: number) : number {
        switch(verbosity){
            case 0: return 15;
            case 1: return 12;
            case 2: return 9;
            default: return 15;
        }
    }

    paint(){
        if(!this.visible)
            return;

        for(let y: number = this.dimension.height; y >= 0; y--){
            let c: number = this.lines.length - (this.dimension.height - y);
            
            if(c >= 0 && c < this.lines.length){

                Draw.customColor(this.verbosityColor(this.lines[c].verbosity));
                Draw.customBGColor(237);
                        
                Draw.setCursor(this.position.left, this.position.top + y);
                Draw.paintText(this.lines[c].line, this.dimension.width - 1);
            }
        }
    }

}