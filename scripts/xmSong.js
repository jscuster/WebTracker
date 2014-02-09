var WebTracker = WebTracker || {};

WebTracker.XMSong = function() {
var that = this;
WebTracker.Song.init(this);
that.maxTitleLength = 20;
that.maxPatterns = 256;
that.maxSlots = 256;
that.maxChannels = 32;
that.channels = 4;

that.loadSong = function(dv) {
var getString = WebTracker.stringReader(dv),
off = 0,
headerSize = 0,
patternTableCount = 0,
patternCount = 0;

//basic data
that.title = getString(17: 20);
that.trackerName = getString(38, 20);
that.versionMajor = dv.getUint8(58),
that.versionMiner = dv.getUint8(59),
//header data
//set offset to header start;
off = 60;
headerSize = dv.getUint32(off);
off+=4;
alert("header size = " + headerSize);
patternTableCount = dv.getUint16(off);
off+=2;
that.restartPosition = dv.getUint16(off);
off+=2;
that.channels = dv.getUint16(off);
off+=2;
patternCount = dv.getUint16(off);
off+=2;
instrumentCount = dv.getUint16(off);
off+=2;
flags = dv.getUint16(off);
off+=2;
tempo = dv.getUint16(off);
off+=2;
that.bpm = dv.getUint16(off);
off+=2;
for (var i = 0; i <= patternTableCount; i++) {
that.patternOrder[i] = dv.getUint8(off++);
} //i
if (off < headerSize + 60) {
alert("More header data available, context not understood. Ignoring " + (headerSize - off - 60) + " bytes.");
off = headerSize + 60; //first 60 bytes don't count.
} else if (off > headerSize + 60) {
alert("Error, serious bug, we overran the data, not as many header bytes as was expected.");
throw {message: "Error, serious bug, we overran the data, not as many header bytes as was expected."};
} //if data doesn't match up in header size.





}; //loadSong


}; //XMSong

WebTracker.XMSong.prototype = new WebTracker.Song);

WebTracker.XMSong.isValid = function(buffer) {
var res = true, //assume validity.
dv = (buffer instanceof ArrayBuffer) ? new DataView(buffer) : buffer;
idstr = WebTracker.stringReader(dv)(0, 17),
chk1 = dv.getUint8(),
versionMajor = dv.getUint8(58),
versionMiner = dv.getUint8(59);
res = (idstr === 'Extended Module: ') && res;
res = (chk1 === 0x1a) && res;
res = (versionMajor >= 1 && versionMiner >= 4) && res;
};
