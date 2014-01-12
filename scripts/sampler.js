var WebTracker = WebTracker || {};
WebTracker.Sampler = function (samples, destination) {
var context = WebTracker.context;
	destination = destination || context.destination;
		var lastSample = -1,
sptr,
		node,
gain = context.createGain(),
		panner = context.createPanner();
	gain.connect(destination);
	panner.connect(gain);
	destination = panner;

	this.play = function (s, note, when) {
		if (note != 0) {
			when = when || 0;
			this.stop(when - 0.0001);
sptr = s;
			var smp = samples[s],
			rate = smp.factor * Math.pow(1.0595, note-60),
			buffer = smp.data;
			if (buffer) {
				node = context.createBufferSource();
				node.buffer = buffer;
				//volume
				this.setVolume(smp.volume, when);
				if (s !== lastSample) {
					lastSample = s;
				} //if different sample
				//loop
				if (smp.loopLength > 2) {
				node.loop = true;
				node.loopStart = smp.startLoopTime;
				node.loopEnd = smp.endLoopTime;
			} //if
			node.connect(destination);
				node.playbackRate.value = rate;
			WebTracker.logger.log("setting playback rate: " + node.playbackRate);
			node.start(when);
		} //if valid buffer
	} //if valid note
} //play func

this.stop = function (when) {
	WebTracker.logger.log("stopping at time " + when);
	if (node) {
		when = when || 0;
		node.stop(when);
	} //if
}; //stop

this.setPan = function (x, y, z) {
	WebTracker.logger.log("setting pan to: x = " + x + ", y = " + y + ", z = " + z);
	panner.setPosition(x, y, z);
}; //setPan

this .setVolume = function (volume, when) {
	gain.gain.setValueAtTime(volume, when);
//alert("setting to " + volume);
}; //setVolume

this.slideVolume = function(newVolume, endTime) {
gain.gain.linearRampToValueAtTime(newVolume, endTime);
}; //slideVolume

this.setNote = function(s, n, when) {
if (s === sptr) {
var rate = samples[s].factor * Math.pow(1.0595, n-60);
node.playbackRate.setValueAtTime(rate, when);
} else {
this.play(s, n, when);
} //if not already playing, start it fresh.
}; //setNote

this.changeVolume = function(x, t) {
var v = gain.gain.value;
v += x;
WebTracker.restrictRange(v, 0, 1);
gain.gain.setValueAtTime(v, t);
}; //changeVolume
}; //SamplePlayer