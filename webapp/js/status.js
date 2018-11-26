var interval = 250;

var loop = function(){

    $.get('/status/', function(response){
		
        $('[name=playing]').html(response.playing ? response.playing.content.title : '-');

        $('[name=download_name]').html(response.downloading ? response.downloading.name : '-');
        $('[name=dl_size]').html(response.downloading ? response.downloading.status : '-');

        // $('#debug').html( progress );

        // Object.keys(response).forEach(function(key){
        //     $('[name='+ key +']').html(response[key]);
        // });

        // $('[name=duration_duration]').html(nice_duration(0.001 * (response.timestamp - response.playing_since) ) + ' / ' + nice_duration(response['duration']));                 
        
        // if(response.duration > 0){

        //     var progress = 0.1 * (response.timestamp - response.playing_since) / response.duration;

        //     if(progress > 100)
        //         progress = 100;

        //     $('[name=play_progress]')
        //         .finish()
        //         .animate({"width": progress + '%'}, interval - 1, "linear");

        // }

        if(response.downloading){
            
            $('[name=download_box]').show();

            $('[name=dl_progress]')
                .width( (100 * (response.downloading.progress / response.downloading.size)) + '%' );
                // .finish()
                // .animate({"width": (100 * (response.downloading.progress / response.downloading.size)) + '%'}, interval - 1, "linear");

            $('[name=dl_size]')
                .html(nice_filesize(response.downloading.size - response.downloading.progress));
        }

        else $('[name=download_box]').hide();

    });

    setTimeout(loop, interval);
}

loop();