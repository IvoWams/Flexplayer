var config = [];
var eth0 = [];
var wlan0 = [];
var ssid_list = [];

var get_config = function(callback){
    $.getJSON('/config/', function(json){
        config = json;        
        if(typeof callback == 'function')
            callback();
    });
}

var get_eth0 = function(callback){
    $.getJSON('/config/eth0/', function(json){
        eth0 = json;
        if(typeof callback == 'function')
            callback();
    })
}

var get_wlan0 = function(callback){
    $.getJSON('/config/wlan0/', function(json){
        wlan0 = json;
        if(typeof callback == 'function')
            callback();
    })
}

var signal_strength = function(value){
    var table = [
        [-90, "0, 0, 0"],
        [-87, "255, 0, 0"],
        [-82, "200, 50, 50"],
        [-77, "150, 100, 100"],
        [-72, "100, 150, 100"],
        [-67, "50, 200, 50"],
        [0, "0, 250, 0"]
    ];

    for(var i in table){
        if(value < table[i][0]) return '<div class="signal_strength" style="background-color: rgba('+ table[i][1] +', 1);"></div>';
    }

    // Failsafe
    return '<div class="signal_strength" style="background-color: rgba(0, 250, 0, 1);"></div>';
}

var scan_ssid = function(callback){

    var ssid_checked = $('.option.selected').attr('value');

    $.getJSON('/wifi/', function(json){

        if(json.length == 0)
            return setTimeout(function(){ scan_ssid(callback); }, 1000);

        ssid_list = json;
        $('[name=select_ssid]').empty();

        ssid_list

            .sort(function(i1, i2){
                return parseInt(i1.signal) < parseInt(i2.signal);
            })

            .forEach(function(ssid){
                var $option = $('<div class="option" value="'+ ssid.SSID +'">'+ ssid.SSID + ' ('+ ssid.signal +')'+ signal_strength(ssid.signal) +'</div>');

                if(ssid.SSID == wlan0.ssid){
                    $option.addClass('connected');
                    $('[name=status]').html('Verbonden met '+ ssid.SSID);
                }

                if(ssid.SSID == ssid_checked)
                    $option.addClass('selected');

                $('[name=select_ssid]').append($option);

            });

        if(typeof callback == 'function')
            callback();

        // Rescan every 5 sec
        // setTimeout(scan_ssid, 5000);
    });
}

var populate_form = function(bool){

    $('[name=checkbox_dhcp]').prop('checked', config.dhcp)

    $('label[for=input_mac]').html(bool?'WiFi MAC':'LAN MAC');
    $('label[for=input_ip]').html(bool?'WiFi IP':'LAN IP');

    $('[name=input_mac]')
        .val(bool?wlan0.mac:eth0.mac);

    $('[name=input_ip]')
        .prop('readonly', config.dhcp)
        .val(bool?wlan0.ip:eth0.ip);

    $('[name=input_subnet]')
        .prop('readonly', config.dhcp)
        .val(bool?wlan0.subnet:eth0.subnet);

    $('[name=input_gateway]')
        .prop('readonly', config.dhcp)
        .val(bool?wlan0.gateway:eth0.gateway);

    $('[name=input_dns1]')
        .prop('readonly', config.dhcp)
        .val(bool?wlan0.dns1:eth0.dns1);

    $('[name=input_dns2]')
        .prop('readonly', config.dhcp)
        .val(bool?wlan0.dns2:eth0.dns2);

}

// Get stuff

var load_config = function(){
    get_config(function(){

        get_eth0();

        get_wlan0(function(){

            scan_ssid(function(){

                if(wlan0.ssid != ''){
                    $('[name=checkbox_wifi]').prop('checked', true);
                    $('#wifi_setup').show();
                }

                populate_form(wlan0.ssid != '');

            });

        });
    });
}


var connect_to_ssid = function(){

    var $selected = $('.option.selected');
    var ssid = $selected.attr('value');
    var password = $('[name=pasword]').val();

    // Show connecting ...
    $('[name=status]').val('Bezig met verbinden...');
    $('[name=button_connect]').prop('readonly', true);

    $.post('/connect_wifi/', function(result){

        // Done ?
        $('[name=status]').val('...');
        $('[name=button_connect]').prop('readonly', false);

        $.ajax({
            type: "POST",
            url: '/connect_wifi/',
            dataType: 'text',
            data: JSON.stringify({ssid: $('.option.selected').attr('value'), password: $('[name=input_password]').val()}),
            success: function(data, status, xhr){

                $('[name=status]').val('Verbonden met '+ ssid);
                $('.option.connected').removeClass('connected');
                $selected.addClass('connected');

            },
            error: function(xhr, status, error){
                $('[name=status]').val(error);
            }
        });   



    })
}



$(document)

    .on('click', '[name=button_submit]', function(){

        alert('Het wijzigen van de netwerkgegevens kan tot gevolg hebben dat de connectie met deze website wordt verbroken.');
 
        $.ajax({
            type: "POST",
            url: '/config/',
            dataType: 'text',
            data: JSON.stringify({
                'wifi': $('[name=checkbox_wifi]').prop('checked'),
                'dhcp': $('[name=checkbox_dhcp]').prop('checked'), 
                'ip': $('[name=input_ip]').val(),
                'subnet': $('[name=input_subnet]').val(),
                'gateway': $('[name=input_gateway]').val(),
                'dns1': $('[name=input_dns1]').val(),
                'dns2': $('[name=input_dns2]').val()
            }),
            success: function(data, status, xhr){
                // If we still are able to connect to the same IP, reload settings...
                load_config();
            },
            error: function(xhr, status, error){
                alert(error);
            }
        });          
     

    })

    .on('click', 'div.option', function(){
        $('div.option.selected').removeClass('selected');
        $(this).addClass('selected');
    })

    .on('change', '[name=checkbox_wifi]', function(){

        var checked = $(this).prop('checked');
        $('#wifi_setup').toggle(checked);

        populate_form(checked);


    })

    .on('change', '[name=checkbox_dhcp]', function(){

        var checked = $(this).prop('checked');

        ['input_ip', 'input_subnet', 'input_gateway', 'input_dns1', 'input_dns2'].forEach(function(s){
            $('[name='+ s +']').prop('readonly', checked); 
        });

    })

    .on('click', '[name=button_connect]', function(){

        $('[name=status]').html('Bezig met verbinden...');

        $.ajax({
            type: "POST",
            url: '/connect_wifi/',
            dataType: 'text',
            data: JSON.stringify({ssid: $('.option.selected').attr('value'), password: $('[name=input_password]').val()}),
            success: function(data, status, xhr){

                // Connect wifi button forces dhcp initially
                config.dhcp = true;
                $('[name=checkbox_dhcp]').trigger('change');

                populate_form(true);

            },
            error: function(xhr, status, error){
                $('#loading').fadeOut(200);
                alert(error);
            }
        });        

    })

    .ready(function(){

        load_config();

    })
    ;
