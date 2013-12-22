var WebTracker = WebTracker || {};
if (window.File && window.FileReader && window.FileList && window.Blob && (window.AudioContext || window.webkitAudioContext)) {
$(function() {
'use strict';
		window.AudioContext = window.AudioContext || window.webkitAudioContext;
		var context = new window.AudioContext();
WebTracker.context = context;
var changed = false,
song = new WebTracker.AmigaMod(),
initialized = false,
filename = "untitled.mod",
samplePlayers = {importSamplesList: new WebTracker.SamplePlayer([], context.destination, "importSamplesList"),
importSongSamples: new WebTracker.SamplePlayer([], context.destination, "importSongSamples"),
samplesSampleChooser: new WebTracker.SamplePlayer([], context.destination, "samplesSampleChooser")
},
importSelected = false,
importSamples = [],

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
deactivatePlayers();
if (name === "samples") {
samplePlayers.samplesSampleChooser.active = true;
} //activate correct player.
}, //showPanel

showSubpanel = function(name) {
deactivatePlayers();
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
}, //updatesafter changes are made.

fillSamplePlayers = function() {
samplePlayers.samplesSampleChooser.samples = song.samples; //give the array to the sampler.
samplePlayers.importSongSamples.samples = song.samples;
samplePlayers.importSamplesList.samples = importSamples;
}, //load the samples in.

init = function() {
WebTracker.context = context; //globalize the audio context.
$("#first").click();
$("#subfirst").click();
fillSamplePlayers();
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
						var dv = new DataView(e.target.result);
if (WebTracker.AmigaMod.isValid(dv)) {
						song = new WebTracker.AmigaMod();
song.loadMod(dv);
filename = f.name;
fillSamplePlayers();
update();
initialized = true;
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
changed = false;
song = new WebTracker.AmigaMod();
filename = "untitled.mod";
fillSamplePlayers();
update();
} //if
}); //new file creation

$("#saveButton").click(function() {
var zip = new JSZip();
zip.file("readme.txt", "***   " + song.title + " ***\n\nCreated with WebTracker: http://webtracker.com\n\nUnleash your creativity!\n");
zip.file(filename, song.saveMod(true)); //true = return ArrayBuffer. 
var htm = '<a href="' + 'data:application/zip;base64,' + zip.generate() + '">Click to download</a>';
$("#saveLink").html(htm);
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
if (WebTracker.AmigaMod.isValid(dv)) {
s = new WebTracker.AmigaMod();
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
s.loadFromAudioBuffer(audio);
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
update();
} //if user says yes
} //if titles don't match
}); //songTitle leave focus
update();
init();
}); //ready
} else {
	alert('Some required features are unavailable in this browser. Please upgradee this browser or use another. We recommend Google Chrome or Mozilla Firefox.');
} //else
