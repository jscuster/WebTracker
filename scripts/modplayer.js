var WebTracker = WebTracker || {};
WebTracker.ModPlayer = function(song, context, destination) {
'use strict';
WebTracker.logger.log("created mod player.");
var channels = [],
patternCursor = 0,
rowCurser = 0,
curPattern = 0, //not the current pattern but the current spot in the pattern order table.
tpr = 6, //frames per row
bpm = 125,
time = 0,
timePerTick = 0.02, //set in setTimePerTick

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
//alert(timePerTick);
} //tick or bpm if
WebTracker.logger.log("tpr is " + tpr + ", bpm = " + bpm);
WebTracker.logger.log("timePerTick is " + timePerTick);
},

preload = function() {
//initialize variables
channels = [];
patternCursor = 0;
rowCurser = 0;
setTimePerTick(125); //default bpm
curPattern = 0;
//load channels with samplers.
var c = song.channels;
for (var i = 0; i < c; i++) {
channels[i] = new WebTracker.Sampler(song.samples, context, destination);
//set position per left, right, right, left spec.
var mod = i % 4;
if (mod === 0 || mod === 3) {
channels[i].setPan(-0.25, 0, 0); //left
} else {
channels[i].setPan(0.25, 0, 0); //right
} 
} //i
time = context.currentTime;
WebTracker.logger.log("preloaded mod player. time: " + time);
}, //preload

play = function() { //internal function to play a pattern
WebTracker.logger.log("playing mod");
//when this function is called, cursors are set up.
var p = song.patterns[patternCursor],
c = song.channels;
WebTracker.logger.log("playing pattern " + patternCursor + " in a song with " + c + " channels.");
for (var i = 0; i < 64; i++) {
WebTracker.logger.log("row " + i);
for (var j = 0; j < c; j++) {
WebTracker.logger.log("channel " + j);
playNote(p[i][j], j);
} //j (channels)
for (var k = 0; k < tpr; k++) {
WebTracker.logger.log("frame " + k);
tick();
} //k (ticks)
} //i (rows);
}, //play

tick = function() {
time += timePerTick;
WebTracker.logger.log("time: " + time);
}, //frame

playNote = function(note, chan) {
WebTracker.logger.log("playing note\n" + JSON.stringify(note) + "\n on channel " + chan);
var s = channels[chan];
switch (note.effect) {
case 12: //set volume
WebTracker.logger.log("Found set volume effect.");
s.setVolume(note.param);
break;
case 15: //set speed
WebTracker.logger.log("found set speed effect.");
setTimePerTick(note.param);
break;
default:
WebTracker.logger.log("unlogged event: " + note.effect + "x: " + note.x + ", y: " + note.y + ", param: " + note.param);
} //switch
if (note.period != 0) {
s.play(note.sample-1, note.factor, time);
} //if
}; //playNote

this.playSong = function() {
preload();
for (var i = 0; i < song.totalPatterns; i++) {
patternCursor = song.patternOrder[i];
rowCurser = 0;
play();
} //i
for (var i = 0; i < channels.length; i++) {
channels[i].stop(time);
} //i
//prompt("log", WebTracker.logger.getLog());
}; //playSong
}; //ModPlayer