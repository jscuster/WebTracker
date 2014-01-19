var WebTracker = WebTracker || {};
WebTracker.Sample = function () {
'use strict';
	this.maxTitleLength = -1;
this.maxSampleLength = -1;
this.clean = true; //dirty if waiting for resampler.
this.requiredSampleRae = -1; //no requirement

	this.toMono = function () {
if (this.channels > 1) {
		var buffer = this.data,
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
			this.data = mono;
		} //if
} //if not mono already
	}; //toMono

}; //Sample

WebTracker.Sample.init = function(obj) {
	'use strict';
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
		_monoOnly = false,

		setFactor = function () {
			_factor = (_sampRate * Math.pow(1.007247, _tune)) / context.sampleRate;
		}, //setFactor

	setupDataVars = function() {
		_length = _data.length;
		_channels = _data.numberOfChannels;
		_sampRate = _data.sampleRate;
		setFactor();
	}, //setupDataVars

resample = function() {
alert("resampling: rate = " + obj.requiredSampleRate);
if (obj.requiredSampleRate > 0 && obj.requiredSampleRate !== _data.sampleRate) {
obj.clean = false;
alert("no match.");
WebTracker.resample(_data, _data.sampleRate, obj.requiredSampleRate, function(d) {
alert("in callback. old length: " + _data.length + ", new length: " + d.length);
_data = d;
setupDataVars();
obj.sampleRate = obj.requiredSampleRate; //we resampled it, set it up right.
obj.clean = true;
}); //resample
} //if different;
}; //resample

	Object.defineProperty(obj, "monoOnly", {
		get: function () {
			return _monoOnly;
		},
set: function(v) {
_monoOnly = v;
if (v) {
obj.toMono();
} //if
} //set
	}); //monoOnly property

	Object.defineProperty(obj, "title", {
		get: function() {
			return _title;
		},
		set: function(v) {
			if (obj.maxTitleLength > 0) {
				v = v.slice(0, obj.maxTitleLength);
			} //if
			_title = v;
		}
	}); //title property

	Object.defineProperty(obj, "volume", {
		get: function () {
			return _volume;
		},
		set: function (value) {
			_volume = WebTracker.restrictRange(value, 0, 1);
		}
	}); //volume property

	Object.defineProperty(obj, "length", {
		get: function () {
			return _length;
		}
	}); //length property

	Object.defineProperty(obj, "loopStart", {
		get: function () {
			return _loopStart;
		},
		set: function (value) {
			_loopStart = WebTracker.restrictRange(value, 0, _length);
		}
	}); //loopStart property

	Object.defineProperty(obj, "loopEnd", {
		get: function () {
			return _loopEnd;
		},
		set: function (value) {
			_loopEnd = WebTracker.restrictRange(value, 0, _length);
		}
	}); //loopEnd property

	Object.defineProperty(obj, "tune", {
		get: function () {
			return _tune;
		},
		set: function (value) {
			_tune = WebTracker.restrictRange(value, -8, 7);
setFactor();
		}
	}); //tune property

	Object.defineProperty(obj, "factor", {
		get: function () {
			return _factor;
		}
	}); //factor property

	Object.defineProperty(obj, "endLoopTime", {
		get: function () {
			if (_loopEnd < 2) {
				return 0;
			} else {
				return _loopEnd / context.sampleRate;
			}
		}
	}); //endLoopTime property

	Object.defineProperty(obj, "startLoopTime", {
		get: function () {
			if (_loopStart < 2) {
				return 0;
			} else {
				return _loopStart / context.sampleRate;
			}
		}
	}); //loopStartTime property

Object.defineProperty(obj, "loopLength", {
get: function() {
return _loopEnd-_loopStart;
}
}); //loopLength property

	Object.defineProperty(obj, "data", {
		get: function () {
			return _data;
		},
		set: function (value) {
			_data = value;
			if (this.monoOnly && value.numberOfChannels > 1) {
				obj.toMono();
			}
			setupDataVars();
			resample(); //only resamples if diferent.
		}
	}); //data property

	Object.defineProperty(obj, "rawData", {
		set: function (value) {
			_data = value;
			setupDataVars();
		}
	}); //data property

	Object.defineProperty(obj, "sampleRate", {
		get: function () {
			return _sampRate;
		},
		set: function (value) {
			_sampRate = value;
			setFactor();
		}
	}); //sampleRate property

	Object.defineProperty(obj, "channels", {
		get: function () {
			return _channels;
		}
	}); //channels property

	obj.rawData = context.createBuffer(1, 1, WebTracker.context.sampleRate);
obj.data.getChannelData(0)[0] = 0;
} //init

WebTracker.samplePointer = function(h, d) {
return {
headerOffset: h,
dataOffset: d
}; //pointer
}; //samplePointer
