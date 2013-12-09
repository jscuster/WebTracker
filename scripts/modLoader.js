var WebTracker = WebTracker || {};
WebTracker.modLoader = function (dataView, context) { //pass in a DataView.
	'use strict';
WebTracker.logger.log("Creating mod loader");
	var song = {
		title: "",
		samples: [],
		patterns: [],
		patternOrder: [],
		channels: -1
	}, //initial song variable

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
					smp.finetune = 14-smp.finetune;
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
		return; //invalid file
	} //else
}; //modLoader