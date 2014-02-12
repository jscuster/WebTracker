var WebTracker = WebTracker || {};

WebTracker.readAmigaSample = function(buffer, ptrs) {
var dataView = (buffer instanceof ArrayBuffer) ? new DataView(buffer) : buffer,
hoff=ptrs.headerOffset,
doff=ptrs.dataOffset,
len, lstart, lend, //length, loopStart, loopEnd.
res = new WebTracker.Sample(),

readHeader = function() {
res.title = WebTracker.stringReader(dataView)(hoff, 22);
hoff+=22;
len = 2 * dataView.getUint16(hoff, false); //length of sample data
hoff+=2;
var tune = dataView.getInt8(hoff++); //finetune, needs adjusting
if (tune > 7) {
tune = 15-tune;
}
res.tune = tune;
res.volume = dataView.getUint8(hoff++)/64; //volume, scaled to 0..1
lstart = dataView.getUint16(hoff) * 2;
hoff += 2;
lend = lstart + (dataView.getUint16(hoff) * 2);
hoff += 2;
}, //readHeader

readData = function() {
if (len > 0) {
var d = WebTracker.context.createBuffer(1, len, WebTracker.context.sampleRate);
res.data = d;
d = d.getChannelData(0);
for (var i = 0; i < len; i++) {
d[i] = dataView.getInt8(doff++) / 128; //scale down to -1 .. 1
} //i
} else { //now there is no real sample data, just need a buffer.
var d = WebTracker.context.createBuffer(1, 1, WebTracker.context.sampleRate);
res.data = d;
d = d.getChannelData(0);
d[0] = 0;
} //load data or create empty buffer
res.sampleRate=8287.2; //standard amiga sample sampleRate.
}; //readData

readHeader();
readData();
res.loopStart = lstart;
res.loopEnd = lend;
ptrs.headerOffset = hoff;
ptrs.dataOffset = doff;
return res; //return the newly loaded sample
}; //readSample

WebTracker.isAmigaSampleCompatible = function(s) {
var err = [], ep = 0;
if (s.channels > 1) {
err[ep++] = ["Sample must have only 1 channel, this sample has " + s.channels + ".",
function() {
s.toMono();
}];
} //if not mono
if (s.sampleRate !== 8287.2) {
err[ep] = ["Sample must have sample rate of 8287.2. This sample's rate = " + s.sampleRate + ".",
function() {
s.resample(8287.2);
}];
} //if not sampleRate match
if (s.title.length > 22) {
err[ep++] = ["Sample titles can be no more than 22 characters.",
function() {
var t = orig = s.title;
while (t != null && t.length > 22) {
t = prompt("Please enter a new title, 22 characters or less:", orig);
if (t == null) {
alert("keeping the original tital.");
} else {
orig = t;
} //if
} //while
s.title = orig;
}];
} //if title to long
if (s.length > 131070) { //0xffff is max size for length, measured in words, 65535*2.
err[ep++] = ["This sample is to long. The max length is 131070, current length is " + s.length + ".",
function() {
if (s.channels > 1) {
alert("Please make this sample mono first.");
} else if (confirm("Truncate sample data to 131070 bytes?")) {
var oldData = s.data.getChannelData(0),
r = s.sampleRate,
d=WebTracker.context.createAudioBuffer(1, 131070, 44100);
s.data = d;
s.sampleRate = r;
d=d.getChannelData(0);
for (var i = 0; i < 131070; i++) {
d[i]=oldData[i];
} //i
} //if not mono or if agree to truncate
}]; //err
} //if length not right
return err;
}; //isValidAmigaSample

WebTracker.writeAmigaSample = function(s, buffer, ptrs) {
if (WebTracker.isValidAmigaSample(s)) {
var dv = (buffer instanceof ArrayBuffer) ? new DataView(buffer) : buffer,
hoff=ptrs.headerOffset,
doff=ptrs.dataOffset,
round = Math.round,

writeHeader = function() {
WebTracker.stringWriter(dv)(s.title, hoff, 22);
hoff+=22;
var tmp = (s.length / 2) + (s.length % 2);
dv.setUint16(hoff, tmp, false);
hoff += 2;
dv.setUint8(hoff++, s.tune < 0 ? s.tune + 15 : s.tune); //two's complament lower nibble
dv.setUint8(hoff++, round(s.volume*64));
dv.setUint16(hoff, round(s.loopStart/2), false);
hoff+=2;
dv.setUint16(hoff, round((s.loopEnd - s.loopStart)/2), false);
hoff+=2;
}, //writeHeader

writeData = function() {
if (s.length > 0) {
var d = s.data.getChannelData(0),
l = s.length;
for (var i = 0; i < l; i++) {
dv.setInt8(doff++,  round(d[i]*127));
} //i
if ((s.length % 2) > 0) doff++; //length measured in words.
} //if length > 0
}; //writeData

writeHeader();
writeData();
ptrs.headerOffset = hoff;
ptrs.dataOffset = doff;
} //if valid

return WebTracker.samplePointer(hoff, doff);
}; //writeSample
