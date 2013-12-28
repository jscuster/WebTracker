var WebTracker = WebTracker || {};

WebTracker.amigaSample = function() {
'use strict';
var p = new WebTracker.Sample({monoOnly: true, maxTitleLength: 22, maxSampleLength: 65535}); //limits for amiga samples.
p.readSample = function(buffer, ptrs) {
try {
var dataView = (buffer instanceof ArrayBuffer) ? new DataView(buffer) : buffer,
newSamplePointers = {
headerOffset: 0,
dataOffset: 0
},

//read header
hoff = ptrs.headerOffset,
len;
this.title = WebTracker.readString(dataView, hoff, 22);
hoff += 22;
len = 2 * dataView.getUint16(hoff, false);
hoff += 2;
var tune = dataView.getInt8(hoff);
if (tune > 7) {
tune = 15-tune;
}
this.tune = tune;
hoff++;
this.volume = dataView.getUint8(hoff)/64;
hoff++;

//read sample data
var doff = ptrs.dataOffset;

if (len > 2) {
var d = WebTracker.context.createBuffer(1, len, WebTracker.context.sampleRate);
this.data = d;
d = d.getChannelData(0);
for (var i = 0; i < len; i++) {
d[i] = dataView.getInt8(doff++) / 128; //scale down to -1 .. 1
} //i
} else {
doff += len;
} //if
newSamplePointers.dataOffset = doff; //should be original doff + this.length.
//read data-dependant info
this.loopStart = dataView.getUint16(hoff) * 2;
hoff += 2;
var loopLength = dataView.getUint16(hoff) * 2;
hoff += 2;
this.loopEnd = this.loopStart + loopLength;
this.sampleRate = 16574;
newSamplePointers.headerOffset = hoff;

//return new offsets
return newSamplePointers;
} catch (e) {
alert("Error reading the file.\n" + JSON.stringify(e));
} //try catch
}; //readSample

p.writeSample = function(dv, ptrs) {
var hoff = ptrs.headerOffset, doff = ptrs.dataOffset;
WebTracker.writeString(dv, this.title, hoff, 22);
hoff+=22;
var tmp = (this.length / 2) + (this.length % 2);
dv.setUint16(hoff, tmp, false);
hoff += 2;
dv.setUint8(hoff++, this.tune < 0 ? this.tune + 15 : this.tune); //two's complament lower nibble
dv.setUint8(hoff++, this.volume*64);
dv.setUint16(hoff, this.loopStart/2, false);
hoff+=2;
dv.setUint16(hoff, (this.loopEnd - this.loopStart)/2, false);
hoff+=2;
if (this.length <= 2) {
doff += this.length;
} else {
var d = this.data.getChannelData(0),
l = this.length;
for (var i = 0; i < l; i++) {
dv.setInt8(doff,  d[i]*127);
doff++;
} //i
if ((this.length % 2) > 0) doff++; //length measured in words.
} //if length > 2
return {
headerOffset: hoff,
dataOffset: doff
}; //pointers to the next data
}; //writeSample
return p;
}; //function to create AmigaSample prototype

