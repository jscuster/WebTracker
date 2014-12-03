var WebTracker = WebTracker || {};
WebTracker.SamplePlayer = function (instruments, destination, container, keyboardContainer) {
	"use strict";
	//allows the player to select and play an instrument.
	if (!container) { //must know where to generate html and which controls to listen to.
		throw {
			message: "Error: A valid id must be passed so controls can be placed."
		};
	} //if bad container

	var iptr = 0, //points to the currently playing instrument
		that = this,
		keys = "zsxdcvgbhnjmq2w3er5t6y7ui9o0p".toUpperCase(),
		octave = 5,
		transpose = 0,
		downKey = -1, //keys currently down. Must keep track so the key is not retriggerd when held.
		_noteCallback,
		_instrumentCallback,
		player = new WebTracker.Sampler(instruments, destination), //only use of destination param
		nextInsId = container + "NextInstrumnt",
		prevInsId = container + "PrevInstrument",
		insNameId = container + "InstrumentName",
		prevOctId = container + "PrevOctave",
		nextOctId = container + "NextOctave",
		octNameId = container + "OctaveName",
		transUpId = container + "TransposeUp",
		transDownId = container + "TransposeDown",
		transNameId = container + "TransposeName",
		keyboardClass = container + "Keyboard",
		makeKeyTextBox = keyboardContainer && keyboardContainer.length > 0,

		keyToNote = function (key) {
			var k = keys.indexOf(key);
			if (k >= 0) {
				k += (12 * octave) + transpose;
			}
			return k; //-1 = bad key
		}, //keyToNote returns midi note from key and octave.

		keyDown = function (e) {
			if (that.active) {
				if (!e.ctrlKey) {
					if (downKey !== e.which) {
						downKey = e.which;
						switch (e.which) {
						case 187: // =
							that.nextInstrument();
							return false;
							break;
						case 189: // -
							that.prevInstrument();
							return false;
							break;
						case 219: // [
							that.prevOctave();
							return false;
							break;
						case 221: // ]
							that.nextOctave();
							return false;
							break;
						case 186: // ;
							that.transposeDown();
							return false;
							break;
						case 222: // '
							that.transposeUp();
							return false;
							break;
						default:
							var i = keyToNote(String.fromCharCode(e.which));
							if (i >= 0) {
								player.play(iptr, i);
								if (_noteCallback) _noteCallback(iptr, i);
								return false;
							} //note finding
						} //switch
					} //if key not pressed
				} //if ctrl not pushed
			} //if active
		}, //keyDown

		keyUp = function (e) {
			if (that.active) {
				var i = keyToNote(String.fromCharCode(e.which));
				if (e.which === downKey) {
					downKey = -1;
					if (i >= 0) {
						player.stop();
						return false;
					} //if matching note
				} //if the key had been pressed
			} //if active
		}, //keyUp

		generateHtml = function () {
			var res = '<table><tr>';
			res += '<td><button id="' + nextInsId + '">Next Instrument</button></td>';
			res += '<td><button id="' + nextOctId + '">+ 1</button></td>';
			res += '<td><button id="' + transUpId + '">+ 1</button></td>';
			res += '</tr><tr>';
			res += '<td id="' + insNameId + '"></td>';
			res += '<td id="' + octNameId + '"></td>';
			res += '<td id="' + transNameId + '"></td>';
			res += '<td id="' + insNameId + '"></td>';
			res += '</tr><tr>';
			res += '<td><button id="' + prevInsId + '">Previous Instrument</button></td>';
			res += '<td><button id="' + prevOctId + '">- 1</button></td>';
			res += '<td><button id="' + transDownId + '">- 1</button></td>';
			res += '</tr></table>';
			if (makeKeyTextBox) {
				res += '<input type="text" value="Click here to use keyboard." class="' + keyboardContainer + '"><br>';
			} //if make textbox
			res += '<table><tr><td><a class="' + keyboardClass + '">';
			res += "c c# d d# e f f# g g# a a# b".split(" ").join('</a></td><td><a class="' + keyboardClass + '">');
			res += "</A></td></tr></table>";
			return res;
		}, //generateHtml

		initControls = function () {
			//button bindings
			$("#" + container).html(generateHtml());
			$("#" + prevInsId).click(that.prevInstrument);
			$("#" + nextInsId).click(that.nextInstrument);
			$("#" + nextOctId).click(that.nextOctave);
			$("#" + prevOctId).click(that.prevOctave);
			$("#" + transUpId).click(that.transposeUp);
			$("#" + transDownId).click(that.transposeDown);
			//key bindings
			$(document).on('keydown', '.' + keyboardContainer, keyDown);
			$(document).on('keyup', '.' + keyboardContainer, keyUp);
			update();
		},

		update = function () {
			if (that.active) {
				$("#" + insNameId).html((iptr + 1) + ": " + instruments[iptr].title);
				$("#" + octNameId).html("octave: " + octave);
				$("#" + transNameId).html("Transpoze: " + transpose);
			} //if
		}, //update
		active = false;

	//publicly viewable data
	Object.defineProperty(this, 'active', {
		get: function () {
			return active;
		},
		set: function (v) {
			active = v;
			if (active) {} //if
		} //set
	}); //active property

	this.update = update;

	this.nextInstrument = function () {
		iptr = (iptr + 1) % instruments.length;
		if (_instrumentCallback) _instrumentCallback(iptr);
		update();
	}; //nextInstrunent

	this.prevInstrument = function () {
		iptr--;
		if (iptr < 0) {
			iptr = samples.length - 1;
		}
		if (_instrumentCallback) _instrumentCallback(iptr);
		update();
	}; //prevSample

	this.prevOctave = function () {
		octave--;
		if (octave < 2) {
			octave = 2;
		} //if
		update();
	}; //prevOctave

	this.nextOctave = function () {
		octave++;
		if (octave > 8) {
			octave = 8;
		}
		update();
	}; //nextOctave

	this.transposeDown = function () {
		transpose--;
		if (transpose < -11) {
			transpose = -11;
		}
		update();
	}; //transposeDown

	this.transposeUp = function () {
		transpose++;
		if (transpose > 11) {
			transpose = 11;
		}
		update();
	}; //transposeUp

	Object.defineProperty(this, 'instrument', {
		get: function () {
			return instruments[iptr];
		}, //get currently selected sample.
		set: function (value) {
			instruments[iptr] = value;
			update();
		} //set the currently selected sample to the new value
	}); //sample property

	Object.defineProperty(this, 'instrumentIndex', {
		get: function () {
			return iptr;
		}, //get sampleIndex (iptr)
		set: function (value) {
			iptr = WebTracker.restrictRange(value, 0, instruments.length - 1);
			update();
		} //set sampleIndex
	}); //sampleIndex property

	Object.defineProperty(this, 'instruments', {
		get: function () {
			return instruments;
		},
		set: function (s) {
			instruments = s;
			iptr = 0;
			if (instruments.length === 0) {
				instruments = [new WebTracker.Instrument()];
			}
			player = new WebTracker.Sampler(samples, destination);
			update();
		}
	}); //samples property

	Object.defineProperty(this, "noteCallback", {
		set: function (nc) {
			_noteCallback = nc || function () {};
		}
	}); //noteCallback

	Object.defineProperty(this, "instrumentCallback", {
		set: function (sc) {
			_instrumentCallback = sc || function () {};
		}
	}); //instrumentCallback

	if ((typeof keyboardContainer === "string") && keyboardContainer.length > 0) {
		makeKeyTextBox = false;
	} else {
		makeKeyTextBox = true;
		keyboardContainer = container + "SamplesKeyBox";
	} //if no good container, make one.

	initControls();
}; //SamplePlayer