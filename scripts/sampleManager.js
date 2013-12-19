var WebTracker = WebTracker || {};
WebTracker.SamplePlayer = function(samples, destination) { 
//allows the player to select and play a sample.
'use strict';
var sptr = 0, //points to the currently playing sample
keys = "zsxdcvgbhnjm,l.;/".toUpperCase(),
octave = 5,
downKey = -1, //keys currently down. Must keep track so the key is not retriggerd when held.
noteCallbacks = [],
player = new Sampler(samples, destination), //only use of destination param (selects destination for audio.

keyToNote = function(key) {
var k = keys.indexOf(key);
if (k >= 0) {
return (12*octave)+k;
}
return k; //-1 = bad key
}, //keyToNote returns midi note from key and octave.

keydown = function (e) {
var i = keyToNote(String.fromCharCode(e.which));
if (i >= 0 && downKey != i) {
var rate = curSample.factor * Math.pow(1.0595, i-60);
player.play(sptr, i);
downKey = i;
} //if
}, //keyDown

keyup = function (e) {
var i = keyToNote(String.fromCharCode(e.which));
if (i >= 0 && i === downKey) {
player.stop();
downKey = -1;
} //if
}; //keyUp

this.active = false;
this.nextSample = function() {
sptr++;
if (sptr >= samples.length) {
sptr = 0;
} //we move to the next sample in the list.
update();
}, //nextSample

this.prevSample = function() {
sptr--;
if (sptr < 0) {
sptr = samples.length - 1;
}
update();
}; //prevSample

Object.defineProperty(this, 'sample', {
get: function() {
return samples[sptr];
}, //get currently selected sample.
set: function(value) {
samples[sptr] = value;
update();
} //set the currently selected sample to the new value
}; //sample property

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
}; //sampleIndex property

