var WebTracker = WebTracker || {};

WebTracker.Instrument = function () {
	"use strict";
	var samples = [new WebTracker.Sample()], //0 = silence
		noteMap = [0];

	//initialize
	for (var i = 1; i < 128; i++) noteMap[i] = 0; //set all notes to point to silence.

	//public vars
	this.volumeEnvelope = [{x: 0, y: 1}];
	this.panEnvelope = [{x: 0, y: 0}];
	this.volumeSustain = 0;
	this.volumeLoopStart = this.volumeLoopEnd = 0;
	this.volumeEnvelopeEnabled = this.volumeEnvelopeSustained = this.volumeEnvelopeLooped = false;
	this.panSustain = 0;
	this.panLoopStart = this.panLoopEnd = 0;
	this.panEnvelopeEnabled = this.panEnvelopeSustained = this.panEnvelopeLooped = false;
	this.vibratoType = 0;
	this.vibratoSweep = 0;
	this.vibratoDepth = 0;
	this.vibratoRate = 0;
	this.volumeFadeOut = 0;
	this.title = "";
	this.volume = 1;

	this.addSample = function (s) {
		var idx = samples.length;
		samples[idx] = s;
		return idx;
	}; //addSample

	this.setSample = function (s, idx) {
		if (idx < 1) {
			throw {message: "Error: No assignment to sample 0 is permitted."};
		} //if idx = 0
		else {
			samples[idx] = s;
		} //if in bound
	}; //addSample

	this.removeSample = function (idx) {
		if (idx > 0 && idx < samples.length) {
			samples.splice(idx, 1);
			for (var i = 0; i < 128; i++) {
				var n = noteMap[i];
				if (n >= idx) {
					noteMap[i] = n - 1;
				} //if n >= current sample removing, point to prev sample.
			} //for each sample in noteMap
		} //if removed sample in bounds
	}; //removeSample

	this.mapSample = function (s, start, end) {
		start = start || 1;
		end = end || 127;
		s = s || 1;
		var resran = WebTracker.restrictRange;
		start = resran(start, 1, 127);
		end = resran(end, 1, 127);
		s = resran(s, 1, samples.length - 1);
		if (start <= end) {
			for (var i = start; i <= end; i++) {
				noteMap[i] = s;
			}
		} //if start less end
	}; //mapSample

	this.getNoteSample = function (note) {
var m = noteMap[note];
		return samples[m];
	}; //getNoteSample

	this.getSample = function (idx) {
		//make sure we're in bounds
		if (idx < 1 || idx >= samples.length) {
			throw {
				message: "Illegal sample requested: requested " + idx + ", must be between 1 and " + samples.length + "."
			};
		} //if
		return samples[idx];
	}; //getSample

	Object.defineProperty(this, "sampleCount", {
		get: function () {
			return samples.length - 1; //don't count the silence sample
		}
	}); //get property for samples.length: sampleCount

	Object.defineProperty(this, "length", { //total data bytes
		get: function() {
			var len = 0;
			if (samples.length > 1) {
				for (var i = 1; i < samples.length; i++) {
					len = len + samples[i].length;
				} //i
			} //if
			return len;
		}
	}); //length
}; //Instrument