WebTracker.amigaMod = function() {
'use strict';

var readChannels = function (buffer) {
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

var mod = new WebTracker.Song({
maxTitleLength: 20,
maxSamples: 31,
minSamples: 31,
maxPatterns: 127,
maxSlots: 127,
maxChannels: 32,
sampleGenerator: WebTracker.amigaSample
}); //new Song with Amiga Mod based parameters.

mod.isValid = function (buffer) {
return readChannels(buffer) >= 0;
}; //if the channel > 0, the cookie is there and it's good.

mod.loadMod = function (buffer) { //pass in a DataView.
this.channels = readChannels(buffer);
if (this.channels >= 0) {
mod.restartPosition = 127; //rarely used

var dataView = (buffer instanceof ArrayBuffer) ? new DataView(buffer) : buffer,
offset = 0, //jumps around, depending on what we're doing.

getString = (function() { //store the readString function for faster access.
var readString = WebTracker.readString;
return function(offset, length) {
return readString(dataView, offset, length);
}; //inner func
})(), //getString closure

readNote = function (offset) {
var a = [];
for (var i = 0; i < 4; i++) {
a[i] = dataView.getUint8(offset + i);
} //for
var e = {};
e.sample = ((a[0] & 0xf0) | ((a[2] & 0xf0) >> 4));
e.period = (((a[0] & 0x0f) << 8) | a[1]);
e.factor = 80.4284 / e.period;
e.effect = a[2] & 0x0f;
e.param = a[3];
e.x = (a[3] & 0xf0) >> 4;
e.y = a[3] & 0x0f;
return e;
}; //readNote

//get title
this.title = getString(0, 20);

//get pattern table
offset = 950; //end of sample headers.
this.totalPatterns = dataView.getUint8(offset);
offset++
this.restartPosition = dataView.getUint8(offset);
offset++;
var max = 0,
order = this.patternOrder;
for (var i = 0; i < this.totalPatterns; i++) {
var tmp  = dataView.getUint8(offset++);
order[i] = tmp;
max = max < order[i] ? order[i] : max;
} //i
this.patternCount = max + 1;

//get channels
this.channels = readChannels(buffer);

//read patterns
offset = 1084; //after headers is pattern data.
var p = this.patterns;
for (var pattern = 0; pattern < this.patternCount; pattern++) {
p[pattern] = [];
for (var row = 0; row < 64; row++) {
p[pattern][row] = [];
for (var chan = 0; chan < this.channels; chan++) {
p[pattern][row][chan] = readNote(offset);
offset += 4;
} //channels
} //rows
} //patterns

//read samples
var samplePointers = {
headerOffset: 20,
dataOffset: 1084 + (this.patternCount * 64 * this.channels * 4)
}; //pointers to offsets where sample headers and data are stored.
var s = [];
for (var i = 0; i < 31; i++) {
var smp = WebTracker.amigaSample();
samplePointers = smp.readSample(dataView, samplePointers);
s[i] = smp;
} //for: read each sample.
this.samples = s;

//done reading.
} else {
throw {message: "Bad Amiga Module Format."};
} //else
}; //loadMod

mod.saveMod = function(returnArrayBuffer) {
'use strict';
var samplePointers = {
headerOffset: 20,
dataOffset: 0
},

//calculate byte length
modLength = 1084; //sample headers, title, pattern headers, etc.
modLength += 64 * this.patternCount * this.channels*4;
samplePointers.dataOffset = modLength; //end of pattern data
this.samples.forEach(function(s) {
modLength += s.length;
modLength += s.length % 2;
});

//vars
var buffer = new ArrayBuffer(modLength),
dv = new DataView(buffer),

writeString = (function() {
var sw = WebTracker.writeString;
return function(txt, offset, length) {
return sw(dv, txt, offset, length);
}; //inner function
})(); //closure writeString

//write title
writeString(this.title, 0, 20);

//write pattern headers
var offset = 950; //start of data
dv.setUint8(offset, this.totalPatterns);
offset++;
dv.setUint8(offset, this.restartPosition);
offset++;
for (var i = 0; i < this.totalPatterns; i++) {
dv.setUint8(offset++, this.patternOrder[i] || 0);
} //i
writeString(this.channels === 4 ? "M.K." : (this.channels + "CHN"), 1080, 4); //writes first 4 bytes, IE: 8CHN or 32CH.

//write pattern data
offset = 1084; //end of headers
var p = this.patterns;
for (var i = 0; i < this.patternCount; i++) {
for (var j = 0; j < 64; j++) {
for (var k = 0; k < this.channels; k++) {
var n = p[i][j][k];
var a = [];
//sample
a[0] = n.sample & 0xf0;
a[2] = ((n.sample & 0x0f) << 4);
//period
a[0] = a[0] | (n.period & 0xf00) >> 8;
a[1] = n.period & 0xff;
//effect
a[2] = a[2] | n.effect;
//parameter
a[3] = n.param;
a.forEach(function(v) {
dv.setUint8(offset++, v);
});//forEach
} //k
} //j
} //i

//write samples
this.samples.forEach(function(s) {
samplePointers = s.writeSample(dv, samplePointers);
}); //write each sample.

//return the file in the desired format
if (!returnArrayBuffer) {
return WebTracker.base64ArrayBuffer(buffer);
} else {
return buffer;
} //if converting to base64
}; //saveMod

mod.channels = 4;
mod.samples = [];
return mod;
}; //amigaMod

WebTracker.amigaEffect = function(e, p) {
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

