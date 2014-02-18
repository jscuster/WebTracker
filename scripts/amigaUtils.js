
var WebTracker = WebTracker || {};

WebTracker.amigaEffect = (function () {
	var effect = WebTracker.effect;
	return function (e, p) {
		var x = ((p & 0xf0) >> 4),
			y = p & 0x0f;
		//set efects
		switch (e) {
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
			return effect(e + 1, p);
			break;
		case 4: //vibrato
			return effect(5, x, y);
			break;
			//next ones fall through
		case 5: //continue note slide + slice volume
		case 6: //continue note slide + vibrato
			return effect(e + 1, x > 0 ? x : -y);
			break;
		case 7: //tremolo
			return effect(e, x, y);
			break;
		case 8: //supposed to be unused, suspect pan.
			return effect(e + 1, p);
			break;
		case 9: //set ssample offset
			return effect(10, p << 8);
			break;
		case 10: //volume slide
			return effect(11, x > 0 ? x : -y);
			break;
		case 11: //position jump
			return effect(e + 1, p);
			break;
		case 12: //set volume
			return effect(13, p / 64);
			break;
		case 13: //pattern break
			return effect(14, (x * 10) + y);
			break;
		case 14: //sub-effect
			e = x + 15;
			return effect(e, y);
			break;
		case 15: //set tempo
			var r = p <= 32 ? Math.round(750 / p) : p
			return effect(31, r); //< 32 = ticks per row.
			break;
		} //switch
	}; //amigaEffect
})(); //closure amegaEffect

WebTracker.toAmigaEffect = function (effect) {
	var e = +effect.effect,
		p1 = +effect.p1,
		p2 = +effect.p2,

		encode = function (e, x, y) {
			return [e, (x << 4) | y];
		}; //encode

	//set efects
	switch (e) {
	case 0: //no effect
		return [0, 0];
		break;
	case 1: //arpeggio
		return encode(0, p1, p2);
		break;
		//falls through
	case 2: //slide up
	case 3: //slide down
	case 4: //slide to note
		return [e - 1, p1];
		break;
	case 5: //vibrato
		return encode(e - 1, p1, p2);
		break;
		//next ones fall through
	case 6: //continue note slide + slide volume
	case 7: //continue note slide + vibrato
		if (p1 < 0) {
			return encode(e - 1, 0, -1 * p1);
		} else { //p1 posative
			return encode(e - 1, p1, 0);
		} //x or y for p1
		break;
	case 8: //tremolo
		return encode(7, p1, p2);
		break;
	case 9: //supposed to be unused, suspect pan.
		return [e - 1, p1];
		break;
	case 10: //set ssample offset
		return [9, p1 >> 8];
		break;
	case 11: //volume slide
		if (p1 < 0) {
			return encode(e - 1, 0, p1 * -1);
		} else { //p1 posative
			return encode(e - 1, p1, 0);
		} //x or y for p1
		break;
	case 12: //position jump
		return [e - 1, p1];
		break;
	case 13: //set volume
		return [12, Math.round(p1 * 64)];
		break;
	case 14: //pattern break
		var y = p1 % 10;
		return encode(13, (p1 - y) / 10, y);
		break;
		//next ones fall through, be ware.
	case 25:
	case 26:
		return encode(14, e - 15, p1);
		break;
	case 31: //set tempo
		return [15, p1];
		break;
	default: // the others
		return encode(14, e - 15, p1 * 64);
		break;
	} //switch
}; //toAmigaEffect

WebTracker.amigaSlideNoteDown = function (bpm, start, end, amt) {
	end = end || 83.0554563; //max if sliding without bound.
	var ticks = 750 / bpm,
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

WebTracker.amigaSlideNoteUp = function (bpm, start, end, amt) {
	end = end || 48; //min amiga slide
	var ticks = 750 / bpm,
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

WebTracker.calcAmigaNoteSlide = function (bpm, last, bound, amt) {
	var q;
	if (bound > last) {
		q = WebTracker.amigaSlideNoteDown(bpm, last, bound, amt);
	} else {
		q = WebTracker.amigaSlideNoteUp(bpm, last, bound, amt);
	} //if
	return q;
}; //calculateNoteSlide

WebTracker.calcAmigaArpeggio = function (bpm, base, o1, o2) {
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

WebTracker.calcAmigaFineSlide = function (n, x) {
	var p = WebTracker.noteToAmigaPeriod(n);
	return WebTracker.amigaPeriodToNote(x + p);
}; //calcFineSlide

WebTracker.calcAmigaVolumeSlide = function (bpm, vol, p) {
	var activeTicks = (750 / bpm) - 1,
		newVol = WebTracker.restrictRange(vol + ((p * activeTicks) / 64), 0, 1);
	return newVol;
}; //calcVolumeSlide

WebTracker.calcAmigaCycles = function (bpm, c) {
	return (c * 750) / (bpm * 64);
} //calcCycles

WebTracker.calcAmigaVibratoAmplitude = function (s) {
	return s / 16;
}; //calcSimitones

WebTracker.calcAmigaTremoloAmplitude = function (bpm, amp) {
	return (750 * amp) / bpm;
}; //calcTremoloAmplitude