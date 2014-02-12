var WebTracker = WebTracker || {};
(function() { //closure for load and validation functions
//just a place to store getChannels and frequently used functions privately.
'use strict';
	var amigaEffect = WebTracker.amigaEffect,
note = WebTracker.note,

	amigaNote = function (n) {
			var res = {};
			res.period = ((n[0] & 0x0f) << 8) | n[1];
			res.sample = (n[0] & 0xf0) | ((n[2] & 0xf0) >> 4);
			res.effect = n[2] & 0x0f;
			res.param = n[3];
			var midiNote = WebTracker.amigaPeriodToNote(res.period);
			return note(res.sample, midiNote, amigaEffect(res.effect, res.param));
		}; //amigaNote

getChannels = function (buffer) {
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
			id = WebTracker.stringReader(buffer)(1080, 4); //id at position 1080, 4 letters.
		if (id in chanCount) {
			return chanCount[id];
		} else {
			return -1;
		} //else
	}; //readChannels


	WebTracker.isValidAmigaModule = function (buffer) {
		return getChannels(buffer) > 0;
	}; //isValid

	WebTracker.loadAmigaMod = function (buffer) { //pass in a DataView.
var chans = getChannels(buffer);
		s.channels = chans;
		if (chans > 0) {
			var dataView = (buffer instanceof ArrayBuffer) ? new DataView(buffer) : buffer,
				offset = 0, //jumps around, depending on what we're doing.
				ocount, pcount, //how many to read
				getString = WebTracker.stringReader(dataView),
				song = new WebTracker.Song(),

				readNote = function (offset) {
					var a = [];
					for (var i = 0; i < 4; i++) {
						a[i] = dataView.getUint8(offset++);
					} //for
					return amigaNote(a);
				}; //readNote

//set default bpm
			song.bpm = song.defaultBpm = 125;

			//get title
			song.title = getString(0, 20);

			//get pattern table
			offset = 950; //end of sample headers.
			ocount = dataView.getUint8(offset++);
			song.restartPosition = dataView.getUint8(offset++);
			var max = 0,
				order = song.patternOrder;
			for (var i = 0; i < ocount; i++) {
				var tmp = dataView.getUint8(offset++);
				order[i] = tmp;
				max = max < tmp ? tmp : max;
			} //i
			pcount = max + 1;

			//read patterns
			offset = 1084; //after headers is pattern data.
			var p = song.patterns;
			for (var pattern = 0; pattern < pcount; pattern++) {
				p[pattern] = [];
				for (var row = 0; row < 64; row++) {
					p[pattern][row] = [];
					for (var chan = 0; chan < chans; chan++) {
						p[pattern][row][chan] = readNote(offset);
						offset += 4;
					} //channels
				} //rows
			} //patterns

			//read samples
			var samplePointers = WebTracker.samplePointer(20, offset); //pointers to offsets where sample headers and data are stored.
			var s = [];
			for (var i = 0; i < 31; i++) {
				s[i] = WebTracker.readAmigaSample(dataView, samplePointers);
			} //for: read each sample.
			song.samples = s;
//set bpm if found
			song.patterns[song.patternOrder[0]][0].forEach(function(n) { //cearch the channels in the first row of the first pattern in the patternOrder list.
				if (n.effect === 31) song.bpm = n.effect.p1;
			}); //find first bpm
//done, return the song
return song;
			//done reading.
		} else {
			throw {
				message: "Bad Amiga Module Format."
			};
		} //else
	}; //loadMod
})(); //call anonymous closure to set up loader

