var WebTracker = WebTracker || {};
WebTracker.effects = [
'none', //0
'Arpeggio',
'Slide Note Up',
'Slide Note Down',
'Slide To Note',
'Vibrato', //5
'Continue Note Slide + Slide Volume',
'Continue Vibrato + Volume Slide',
'Tremolo',
'Reserved',
'SetSampleOffset', //10
'Slide Volume',
'Position Jump',
'Set Volume',
'Pattern Break',
'Toggle Filter', //15
'Fine Slide Up',
'Fine Slide Down',
'Toggle Glissando',
'Set Vibrato Waveform',
'Tune', //20
'Loop Pattern',
'Set Tremolo Waveform',
'Reserved SubEffect',
'Retrigger Sample',
'Fine Volume Slide Up', //25
'Fine Volume Slide Down',
'Cut Sample',
'Delay Sample',
'Delay Pattern',
'Inverte Loop', //30
'Set Tempo' //31
];
WebTracker.effectSupported = [
true,
false,
false,
false,
false,
false,
false,
false,
false,
false,
true,
false,
true,
false,
false,
false,
false,
false,
false,
false,
false,
false,
false,
false,
false,
false,
false,
false,
false,
false,
true];

(function () { //anonymous func to fill vars without creating global vars.
	'use strict';
	var e = WebTracker.effects,
		l = e.length,
		n = [];
	for (var i = 0; i < l; i++) {
		n[e[i]] = i;
	} //i
	WebTracker.EffectByName = n;
})(); //anonymous var setter

WebTracker.effectParams = [
[], //0
 ['Second Note', 'Third Note'],
 ['new Period'],
 ['new Period'],
 ['Amount/Tick'],
 ['Frequency', 'Amplitude'],
 ['Amount/Tick'], //5
 ['Amount/Tick'],
 ['Frequency', 'Amplitude'],
 ['Reserved Param'],
 ['Bytes'],
 ['Amount/Tick'], //10
 ['Position'],
 ['Volume'],
 ['Row'],
 ['State'], ['Amount'],
 ['Amount'], //15
 ['State'],
 ['Waveform'],
 ['Value'],
 ['Loops'],
 ['Waveform'], //20
 ['Reserved Param'],
 ['Ticks'],
 ['Volume Increment'],
 ['Volume Decrement'],
 ['Ticks'], //25
 ['Delay'],
 ['Rows'],
 ['Speed'],
 ['BPM']
];

WebTracker.EffectWaveforms = ['Sine With Retrigger', 'Saw With Retrigger', 'Square With Retrigger', 'Random With Retrigger', 'Sine', 'Saw', 'Square', 'Random']

WebTracker.signedEffects = [5, 6, 10];

WebTracker.effect = function (e, p1, p2) {
	return {
		effect: e,
		p1: p1,
		p2: p2
	}; //effect
}; //effect factory

WebTracker.note = function (s, n, e) {
	return {
		sample: s,
		note: n,
		effect: e
	}; //note
}; //note factory

WebTracker.effectToString = function (e) {
var qq = e.effect;
	var res = WebTracker.effects[e.effect];
	var p = WebTracker.effectParams[e.effect];
	if (p.length) {
		if (p.length == 2) {
			res += ": " + p[0] + " " + e.p1;
			res += ", " + p[1] + " " + e.p2;
		} else { //if 2 params
			res += ": " + e.p1;
		} //if 1 or 2 params
	} //if any params
	return res;
}; //effectToString

WebTracker.copyNote = (function() {
var note = WebTracker.note,
effect = WebTracker.effect;
return function(n) {
var e = n.effect;
return note(n.sample, n.note, effect(e.effect, e.p1, e.p2));
}; //copyNote
})(); //closure for copyNote
