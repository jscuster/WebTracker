var WebTracker = WebTracker || {};
WebTracker.SamplePlayer = function(_samples, destination, container, keyboardContainer) { 
//allows the player to select and play a sample.
'use strict';
if (!container) { //must know where to generate html and which controls to listen to.
throw {message: "Error: A valid id must be passed so controls can be placed."};
} //if bad container

var samples = [],
sptr = 0, //points to the currently playing sample
that = this,
keys = "zsxdcvgbhnjmq2w3er5t6y7ui9o0p".toUpperCase(),
octave = 5,
transpose = 0,
downKey = -1, //keys currently down. Must keep track so the key is not retriggerd when held.
_noteCallback,
_sampleCallback,
player = new WebTracker.Sampler(samples, destination), //only use of destination param
nextSampId = container + "NextSample",
prevSampId = container + "PrevSample",
sampNameId = container + "SampleName",
prevOctId = container+"PrevOctave",
nextOctId = container + "NextOctave",
octNameId = container + "OctaveName",
transUpId = container+"TransposeUp",
transDownId = container+"TransposeDown",
transNameId = container + "TransposeName",
keyboardClass = container + "Keyboard",
makeKeyTextBox = keyboardContainer && keyboardContainer.length > 0,

keyToNote = function(key) {
var k = keys.indexOf(key);
if (k >= 0) {
k += (12*octave) + transpose;
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
that.nextSample();
return false;
break;
case 189: // -
that.prevSample();
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
var  i = keyToNote(String.fromCharCode(e.which));
if (i >= 0) {
player.play(sptr, i);
if (_noteCallback) _noteCallback(sptr, i);
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

generateHtml = function() {
var res = '<table><tr>';
res += '<td><button id="' + nextSampId +'">Next Sample</button></td>';
res += '<td><button id="' + nextOctId + '">+ 1</button></td>';
res += '<td><button id="' + transUpId + '">+ 1</button></td>';
res += '</tr><tr>';
res += '<td id="' + sampNameId + '"></td>';
res += '<td id="' + octNameId + '"></td>';
res += '<td id="' + transNameId + '"></td>';res += '<td id="' + sampNameId + '"></td>';
res += '</tr><tr>';
res += '<td><button id="' + prevSampId + '">Previous Sample</button></td>';
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

initControls = function() {
//button bindings
$("#" + container).html(generateHtml());
$("#"+ prevSampId).click(that.prevSample);
$("#" + nextSampId).click(that.nextSample);
$("#" + nextOctId).click(that.nextOctave);
$("#" + prevOctId).click(that.prevOctave);
$("#" + transUpId).click(that.transposeUp);
$("#" + transDownId).click(that.transposeDown);
//key bindings
$('.' + keyboardContainer).keydown(keyDown);
$('.' + keyboardContainer).keyup(keyUp);
update();
},

update = function() {
if (that.active) {
$("#" + sampNameId).html((sptr+1) + ": " + samples[sptr].title);
$("#"+octNameId).html("octave: " + octave);
$("#"+transNameId).html("Transpoze: " + transpose);
} //if
}, //update
active = false;

//publicly viewable data
Object.defineProperty(this, 'active', {
get: function() {
return active;
},
set: function(v) {
active = v;
if (active) {
} //if
} //set
}); //active property

this.update = update;

this.nextSample = function() {
sptr++;
if (sptr >= samples.length) {
sptr = 0;
} //we move to the next sample in the list.
if (_sampleCallback) _sampleCallback(sptr);
update();
}; //nextSample

this.prevSample = function() {
sptr--;
if (sptr < 0) {
sptr = samples.length - 1;
}
if (_sampleCallback) _sampleCallback(sptr);
update();
}; //prevSample

this.prevOctave = function() {
octave--;
if (octave < 2) {
 octave = 2;
} //if
update();
}; //prevOctave

this.nextOctave = function() {
octave++;
if (octave > 8) {
octave = 8;
}
update();
}; //nextOctave

this.transposeDown = function() {
transpose--;
if (transpose < -11) {
transpose=-11;
}
update();
}; //transposeDown

this.transposeUp = function() {
transpose++;
if (transpose > 11) {
transpose = 11;
}
update();
}; //transposeUp

Object.defineProperty(this, 'sample', {
get: function() {
return samples[sptr];
}, //get currently selected sample.
set: function(value) {
samples[sptr] = value;
update();
} //set the currently selected sample to the new value
}); //sample property

Object.defineProperty(this, 'sampleIndex', {
get: function() {
return sptr;
}, //get sampleIndex (sptr)
set: function(value) {
sptr = value;
if (sptr >= samples.length) sptr = samples.Length - 1;
if (sptr < 0) sptr = 0;
update();
} //set sampleIndex
}); //sampleIndex property

Object.defineProperty(this, 'currentSample', {
get: function() {
return samples[sptr];
} //getter
}); //currentSample property

Object.defineProperty(this, 'samples', {
get: function() {
return samples;
},
set: function(s) {
samples = s;
sptr=0;
if (samples.length === 0) {
samples = [new WebTracker.AmigaSample()];
}
player = new WebTracker.Sampler(samples, destination);
update();
}
}); //samples property

Object.defineProperty(this, "noteCallback", {
set: function(nc) {
_noteCallback= nc || function(){};
}
}); //noteCallback

Object.defineProperty(this, "sampleCallback", {
set: function(sc) {
_sampleCallback = sc || function(){};
}
}); //sampleCallback

if ((typeof keyboardContainer === String) && keyboardContainer.length > 0) {
makeKeyTextBox = false;
} else {
makeKeyTextBox = true;
keyboardContainer = container + "SamplesKeyBox";
} //if no good container, make one.

this.samples = _samples;
initControls();
}; //SamplePlayer