WebTracker.isAmigaModCompatible = function(s) {
//make sure this song is compatible with amiga mods. 
//provides array of errors and functions to fix them.
var err = [], ep = 0;
//channels > 0 && <= 32
if (s.channels <== 0 || s.channels > 32) {
err[ep++] = ["Amiga modules support from 1 to 32 channels. This song has " + s.channels + ".", 
function() {
alert("Remove one channel in the composer.");
}]; //fix too many channels
} //if channels not supported
//title < 20 chars
if (s.title.length > 20) {
err[ep++] = ["The song title must be no more than 20 characters.",
function() {
var t = prompt("Please enter a title, 20 characters.", song.title);
if (t != null && t.length <= 20) {
song.title = t;
} else {
alert("Error: Title too long or not entered.");
} //if title is right
}]; //fix for long title
} //if title
if (s.slots > 127) {
err[ep++] = [
"Pattern order list may have up to 127 items. Currently this song lists " + s.slots + ".",
function() {
alert("To fix this problem, click "Patterns in the top bar, then Order. Delete some of the items listed until 127 or less remain.");
}]; //fix too many slots
} //if more than 127 slots.
//patterns <= 127
if (s.patternCount > 127) {
err[ep++] = [
"an amiga song may have up to 127 patterns. Currently this song has " + s.patternCount + ".",
function() {
alert("To fix this problem, click "Patterns in the top bar, then Edit. Delete some of the patterns listed until 127 or less remain.");
}]; //fix too many slots
} //if more than 127 patterns.
//make sure each pattern has exactly 64 rows.
var p = s.patterns, tmp = [];
for (var i = 0; i < p.length; i++) {
tmp = p[i];
if (tmp.length !== 64) {
err[ep++] = ["Pattern " + i + " must have exactly 64 rows.", function(){}];
} else //if not correct rows
for (var j = 0; j < tmp.length; j++) {
if (tmp[j].effect.effect > 31) { //highest supported effect
err[ep++] = ["Pattern " + i + ", note " + j + " has an unsupported effect.", function(){}];
} //valid amiga effect
} //j
} //for each pattern
var smp = s.samples;
for (var i = 0; i < smp.length; i++) {
tmp= WebTracker.isAmigaSampleCompatible(smp[i]);
if (tmp.length > 0) {
err[ep++] = ["Sample " + (i+1) + " error(s)", function(){}];
for (var j = 0; j < tmp.length; j++) {
err[ep++] = tmp[j];
} //j
} //tmp.length
} //for each sample
return err; 
}; //isAmigaSongCompatible

WebTracker.saveAmigaMod = function (song) {
		'use strict';
if (WebTracker.isAmigaModCompatible(song).length > 0) {
throw {message: "Error: This song is not compatible with the amiga format."};
} //if not valid

		var samplePointers,

			//calculate byte length and sample data offset
			modLength = function () {
				var length = 1084; //sample headers, title, pattern headers, etc.
				length += (64 * song.patternCount * song.channels * 4);
				samplePointers = WebTracker.samplePointer(20, length); //end of pattern data
				song.samples.forEach(function (s) {
if (WebTracker.isAmigaSampleCompatible(s).length > 0) {
throw {message: "Error: This song is not compatible with the amiga format."};
} else { //now we know it's valid
					length += s.length;
					length += s.length % 2;
} //if
				});
				return length;
			},

			//more vars
			buffer = new ArrayBuffer(modLength()),
			dv = new DataView(buffer),

	toAmigaNote = function (n) {
			var res = {};
res.period = WebTracker.noteToAmigaPeriod(n.note);
			var e = WebTracker.toAmigaEffect(n.effect);
			res.effect = e[0];
			res.param = e[1];
			res.sample = n.sample;
			return [(res.sample & 0xf0) | ((res.period & 0xf00) >> 8), res.period & 0xff, ((res.sample & 0x0f) << 4) | res.effect, res.param];
		}, //toAmigaNote

			writeString = WebTracker.stringWriter(dv);

		//write title
		writeString(song.title, 0, 20);

		//write pattern headers
		var offset = 950, //start of data
			po = song.patternOrder;

		dv.setUint8(offset, song.slots);
		offset++;
		dv.setUint8(offset, song.restartPosition);
		offset++;
		for (var i = 0; i < po.length; i++) {
			dv.setUint8(offset++, po[i] || 0);
		} //i
		writeString(song.channels === 4 ? "M.K." : (song.channels + "CHN"), 1080, 4); //writes first 4 bytes, IE: 8CHN or 32CH.

		//write pattern data
		offset = 1084; //end of headers
		var p = song.patterns;
		for (var i = 0; i < p.length; i++) {
			for (var j = 0; j < 64; j++) {
				for (var k = 0; k < song.channels; k++) {
					var a = toAmigaNote(p[i][j][k]);
					a.forEach(function (v) {
						dv.setUint8(offset++, v);
					}); //forEach
				} //k
			} //j
		} //i

		//write samples
		song.samples.forEach(function (s) {
			WebTracker.writeAmigaSample(s, dv, samplePointers);
		}); //write each sample.
if (song.samples.length < 31) {
var s = new WebTracker.sample();
s.sampleRate = 8287.2;
s.title="";
for (var i = song.samples.length; i < 31; i++) { //fill in sample data
			WebTracker.writeAmigaSample(s, dv, samplePointers);
} //for each non-created sample

		//return the file in the desired format
		if (!returnArrayBuffer) {
			return WebTracker.base64ArrayBuffer(buffer);
		} else {
			return buffer;
		} //if converting to base64
	}; //saveAmigaMod

WebTracker.amigaSlideNoteDown = function(bpm, start, end, amt) {
end = end || 83.0554563; //max if sliding without bound.
var ticks=750/bpm,
sp = WebTracker.noteToAmigaPeriod(start),
ep = WebTracker.noteToAmigaPeriod(end),
res = [start],
tmp = sp,
i,
ptn = WebTracker.amigaPeriodToNote;
for (var i = 0; i < ticks && tmp > ep; i++) {
tmp -= amt;
if (tmp < ep) tmp = ep;
res[i] = ptn(tmp);
}
return res;
} //slideNoteDown

WebTracker.amigaSlideNoteUp = function(bpm, start, end, amt) {
end = end || 48; //min amiga slide
var ticks=750/bpm,
sp = WebTracker.noteToAmigaPeriod(start),
ep = WebTracker.noteToAmigaPeriod(end),
res = [start],
tmp = sp,
i,
ptn = WebTracker.amigaPeriodToNote;
for (var i = 0; i < ticks && tmp < ep; i++) {
tmp += amt;
if (tmp > ep) tmp = ep;
res[i] = ptn(tmp);
}
return res;
} //slideNoteUp

WebTracker.calcAmigaNoteSlide = function(bpm, last, bound, amt) {
var q;
if (bound > last) {
q = WebTracker.amigaSlideNoteDown(bpm, last, bound, amt);
} else {
q = WebTracker.amigaSlideNoteUp(bpm, last, bound, amt);
} //if
return q;
}; //calculateNoteSlide

WebTracker.calcAmigaArpeggio = function(bpm, base, o1, o2) {
var t = 750 / bpm,
i = 0,
res = [],
notes = [base,
base + o1,
base + o2];
res[i] = notes[i % 3];
i++;
while (i < t) {
for (var j = 0; j < 3; j++) {
res[i] = notes[i % 3];
i++;
} //j
} //while
return res;
}; //calcArpeggio

WebTracker.calcAmigaFineSlide = function(n, x) {
var p = WebTracker.noteToAmigaPeriod(n);
return WebTracker.amigaPeriodToNote(x + p);
}; //calcFineSlide

WebTracker.calcAmigaVolumeSlide = function(bpm, vol, p) {
var activeTicks = (750 / bpm) - 1,
newVol = WebTracker.restrictRange(vol + ((p * activeTicks) / 64), 0, 1);
return newVol;
}; //calcVolumeSlide

WebTracker.calcAmigaCycles = function(bpm, c) {
return (c * 750) / (bpm * 64);
} //calcCycles

WebTracker.calcAmigaVibratoAmplitude = function(s) {
return s / 16;
}; //calcSimitones

WebTracker.calcAmigaTremoloAmplitude = function(bpm, amp) {
return (750 * amp) / bpm;
}; //calcTremoloAmplitude
