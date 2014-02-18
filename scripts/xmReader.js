var WebTracker = WebTracker || {};

WebTracker.readXMInstrument = function(dv, ptr, deltaEnv) { //ptr = pointer to data
var getString = WebTracker.stringReader(dv),
ins = new WebTracker.Instrument(),
sampCount,
off=ptr.off,
samples = [],
instrumentHeaderSize = 0,

readEnvPoints = function(o, pts) {
var env = [],
pt = 0,
y = 0;
for (var i = 0; i < pts; i++) {
pt = (deltaEnv ? pt : 0) + dv.getUint116(o);
o += 2;
y = dv.getUint16(o);
o += 2;
env[i] = {x: pt, y: y};
} //i 
return env;
}, //readEnv

readEnvelopes = function() {
var volpts = dv.getUint8(off+96);
var panpts = dv.getUint8(off+97);
volpts > 12 ? 0 : volpts; //> 12 = 0
panpts > 12 ? 0 : panpts;
ins.volumeEnvelope = readEnvelope(off, volpts); //read the points for volume
off += 48; //advance to pan
//pan envelope
ins.panEnvelope = readEnv(off, panpts);
off += 50; //48 for the points, 2 for volume and pan point count.
//why not store the stinkin' count before the points? What an over-complecated format.
}, //data stored internally, nothing to return.

readVolEnvParams = function() {
var flags = 0;
ins.volumeSustain = dv.readUint8(off++);
ins.volumeLoopStart = dv.readUint8(off++);
ins.volumeLoopEnd = dv.readUint8(off++);
flags = dv.getUint8(off+3);
ins.volumeEnvelopeEnables = (flags & 0x1) > 0;
ins.volumeSustained = (flags & 0x2) > 0;
ins.volumeLooped = (flags & 0x4) > 0;
}, //readVolEnvParams

readPanEnvParams = function() {
var flags = 0;
ins.panSustain = dv.readUint8(off++);
ins.panLoopStart = dv.readUint8(off++);
ins.panLoopEnd = dv.readUint8(off++);
off++; //volume flags
flags = dv.getUint8(off++);
ins.panEnvelopeEnables = (flags & 0x1) > 0;
ins.panSustained = (flags & 0x2) > 0;
ins.panLooped = (flags & 0x4) > 0;
}, //readPanEnvParams

readEnvParams = function() {
readVolEnvParams();
readPanEnvParams();
}, //readEnvParams

readVibratoParams = function() {
ins.vibratoType = dv.getUint8(off++);
ins.vibratoSweep = dv.getUint8(off++);
ins.vibratoDepth = dv.getUint8(off++);
ins.vibratoRate = dv.getUint8(off++);
}, //readVibratoParams

readSample = function(hdr, dataPtr) {
var data = dataPtr.off,
len = dv.getUint32(hdr),
lstart = dv.getUint32(hdr + 4),
llen = dv.getUint32(hdr + 8),
vol = dv.getUint8(hdr + 12),
tune = dv.getInt8(hdr + 13),
flags = dv.getUint8(hdr + 14),
panning = dv.getUint8(hdr + 15),
relNote = dv.getInt8(hdr + 16),
title = getString(hdr + 18, 22),
looped = (flags & 0x3) > 0,
pingpong = (flags & 0x2) > 0,
sixteenBit = (flags & 0x10) > 0,
smp;
smp.tune = tune / 16;
smp.title = title;
smp.pan = (panning - 128) / 128; //128 = center here, 0 = center in software.

if (sixteenBit) {
lstart /= 2;
llen /= 2;
len /= 2;
}
smp = new WebTracker.Sample();
var d = WebTracker.context.createBuffer(1, len, WebTracker.Context.sampleRate);
smp.data = d;
d = d.getChannelData(0);
var delta = 0; //samples saved as delta values, not exact values.
if (sixteenBit) { //one way if sixteenBit, another if not.
for (var i = 0; i < len; i++) {
delta += dv.getInt16(data);
d[i] = delta / 32767;
data += 2;
} //i
} else { //8-bit samples
delta = 0; //make sure delta is 0
for (var i = 0; i < len; i++) {
delta += dv.getInt8(data++);
d[i] = delta / 127;
} //i
} //if sixteenBit

dataPtr.off = data;
}, //readSample

//read instrument header
ins.title = getString(off, 22);
off += 23; //22 for title and 1 for ins type (random)
sampCount = dv.getUint16(off);
off += 2;
if (sampCount > 0) {
//setup ptr for next pattern by adding header for sample header.
instrumentHeaderSize = off + dv.getUint32(off);
for (var i = 0; i < sampCount; i++) {
ins.addSample(samples[i] = new WebTracker.Sample());
} //i
//map notes to samples
//not sure how xm notes map to midi, assuming midi 24 = xm 1.
for (var i = 0; i < 96; i++) {
var n = dv.getUint8(off++) + 24; //offset to midi note
ins.mapSample(i+1, n, n);
} //i
//read envelopes for this instrument
readEnvelopes();
//read params
readEnvParams();
readVibratoParams();
ins.volumeFadeOut = dv.getUint16(off);
off += 4; //2 for param, 2 for unused.


}; //readXMInstrument

WebTracker.loadXMSong = function(dv) {
var getString = WebTracker.stringReader(dv),
off = 0,
nextOff = 0,
patternTableCount = 0,
patternCount = 0,
insCount = 0,
patternCount = 0,
amigaPeriods = false,
tmp, //we always need temp vars
chans, //channels
song = new WebTracker.Song(),
po = song.patternOrder,
patterns = song.patterns,
dataPtr = {off: 0},
nextOff = 0,
deltaEnv = false, //For trackers that store change only in envelope points

readNote = function(ptr) {
var off = ptr.off,
nflags = dv.getUint8(off);
if ((nflags & 0x80) === 0) {
nflags = 0x1f;
} else {
off++;
} //if no note data
var key = (flags & 0x1) > 0 ? dv.getUint8(off++),
var ins = (flags & 0x2) > 0 ? dv.getUint8(off++),
var vol = (flags & 0x4) > 0 ? dv.getUint8(off++),
var fx = (flags & 0x8) > 0 ? dv.getUint8(off++),
var fxData = (flags & 0x10) > 0 ? dv.getUint8(off++);
ptr.off = off;
return WebTracker.note(ins, key, vol, WebTracker.effect(fx, fxData)); //totally rong, need to fix, just here for now.
}; //readNote

//basic data
song.title = getString(17: 20);
song.trackerName = getString(38, 20);
deltaEnv = (song.trackerName.substring(0, 15) === "DigiBooster Pro");

//header data
//set data offset based on header size.
off = 60 + dv.getUint32(60);
patternTableCount = dv.getUint16(64);
song.restartPosition = dv.getUint16(66);
song.channels = chans = dv.getUint16(68);
patternCount = dv.getUint16(70);
instrumentCount = dv.getUint16(72);
amigaPeriods = (dv.getUint16(74) & 0x1) > 0;
defaultSpeed = dv.getUint16(76);
defaultBpm = dv.getUint16(78);
for (var i = 0; i <= patternTableCount; i++) {
tmp = dv.getUint8(80 + i);
tmp = tmp < patternCount ? tmp : 0;
po[i] = tmp; //po = song.patternOrder
} //i

//read pattern headers
for (var i = 0; i < patternCount; i++) {
var p = patterns[i] = [];
if (dv.getUint8(off+4) !== 0) {
alert("This XM module uses a unknown packing type in pattern " + i + ". Unable to load song.");
return new WebTracker.Song(); //return a new empty song instead.
} //if bad packing type
var rows = dv.getUint16(off+5),
patternDataLength = dv.getUint16(off+7);
off += dv.getUint32(off); //point to next pattern header
nextOff =  off+patternDataLength;
dataPtr.off = off;
if (patternDataLength > 0) {
for (var j = 0; j < rows; j++) {
p[j] = []; //initialize row
for (var k = 0; k < chans; k++) { //each channel
p[j][k] = readNote(dataPtr);
} //k: chans
} //j: rows
off = nextOff; //done with this pattern, move to next.
} //i: patterns

//read instruments
dataPtr.off = off + 4;
var si = song.instruments = [new WebTracker.Instrument()]; //new array of instruments, 0 = silence
for (var i = 1; i <= instrumentCount; i++) {
si[i] = readInstrument(dv, dataPtr, deltaEnv);
} //i

}; //loadXMSong

WebTracker.isValidXMModule = function(buffer) {
var dv = (buffer instanceof ArrayBuffer) ? new DataView(buffer) : buffer;
return dv.getUint16(58) === 0x0104;
}; //isValidXMModule
