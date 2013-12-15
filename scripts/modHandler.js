var WebTracker = WebTracker || {};
WebTracker.AmigaMod = function() {
		this.title = "Untitled";
		this.samples = [];
		this.patterns = [];
		this.patternOrder = [];
		this.channels = 0;
this.totalPatterns = 0;
for (var i = 0; i < 31; i++) {
this.samples[i] = {
title: "untitled",
length: 0,
volume: 64,
finetune: 0,
loopStart: 0,
loopLength: 0
}; //sample
} //i
this.restartPosition = 127; //rarely used
this.patternCount = 0;

	}; //song variable

WebTracker.modLoader = function (dataView, context) { //pass in a DataView.
	'use strict';
WebTracker.logger.log("Creating mod loader");
	var song = new WebTracker.AmigaMod(), //initial song variable

		getString = function (offset, length) {
			var res = [],
				end = offset + length,
				chr;
			while (offset < end) {
				var tmp = dataView.getUint8(offset);
				if (tmp === 0) break;
				offset++;
				res.push(tmp);
			}
			return String.fromCharCode.apply(null, res);
		}, //getString

		getChannels = function () {
			var chanCount = {
				'TDZ1': 1,
				'1CHN': 1,
				'TDZ2': 2,
				'2CHN': 2,
				'TDZ3': 3,
				'3CHN': 3,
				'M.K.': 4,
				'FLT4': 4,
				'M!K!': 4,
				'4CHN': 4,
				'TDZ4': 4,
				'5CHN': 5,
				'TDZ5': 5,
				'6CHN': 6,
				'TDZ6': 6,
				'7CHN': 7,
				'TDZ7': 7,
				'8CHN': 8,
				'TDZ8': 8,
				'OCTA': 8,
				'CD81': 8,
				'9CHN': 9,
				'TDZ9': 9,
				'10CH': 10,
				'11CH': 11,
				'12CH': 12,
				'13CH': 13,
				'14CH': 14,
				'15CH': 15,
				'16CH': 16,
				'17CH': 17,
				'18CH': 18,
				'19CH': 19,
				'20CH': 20,
				'21CH': 21,
				'22CH': 22,
				'23CH': 23,
				'24CH': 24,
				'25CH': 25,
				'26CH': 26,
				'27CH': 27,
				'28CH': 28,
				'29CH': 29,
				'30CH': 30,
				'31CH': 31,
				'32CH': 32
			},
				id = getString(1080, 4); //id at position 1080, 4 letters.
			if (id in chanCount) {
				song.channels = chanCount[id];
			} else {
				song.channels = -1;
			} //else
		}, //getChannels

		isValid = function () {
			getChannels();
			return song.channels > 0;
		},

		getTitle = function () {
			song.title = getString(0, 20);
		},

		getPatternTable = function () {
			var offset = 950;
			song.totalPatterns = dataView.getUint8(offset);
			offset++
			song.restartPosition = dataView.getUint8(offset);
			offset++;
			var max = 0,
				order = song.patternOrder;
			for (var i = 0; i < song.totalPatterns; i++) {
				order[i] = dataView.getUint8(offset++);
				max = max < order[i] ? order[i] : max;
			} //i
			song.patternCount = max + 1;
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
				p = song.patterns;
			for (var pattern = 0; pattern < song.patternCount; pattern++) {
				p[pattern] = [];
				for (var row = 0; row < 64; row++) {
					p[pattern][row] = [];
					for (var chan = 0; chan < song.channels; chan++) {
						p[pattern][row][chan] = readNote(offset);
						offset += 4;
					} //channels
				} //rows
			} //patterns
		}, //readPatterns

		getSampleHeaders = function () {
			var offset = 20;
			for (var i = 0; i < 31; i++) {
				var smp = {
					channels: 1
				};
				smp.title = getString(offset, 22);
				offset += 22;
				smp.length = 2 * dataView.getUint16(offset, false);
				offset += 2;
				smp.finetune = dataView.getInt8(offset);
				if (smp.finetune > 7) {
					smp.finetune = 15-smp.finetune;
				}
				offset++;
				smp.volume = dataView.getUint8(offset);
				offset++;
				smp.loopStart = dataView.getUint16(offset) * 2;
				offset += 2;
				smp.loopLength = dataView.getUint16(offset) * 2;
offset += 2;
smp.loopEnd = smp.loopStart + smp.loopLength;
smp.loopEnd = smp.loopEnd < smp.length ? smp.loopEnd : smp.length-1;
smp.loopTimeStart = smp.loopStart / 44100;
smp.loopTimeEnd = smp.loopEnd / 44100;
smp.factor = (16574 * Math.pow(1.007247, smp.finetune)) / 44100;
				song.samples[i] = smp;

			} //i
var smp = song.samples[0];

		}, //getSampleHeaders

		readSampleData = function () {
			var offset = 1084 + (song.patternCount * 64 * song.channels * 4); //title, sample headers, pattern data, etc.
			for (var i = 0; i < 31; i++) {
				var smp = song.samples[i];
				var l = smp.length;
if (l < 2) {
smp.data = context.createBuffer(1, 1, 44100);
smp.data.getChannelData(0)[0] = 0;
} else {
var d = context.createBuffer(1, l, 44100);
smp.data = d;
d = d.getChannelData(0);
				for (var j = 0; j < l; j++) {
					d[j] = dataView.getInt8(offset++) / 127; //scale down to -1 .. 1
				} //j
			} //i
} //if
		}; //readSampleData


	if (isValid()) {
		getTitle();
		getSampleHeaders();
		getPatternTable();
		readPatterns();
readSampleData();
		return song;
	} else {
		return undefined; //invalid file
	} //else
}; //modLoader

