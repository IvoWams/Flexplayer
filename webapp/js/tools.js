var nice_duration = function(t){
    var m = parseInt(t / 60), s = parseInt(t % 60);
    return (m > 0?m + 'm ':'') + s + 's'; 
}

var nice_filesize = function(t){
    if(isNaN(t)) return '-';
    if(t > 1073741824) return (t / 1073741824).toFixed(2) + ' GB';
    else if(t > 1048576) return (t / 1048576).toFixed(2) + ' MB';
    else if(t > 1024) return (t / 1024).toFixed(2) + ' KB';
    else return t + ' B';
}