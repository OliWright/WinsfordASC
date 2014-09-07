// This file was originally from https://github.com/AlexKizer/hy3.js
// and looks like it was written for node.js
// I've refactored it to work in a browser, but tried to keep my
// changes as minimal as possible.
//   Oli Wright.

var Hytek = function() {
    console.log('!');
    this.includeAlias = true;
    this.tags = hy3Tags;
}

function newline(str) {
    return str.charCodeAt(131) === 0x0a ? 2 : 1;
}

Hytek.prototype.parseContents = function(str) {
    var o = [],
        line = 130 + newline(str),//determine if file uses 0D or 0D0A newline character
        lines = str.length / line;
    for (i = 0; i < lines; i++) {
        var start = i * line;
        var l = this.parseLine(str.slice(start, start + line), this.tags);
        o[i] = l;
        console.log(l);
        console.log('###');
    }
    return o;
}

Hytek.prototype.parseSync = function(file) {
    var buf = fs.readFileSync(file),
        str = buf.toString('ascii');
    return parseContents(str);
}

Hytek.prototype.parse = function(file, callback){
    fs.readFile(file, function(err, buf){
        if(err)
            return callback(err, null);
        var str = buf.toString('ascii');
        var o = parseContents(str);
        callback(null, o);
    });
}

Hytek.prototype.parseLine = function (str, tags) {
    str = str.slice(0, 130);
    var id = str.slice(0, 2).toString('ascii');
    var tag = tags[id];
    if (tag == undefined)
        return new Error('Tag not found: ' + id);
    var o = {};
    o.tagId = id;
    for (var intervalProperty in tag) {
        if (!tag.hasOwnProperty(intervalProperty) || (intervalProperty.toString() == 'alias' && this.includeAlias == false))
            continue;
        if (intervalProperty.toString() == 'alias') {
            o[intervalProperty] = tag[intervalProperty];
            continue;
        }
        var interval = tag[intervalProperty];
        if (!interval instanceof Array || interval.length != 2) {
            return new Error('Invalid interval: ' + interval);
            continue;
        }
        var data = str.slice(interval[0], interval[1] + 1).trim(); //assuming inclusive interval
        o[intervalProperty] = data;
    }
    o.checksum = str.slice(str.length - 2, str.length);
    return o;
}

function matchTag(jsonArray, tag) {
    for(var o in jsonArray) {
        if(o.tagId === tag)
            return o;
    }
}

function format(jsonArray, format){
    var o = {};
    for(var p in format) {
        var spec = format[p];
        for (var t in spec) {
            var tag = spec[t];
            var matchedTag = matchTag[jsonArray, tag];
            //o[p] = 

        }
    }
}

//module.exports = new Hytek();
//exports.parseSync = parseSync;
//exports.parse = parse;
