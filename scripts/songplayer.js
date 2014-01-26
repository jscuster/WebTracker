var WebTracker = WebTracker || {};
WebTracker.SongPlayer = function(song, destination) {
'use strict';
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
samples = song.samples,

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
sample: 0,
volume: 0
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
preload(); //reset things back.
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

applySlide = function(samp, s, ch) {
var t = tpr / s.length;
for (var i = 0; i < s.length; i++) {
ch.setNote(samp, s[i], time + (t*i));
} //i
}, //applySlide

playNote = (function() {
//compile these funcs so they're ready.
var noteStore,
note,
chan,
s, //sampler
isNote = true,
newSample = false,
slideNotes,

checkSample = function() {
if (note.sample > 0) {
noteStore.sample = note.sample - 1;
noteStore.volume = samples[noteStore.sample].volume;
newSample = true;
} else {
newSample = false;
} //if note has a sample
}, //checkSample

arpeggio = function() {
isNote = false;
startNote();
slideNotes = song.calcArpeggio(_bpm, noteStore.lastNote, note.effect.p1, note.effect.p2);
applySlide(noteStore.sample, slideNotes, s);
}, //arpeggio

slideToNote = function(useEffectParam) {
if (note.note > 0) {
noteStore.slideBound = note.note;
} //if valid note
if (useEffectParam) {
noteStore.lastSlideAmt = note.effect.p1;
} //if useEffectParam
slideNotes = song.calculateNoteSlide(_bpm, noteStore.lastNote, noteStore.slideBound, noteStore.lastSlideAmt);
noteStore.lastNote = slideNotes[slideNotes.length - 1];
applySlide(noteStore.sample, slideNotes, s);
isNote = false;
}, //slideToNote

vibrato = function() {
var e = note.effect,
simi = e.p2,
cycles = e.p1;
noteStore.vibratoAmp = simi !== 0 ? simi / 16 : noteStore.vibratoAmp;
noteStore.vibratoCycles = cycles !== 0 ? cycles * 64 : noteStore.vibratoCycles;
simi=noteStore.vibratoAmp;
cycles = noteStore.vibratoCycles;

slideVolume = function() {
noteStore.volume = song.calcVolumeSlide(_bpm, noteStore.volume, note.effect.p1);
s.slideVolume(noteStore.volume, time + tpr);
}, //slideVolume

startNote = function() {
if (note.note !== 0 && note.note !== noteStore.lastNote) {
noteStore.lastNote = note.note;
} //set the note if not 0.
if (note.note !== 0 && note.sample !== 0) {
s.play(noteStore.sample, noteStore.lastNote, time);
} //if not playing 0 note or 0 sample
}; //starts the note playing.

return function(n, c) {
note = n;
chan = c;
try {
s = channels[chan];
isNote = true; //is the note to be played or a param.
noteStore = chanStore[chan],
checkSample(); //set vars if new sample
switch (note.effect.effect) {
case 0: //do nothing but don't log it as unknown.
break;
case 1: //Arpeggio
arpeggio();
break;
case 2: //slide up
isNote = false;
slideNotes = song.slideNoteUp(note.note || noteStore.lastNote, 0, note.effect.p1);
if (newSample) {
startNote();
} //if it's a new sample, it's a new note.
applySlide(noteStore.sample, slideNotes, s);
noteStore.lastNote = slideNotes[slideNotes.length - 1];
break;
case 3: //slide down
slideNotes = song.slideNoteDown(note.note || noteStore.lastNote, 0, note.effect.p1);
if (newSample) {
startNote();
} //if it's a new sample, it's a new note.
applySlide(noteStore.sample, slideNotes, s);
noteStore.lastNote = slideNotes[slideNotes.length - 1];
isNote = false;
break;
case 4: //slide to note
slideToNote(true);
break;
case 6: //note and volume slide
slideToNote(false);
slideVolume();
break;
case 11: //slide volume
slideVolume();
break;
case 13: //set volume
isNote = false; //start note before setting volume.
noteStore.volume = note.effect.p1;
startNote();
s.setVolume(noteStore.volume, time);
break;
case 16: //fine slide up
startNote();
isNote = false;
noteStore.lastNote = song.calcFineSlide(noteStore.lastNote, note.effect.p1 * -1);
s.setNote(noteStore.sample, noteStore.lastNote, time);
break;
case 17: //fine slide down
startNote();
isNote = false;
noteStore.lastNote = song.calcFineSlide(noteStore.lastNote, note.effect.p1);
s.setNote(noteStore.sample, noteStore.lastNote, time);
break;
case 25: 
s.changeVolume(note.effect.p1, time);
noteStore.volume += note.effect.p1;
break;
case 26:
s.changeVolume(-note.effect.p1, time);
noteStore.volume -= note.effect.p1;
break;
case 31: //set speed
_bpm = note.effect.p1;
setTimePerRow();
break;
default:
WebTracker.logger.log("unhandled event: " + JSON.stringify(note));
} //switch
if (isNote && note.note !== 0) {
startNote();
} //if
} catch (e) {
alert("Playing note " + JSON.stringify(note) + "\non channel " + chan);
alert(JSON.stringify(e));
throw e;
} //catch
}; //inner, playNote
})(); //outer playNote

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