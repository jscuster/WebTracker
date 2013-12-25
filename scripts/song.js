
var WebTracker = WebTracker || {};

WebTracker.Song = function (params) {
	params.maxTitleLength = params.maxTitleLength || -1;
	params.maxSamples = params.maxSamples || -1;
	params.minSamples = params.minSamples || -1;
	params.maxPatterns = params.maxPatterns || -1;
	params.maxSlots = params.maxPlayOrder || -1;
	params.maxChannels = params.maxChannels || -1;
	var _title = "Untitled",
		_samples = [],
		_patterns = [],
		_channels = 1,
		_patternOrder = [],
		_patternCount = 0,
		_slots = 0; //size of patternOrder

	Object.defineProperty(this, "title", {
		get: function () {
			return _title;
		},
		set: function (v) {
			if (params.maxTitleLength > 0) {
				v = v.slice(0, params.maxTitleLength);
			}
			_title = v;
		}
	}); //title property

	Object.defineProperty(this, "channels", {
		get: function () {
			return _channels;
		},
		set: function (v) {
			_channels = WebTracker.restrictRange(v, 0, params.maxChannels);
		}
	}); //channels property

	Object.defineProperty(this, "patterns", {
		get: function () {
			return _patterns;
		},
		set: function (v) {
			_patterns = v;
		}
	}); //patterns property

	Object.defineProperty(this, "slots", {
		get: function () {
			return _slots;
		},
		set: function (v) {
			_slots = WebTracker.restrictRange(v, 0, params.maxSlots);
		}
	}); //slots property

	Object.defineProperty(this, "patternOrder", {
		get: function () {
			return _patternOrder;
		},
		set: function (v) {
			_patternOrder = v;
		}
	}); //patternOrder property

	Object.defineProperty(this, "samples", {
		get: function () {
			return _samples;
		},
		set: function (v) {
			_samples = v;
			if (v.length < params.minSamples) {
				this.fillSamples();
			} //if
		}
	}); //samples property

	Object.defineProperty(this, "maxTitleLength", {
		get: function () {
			return params.maxTitleLength;
		}
	}); //maxTitleLength property

	Object.defineProperty(this, "maxSamples", {
		get: function () {
			return params.maxSamples;
		}
	}); //maxSamples property

	Object.defineProperty(this, "maxChannels", {
		get: function () {
			return params.maxChannels;
		}
	}); //maxChannels property

	Object.defineProperty(this, "rowsPerPattern", {
		get: function () {
			return params.rowsPerPattern;
		}
	}); //rowsPerPattern property

	Object.defineProperty(this, "maxSlots", {
		get: function () {
			return params.maxSlots;
		}
	}); //maxSlots property

	Object.defineProperty(this, "maxPatterns", {
		get: function () {
			return params.maxPatterns;
		}
	}); // property

	Object.defineProperty(this, "minSamples", {
		get: function () {
			return params.minSamples;
		}
	}); //minSamples property

	this.fillSamples = function () {
		if (_samples.length < params.minSamples) {
			for (var i = _samples.length; i < params.minSamples; i++) {
				_samples[i] = params.sampleGenerator();
			} //i
		} //if
	}; //fillSamples

	this.findEmptyPatterns = function () {
		var p = _patterns,
			res = [],
			ctr = 0,
			empty = true,
			c = _channels;
		for (var i = 0; i < p.length; i++) {
			empty = true;
			for (var j = 0; empty && j < params.rowsPerPattern; j++) {
				for (var k = 0; empty && k < c; k++) {
					var n = p[i][j][k];
					empty = (n.effect === 0 && n.sample === 0 && n.period === 0 && n.param === 0);
				} //k
			} //j
			if (empty) {
				res.push(i);
			} //if
		} //i
		return res;
	}; //findEmptyPatterns

	this.createPattern = function (rows) {
		if (_patternCount < params.maxPatterns) {
			rows = rows || 0;
			var p = [];
			for (var i = 0; i < rows; i++) {
				p[i] = [];
			} //i
			_patterns.push(p);
			_patternCount += 1;
			return true;
		} else { //can't have more than 127 patterns.
			return false;
		} //if
	}; //createPattern

	this.removePattern = function (x) {
		if (x < _patternCount) {
			this.patterns.splice(x, 1);
			var o = _patternOrder;
			for (var i = 0; i < _totalPatterns; i++) {
				if (o[i] > x) {
					o[i]--;
				} else if (o[i] === x) {
					o[i] = -1;
				} //if
			} //i
			var del;
			while ((del = o.indexOf(-1)) >= 0) {
				o.splice(del, 1);
				_totalPatterns--;
			} //while
			_patternCount--;
		} else { //doesn't exist
			throw {
				message: "Pattern doesn't exist, should be between 0 and " + _patternCount + "."
			};
		} //else
	}; //removePattern

	this.swapPatterns = function (x, y) {
		if (x < _patternCount && y < _patternCount) {
			var tmp, p = _patterns,
				o = _patternOrder;
			tmp = p[x];
			p[x] = p[y];
			p[y] = tmp;
			for (var i = 0; i < _totalPatterns; i++) {
				if (o[i] === x) {
					o[i] = y;
				} else if (o[i] === y) {
					o[i] = x;
				} //if match, swap in pattern order.
			} //i
		} //if in bounds
	}; //swapPatterns

	this.movePatternUp = function (x) {
		if (x > 0 && x < _patternCount) {
			this.swapPatterns(x, x - 1);
		} //if
	}; //movePatternUp

	this.movePatternDown = function (x) {
		if (x > 0 && x < _patternCount - 1) {
			this.swapPatterns(x, x + 1);
		} //if
	}; //movePatternDown

}; //Song