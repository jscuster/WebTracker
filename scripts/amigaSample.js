var WebTracker = WebTracker || {};

WebTracker.AmigaSample = function() {
'use strict';
WebTracker.Sample.init(this);
this.monoOnly = true;
this.maxTitleLength = 22;
this.maxSampleLength = (0xffff)*2; //65535 words
this.sampleRate=8287.2;
var that = this;
this.readSample = function(buffer, ptrs) {
var dataView = (buffer instanceof ArrayBuffer) ? new DataView(buffer) : buffer,
hoff=ptrs.headerOffset,
doff=ptrs.dataOffset,
len, lstart, lend; //length, loopStart, loopEnd.

var readHeader = function() {
that.title = WebTracker.readString(dataView, hoff, 22);
hoff+=22;
len = 2 * dataView.getUint16(hoff, false); //length of sample data
hoff+=2;
var tune = dataView.getInt8(hoff++); //finetune, needs adjusting
if (tune > 7) {
tune = 15-tune;
}
that.tune = tune;
that.volume = dataView.getUint8(hoff++)/64; //volume, scaled to 0..1
lstart = dataView.getUint16(hoff) * 2;
hoff += 2;
lend = lstart + (dataView.getUint16(hoff) * 2);
hoff += 2;
}, //readHeader

readData = function() {
if (len > 0) {
var d = WebTracker.context.createBuffer(1, len, WebTracker.context.sampleRate);
that.data = d;
d = d.getChannelData(0);
for (var i = 0; i < len; i++) {
d[i] = dataView.getInt8(doff++) / 128; //scale down to -1 .. 1
} //i
} //if
}; //readData

readHeader();
readData();
that.loopStart = lstart;
that.loopEnd = lend;
return WebTracker.samplePointer(hoff, doff);
}; //readSample

this.writeSample = function(buffer, ptrs) {
var dv = (buffer instanceof ArrayBuffer) ? new DataView(buffer) : buffer,
hoff=ptrs.headerOffset,
doff=ptrs.dataOffset,
that = this,

writeHeader = function() {
WebTracker.writeString(dv, that.title, hoff, 22);
hoff+=22;
var tmp = (that.length / 2) + (that.length % 2);
dv.setUint16(hoff, tmp, false);
hoff += 2;
dv.setUint8(hoff++, that.tune < 0 ? that.tune + 15 : that.tune); //two's complament lower nibble
dv.setUint8(hoff++, that.volume*64);
dv.setUint16(hoff, that.loopStart/2, false);
hoff+=2;
dv.setUint16(hoff, (that.loopEnd - that.loopStart)/2, false);
hoff+=2;
}, //writeHeader

writeData = function() {
if (that.length > 0) {
var d = that.data.getChannelData(0),
l = that.length;
for (var i = 0; i < l; i++) {
dv.setInt8(doff++,  d[i]*127);
} //i
if ((this.length % 2) > 0) doff++; //length measured in words.
} //if length > 0
}; //writeData

writeHeader();
writeData();
return WebTracker.samplePointer(hoff, doff);
}; //writeSample
}; //AmigaSample

WebTracker.AmigaSample.prototype = new WebTracker.Sample();
