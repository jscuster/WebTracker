var WebTracker = WebTracker || {};
WebTracker.AmigaSample = function() {
this.title = "untitled";
this.length = 0;
this.volume = 64;
this.finetune = 0,
this.loopStart = 0;
this.loopLength = 0;
}; //AmigaSample

AmigaSample.prototype.readSample = (function() {
'use strict';
var readSampleHeader = function (dataView, offset) {
this.title = WebTracker.readString(dataView, offset, 22);
offset += 22;
this.length = 2 * dataView.getUint16(offset, false);
offset += 2;
this.finetune = dataView.getInt8(offset);
if (this.finetune > 7) {
this.finetune = 15-this.finetune;
}
offset++;
this.volume = dataView.getUint8(offset);
offset++;
this.loopStart = dataView.getUint16(offset) * 2;
offset += 2;
this.loopLength = dataView.getUint16(offset) * 2;
offset += 2;
var loopEnd = this.loopStart + this.loopLength;
loopEnd = loopEnd < this.length ? loopEnd : this.length-1;
this.loopTimeStart = this.loopStart / 44100;
this.loopTimeEnd = loopEnd / 44100;
this.factor = (16574 * Math.pow(1.007247, this.finetune)) / 44100;
return offset; //should be original offset + 30.
}, //readSampleHeader

readSampleData = function (dataView, offset) {
var l = this.length;
if (l < 2) {
this.data = WebTracker.context.createBuffer(1, 1, 44100);
this.data.getChannelData(0)[0] = 0;
offset += l;
} else {
var d = WebTracker.context.createBuffer(1, l, 44100);
this.data = d;
d = d.getChannelData(0);
for (var i = 0; i < l; i++) {
d[i] = dataView.getInt8(offset++) / 128; //scale down to -1 .. 1
} //i
} //if
return offset; //should be original offset + this.length.
}; //readSampleData

return function(buffer, ptrs) {
var dataView = (buffer instanceof ArrayBuffer) ? new DataView(buffer) : buffer;
return {
headerOffset: readSampleHeader(dataView, ptrs.headerOffset),
dataOffset: readSampleData(dataView, ptrs.dataOffset)
}; //returns pointers to the new offsets.
}; //returned function
})(); //closure: readSample

AmigaSample.prototype.writeSample = function(dv, ptrs) {
var hoff = ptrs.headerOffset, doff = ptrs.dataOffset;
WebTracker.writeString(dv, s.title, hoff, 22);
hoff+=22;
var tmp = (this.length / 2) + (this.length % 2);
dv.setUint16(hoff, tmp, false);
hoff += 2;
dv.setUint8(hoff++, this.finetune < 0 ? this.finetune + 15 : this.finetune); //two's complament lower nibble
dv.setUint8(hoff++, this.volume);
dv.setUint16(hoff, this.loopStart/2, false);
hoff+=2;
dv.setUint16(hoff, this.loopLength/2, false);
hoff+=2;
if (this.length <= 2) {
doff += s.length/2;
} else {
var d = this.data.getChannelData(0),
l = this.length;
if (l !== d.length) alert("length mismatch: " + s.title);
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

WebTracker.AmigaMod = function() {
'use strict';
this.title = "Untitled";
this.samples = [];
this.patterns = [];
this.patternOrder = [];
this.channels = 0;
this.totalPatterns = 0;
for (var i = 0; i < 31; i++) {
this.samples[i] = new AmigaSample();
}; //i
this.restartPosition = 127; //rarely used
this.patternCount = 0;
}; //AmigaMod

AmigaMod.prototype.readChannels = function (buffer) {
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

AmigaMod.isValid = function (buffer) {
return new AmigaMod().readChannels(buffer) >= 0;
}; //if the channel > 0, the cookie is there and it's good.

AmigaMod.prototype.readMod = function (buffer) { //pass in a DataView.
WebTracker.logger.log("Creating mod loader");

var dataView = (buffer instanceof ArrayBuffer) ? new DataView(buffer) : buffer,

getString = (function() { //store the readString function for faster access.
var readString = WebTracker.readString;
return function(offset, length) {
return readString(dataView, offset, length);
}; //inner func
})(), //getString closure

getTitle = function () {
this.title = getString(0, 20);
},

getPatternTable = function () {
var offset = 950;
this.totalPatterns = dataView.getUint8(offset);
offset++
this.restartPosition = dataView.getUint8(offset);
offset++;
var max = 0,
order = this.patternOrder;
for (var i = 0; i < this.totalPatterns; i++) {
order[i] = dataView.getUint8(offset++);
max = max < order[i] ? order[i] : max;
} //i
this.patternCount = max + 1;
}, //getPatternTable

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
}, //readNote

readPatterns = function () {
var offset = 1084,
p = this.patterns;
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
}, //readPatterns

samplePointers = {
headerOffset: 20,
dataOffset: 0
}; //pointers to offsets where sample headers and data are stored.

if (AmigaMod.isValid(dataView)) {
getTitle();
getPatternTable();
readPatterns();
samplePointers.dataOffset = 1084 + (this.patternCount * 64 * this.channels * 4); //offset of first sample's data.
this.samples.forEach(function(s) {
samplePointers = s.readSample(dataView, samplePointers);
}); //read each sample.
} else {
throw {message: "Bad Amiga Module Format."};
} //else
}; //loadMod

AmigaMod.prototype.saveMod = function(returnArrayBuffer) {
'use strict';
WebTracker.logger.log("Saving mod file.");

var samplePointers = {
headerOffset: 20,
dataOffset: 0
},

modLength = function() {
var l = 1084; //sample headers, title, pattern headers, etc.
l += 64 * this.patternCount * this.channels*4;
samplePointers.dataOffset = l;
this.samples.forEach(function(s) {
l += s.length;
l += s.length % 2;
});
WebTracker.logger.log("length calculated to " + l);
return l; //length
},
buffer = new ArrayBuffer(modLength()),
dv = new DataView(buffer),

writeString = (function() {
var sw = WebTracker.writeString;
return function(txt, offset, length) {
return sw(dv, txt, offset, length);
}; //inner function
})(), //closure writeString

writeTitle = function() {
writeString(this.title, 0, 20);
}, //writeTitle

writePatternHeaders = function() {
var offset = 950; //start of data
dv.setUint8(offset, this.totalPatterns);
offset++;
dv.setUint8(offset, this.restartPosition);
offset++;
for (var i = 0; i < this.totalPatterns; i++) {
dv.setUint8(offset++, this.patternOrder[i] || 0);
} //i
writeString(this.channels === 4 ? "M.K." : (this.channels + "CHN"), 1080, 4); //writes first 4 bytes, IE: 8CHN or 32CH.
}, //writePatternHeaders

writePatternData = function() {
var offset = 1084,
p = this.patterns;
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
}, //writePatternData

writeSamples = function() {
this.samples.forEach(function(s) {
samplePointers = s.writeSample(dv, samplePointers);
}); //write each sample.
}; //writeSamples

//write the bad boy
writeTitle();
writeSamples();
writePatternHeaders();
writePatternData();
if (!returnArrayBuffer) {
return WebTracker.base64ArrayBuffer(buffer);
} else {
return buffer;
} //if converting to base64
}; //saveMod