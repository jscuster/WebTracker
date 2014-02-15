var WebTracker = WebTracker || {};

WebTracker.Sampler = function (instruments, destination) {
"use strict";
	var context = WebTracker.context,
		lastInstrument = -1,
		iptr,
		lastMappedSample,
		node,
		gain = context.createGain(),
		panner = context.createPanner(),
		tremoloOn = false,
		tremoloOsc,
		vibratoOn = false,
		vibratoOsc,

		Modulator = function (freq, amp) {
			var depth = context.createGain(),
				lfo = context.createOscillator();
			lfo.connect(depth);
			lfo.frequency.value = freq;
			depth.gain.value = amp;
			this.start = function (when) {
				lfo.start(when);
			}; //start

			this.stop = function (when) {
				lfo.stop(when);
			}; //stop

			this.connect = function (c) {
				depth.connect(c);
			}; //conect

			Object.defineProperty(this, "type", {
				set: function (t) {
					lfo.type = t;
				},
				get: function () {
					return lfo.type;
				}
			}); //type
		}, //Modulator

		hackedVibrato = function (modulator) { //if can't connect osc to playbackRate, use setCurveAtTime.
			var proc = context.createScriptProcessor(4096, 1, 1),
				durration = proc.bufferSize / context.sampleRate,
				n = node;
			modulator.connect(proc);
			proc.connect(context.destination); //will always be 0, but need to connect to work.
			proc.onaudioprocess = function (e) {
				n.playbackRate.setcurveAtTime(e.inputBuffer.getChannelData(0), e.playbackTime, durration);
			}; //onaudioprocess
		}; //hackedVibrato

	destination = destination || context.destination;
	gain.connect(destination);
	panner.connect(gain);
	panner.panningModel = "equalpower";
	panner.distanceModel =  "linear"
	destination = panner;

	this.play = function (ins, note, when) {
		if (note != 0) {
			when = when || 0;
			this.stop(when - 0.0001);
			iptr = ins;
			ins = instruments[ins];
			var smp = ins.getNoteSample(note),
				rate = smp.factor * Math.pow(1.0595, note - 60),
				buffer = smp.data;
			lastMappedSample = smp;
			if (buffer) {
				node = context.createBufferSource();
				node.buffer = buffer;
				//volume
				this.setVolume(ins.volume, when);
				if (iptr !== lastInstrument) {
					lastInstrument = iptr;
				} //if different sample
				//loop
				if (smp.loopLength > 2) {
					node.loop = true;
					node.loopStart = smp.startLoopTime;
					node.loopEnd = smp.endLoopTime;
				} //if
				node.connect(destination);
				node.playbackRate.value = rate;
				node.start(when);
			} //if valid buffer
		} //if valid note
	} //play func

	this.stop = function (when) {
		if (node) {
			when = when || 0;
			node.stop(when);
			node = undefined; //if it's stopping, we're done with it.
			this.stopVibrato(when);
			this.stopTremolo(when);
		} //if
	}; //stop

	this.setPan = (function() {
		var abs = Math.abs;
		return function (x) {
			panner.setPosition(x, 0, 1 - abs(x));
		}; //setPan
	})(); //setPan closure saving abs
	this.setVolume = function (volume, when) {
		gain.gain.setValueAtTime(volume, when);
	}; //setVolume

	this.slideVolume = function (newVolume, endTime) {
		gain.gain.linearRampToValueAtTime(newVolume, endTime);
	}; //slideVolume

	this.setNote = function (s, n, when) {
		if (s === iptr) {
			var rate = lastMappedSample.factor * Math.pow(1.0595, n - 60);
			node.playbackRate.setValueAtTime(rate, when);
		} else {
			this.play(s, n, when);
		} //if not already playing, start it fresh.
	}; //setNote

	this.vibratoType = this.tremoloType = "sine";

	this.vibrato = function (freq, amp, when) {
		this.stopVibrato(when);
		vibratoOsc = new Modulator(freq, amp);
		//there's a bug in most browsers, this doesn't work.
		vibratoOsc.connect(node.playbackRate);
		//hackedVibrato(vibratoOsc); //use scriptProcessor instead.
		vibratoOn = true;
		vibratoOsc.type = this.vibratoType;
		vibratoOsc.start(when);
	} //vibrato

	this.stopVibrato = function (when) {
		if (vibratoOn) {
			vibratoOsc.stop(when);
			vibratoOsc = undefined;
			vibratoOn = false;
		} //vibratoOn
	}; //stopVibrato

	this.tremolo = function (freq, amp, when) {
		this.stopTremolo(when);
		tremoloOsc = new Modulator(freq, amp);
		tremoloOsc.connect(gain.gain);
		tremoloOn = true;
		tremoloOsc.type = tremoloType;
		tremoloOsc.start(when);
	} //tremolo

	this.stopTremolo = function (when) {
		if (tremoloOn) {
			tremoloOsc.stop(when);
			tremoloOsc = undefined;
			tremoloOn = false;
		} //if tremolo
	}; //stopTremolo

}; //SamplePlayer