var WebTracker = WebTracker || {};

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
var notePtr = {off: off};
if (patternDataLength > 0) {
for (var j = 0; j < rows; j++) {
p[j] = []; //initialize row
for (var k = 0; k < chans; k++) { //each channel
p[j][k] = readNote(notePtr);
} //k: chans
} //j: rows
off = nextOff; //done with this pattern, move to next.
} //i: patterns


}; //loadXMSong

WebTracker.isValidXMModule = function(buffer) {
var dv = (buffer instanceof ArrayBuffer) ? new DataView(buffer) : buffer;
return dv.getUint16(58) === 0x0104;
}; //isValidXMModule