WebTracker.saveMod = function(song, b64) {
var startSampleData,
modLength = function() {
var l = 1084; //sample headers, title, pattern headers, etc.
l += 64 * song.totalPatterns * song.channels;
startSampleData = l;
song.samples.forEach(function(s) {
l += s.length;
l += s.length % 2;
});
return l; //length
},
buffer = new ArrayBuffer(modLength()),
dv = new DataView(buffer),

		writeString = function (txt, offset, length) {
var st = txt.slice(0, length),
l=st.length;
for (var i = 0; i < l; i++) {
dv.setUint8(offset + i, st.charCodeAt(i));
} //i
}, //writeString

writeTitle = function() {
writeString(song.title, 0, 20);
}, //writeTitle

writeSamples = function() {
var hoff = 20, doff = startSampleData;
song.samples.forEach(function(s) {
writeString(s.title, hoff, 22);
hoff+=22;
dv.setUint16(hoff, (s.length / 2) + (s.length % 2));
hoff += 2;
dv.setUint8(hoff++, s.finetune < 0 ? s.finetune + 15 : s.finetune); //two's complament lower nibble
dv.setUint8(hoff++, s.volume);
dv.setUint16(hoff, s.loopStart/2);
hoff+=2;
dv.setUint16(hoff, s.loopLength/2);
hoff+=2;
for (var i = 0, d = s.data.getChannelData(0), l = s.length; i < l; i++) {
dv.setInt8(doff,  d[i]*127);
doff++;
} //i
if ((s.length % 2) > 0) hoff++; //length measured in words.
}); //forEach
}, //writeSamples

writePatternHeaders = function() {
var offset = 950; //start of data
dv.setUint8(offset, song.totalPatterns);
offset++;
dv.setUint8(offset, song.restartPosition);
offset++;
for (var i = 0; i < song.totalPatterns; i++) {
dv.setUint8(offset++, song.patternOrder[i] || 0);
} //i
writeString(song.channels === 4 ? "M.K." : (song.channels + "CHN").slice(0, 4), 1080, 4);
}, //writePatternHeaders

writePatternData = function() {
var offset = 1084,
p = song.patterns;
for (var i = 0; i < song.patternCount; i++) {
for (var j = 0; j < 64; j++) {
for (var k = 0; k < song.channels; k++) {
var n = p[i][j][k];
var w1 = n.period;
w1 = w1 | ((n.sample & 0xf0) << 12);
dv.setUint16(offset, w1);
offset+=2;
w1 = (n.sample & 0x0f) << 12;
w1 = w1 | (n.effect << 8);
w1 = w1 | n.param;
dv.setUint16(offset, w1);
offset+=2;
} //k
} //j
} //i
}, //writePatternData

//this function is not mine, find it at https://gist.github.com/jonleighton/958841
//Give credit where credit is due.
// Converts an ArrayBuffer directly to base64, without any intermediate 'convert to string then
// use window.btoa' step. According to my tests, this appears to be a faster approach:
// http://jsperf.com/encoding-xhr-image-data/5

base64ArrayBuffer = function(arrayBuffer) {
  var base64    = ''
  var encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

  var bytes         = new Uint8Array(arrayBuffer)
  var byteLength    = bytes.byteLength
  var byteRemainder = byteLength % 3
  var mainLength    = byteLength - byteRemainder

  var a, b, c, d
  var chunk

  // Main loop deals with bytes in chunks of 3
  for (var i = 0; i < mainLength; i = i + 3) {
    // Combine the three bytes into a single integer
    chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]

    // Use bitmasks to extract 6-bit segments from the triplet
    a = (chunk & 16515072) >> 18 // 16515072 = (2^6 - 1) << 18
    b = (chunk & 258048)   >> 12 // 258048   = (2^6 - 1) << 12
    c = (chunk & 4032)     >>  6 // 4032     = (2^6 - 1) << 6
    d = chunk & 63               // 63       = 2^6 - 1

    // Convert the raw binary segments to the appropriate ASCII encoding
    base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d]
  }

  // Deal with the remaining bytes and padding
  if (byteRemainder == 1) {
    chunk = bytes[mainLength]

    a = (chunk & 252) >> 2 // 252 = (2^6 - 1) << 2

    // Set the 4 least significant bits to zero
    b = (chunk & 3)   << 4 // 3   = 2^2 - 1

    base64 += encodings[a] + encodings[b] + '=='
  } else if (byteRemainder == 2) {
    chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1]

    a = (chunk & 64512) >> 10 // 64512 = (2^6 - 1) << 10
    b = (chunk & 1008)  >>  4 // 1008  = (2^6 - 1) << 4

    // Set the 2 least significant bits to zero
    c = (chunk & 15)    <<  2 // 15    = 2^4 - 1

    base64 += encodings[a] + encodings[b] + encodings[c] + '='
  }
  
  return base64
}; //base64ArrayBuffer

//do the work
writeTitle()
writeSamples();
writePatternHeaders();
writePatternData();
if (b64) {
return base64ArrayBuffer(buffer);
} else {
return buffer;
} //if converting to base64
}; //saveMod
