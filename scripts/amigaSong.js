var WebTracker = WebTracker || {};

WebTracker.AmigaSong = function () {
	'use strict';
	WebTracker.Song.init(this);
	var that = this;

	//amiga specific properties
	that.maxTitleLength = 20;
	that.maxSamples = 31;
	that.minSamples = 31;
	that.maxPatterns = 127;
	that.maxSlots = 127;
	that.maxChannels = 32;
	that.restartPosition = 127; //rarely used
	that.Sample = WebTracker.AmigaSample;
	that.samples = [];
that.minBpm = 32;
that.maxBpm = 255;
that.bpm = 125;
that.defaultRowsPerPattern = 64;
that.channels = 4;

	that.loadMod = function (buffer) { //pass in a DataView.
		that.channels = that.getChannels(buffer);
		if (that.channels >= 0) {
			var dataView = (buffer instanceof ArrayBuffer) ? new DataView(buffer) : buffer,
				offset = 0, //jumps around, depending on what we're doing.
				ocount, pcount, //how many to read

				getString = (function () { //store the readString function for faster access.
					var readString = WebTracker.readString;
					return function (offset, length) {
						return readString(dataView, offset, length);
					}; //inner func
				})(), //getString closure

				readNote = function (offset) {
					var a = [];
					for (var i = 0; i < 4; i++) {
						a[i] = dataView.getUint8(offset++);
					} //for
					return that.amigaNote(a);
				}; //readNote

			//get title
			that.title = getString(0, 20);

			//get pattern table
			offset = 950; //end of sample headers.
			ocount = dataView.getUint8(offset++);
			that.restartPosition = dataView.getUint8(offset++);
			var max = 0,
				order = that.patternOrder;
			for (var i = 0; i < ocount; i++) {
				var tmp = dataView.getUint8(offset++);
				order[i] = tmp;
				max = max < tmp ? tmp : max;
			} //i
			pcount = max + 1;

			//read patterns
			offset = 1084; //after headers is pattern data.
			var p = that.patterns;
			for (var pattern = 0; pattern < pcount; pattern++) {
				p[pattern] = [];
				for (var row = 0; row < 64; row++) {
					p[pattern][row] = [];
					for (var chan = 0; chan < that.channels; chan++) {
						p[pattern][row][chan] = readNote(offset);
						offset += 4;
					} //channels
				} //rows
			} //patterns

			//read samples
			var samplePointers = WebTracker.samplePointer(20, offset); //pointers to offsets where sample headers and data are stored.
			var s = [];
			for (var i = 0; i < 31; i++) {
				var smp = new WebTracker.AmigaSample();
				samplePointers = smp.readSample(dataView, samplePointers);
				s[i] = smp;
			} //for: read each sample.
			that.samples = s;
//set bpm if found
			that.patterns[that.patternOrder[0]][0].forEach(function(n) { //cearch the channels in the first row of the first pattern in the patternOrder list.
				if (n.effect === 31) that.bpm = n.effect.p1;
			}); //find first bpm

			//done reading.
		} else {
			throw {
				message: "Bad Amiga Module Format."
			};
		} //else
	}; //loadMod

	that.saveMod = function (returnArrayBuffer) {
		'use strict';
		var samplePointers,

			//calculate byte length and sample data offset
			modLength = function () {
				var length = 1084; //sample headers, title, pattern headers, etc.
				length += (64 * that.patternCount * that.channels * 4);
				samplePointers = WebTracker.samplePointer(20, length); //end of pattern data
				that.samples.forEach(function (s) {
					length += s.length;
					length += s.length % 2;
				});
				return length;
			},

			//more vars
			buffer = new ArrayBuffer(modLength()),
			dv = new DataView(buffer),

			writeString = (function () {
				var sw = WebTracker.writeString;
				return function (txt, offset, length) {
					return sw(dv, txt, offset, length);
				}; //inner function
			})(); //closure writeString

		//write title
		writeString(that.title, 0, 20);

		//write pattern headers
		var offset = 950, //start of data
			po = that.patternOrder;

		dv.setUint8(offset, that.slots);
		offset++;
		dv.setUint8(offset, that.restartPosition);
		offset++;
		for (var i = 0; i < po.length; i++) {
			dv.setUint8(offset++, po[i] || 0);
		} //i
		writeString(that.channels === 4 ? "M.K." : (that.channels + "CHN"), 1080, 4); //writes first 4 bytes, IE: 8CHN or 32CH.

		//write pattern data
		offset = 1084; //end of headers
		var p = that.patterns;
		for (var i = 0; i < p.length; i++) {
			for (var j = 0; j < 64; j++) {
				for (var k = 0; k < that.channels; k++) {
					var a = that.toAmigaNote(p[i][j][k]);
					a.forEach(function (v) {
						dv.setUint8(offset++, v);
					}); //forEach
				} //k
			} //j
		} //i

		//write samples
		that.samples.forEach(function (s) {
			samplePointers = s.writeSample(dv, samplePointers);
		}); //write each sample.

		//return the file in the desired format
		if (!returnArrayBuffer) {
			return WebTracker.base64ArrayBuffer(buffer);
		} else {
			return buffer;
		} //if converting to base64
	}; //saveMod
	that.getChannels = function (buffer) {
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
			id = WebTracker.readString(buffer, 1080, 4); //id at position 1080, 4 letters.
		if (id in chanCount) {
			return chanCount[id];
		} else {
			return -1;
		} //else
	}; //readChannels


	that.isValid = function (buffer) {
		return that.getChannels(buffer) > 0;
	}; //isValid

	that.amigaEffect = (function() {
var effect = WebTracker.effect;
return function (e, p) {
		var x = ((p & 0xf0) >> 4),
			y = p & 0x0f;
		//set efects
		switch(e) {
			case 0:
			if (p === 0) {
				return effect(e, p);
			} else {
return effect(1, x, y);
}
break;
//falls through
case 1: //slide up
case 2: //slide down
case 3: //slide to note
return effect(e+1, p);
break;
case 4: //vibrato
return effect(5, x, y);
break;
//next ones fall through
case 5: //continue note slide + slice volume
case 6: //continue note slide + vibrato
return effect(e+1, x > 0 ? x : -y);
break;
case 7: //tremolo
return effect(e, x, y);
break;
case 8: //supposed to be unused, suspect pan.
return effect(e+1, p);
break;
case 9: //set ssample offset
return effect(10, p << 8);
break;
case 10: //volume slide
return effect(11, x > 0 ? x : -y);
break;
case 11: //position jump
return effect(e+1, p);
break;
case 12:  //set volume
return effect(13, p/64);
break;
case 13: //pattern break
return effect(14, (x*10) + y);
break;
case 14: //sub-effect
			e = x + 15;
switch (e) {
//next ones fall through, be ware!
case 25: //slide volume up
case 26: //slide volume down
y = y / 64;
break;
default:
} //sub-switch, modify y.
			return effect(e, y);
break;
case 15: //set tempo
var r = p <= 32 ? Math.round(750 / p) : p
return effect(31, r); //< 32 = ticks per row.
break;
} //switch
	}; //amigaEffect
})(); //closure amegaEffect

	that.toAmigaEffect = function (effect) {
		var e = effect.effect,
			x, y, p,

			encode = function () {
				p = ((x << 4) | y);
				return [e, p];
			}; //encode

		//set efects
switch (e) {
case 0:
			return [0, 0];
break;
case 13: //set volume
return [e-1, p*64];
break;
//the next falls through, be ware
case 25: //volume, p1 factor of 64.
case 26:
x = e-15;
e = 14;
y = effect.p1 * 64;
return encode();
break;
case 31:
			e = 15;
			return [e, effect.p1];
break;
default:
if (e >= 15) {
			x = e - 15;
			e = 14;
			y = effect.p1;
			return encode();
		} else { //e < 14
			if (WebTracker.effectParams[e].length >= 2) {
				x = effect.p1;
				y = effect.p2;
				e--;
				return encode();
			} else { //return 1 param;
				if (WebTracker.signedEffects.indexOf(e) >= 0) {
					if (effect.p1 > 0) {
						x = effect.p1
						y = 0;
					} else {
						x = 0;
						y = -effect.p1; //negative to posative without abs.
					} //+x or -y
					e--;
					return encode();
				} else { //1 unsigned param
					return [e - 1, effect.p1];
				} //what to return
			} //1 or 2 params
		} //< 14
} //switch
	}; //toAmigaEffect

	that.amigaNote = function (n) {
			var res = {};
			res.period = ((n[0] & 0x0f) << 8) | n[1];
			res.sample = (n[0] & 0xf0) | ((n[2] & 0xf0) >> 4);
			res.effect = n[2] & 0x0f;
			res.param = n[3];
			var midiNote = WebTracker.amigaPeriodToNote(res.period);
			return WebTracker.note(res.sample, midiNote, that.amigaEffect(res.effect, res.param));
		}; //amigaNote

	that.toAmigaNote = function (n) {
			var res = {};
res.period = WebTracker.noteToAmigaPeriod(n.note);
			var e = that.toAmigaEffect(n.effect);
			res.effect = e[0];
			res.param = e[1];
			res.sample = n.sample;
			return [(res.sample & 0xf0) | ((res.period & 0xf00) >> 8), res.period & 0xff, ((res.sample & 0x0f) << 4) | res.effect, res.param];
		}; //toAmigaNote

that.slideNoteDown = function(bpm, start, end, amt) {
end = end || 48; //min amiga slide
var ticks=750/bpm,
sp = WebTracker.noteToAmigaPeriod(start),
ep = WebTracker.noteToAmigaPeriod(end),
res = [end],
tmp = sp,
i,
ptn = WebTracker.amigaPeriodToNote;
for (var i = 0; i < ticks && tmp > ep; i++) {
tmp -= amt;
if (tmp < ep) tmp = ep;
res[i] = ptn(tmp);
}
return res;
} //slieNoteDown

that.slideNoteUp = function(bpm, start, end, amt) {
end = end || 83.0554563; //max if sliding without bound.
var ticks=750/bpm,
sp = WebTracker.noteToAmigaPeriod(start),
ep = WebTracker.noteToAmigaPeriod(end),
res = [end],
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

that.calculateNoteSlide = function(bpm, last, bound, amt) {
var q;
if (bound > last) {
q = that.slideNoteDown(bpm, last, bound, amt);
} else {
q = that.slideNoteUp(bpm, last, bound, amt);
} //if
return q;
}; //calculateNoteSlide

this.calcArpeggio = function(bpm, base, o1, o2) {
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

this.calcVolumeSlide = function(bpm, vol, p) {
vol += ((750 * p)/(bpm * 64)); //ticks per row * p, all over 64. 64 = max amiga volume.
vol = WebTracker.restrictRange(vol, 0, 1);
}; //calcVolumeSlide

}; //amigaMod

WebTracker.AmigaSong.prototype = new WebTracker.Song();