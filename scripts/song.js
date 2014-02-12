
var WebTracker = WebTracker || {};

WebTracker.Song = function () {
	'use strict';
	var _title = "Untitled",
		_samples = [new WebTracker.Sample()],
		_patterns = [],
		_channels = 4,
		_patternOrder = [],
		_bpm = 120;

	this.rowsPerBeat = 4;
	this.defaultRowsPerPattern = 64;
	this.restartPosition = 0;

	this.findEmptyPatterns = function () {
		var p = this.patterns,
			res = [],
			ctr = 0,
			empty = true,
			c = this.channels;
		for (var i = 0; i < p.length; i++) {
			empty = true;
			for (var j = 0; empty && j < p[i].length; j++) {
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
		rows = rows || this.defaultRowsPerPattern;
		var p = [];
		for (var i = 0; i < rows; i++) {
			p[i] = [];
			for (var j = 0; j < this.channels; j++) {
				p[i][j] = WebTracker.note(0, 0, WebTracker.effect(0, 0, 0));
			} //j
		} //i
		this.patterns.push(p);
		this.patternOrder.push(this.patternCount - 1);
	}; //createPattern

	this.removePattern = function (x) {
		if (x < this.patternCount) {
			this.patterns.splice(x, 1);
			var o = this.patternOrder;
			for (var i = 0; i < this.slots; i++) {
				if (o[i] > x) {
					o[i]--;
				} else if (o[i] === x) {
					o[i] = -1;
				} //if
			} //i
			var del;
			while ((del = o.indexOf(-1)) >= 0) {
				o.splice(del, 1);
			} //while
		} else { //doesn't exist
			throw {
				message: "Pattern doesn't exist, should be between 0 and " + this.patternCount + "."
			};
		} //else
	}; //removePattern

	this.swapPatterns = function (x, y) {
		if (x < this.patternCount && y < this.patternCount) {
			var tmp, p = this.patterns,
				o = this.patternOrder;
			tmp = p[x];
			p[x] = p[y];
			p[y] = tmp;
			for (var i = 0; i < o.length; i++) {
				if (o[i] === x) {
					o[i] = y;
				} else if (o[i] === y) {
					o[i] = x;
				} //if match, swap in pattern order.
			} //i
		} //if in bounds
	}; //swapPatterns

	this.movePatternUp = function (x) {
		if (x > 0 && x < this.patternCount) {
			this.swapPatterns(x, x - 1);
		} //if
	}; //movePatternUp

	this.movePatternDown = function (x) {
		if (x > 0 && x < this.patternCount - 1) {
			this.swapPatterns(x, x + 1);
		} //if
	}; //movePatternDown

	this.getNotesAtPoints = function (pat, points) {
		var p = this.patterns[pat],
			copyNote = WebTracker.copyNote,
			res = [];
		for (var i = 0; i < points.length; i++) {
			var pt = points[i];
			res.push({
				x: pt.x,
				y: pt.y,
				note: p[pt.y][pt.x]
			});
		} //for each point
		return res;
	}; // getNotesAtPoints

	this.putNotesAtPoints = function (pat, xoff, yoff, notes) {
		var p = this.patterns[pat],
			copyNote = WebTracker.copyNote,
			res = [],
			x,
			y;
		for (var i = 0; i < notes.length; i++) {
			x = +notes[i].x + xoff;
			y = +notes[i].y + yoff;
			res[i] = copyNote(p[y][x]);
			p[y][x] = copyNote(notes[i].note);
		} //i
		return res; //get back the old notes.
	}; //putNotesInRect

	this.transposeNotes = function (notes, transpose) {
		var res = [],
			copyNote = WebTracker.copyNote;
		for (var i = 0; i < notes.length; i++) {
			res[i] = copyNote(notes[i].note);
			notes[i].note.note += transpose;
		} //i
		return res;
	}; //transposeNotes

	this.clearNote = function (pat, row, chan) {
		var n = this.patterns[pat][ros][chan];
		this.patterns[pat][row][chan] = WebTracker.note(0, 0, WebTracker.effect(0, 0, 0));
		return n;
	}; //clearNote


	Object.defineProperty(this, "title", {
		get: function () {
			return _title;
		},
		set: function (v) {
			_title = v;
		}
	}); //title property

	Object.defineProperty(this, "channels", {
		get: function () {
			return _channels;
		},
		set: function (v) {
			_channels = v;
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
			return _patternOrder.length;
		}
	}); //slots property

	Object.defineProperty(this, "patternCount", {
		get: function () {
			return _patterns.length;
		}
	}); //patternCount property

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
		}
	}); //samples property

	Object.defineProperty(this, 'bpm', {
		get: function () {
			return _bpm;
		},
		set: function (v) {
			_bpm = v;
		} //set
	}); //bpm property

}; //Song