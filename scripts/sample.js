var WebTracker = WebTracker || {};
WebTracker.Sample = function () {
	'use strict';
	this.clean = true; //dirty if waiting for resampler.
	var that = this,
		context = WebTracker.context,
		_title = "Untitled",
		_channels = 0,
		_length = 0,
		_volume = 1,
		_loopStart = 0,
		_loopEnd = 0,
		_sampRate = WebTracker.context.sampleRate,
		_factor = 1,
		_tune = 0,
		_data,

		setFactor = function () {
			_factor = (_sampRate * Math.pow(1.007247, _tune)) / context.sampleRate;
		}, //setFactor

		setupDataVars = function () {
			_length = _data.length;
			_channels = _data.numberOfChannels;
			_sampRate = _data.sampleRate;
			setFactor();
		}; //setupDataVars

	Object.defineProperty(that, "title", {
		get: function () {
			return _title;
		},
		set: function (v) {
			_title = v;
		}
	}); //title property

	Object.defineProperty(that, "volume", {
		get: function () {
			return _volume;
		},
		set: function (value) {
			_volume = WebTracker.restrictRange(value, 0, 1);
		}
	}); //volume property

	Object.defineProperty(that, "length", {
		get: function () {
			return _length;
		}
	}); //length property

	Object.defineProperty(that, "loopStart", {
		get: function () {
			return _loopStart;
		},
		set: function (value) {
			_loopStart = WebTracker.restrictRange(value, 0, _length);
		}
	}); //loopStart property

	Object.defineProperty(that, "loopEnd", {
		get: function () {
			return _loopEnd;
		},
		set: function (value) {
			_loopEnd = WebTracker.restrictRange(value, 0, _length);
		}
	}); //loopEnd property

	Object.defineProperty(that, "tune", {
		get: function () {
			return _tune;
		},
		set: function (value) {
			_tune = WebTracker.restrictRange(value, -8, 7);
			setFactor();
		}
	}); //tune property

	Object.defineProperty(that, "factor", {
		get: function () {
			return _factor;
		}
	}); //factor property

	Object.defineProperty(that, "endLoopTime", {
		get: function () {
			if (_loopEnd < 2) {
				return 0;
			} else {
				return _loopEnd / context.sampleRate;
			}
		}
	}); //endLoopTime property

	Object.defineProperty(that, "startLoopTime", {
		get: function () {
			if (_loopStart < 2) {
				return 0;
			} else {
				return _loopStart / context.sampleRate;
			}
		}
	}); //loopStartTime property

	Object.defineProperty(that, "loopLength", {
		get: function () {
			return _loopEnd - _loopStart;
		}
	}); //loopLength property

	Object.defineProperty(that, "data", {
		get: function () {
			return _data;
		},
		set: function (value) {
			_data = value;
			setupDataVars();
		}
	}); //data property

	Object.defineProperty(that, "sampleRate", {
		get: function () {
			return _sampRate;
		},
		set: function (value) {
			_sampRate = value;
			setFactor();
		}
	}); //sampleRate property

	Object.defineProperty(that, "channels", {
		get: function () {
			return _channels;
		}
	}); //channels property

	this.data = context.createBuffer(1, 1, WebTracker.context.sampleRate);
	this.data.getChannelData(0)[0] = 0;

}; //Sample

WebTracker.Sample.prototype.resample = function (newRate) {
	if (newRate !== this.sampleRate) {
		that.clean = false;
		WebTracker.resample(this.data, this.sampleRate, newRate, function (d) {
			this.data = d;
			this.sampleRate = newRate; //we resampled it, set it up right.
			this.clean = true;
		}); //resample
	} //if different;
}; //resample

WebTracker.Sample.prototype.toMono = function () {
	if (this.data.numberOfChannels > 1) {
		var buffer = this.data,
			l = buffer.length,
			c = buffer.numberOfChannels,
			d,
			chanData = [];
		this.data = WebTracker.context.createBuffer(1, l, buffer.sampleRate);
		d = this.data.getChannelData(0);
		for (var i = 0; i < c; i++) {
			chanData[i] = buffer.getChannelData(i);
		} //get each channel
		for (var i = 0; i < l; i++) {
			var avg = 0;
			for (var j = 0; j < c; j++) {
				avg += chanData[j][i]; //add the channels together
			} //j
			d[i] = avg / c;
		} //i
	} //if
}; //toMono

WebTracker.Sample.prototype.eightBitify = function () {
	var round = Math.round;
	for (var i = 0; i < this.channels; i++) {
		var b = this.data.getChannelData(i),
			l = b.length;
		for (var j = 0; j < l; j++) {
			b[j] = round(b[j] * 127) / 127; //allowed samples are from -128 to 127, round each sample to this constraint.
		} //j
	} //i
}; //eightBitify

WebTracker.samplePointer = function (h, d) {
	return {
		headerOffset: h,
		dataOffset: d
	}; //pointer
}; //samplePointer