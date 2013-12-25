var WebTracker = WebTracker || {};
if (window.File && window.FileReader && window.FileList && window.Blob && (window.AudioContext || window.webkitAudioContext)) {
$(function() {
'use strict';
var context = WebTracker.context,
destination = context.createDynamicsCompressor(),
changed = false,
song,
initialized = false,
filename = "untitled.mod",
samplePlayers = {importSamplesList: new WebTracker.SamplePlayer([], destination, "importSamplesList"),
importSongSamples: new WebTracker.SamplePlayer([], destination, "importSongSamples"),
samplesSampleChooser: new WebTracker.SamplePlayer([], destination, "samplesSampleChooser")
},
importSelected = false,
importSamples = [],
modPlayer,

deactivatePlayers = function() {
for (var i in samplePlayers) {
samplePlayers[i].active = false;
} //deactivate all players.
}, //deactivate players

showImportControls = function() {
if (importSelected) { //we're in the middle of an import
$("#importClear").html("Cancel Import")
$("#importImport").html("Place Sample");
$("#importAdd").attr('disabled', 'disabled');
deactivatePlayers();
samplePlayers.importSongSamples.active = true;
update();
$("#importSongSamples").show();
$("#importSamplesList").hide();
} else {
//we are not in the middle of an import, just starting.
$("#importClear").html("Clear Loaded Samples")
$("#importImport").html("Select Sample");
$("#importAdd").removeAttr('disabled');
$("#importSamplesList").show();
$("#importSongSamples").hide();
deactivatePlayers();
samplePlayers.importSamplesList.active = true;
update();
} //show proper labels on controls
}, //showing controls for import

showPanel = function(name) {
$(".mainPanel").hide();
$("#" + name).show();
$("#" + name + "First").click();
deactivatePlayers();
if (name === "samples") {
samplePlayers.samplesSampleChooser.active = true;
} //activate correct player.
}, //showPanel

showSubpanel = function(name) {
$(".subpanel").hide();
$("#" + name).show();
if (name === "import") {
$("#importSongSamples").hide();
samplePlayers.importSamplesList.active = true; //activate the correct player.
samplePlayers.importSamplesList.update();
} //activate import player
}, //showPanel

update = function() {
document.title = song.title + ": Web Tracker";
$("#songTitle").prop('value', song.title)
$("#filesFilename").html("current file: " + filename + " - " + song.title)
$("#songMessage").html(song.samples.map(function(s) {return s.title;}).join("<br>"));
for (var i in samplePlayers) {
samplePlayers[i].update();
} //update the players.
buildPatternEditor();
buildPatternTable();
modPlayer.update();
$("#patternTempo").val(modPlayer.bpm);
}, //updatesafter changes are made.

fillSamplePlayers = function() {
samplePlayers.samplesSampleChooser.samples = song.samples; //give the array to the sampler.
samplePlayers.importSongSamples.samples = song.samples;
samplePlayers.importSamplesList.samples = importSamples;
}, //load the samples in.

buildPatternEditor = function() {
var res = "<table>",
c = song.patternCount;
for (var i = 0; i < c; i++) {
res += '<tr><td>' + (i+1) + '</td><td><button class="patternPlay" id="play:' + i + '">Play Pause</button></td>';
res += '<td><button class="patternRemove" id="remove:' + i + '">Remove</button></td>';
res += '<td><button class="patternUp" id="up:' + i + '">Move Up</button></td>';
res += '<td><button class="patternDown" id="down:' + i + '">Move Down</button></td>'
res += "</tr>";
} //i
res += "</table>";
$("#editorInfo").html(res);
$(".patternPlay").click(function() {
var idx = this.id.split(":")[1];
modPlayer.playPattern(idx);
}); //play click
$(".patternRemove").click(function() {
var idx = this.id.split(":")[1];
changed = true;
song.removePattern(idx);
update();
}); //remove click
$(".patternUp").click(function() {
var idx = this.id.split(":")[1];
changed=true;
song.movePatternUp(idx);
}); //pattern up click
$(".patternDown").click(function() {
var idx = this.id.split(":")[1];
changed=true;
song.movePatternDown(idx);
}); //down click
}, //buildPatternEditor

buildPatternTable = function() {
var res = "<table><tr>",
num = 1;
song.patternOrder.forEach(function(o) {
res += '<td><a class="patternOrderPlay">' + num + ':</a> <input type="text" class = "patternOrderValue" value="' + (o+1) + '" id = "patternOrder:' + (num-1) + '"></td>';
if (num % 4 == 0) {
res += "</tr><tr>";
} //2 collumns
num++;
}); //show each pattern
res += '</tr><tr><td><button id="patternOrderAdd">Add</button></td><td></td><td><button id="patternOrderRemove">Remove</td><td></td></tr></table>'
$("#patternTable").html(res);
$("#patternOrderAdd").click(function() {
if (song.patternCount > 0) {
song.patternOrder[song.totalPatterns++] = 0;
changed=true;
update();
$("#patternOrderAdd").focus();
} else {
alert("Please create a pattern in the editor first.");
} //no point in adding a slot to put patterns if none exist.
}); //patternOrderAdd click
$(".patternOrderValue").focusout(function() {
var idx = +(this.id.split(":")[1]),
val = +(this.value);
if (isNaN(val) || val > song.patternCount) {
alert("Please enter a number between " + 1 + " and " + song.patternCount + ".");
$(this).focus();
} else {
song.patternOrder[idx] = val-1;
changed=true;
} //if it's a valid number, set it in the song.
}); //text field change.
$("#patternOrderRemove").click(function() {
if (song.totalPatterns <= 0) {
alert("No slots to remove.");
} else {
song.totalPatterns--;
song.patternOrder.pop();
changed=true;
update();
$("#patternOrderRemove").focus();
} //remove if there are slots
}); //remove clicked
$(".patternOrderPlay").click(function() {
var v = $(this).html().split(":")[0];
v = (+v) -1;
alert("'" + v + "'");
modPlayer.playFromSlot(v);
}); //play from pattern
}, //build pattern order html table

newSong = function() {
changed = false;
song = WebTracker.amigaMod();
song.createPattern();
song.patternOrder = [0];
song.totalPatterns = song.patternCount = 1;
filename = "untitled.mod";
refreshObjects();
}, //newSong

refreshObjects = function() {
fillSamplePlayers();
modPlayer = new WebTracker.ModPlayer(song, destination);
modPlayer.stopCallback = function() {
$("#patternTempo").val(modPlayer.bpm);
}; //stopCallback
update();
}, //refresh players, andother objects.

init = function() {
destination.connect(context.destination);
newSong();
$(".first").click();
}; //initialize the program

$(".menu").click(function() {
showPanel($(this).html().toLowerCase());
$(".menu").removeAttr("disabled");
$(this).attr("disabled", "disabled");
}); //click

$(".submenu").click(function() {
showSubpanel($(this).html().toLowerCase());
$(".submenu").removeAttr("disabled");
$(this).attr("disabled", "disabled");
}); //click

$("#fileOpen").change(function(e) {
var f = e.target.files[0]; //only open the first selected file
					var reader = new FileReader();
					reader.onload = function (e) {
						var dv = new DataView(e.target.result),
sng = WebTracker.amigaMod();
if (sng.isValid(dv)) {
						song = sng;
song.loadMod(dv);
filename = f.name;
refreshObjects();
changed = false;
} else {
alert(f.name + " is an invalid amiga module. Please select only amiga modules (*.mod).");
} //else
}; //onload
reader.readAsArrayBuffer(f);
}); //fileOpen change (in file/open menu

$("#newFile").click(function () {
var go = true;
if (changed) {
go = confirm("This will erace your current song. Do you wish to proceed?");
} //if changed
if (go) { //user says OK or the changes were saved.
newSong();} //if
}); //new file creation

$("#saveButton").click(function() {
var zip = new JSZip();
zip.file("readme.txt", "***   " + song.title + " ***\n\nCreated with WebTracker: http://webtracker.com\n\nUnleash your creativity!\n");
zip.file(filename, song.saveMod(true)); //true = return ArrayBuffer. 
var htm = '<a href="' + 'data:application/zip;base64,' + zip.generate() + '">Click to download</a>';
$("#saveLink").html(htm);
changed=false;
}); //save click

$("#importClear").click(function() {
importSelected = !importSelected; //toggle the bad boy.
if (!importSelected) { //if it was on
//the operation was canceled.
showImportControls();
} else {
//clearing importSamples.
importSamples = [];
fillSamplePlayers();
} //act on importSelected togg.e
}); //importClear clicked

$("#importImport").click(function() {
if (importSelected) {
var smp = samplePlayers.importSamplesList.currentSample,
i = samplePlayers.importSongSamples.sampleIndex;
if (confirm("Warning: replacing sample " + (i+1) + ": (" + song.samples[i].title + ") with the selected sample. Continue?")) {
smp.title = song.samples[i].title;
song.samples[i]=smp; //replace
i = samplePlayers.importSamplesList.sampleIndex;
importSamples.splice(i, 1);
fillSamplePlayers();
changed = true;
update();
} //if confirmed
} //if in the middle of importing
//no matter what, we do this when import is clicked.
importSelected = !importSelected; //toggle
showImportControls(); //show controls based on prev var.
}); //import clicked

$("#importAdd").change(function(e) {
var f = e.target.files; //all the files the user selected.
var reader = new FileReader();
reader.onload = function (e) {
var data = e.target.result,
dv = new DataView(data),
s; //song or sample temp var
s = WebTracker.amigaMod();
if (s.isValid(dv)) {
s.loadMod(dv);
for (var i = 0; i < s.samples.length; i++) {
importSamples[importSamples.length] = s.samples[i];
} //i
fillSamplePlayers();
update();
} else {
//this is some other kind of audio file. Lets try to decode it.
context.decodeAudioData(data, //the loaded file
function(audio) { //callback for successful decode
s = new WebTracker.AmigaSample();
s.data = audio;
importSamples[importSamples.length] = s;
fillSamplePlayers();
update();
}, //decodeAudioData success
function() { //error callback
alert("This browser is unable to decode the data in one of the files. Perhaps another browser will be able to, save your work and open another browser to add the file.");
}); //decodeAudioData
} //else
}; //onload
for (var i = 0; i < f.length; i++) {
var theFile = f[i];
reader.readAsArrayBuffer(theFile);
}; //for
}); //fileImportAdd change (in file/open menu

$("#songTitle").focusout(function() {
var t = $(this).prop('value');
if (t !== song.title) {
if (confirm("Changing song title to '" + t + "'. Proceed?")) {
song.title = t;
changed=false;
update();
} //if user says yes
} //if titles don't match
}); //songTitle leave focus

$("#patternTempo").focusout(function() {
var v = +this.value;
if (v && v < 32) {
alert ("Please enter a number larger than 32.");
this.value=modPlayer.bpm;
} else {
modPlayer.bpm = v;
} //if
}); //tempo loose focus

init();
}); //ready
} else {
alert('Some required features are unavailable in this browser. Please upgradee this browser or use another. We recommend Google Chrome or Mozilla Firefox.');
} //else
