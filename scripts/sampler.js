var WebTracker = WebTracker || {};
WebTracker.Sampler = function (samples, destination) {
var context = WebTracker.context;
	destination = destination || context.destination;
		var lastSample = -1,
		node, gain = context.createGain(),
		panner = context.createPanner();
	gain.connect(destination);
	panner.connect(gain);
	destination = panner;

	this.play = function (s, note, when) {
		if (note >= 0) {
			when = when || 0;
			this.stop(when - 0.0001);
				var smp = samples[s],
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
				node.loopStart = smp.loopTimeStart;
				node.loopEnd = smp.loopTimeEnd;
			} //if
			node.connect(destination);
				node.playbackRate.value = note;
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
volume = volume <= 0 ? 0 : (volume / 64);
	gain.gain.setValueAtTime(volume, when);
}; //setVolume

this.slideVolume = function(delta, endTime) {
var tmp = (gain.gain.value * 64) + delta;
if (tmp > 64) tmp = 64;
if (tmp < 0) tmp = 0;
gain.gain.linearRampToValueAtTime(tmp/64, endTime);
}; //slideVolume
}; //SamplePlayer