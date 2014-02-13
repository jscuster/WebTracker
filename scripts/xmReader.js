var WebTracker = WebTracker || {};

WebTracker.loadXMSong = function(dv) {
var getString = WebTracker.stringReader(dv),
off = 0,
patternTableCount = 0,
patternCount = 0,
insCount = 0,
patternCount = 0,
amigaPeriods = false,
song = new WebTracker.Song();

//basic data
song.title = getString(17: 20);
song.trackerName = getString(38, 20);
//header data
//set data offset based on header size.
off = 60 + dv.getUint32(60);
patternTableCount = dv.getUint16(64);
song.restartPosition = dv.getUint16(66);
song.channels = dv.getUint16(68);
patternCount = dv.getUint16(70);
instrumentCount = dv.getUint16(72);
amigaPeriods = (dv.getUint16(74) & 0x1) > 0;
defaultSpeed = dv.getUint16(76);
defaultBpm = dv.getUint16(78);
for (var i = 0; i <= patternTableCount; i++) {
song.patternOrder[i] = dv.getUint8(80 + i);
} //i

}; //loadXMSong

WebTracker.isValidXMModule = function(buffer) {
var dv = (buffer instanceof ArrayBuffer) ? new DataView(buffer) : buffer;
return dv.getUint16(58) === 0x0104;
}; //isValidXMModule
