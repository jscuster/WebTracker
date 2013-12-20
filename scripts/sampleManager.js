var WebTracker = WebTracker || {};
WebTracker.SamplePlayer = function(samples, destination, container) { 
//allows the player to select and play a sample.
'use strict';
if (!container) { //must know where to generate html and which controls to listen to.
throw {message: "Error: A valid id must be passed so controls can be placed."};
}

var sptr = 0, //points to the currently playing sample
that = this,
keys = "zsxdcvgbhnjmq2w3er5t6y7ui9o0p".toUpperCase(),
octave = 5,
transpose = 0,
downKey = -1, //keys currently down. Must keep track so the key is not retriggerd when held.
noteCallbacks = [],
player = new WebTracker.Sampler(samples, destination), //only use of destination param
nextSampId = container + "NextSample",
prevSampId = container + "PrevSample",
sampNameId = container + "SampleName",

keyToNote = function(key) {
var k = keys.indexOf(key);
if (k >= 0) {
k += (12*octave) + transpose;
}
return k; //-1 = bad key
}, //keyToNote returns midi note from key and octave.

keyDown = function (e) {
if (that.active) {
if (downKey !== e.which) {
switch (e.which) {
case 187:
that.nextSample();
break;
case 189:
that.prevSample();
break;
case 219:
that.prevOctave();
break;
case 221:
that.nextOctave();
break;
case 186:
that.transposeDown();
break;
case 222:
that.transposeUp();
break;
default:
var  i = keyToNote(String.fromCharCode(e.which));
if (i >= 0) {
var rate = samples[sptr].factor * Math.pow(1.0595, i-60);
player.play(sptr, rate);
} //note finding
} //switch
downKey = e.which;
} //if key not pressed
} //if active
}, //keyDown

keyUp = function (e) {
if (that.active) {
var i = keyToNote(String.fromCharCode(e.which));
if (e.which === downKey) {
if (i >= 0) {
player.stop();
} //if matching note
downKey = -1;
} //if the key had been pressed
} //if active
}, //keyUp

generateHtml = function() {
var res = '<table><tr><td><button id="' + nextSampId +'">+</button></td></tr><tr><td id="' + sampNameId + '">';
res += '</td></tr><tr><td><button id="' + prevSampId + '">-</button></td></tr></table>';
return res;
}, //generateHtml

initControls = function() {
$("#" + container).html(generateHtml());
$("#"+ prevSampId).click(that.prevSample);
$("#" + nextSampId).click(that.nextSample);
$(document).keydown(keyDown);
$(document).keyup(keyUp);
update();
},

update = function() {
$("#" + sampNameId).html((sptr+1) + ": " + samples[sptr].title);
}

//publicly viewable data
this.active = false;

this.nextSample = function() {
sptr++;
if (sptr >= samples.length) {
sptr = 0;
} //we move to the next sample in the list.
update();
}; //nextSample

this.prevSample = function() {
sptr--;
if (sptr < 0) {
sptr = samples.length - 1;
}
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
//alert("transposing down.");
transpose--;
if (transpose < -11) {
transpose=-11;
}
update();
}; //transposeDown

this.transposeUp = function() {
//alert("transposing up.");
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
initControls();
}; //SamplePlayer