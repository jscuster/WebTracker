var WebTracker = WebTracker || {};

WebTracker.Song = function () {
'use strict';
this.maxInstruments = this.maxTitleLength = this.maxChannels = this.maxPatterns = -1;
this.minInstruments = this.maxSlots = -1;

	this.fillSamples = function () {
		if (_samples.length < obj.minSamples) {
			for (var i = _samples.length; i < obj.minSamples; i++) {
				_samples[i] = obj.sampleGenerator();
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
			for (var j = 0; empty && j < obj.rowsPerPattern; j++) {
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
		if (_patternCount < obj.maxPatterns) {
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

WebTracker.Song.init = function(obj) {
'use strict';
	var _title = "Untitled",
		_samples = [],
		_patterns = [],
		_channels = 1,
		_patternOrder = [],
		_patternCount = 0,
		_slots = 0; //size of patternOrder

	Object.defineProperty(obj, "title", {
		get: function () {
			return _title;
		},
		set: function (v) {
			if (obj.maxTitleLength > 0) {
				v = v.slice(0, obj.maxTitleLength);
			}
			_title = v;
		}
	}); //title property

	Object.defineProperty(obj, "channels", {
		get: function () {
			return _channels;
		},
		set: function (v) {
			_channels = WebTracker.restrictRange(v, 0, obj.maxChannels);
		}
	}); //channels property

	Object.defineProperty(obj, "patterns", {
		get: function () {
			return _patterns;
		},
		set: function (v) {
			_patterns = v;
		}
	}); //patterns property

	Object.defineProperty(obj, "slots", {
		get: function () {
			return _slots;
		},
		set: function (v) {
			_slots = WebTracker.restrictRange(v, 0, obj.maxSlots);
		}
	}); //slots property

	Object.defineProperty(obj, "patternOrder", {
		get: function () {
			return _patternOrder;
		},
		set: function (v) {
			_patternOrder = v;
		}
	}); //patternOrder property

	Object.defineProperty(obj, "samples", {
		get: function () {
			return _samples;
		},
		set: function (v) {
			_samples = v;
			if (v.length < obj.minSamples) {
				this.fillSamples();
			} //if
		}
	}); //samples property


}; //Song.init