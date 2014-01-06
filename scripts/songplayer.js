var WebTracker = WebTracker || {};
WebTracker.SongPlayer = function(song, destination) {
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
_bpm = song.bpm,
time = 0,
tpr = 0.125, //set in setTimePerTick
donePlaying = true,
playTimer = 0,
donePlayingCallback,
chanStore,
slideBounds = [],

setTimePerRow = function() {
tpr = 60/(_bpm * song.rowsPerBeat);
}, //setTimePerTick

preload = function() {
//initialize variables
channels = [];
patternCursor = 0;
rowCursor = 0;
curPattern = 0;
chanStore = [];

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
}  //if pan
chanStore[i] = {
lastNote: 0,
slideBound: 0,
sample: 0
};
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
time += tpr;
bumpRowCursor();
}, //playRow

play = function() { //internal function to play a pattern
var rtime = context.currentTime + lookAhead;
while ((time < rtime) && !donePlaying) {
playRow();
} //while
}, //play

applySlide = function(s, ch) {
var t = tpr / s.length;
for (var i = 0; i < s.length; i++) {
ch.setNote(s[i], time + (t*i));
} //i
}, //applySlide

playNote = function(note, chan) {
var s = channels[chan],
isNote = true, //is the note to be played or a param.
slideNotes,
noteStore = chanStore[chan];
//alert(chanStore);
//alert(noteStore);
switch (note.effect.effect) {
case 0: //do nothing but don't log it as unknown.
break;
case 2: //slide up
slideNotes = song.slideNoteUp(note.note || noteStore.lastNote, 0, note.effect.p1);
applySlide(slideNotes, s);
noteStore.lastNote = slideNotes[slideNotes.length - 1];
isNote = false;
break;
case 3: //slide down
slideNotes = song.slideNoteDown(note.note || noteStore.lastNote, 0, note.effect.p1);
applySlide(slideNotes, s);
noteStore.lastNote = slideNotes[slideNotes.length - 1];
isNote = false;
break;
case 4: //slide to note
if (note.note > 0) {
noteStore.slideBound = note.note;
}
slideNotes = song.calculateNoteSlide(_bpm, noteStore.lastNote, noteStore.slideBound, note.effect.p1);
noteStore.lastNote = slideNotes[slideNotes.length - 1];
applySlide(slideNotes, s);
isNote = false;
break;
case 11: //slide volume
var delta = note.effect.p1;
delta = delta / 64;
delta *= (tpr-1);
s.slideVolume(delta, time + (tpr));
break;
case 13: //set volume
s.setVolume(note.effect.p1/64);
break;
case 25:
s.changeVolume(note.effect.p1, time);
break;
case 26:
s.changeVolume(-note.effect.p1, time);
break;
case 31: //set speed
_bpm = note.effect.p1;
setTimePerRow();
//alert("set bpm: " + _bpm + ", tpr: " + tpr);
break;
default:
WebTracker.logger.log("unlogged event: " + JSON.stringify(note));
} //switch
if (isNote && note.note != 0) {
if (note.sample) {
noteStore.sample = note.sample - 1;
}
noteStore.lastNote = note.note;
s.play(noteStore.sample, note.note, time);
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

this.quickPlayNote = function(pat, row, chan) {
time = context.currentTime;
playNote(song.patterns[pat][row][chan], chan);
channels[chan].stop(time+1);
}; //quickPlayNote

Object.defineProperty(this, 'bpm', {
get: function() {
return _bpm;
}, //get
set: function(v) {
v = v < 32 ? 32 : v;
alert("setting bpm to " + v);
_bpm = v;
setTimePerRow();
} //set
}); //defineProperty

Object.defineProperty(this, "stopCallback", {
set: function(v) {
donePlayingCallback = v;
} //set
}); //stopCallback

this.update = preload;
preload();
}; //SongPlayer