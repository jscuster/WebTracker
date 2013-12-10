var WebTracker = WebTracker || {};
WebTracker.Sampler = function (samples, context, destination) {
	WebTracker.logger.log("creating sampler");
	destination = destination || context.destination;
	var buffers = [],
		lastSample = -1,
		node, gain = context.createGain(),
		panner = context.createPanner();
	gain.connect(destination);
	panner.connect(gain);
	destination = panner;
	for (var i = 0; i < 31; i++) {
		buffers[i] = samples[i].data;
	} //i

	this.play = function (s, note, when) {
		WebTracker.logger.log("Playing sample " + s + ", note: " + note + ", time: " + when);
		if (note >= 0) {
			when = when || 0;
			this.stop(when - 0.0001);
			if (buffers[s]) {
				node = context.createBufferSource();
				node.buffer = buffers[s];
				var smp = samples[s];
				//volume
				if (s !== lastSample) {
					lastSample = s;
					this.setVolume(smp.volume);
				} //if different sample
				//loop
				if (smp.loopLength > 2) {
				node.loop = true;
				node.loopStart = smp.loopTimeStart;
				node.loopEnd = smp.loopTimeEnd;
			} //if
			node.connect(destination);
			if (note > 0 && note < 1) {
				node.playbackRate.value = note;
			} else {
				node.playbackRate.value = smp.factor * Math.pow(1.0595, note);
			} //if
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
	WebTracker.logger.log("setting volume to " + volume);
}; //setVolume
}; //SamplePlayer