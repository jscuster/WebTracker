var WebTracker = WebTracker || {};
WebTracker.ModPlayer = function(song, destination) {
'use strict';
WebTracker.logger.log("created mod player.");
var context = WebTracker.context,
channels = [],
channelCount = 0,
patternCursor = 0,
rowCursor = 0,
curPattern = 0, //not the current pattern but the current spot in the pattern order table.
playPatternOnly = false,
playInterval = 100,
lookAhead = 1,
tpr = 6, //frames per row
bpm = 125,
time = 0,
timePerTick = 0.02, //set in setTimePerTick
donePlaying = true,
playTimer = 0,
donePlayingCallback,

setTimePerTick = function(x) {
var r = 750/x; 
//ticks = 60/(4*bpm*0.02), bpm=60/(4*ticks*0.02), simplifying, = (60/(4*0.02) = 750
if (x < 32) { //setting ticks, r = bpm
tpr = x;
bpm = Math.round(r);
timePerTick = 0.02; //ticks tied to VSync, static number.
} else { //setting by bpm, r = ticks
tpr = Math.round(r);
bpm = x;
timePerTick = 60/(4*tpr*bpm*1.25);
} //tick or bpm if
WebTracker.logger.log("tpr is " + tpr + ", bpm = " + bpm);
WebTracker.logger.log("timePerTick is " + timePerTick);
}, //setTimePerTick

preload = function() {
//initialize variables
channels = [];
patternCursor = 0;
rowCursor = 0;
curPattern = 0;
//load channels with samplers.
channelCount = song.channels;
for (var i = 0; i < channelCount; i++) {
channels[i] = new WebTracker.Sampler(song.samples, destination);
//set position per left, right, right, left spec.
var mod = i % 4;
if (mod === 0 || mod === 3) {
channels[i].setPan(-0.25, 0, 0); //left
} else {
channels[i].setPan(0.25, 0, 0); //right
} 
} //i
playPatternOnly = false;
donePlaying = true;
WebTracker.logger.log("preloaded mod player. time: " + time);
}, //preload

stopMusic = function() {
if (playTimer) {
clearInterval(playTimer);
playTimer = 0;
}
donePlaying = true;
for (var i = 0; i < channels.length; i++) {
channels[i].stop(time);
} //i
if (donePlayingCallback) {
donePlayingCallback();
} //if
}, //stop audio and end playback

bumpRowCursor = function() {
rowCursor += 1;
if (rowCursor >= 64) {
rowCursor = 0;
bumpPatternCursor();
} //if
}, //bumpRowCursor

bumpPatternCursor = function() {
curPattern++;
if (curPattern < song.slots && !playPatternOnly) {
patternCursor = song.patternOrder[curPattern];
} else {
stopMusic();
} //if
}, //bumpPatternCursor

playRow = function() {
var p = song.patterns[patternCursor][rowCursor];
for (var i = 0; i < channelCount; i++) {
playNote(p[i], i);
} //i (channels)
for (var k = 0; k < tpr; k++) {
tick();
} //k (ticks)
bumpRowCursor();
}, //playRow

play = function() { //internal function to play a pattern
var rtime = context.currentTime + lookAhead;
while ((time < rtime) && !donePlaying) {
playRow();
} //while
}, //play

tick = function() {
time += timePerTick;
WebTracker.logger.log("time: " + time);
}, //frame

playNote = function(note, chan) {
var s = channels[chan];
switch (note.effect) {
case 10: //slide volume
var delta = note.x ? note.x : 0 - note.y;
delta = delta / 64;
delta *= (tpr-1);
s.slideVolume(delta, time + (tpr*timePerTick));
break;
case 12: //set volume
s.setVolume(note.param/64);
break;
case 15: //set speed
setTimePerTick(note.param);
break;
default:
WebTracker.logger.log("unlogged event: " + note.effect + "x: " + note.x + ", y: " + note.y + ", param: " + note.param);
} //switch
if (note.sample != 0) {
s.play(note.sample-1, note.factor, time);
} //if
}; //playNote

this.playSong = function() {
stopMusic();
curPattern = 0;
patternCursor = song.patternOrder[curPattern];
rowCursor = 0;
donePlaying = false;
playPatternOnly = false;
time = context.currentTime;
playTimer = setInterval(play, playInterval);
//prompt("log", WebTracker.logger.getLog());
}; //playSong

this.playPattern = function(p) {
if (p < song.patternCount) {
stopMusic();
patternCursor = p;
rowCursor = 0;
donePlaying = false;
playPatternOnly = true;
time = context.currentTime;
playTimer = setInterval(play, playInterval);
//prompt("log", WebTracker.logger.getLog());
} else {
throw {message: "Playing a pattern that does not exist."};
} //else
}; //playPattern

this.playFromSlot = function(s) {
if (s < song.slots) {
stopMusic();
curPattern = s;
patternCursor = song.patternOrder[curPattern];
rowCursor = 0;
donePlaying = false;
playPatternOnly = false;
time = context.currentTime;
playTimer = setInterval(play, playInterval);
//prompt("log", WebTracker.logger.getLog());
} else {
throw {message: "Playing from pattern that's out of bounds."};
} //else
}; //playFromPattern

Object.defineProperty(this, 'bpm', {
get: function() {
return bpm;
}, //get
set: function(v) {
v = v < 32 ? 32 : v;
setTimePerTick(v);
} //set
}); //defineProperty

Object.defineProperty(this, "stopCallback", {
set: function(v) {
donePlayingCallback = v;
} //set
}); //stopCallback

this.update = preload;
preload();
}; //ModPlayer