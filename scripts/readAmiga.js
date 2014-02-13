
var WebTracker = WebTracker || {};

WebTracker.readAmigaSample = function (buffer, ptrs) {
	'use strict';
	var dataView = (buffer instanceof ArrayBuffer) ? new DataView(buffer) : buffer,
		hoff = ptrs.headerOffset,
		doff = ptrs.dataOffset,
		len, lstart, lend, //length, loopStart, loopEnd.
		res = new WebTracker.Sample(),

		readHeader = function () {
			res.title = WebTracker.stringReader(dataView)(hoff, 22);
			hoff += 22;
			len = 2 * dataView.getUint16(hoff, false); //length of sample data
			hoff += 2;
			var tune = dataView.getInt8(hoff++); //finetune, needs adjusting
			if (tune > 7) {
				tune = 15 - tune;
			}
			res.tune = tune;
			res.volume = dataView.getUint8(hoff++) / 64; //volume, scaled to 0..1
			lstart = dataView.getUint16(hoff) * 2;
			hoff += 2;
			lend = lstart + (dataView.getUint16(hoff) * 2);
			hoff += 2;
		}, //readHeader

		readData = function () {
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
			res.sampleRate = 8287.2; //standard amiga sample sampleRate.
		}; //readData

	readHeader();
	readData();
	res.loopStart = lstart;
	res.loopEnd = lend;
	ptrs.headerOffset = hoff;
	ptrs.dataOffset = doff;
	return res; //return the newly loaded sample
}; //readAmigaSample

//mod reader

(function () { //closure for load and validation functions
	//just a place to store getChannels and frequently used functions privately.
	'use strict';
		var getChannels = function (buffer) {
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
		if (chans > 0) {
			var dataView = (buffer instanceof ArrayBuffer) ? new DataView(buffer) : buffer,
				offset = 0, //jumps around, depending on what we're doing.
				ocount, pcount, //how many to read
				getString = WebTracker.stringReader(dataView),
				song = new WebTracker.Song(),
				amigaEffect = WebTracker.amigaEffect,
				note = WebTracker.note,

				amigaNote = function (n) {
					var res = {};
					res.period = ((n[0] & 0x0f) << 8) | n[1];
					res.sample = (n[0] & 0xf0) | ((n[2] & 0xf0) >> 4);
					res.effect = n[2] & 0x0f;
					res.param = n[3];
					var midiNote = WebTracker.amigaPeriodToNote(res.period);
					return note(res.sample, midiNote, amigaEffect(res.effect, res.param));
				}, //amigaNote

				readNote = function (offset) {
					var a = [];
					for (var i = 0; i < 4; i++) {
						a[i] = dataView.getUint8(offset++);
					} //for
					return amigaNote(a);
				}; //readNote

			//set default bpm
			song.bpm = song.defaultBpm = 125;
			//set channels
			song.channels = chans;
//set default pan positions for amiga mods.
			for (var i = 0; i < chans; i++) {
				//set position per left, right, right, left spec.
				var mod = i % 4;
				//should be -1, 1, 1, -1, ... but we'll use smaller figures for better sound. (yes, better in my open ion.)
				if (mod === 0 || mod === 3) {
					song.defaultPan[i] = -0.75; //left
				} else {
					song.defaultPan[i] = 0.75; //right
				} //if pan
			} //for each channel, set pan
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
			song.patterns[song.patternOrder[0]][0].forEach(function (n) { //cearch the channels in the first row of the first pattern in the patternOrder list.
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