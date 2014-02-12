var WebTracker = WebTracker || {};

WebTracker.isAmigaSampleCompatible = function (s) {
	var err = [],
		ep = 0;
	if (s.channels > 1) {
		err[ep++] = ["Sample must have only 1 channel, this sample has " + s.channels + ".",
function () {
				s.toMono();
}];
	} //if not mono
	if (s.sampleRate !== 8287.2) {
		err[ep] = ["Sample must have sample rate of 8287.2. This sample's rate = " + s.sampleRate + ".",
function () {
				s.resample(8287.2);
}];
	} //if not sampleRate match
	if (s.title.length > 22) {
		err[ep++] = ["Sample titles can be no more than 22 characters.",
function () {
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
function () {
				if (s.channels > 1) {
					alert("Please make this sample mono first.");
				} else if (confirm("Truncate sample data to 131070 bytes?")) {
					var oldData = s.data.getChannelData(0),
						r = s.sampleRate,
						d = WebTracker.context.createAudioBuffer(1, 131070, 44100);
					s.data = d;
					s.sampleRate = r;
					d = d.getChannelData(0);
					for (var i = 0; i < 131070; i++) {
						d[i] = oldData[i];
					} //i
				} //if not mono or if agree to truncate
}]; //err
	} //if length not right
	return err;
}; //isAmigaSampleCompatible

WebTracker.writeAmigaSample = function (s, buffer, ptrs) {
	if (WebTracker.isAmigaSampleCompatible(s)) {
		var dv = (buffer instanceof ArrayBuffer) ? new DataView(buffer) : buffer,
			hoff = ptrs.headerOffset,
			doff = ptrs.dataOffset,
			round = Math.round,

			writeHeader = function () {
				WebTracker.stringWriter(dv)(s.title, hoff, 22);
				hoff += 22;
				var tmp = (s.length / 2) + (s.length % 2);
				dv.setUint16(hoff, tmp, false);
				hoff += 2;
				dv.setUint8(hoff++, s.tune < 0 ? s.tune + 15 : s.tune); //two's complament lower nibble
				dv.setUint8(hoff++, round(s.volume * 64));
				dv.setUint16(hoff, round(s.loopStart / 2), false);
				hoff += 2;
				dv.setUint16(hoff, round((s.loopEnd - s.loopStart) / 2), false);
				hoff += 2;
			}, //writeHeader

			writeData = function () {
				if (s.length > 0) {
					var d = s.data.getChannelData(0),
						l = s.length;
					for (var i = 0; i < l; i++) {
						dv.setInt8(doff++, round(d[i] * 127));
					} //i
					if ((s.length % 2) > 0) doff++; //length measured in words.
				} //if length > 0
			}; //writeData

		writeHeader();
		writeData();
		ptrs.headerOffset = hoff;
		ptrs.dataOffset = doff;
	} //if valid
}; //writeSample

WebTracker.isAmigaModCompatible = function (s) {
	//make sure this song is compatible with amiga mods. 
	//provides array of errors and functions to fix them.
	var err = [],
		ep = 0;
	//channels > 0 && <= 32
	if (s.channels <= 0 || s.channels > 32) {
		err[ep++] = ["Amiga modules support from 1 to 32 channels. This song has " + s.channels + ".",
function () {
				alert("Remove one channel in the composer.");
}]; //fix too many channels
	} //if channels not supported
	//title < 20 chars
	if (s.title.length > 20) {
		err[ep++] = ["The song title must be no more than 20 characters.",
function () {
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
function () {
				alert("To fix this problem, click Patterns in the top bar, then Order. Delete some of the items listed until 127 or less remain.");
}]; //fix too many slots
	} //if more than 127 slots.
	//patterns <= 127
	if (s.patternCount > 127) {
		err[ep++] = [
"an amiga song may have up to 127 patterns. Currently this song has " + s.patternCount + ".",
function () {
				alert("To fix this problem, click Patterns in the top bar, then Edit. Delete some of the patterns listed until 127 or less remain.");
}]; //fix too many slots
	} //if more than 127 patterns.
	//make sure each pattern has exactly 64 rows with supported effects.
	var p = s.patterns,
		tmp = [];
	for (var i = 0; i < p.length; i++) {
		tmp = p[i];
		if (tmp.length !== 64) {
			err[ep++] = ["Pattern " + i + " must have exactly 64 rows.",
				function () {}];
		} //if rows !== 64
		for (var j = 0; j < tmp.length; j++) {
			for (var k = 0; k < s.channels; k++) {
				if (tmp[j][k].effect.effect > 31) { //highest supported effect
					err[ep++] = ["Pattern " + i + ", note " + j + " has an unsupported effect.",
						function () {}];
				} //valid amiga effect
			} //k (channels)
		} //j (rows)
	} //for each pattern
	var smp = s.samples;
	for (var i = 0; i < smp.length; i++) {
		tmp = WebTracker.isAmigaSampleCompatible(smp[i]);
		if (tmp.length > 0) {
			err[ep++] = ["Sample " + (i + 1) + " error(s)",
				function () {}];
			for (var j = 0; j < tmp.length; j++) {
				err[ep++] = tmp[j];
			} //j
		} //tmp.length
	} //for each sample
	return err;
}; //isAmigaSongCompatible

WebTracker.saveAmigaMod = function (song, returnArrayBuffer) {
	'use strict';
	if (WebTracker.isAmigaModCompatible(song).length > 0) {
		throw {
			message: "Error: This song is not compatible with the amiga format."
		};
	} //if not valid

	var samplePointers,

		//calculate byte length and sample data offset
		modLength = function () {
			var length = 1084; //sample headers, title, pattern headers, etc.
			length += (64 * song.patternCount * song.channels * 4);
			samplePointers = WebTracker.samplePointer(20, length); //end of pattern data
			song.samples.forEach(function (s) {
				if (WebTracker.isAmigaSampleCompatible(s).length > 0) {
					throw {
						message: "Error: This song is not compatible with the amiga format."
					};
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
		s.title = "";
		for (var i = song.samples.length; i < 31; i++) { //fill in sample data
			WebTracker.writeAmigaSample(s, dv, samplePointers);
		} //for each non-created sample
	} //if less than 31samples

	//return the file in the desired format
	if (!returnArrayBuffer) {
		return WebTracker.base64ArrayBuffer(buffer);
	} else {
		return buffer;
	} //if converting to base64
}; //saveAmigaMod