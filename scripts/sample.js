var WebTracker = WebTracker || {};
WebTracker.Sample = function (params) {
	'use strict';
	params.monoOnly = params.monoOnly || false;
	params.maxSampleLength = params.maxSampleLength || -1;
	params.maxTitleLength = params.maxTitleLength || -1;
	var context = WebTracker.context,
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
		}; //setFactor

	Object.defineProperty(this, "monoOnly", {
		get: function () {
			return params.monoOnly;
		}
	}); //monoOnly property

	Object.defineProperty(this, "maxSampleLength", {
		get: function () {
			return params.maxSampleLength;
		}
	}); //maxSampleLength property

	Object.defineProperty(this, "maxTitleLength", {
		get: function () {
			return params.maxTitleLength;
		}
	}); //maxTitleLength property

	Object.defineProperty(this, "title", {
		get: function() {
			return _title;
		},
		set: function(v) {
			if (params.maxTitleLength > 0) {
				v = v.slice(0, params.maxTitleLength);
			} //if
			_title = v;
		}
	}); //title property

	Object.defineProperty(this, "volume", {
		get: function () {
			return _volume;
		},
		set: function (value) {
			_volume = WebTracker.restrictRange(value, 0, 1);
		}
	}); //volume property

	Object.defineProperty(this, "length", {
		get: function () {
			return _length;
		}
	}); //length property

	Object.defineProperty(this, "loopStart", {
		get: function () {
			return _loopStart;
		},
		set: function (value) {
			_loopStart = WebTracker.restrictRange(value, 0, _length);
		}
	}); //loopStart property

	Object.defineProperty(this, "loopEnd", {
		get: function () {
			return _loopEnd;
		},
		set: function (value) {
			_loopEnd = WebTracker.restrictRange(value, 0, _length);
		}
	}); //loopEnd property

	Object.defineProperty(this, "tune", {
		get: function () {
			return _tune;
		},
		set: function (value) {
			_tune = WebTracker.restrictRange(value, -8, 7);
		}
	}); //tune property

	Object.defineProperty(this, "factor", {
		get: function () {
			return _factor;
		}
	}); //factor property

	Object.defineProperty(this, "endLoopTime", {
		get: function () {
			return _loopEnd / context.sampleRate;
		}
	}); //endLoopTime property

	Object.defineProperty(this, "startLoopTime", {
		get: function () {
			return _loopStart / context.sampleRate;
		}
	}); //loopStartTime property

	this.toMono = function () {
		var buffer = _data,
			l = buffer.length,
			c = buffer.numberOfChannels,
			data = [];
		if (c > 1) {
			for (var i = 0; i < c; i++) {
				data[i] = buffer.getChannelData(i);
			} //get each channel
			mono = context.createBuffer(1, l, buffer.sampleRate),
			chan = mono.getChannelData(0);
			for (var i = 0; i < l; i++) {
				var avg = 0;
				for (var j = 0; j < c; j++) {
					avg += data[j][i]; //add the channels together
				} //j
				chan[i] = avg / c;
			} //i
			_data = mono;
			_channels = 1;
		} //if
	}; //toMono

Object.defineProperty(this, "loopLength", {
get: function() {
return _loopEnd-_loopStart;
}
}); //loopLength property

	Object.defineProperty(this, "data", {
		get: function () {
			return _data;
		},
		set: function (value) {
			_data = value;
			_length = value.length;
			_channels = value.numberOfChannels;
			_sampRate = value.sampleRate;
			if (params.monoOnly && value.numberOfChannels > 1) {
				this.toMono();
			}
			setFactor();
		}
	}); //data property

	Object.defineProperty(this, "sampleRate", {
		get: function () {
			return _sampRate;
		},
		set: function (value) {
			_sampRate = value;
			setFactor();
		}
	}); //sampleRate property

	Object.defineProperty(this, "channels", {
		get: function () {
			return _channels;
		}
	}); //channels property

	this.data = context.createBuffer(1, 1, WebTracker.context.sampleRate);
this.data.getChannelData(0)[0] = 0;

}; //Sample