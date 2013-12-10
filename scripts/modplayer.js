var WebTracker = WebTracker || {};
WebTracker.ModPlayer = function(song, context, destination) {
'use strict';
WebTracker.logger.log("created mod player.");
var channels = [], channelCount = 0,
playPatternOnly = false,
donePlaying = true,
playTimer = 0,
patternCursor = 0,
rowCursor = 0,
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
rowCursor = 0;
patternCursor = song.patternOrder[curPattern];
setTimePerTick(125); //default bpm
curPattern = 0;
//load channels with samplers.
channelCount = song.channels;
for (var i = 0; i < channelCount; i++) {
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

playRow = function() {
WebTracker.logger.log("row " + rowCursor);
for (var i = 0, r = song.patterns[patternCursor][rowCursor]; i < channelCount; i++) {
WebTracker.logger.log("channel " + i);
playNote(r[i], i);
} //i (channels)
bumpRowCursor();
}, //playRow

bumpRowCursor = function() {
rowCursor += 1;
if (rowCursor >= 64) {
rowCursor = 0;
bumpPatternCursor();
WebTracker.logger.log("playing pattern " + patternCursor + " in a song with " + c + " channels.");
} //if
}, //bumpRowCursor

bumpPatternCursor = function() {
curPattern++;
if (curPattern < song.totalPatterns && !playPatternOnly) {
patternCursor = song.patternOrder[curPattern];
} else {
clearInterval(playTimer);
donePlaying = true;
alert("done");
} //if
}, //bumpPatternCursor

play = function() { //internal function to play a pattern
//when this function is called, cursors are set up.
var lookAheadTime = context.currentTime + 0.5;
WebTracker.logger.log("Scheduling to " + lookAheadTime);
while (time < lookAheadTime && !donePlaying) {
playRow();
for (var k = 0; k < tpr; k++) {
WebTracker.logger.log("frame " + k);
tick();
} //k (ticks)
} //while
}, //play

tick = function() {
time += timePerTick;
WebTracker.logger.log("time: " + time);
}, //frame

playNote = function(note, chan) {
WebTracker.logger.log("playing note\n" + JSON.stringify(note) + "\n on channel " + chan);
var s = channels[chan];
if (note.period != 0) {
s.play(note.sample-1, note.factor, time);
} //if
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
WebTracker.logger.log("unplayed event: " + note.effect + "x: " + note.x + ", y: " + note.y + ", param: " + note.param);
} //switch
}; //playNote

this.playSong = function() {
preload();
donePlaying = false;
playPatternOnly = false;
rowCursor = 0;
playTimer = setInterval(play, 100);
for (var i = 0; i < channels.length; i++) {
channels[i].stop(time);
} //i
//prompt("log", WebTracker.logger.getLog());
}; //playSong
}; //ModPlayer