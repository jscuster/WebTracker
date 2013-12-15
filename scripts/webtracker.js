var WebTracker = WebTracker || {};
if (window.File && window.FileReader && window.FileList && window.Blob && (window.AudioContext || window.webkitAudioContext)) {
$(function() {
'use strict';
		window.AudioContext = window.AudioContext || window.webkitAudioContext;
		var context = new window.AudioContext(),
changed = false,
song = new WebTracker.AmigaMod(),
initialized = false,
filename = "untitled",

showPanel = function(name) {
$(".mainPanel").hide();
$("#" + name).show();
}, //showPanel

showSubpanel = function(name) {
$(".subpanel").hide();
$("#" + name).show();
}, //showPanel

update = function() {
document.title = song.title + ": Web Tracker";
$("#songTitle").prop('value', song.title)
$("#filesFilename").html("current file: " + filename + " - " + song.title)
$("#songMessage").html(song.samples.map(function(s) {return s.title;}).join("<br>"));
}; //updatesafter changes are made.

$(".menu").click(function() {
showPanel($(this).html().toLowerCase());
$(".menu").removeAttr("disabled");
$(this).attr("disabled", "disabled");
$("#subfirst").click();
}); //click

$(".submenu").click(function() {
showSubpanel($(this).html().toLowerCase());
$(".submenu").removeAttr("disabled");
$(this).attr("disabled", "disabled");
}); //click
$("#first").click();

$("#fileOpen").change(function(e) {
var f = e.target.files[0]; //only open the first selected file
					var reader = new FileReader();
					reader.onload = function (e) {
						var dv = new DataView(e.target.result);
						var sng = WebTracker.modLoader(dv, context);
if (sng) {
song = sng;
filename = f.name;
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
update();
} //if
}); //new file creation

$("#saveButton").click(function() {
var htm = '<a href="' + 'data:application/zip;base64,' + WebTracker.saveMod(song, true) + '">Click to download</a>';
$("#saveLink").html(htm);
}); //save click

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
}); //ready
} else {
	alert('Some required features are unavailable in this browser. Please upgradee this browser or use another. We recommend Google Chrome or Mozilla Firefox.');
} //else
