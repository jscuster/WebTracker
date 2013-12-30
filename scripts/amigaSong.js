var WebTracker = WebTracker || {};

WebTracker.AmigaSong = function() {
'use strict';
WebTracker.Song.init(this);
var that = this;

//amiga specific properties
that.maxTitleLength = 20;
that.maxSamples = 31;
that.minSamples = 31;
that.maxPatterns = 127;
that.maxSlots = 127;
that.maxChannels = 32;
that.restartPosition = 127; //rarely used
that.Sample = WebTracker.AmigaSample;
that.samples = [];

that.loadMod = function (buffer) { //pass in a DataView.
that.channels = that.getChannels(buffer);
if (that.channels >= 0) {
var dataView = (buffer instanceof ArrayBuffer) ? new DataView(buffer) : buffer,
offset = 0, //jumps around, depending on what we're doing.
ocount, pcount, //how many to read

getString = (function() { //store the readString function for faster access.
var readString = WebTracker.readString;
return function(offset, length) {
return readString(dataView, offset, length);
}; //inner func
})(), //getString closure

readNote = function (offset) {
var a = [];
for (var i = 0; i < 4; i++) {
a[i] = dataView.getUint8(offset++);
} //for
return that.amigaNote(a);
}; //readNote

//get title
that.title = getString(0, 20);

//get pattern table
offset = 950; //end of sample headers.
ocount = dataView.getUint8(offset++);
that.restartPosition = dataView.getUint8(offset++);
var max = 0,
order = that.patternOrder;
for (var i = 0; i < ocount; i++) {
var tmp  = dataView.getUint8(offset++);
order[i] = tmp;
max = max < tmp ? tmp : max;
} //i
pcount = max + 1;

//read patterns
offset = 1084; //after headers is pattern data.
var p = that.patterns;
for (var pattern = 0; pattern < pcount; pattern++) {
p[pattern] = [];
for (var row = 0; row < 64; row++) {
p[pattern][row] = [];
for (var chan = 0; chan < that.channels; chan++) {
p[pattern][row][chan] = readNote(offset);
offset+=4;
} //channels
} //rows
} //patterns

//read samples
var samplePointers = WebTracker.samplePointer(20, offset); //pointers to offsets where sample headers and data are stored.
var s = [];
for (var i = 0; i < 31; i++) {
var smp = new WebTracker.AmigaSample();
samplePointers = smp.readSample(dataView, samplePointers);
s[i] = smp;
} //for: read each sample.
that.samples = s;

//done reading.
} else {
throw {message: "Bad Amiga Module Format."};
} //else
}; //loadMod

that.saveMod = function(returnArrayBuffer) {
'use strict';
var samplePointers,

//calculate byte length and sample data offset
modLength = function() {
var length = 1084; //sample headers, title, pattern headers, etc.
length += (64 * that.patternCount * that.channels * 4);
samplePointers = WebTracker.samplePointer(20, length); //end of pattern data
that.samples.forEach(function(s) {
length += s.length;
length += s.length % 2;
});
return length;
},

//more vars
 buffer = new ArrayBuffer(modLength()),
dv = new DataView(buffer),

writeString = (function() {
var sw = WebTracker.writeString;
return function(txt, offset, length) {
return sw(dv, txt, offset, length);
}; //inner function
})(); //closure writeString

//write title
writeString(that.title, 0, 20);

//write pattern headers
var offset = 950, //start of data
po = that.patternOrder;

dv.setUint8(offset, that.slots);
offset++;
dv.setUint8(offset, that.restartPosition);
offset++;
for (var i = 0; i < po.length; i++) {
dv.setUint8(offset++, that.po[i] || 0);
} //i
writeString(that.channels === 4 ? "M.K." : (that.channels + "CHN"), 1080, 4); //writes first 4 bytes, IE: 8CHN or 32CH.

//write pattern data
offset = 1084; //end of headers
var p = that.patterns;
for (var i = 0; i < p.length; i++) {
for (var j = 0; j < 64; j++) {
for (var k = 0; k < that.channels; k++) {
var a = that.toAmigaNote(p[i][j][k]);
a.forEach(function(v) {
dv.setUint8(offset++, v);
});//forEach
} //k
} //j
} //i

//write samples
that.samples.forEach(function(s) {
samplePointers = s.writeSample(dv, samplePointers);
}); //write each sample.

//return the file in the desired format
if (!returnArrayBuffer) {
return WebTracker.base64ArrayBuffer(buffer);
} else {
return buffer;
} //if converting to base64
}; //saveMod
that.getChannels = function (buffer) {
var chanCount = {
'TDZ1': 1, '1CHN': 1, 'TDZ2': 2, '2CHN': 2,
'TDZ3': 3, '3CHN': 3, 'M.K.': 4, 'FLT4': 4, 'M!K!': 4,
'4CHN': 4, 'TDZ4': 4, '5CHN': 5, 'TDZ5': 5,
'6CHN': 6, 'TDZ6': 6, '7CHN': 7, 'TDZ7': 7,
'8CHN': 8, 'TDZ8': 8, 'OCTA': 8, 'CD81': 8,
'9CHN': 9, 'TDZ9': 9, '10CH': 10, '11CH': 11,
'12CH': 12, '13CH': 13, '14CH': 14, '15CH': 15,
'16CH': 16, '17CH': 17, '18CH': 18, '19CH': 19, 
'20CH': 20, '21CH': 21, '22CH': 22, '23CH': 23,
'24CH': 24, '25CH': 25, '26CH': 26, '27CH': 27,
'28CH': 28, '29CH': 29, '30CH': 30, '31CH': 31, '32CH': 32
},
id = WebTracker.readString(buffer, 1080, 4); //id at position 1080, 4 letters.
if (id in chanCount) {
return chanCount[id];
} else {
return -1;
} //else
}; //readChannels


that.isValid = function(buffer) {
return that.getChannels(buffer) > 0;
}; //isValid

that.amigaEffect = function(e, p) {
var x = ((p & 0xf0) >> 4),
y = p & 0x0f;
//set efects
if (e === 15) {
e += 15;
} else if (e === 14) {
e=x+14;
return WebTracker.effect(e, y);
}
if (WebTracker.effectParams[e].length >= 2) {
return WebTracker.effect(e, x, y);
} else {
if (WebTracker.sinedEffects.indexOf(e) >= 0) {
if (x) {
p = x;
} else {
p = -y;
} //+x or -y
} //if signed
return WebTracker.Effect(e, p);
} //1 or 2 params
}; //amigaEffect

that.toAmigaEffect = function(effect) {
var e = effect.effect,
x, y, p,

encode = function() {
p = ((x << 4) | y);
return [e, p];
}; //encode

//set efects
if (e === 30) {
e = 15;
return [e, effect.p1];
} else if (e >= 14) {
x=e-14;
e=14;
y=effect.p1;
return encode();
} else { //e < 14
if (WebTracker.effectParams[e].length >= 2) {
x=effect.p1;
y=effect.p2;
return encode();
} else { //return 1 param;
if (WebTracker.sinedEffects.indexOf(e) >= 0) {
if (effect.p1 > 0) {
x = p1
y = 0;
} else {
x=0;
y = -effect.p1; //negative to posative without abs.
} //+x or -y
return encode();
} else { //1 unsigned param
return [e, effect.p1];
} //what to return
} //1 or 2 params
} //< 14
}; //toAmigaEffect

that.amigaNote = (function() {
var log = Math.log,
d = log(Math.pow(2, 1/12)); //devide log(period/428)/d = note.
return function(n) {
var res = {};
res.period = ((n[0] & 0x0f) << 8) & n[1];
res.sample = (n[0] & 0xf0) | ((n[2] & 0xf0) >> 4);
res.effect = n[2] & 0x0f;
res.param = n[3];
var midiNote = log(res.period/428)/d;
return WebTracker.note(res.sample, midiNote, that.amigaEffect(res.effect, res.param));
}; //amigaNote
})(); //closure for amigaNote

that.toAmigaNote = (function() {
var pow = Math.pow,
f = pow(2, 1/12); //12; //th root of 2
return function(n) {
var res = {};
res.period = 428 * pow(f, n.note),
var e=that.toAmigaEffect(n.effect);
res.effect =e[0];
res.param = e[1];
res.sample = n.sample;
return [(res.sample & 0xf0) | ((res.period & 0xf00) >> 8), res.period & 0xff, (res.sample & 0x0f) << 4) | res.effect, res.param];

}; //toAmigaNote
})(); //closure toAmigaNote

}; //amigaMod

WebTracker.AmigaSong.prototype = new WebTracker.Song();