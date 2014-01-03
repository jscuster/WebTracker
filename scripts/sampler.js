var WebTracker = WebTracker || {};
WebTracker.Sampler = function (samples, destination) {
var context = WebTracker.context;
	destination = destination || context.destination;
		var lastSample = -1,
smp,
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

			smp = samples[s],
			rate = smp.factor * Math.pow(1.0595, note-60),
			buffer = smp.data;
			if (buffer) {
				node = context.createBufferSource();
				node.buffer = buffer;
				//volume
				this.setVolume(smp.volume);
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

this.setVolume = function (volume, when) {
	gain.gain.setValueAtTime(volume, when);
}; //setVolume

this.slideVolume = function(delta, endTime) {
var tmp = gain.gain.value + delta;
if (tmp > 1) tmp = 1;
if (tmp < 0) tmp = 0;
gain.gain.linearRampToValueAtTime(tmp, endTime);
}; //slideVolume

this.setNote = function(n, endTime) {
var rate = smp.factor * Math.pow(1.0595, n-60);
node.playbackRate.setValueAtTime(rate, endTime);
}; //slideNote
}; //SamplePlayer