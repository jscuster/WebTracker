var WebTracker = WebTracker || {};
if (window.File && window.FileReader && window.FileList && window.Blob && (window.AudioContext || window.webkitAudioContext)) {
	$(function () {
		'use strict';
		var context = WebTracker.context,
			destination = context.createDynamicsCompressor(),
			changed = false,
			song,
			initialized = false,
			filename = "untitled.mod",
			samplePlayers = {
				importSamplesList: new WebTracker.SamplePlayer([], destination, "importSamplesList"),
				importSongSamples: new WebTracker.SamplePlayer([], destination, "importSongSamples"),
				samplesSampleChooser: new WebTracker.SamplePlayer([], destination, "samplesSampleChooser"),
				trackerSampleChooser: new WebTracker.SamplePlayer([], destination, "trackerSampleChooser")
			},
			importSelected = false,
			importSamples = [],
			songPlayer,
			trackerStartChan = 0,
			trackerChanWidth = 4,
			trackerCurPattern = 0,
			trackerCurRow = 0,
			trackerAddRows = 1,
			trackerCurChan = 0,
trackerButtonsPerChan = 4, //chan, samp, note, eff
			trackerCurBtn = 0,
			trackerKeys = false,
trackerClipboard,

			deactivatePlayers = function () {
				for (var i in samplePlayers) {
					samplePlayers[i].active = false;
				} //deactivate all players.
			}, //deactivate players

			showImportControls = function () {
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

			showPanel = function (name) {
				$(".mainPanel").hide();
				$("#" + name).show();
				$("#" + name + "First").click();
				deactivatePlayers();
				trackerKeys = false;
				if (name === "samples") {
					samplePlayers.samplesSampleChooser.active = true;
				} else if (name === "tracker") { //activate correct player.
					samplePlayers.trackerSampleChooser.active = true;
					trackerKeys = true;
				} //activate items if tracker
			}, //showPanel

			showSubpanel = function (name) {
				$(".subpanel").hide();
				$("#" + name).show();
				if (name === "import") {
					$("#importSongSamples").hide();
					samplePlayers.importSamplesList.active = true; //activate the correct player.
					samplePlayers.importSamplesList.update();
				} //activate import player
			}, //showPanel

updateEffectsPanel = function() {
var n = song.patterns[trackerCurPattern][trackerCurRow][trackerCurChan];
$("#effectNote").val(n.note);
$("#effectPeriod").val(WebTracker.noteToAmigaPeriod(n.note));
$("#effectSample").val(n.sample);
$("#effectP1Box").val(n.effect.p1);
$("#effectP2Box").val(n.effect.p2 || 0);
$("#effectP1").text(WebTracker.effectParams[n.effect.effect][0]);
$("#effectP2").text((WebTracker.effectParams[n.effect.effect][1]) || "unused");
$("#effectEffects").val(n.effect.effect);
}, //updateEffects

			update = function () {
				document.title = song.title + ": Web Tracker";
				$("#songTitle").prop('value', song.title)
				$("#filesFilename").html("current file: " + filename + " - " + song.title)
				$("#songMessage").html(song.samples.map(function (s) {
					return s.title;
				}).join("<br>"));
				$("#trackerChannelWidth").val(trackerChanWidth);
				$("#trackerCurrentPattern").val(trackerCurPattern);
				$("#trackerAdding").val(trackerAddRows);
				for (var i in samplePlayers) {
					samplePlayers[i].update();
				} //update the players.
				buildPatternEditor();
				buildPatternTable();
				buildTrackerTable();
				songPlayer.update();
				$("#patternTempo").val(songPlayer.bpm);
			}, //updatesafter changes are made.

			fillSamplePlayers = function () {
				samplePlayers.trackerSampleChooser.samples = song.samples; //give the array to the sampler.
				samplePlayers.trackerSampleChooser.noteCallback=trackerNoteCallback;
				samplePlayers.samplesSampleChooser.samples = song.samples; //give the array to the sampler.
				samplePlayers.importSongSamples.samples = song.samples;
				samplePlayers.importSamplesList.samples = importSamples;
			}, //load the samples in.

			buildPatternEditor = function () {
				var res = "<table>",
					c = song.patternCount;
				for (var i = 0; i < c; i++) {
					res += '<tr><td>' + (i + 1) + '</td><td><button class="patternPlay" id="play:' + i + '">Play Pause</button></td>';
					res += '<td><button class="patternRemove" id="remove:' + i + '">Remove</button></td>';
					res += '<td><button class="patternUp" id="up:' + i + '">Move Up</button></td>';
					res += '<td><button class="patternDown" id="down:' + i + '">Move Down</button></td>'
					res += "</tr>";
				} //i
res += '<tr><td><button id="patternAddPattern">Add Pattern</button></td></tr>';

				res += "</table>";
				$("#editorInfo").html(res);
				$(".patternPlay").click(function () {
					var idx = this.id.split(":")[1];
					songPlayer.playPattern(idx);
				}); //play click
				$(".patternRemove").click(function () {
					var idx = this.id.split(":")[1];
					changed = true;
					song.removePattern(idx);
					update();
				}); //remove click
				$(".patternUp").click(function () {
					var idx = this.id.split(":")[1];
					changed = true;
					song.movePatternUp(idx);
				}); //pattern up click
				$(".patternDown").click(function () {
					var idx = this.id.split(":")[1];
					changed = true;
					song.movePatternDown(idx);
				}); //down click
$("#patternAddPattern").click( function() {
song.createPattern();
buildPatternEditor();
});
			}, //buildPatternEditor

			buildPatternTable = function () {
				var res = "<table><tr>",
					num = 1;
				song.patternOrder.forEach(function (o) {
					res += '<td><a class="patternOrderPlay">' + num + ':</a> <input type="text" class = "patternOrderValue" value="' + (o + 1) + '" id = "patternOrder:' + (num - 1) + '"></td>';
					if (num % 4 == 0) {
						res += "</tr><tr>";
					} //2 collumns
					num++;
				}); //show each pattern
				res += '</tr><tr><td><button id="patternOrderAdd">Add</button></td><td></td><td><button id="patternOrderRemove">Remove</td><td></td></tr></table>'
				$("#patternTable").html(res);
				$("#patternOrderAdd").click(function () {
					if (song.patternCount > 0) {
						song.patternOrder[song.totalPatterns++] = 0;
						changed = true;
						update();
						$("#patternOrderAdd").focus();
					} else {
						alert("Please create a pattern in the editor first.");
					} //no point in adding a slot to put patterns if none exist.
				}); //patternOrderAdd click
				$(".patternOrderValue").focusout(function () {
					var idx = +(this.id.split(":")[1]),
						val = +(this.value);
					if (isNaN(val) || val > song.patternCount) {
						alert("Please enter a number between " + 1 + " and " + song.patternCount + ".");
						$(this).focus();
					} else {
						song.patternOrder[idx] = val - 1;
						changed = true;
					} //if it's a valid number, set it in the song.
				}); //text field change.
				$("#patternOrderRemove").click(function () {
					if (song.totalPatterns <= 0) {
						alert("No slots to remove.");
					} else {
						song.totalPatterns--;
						song.patternOrder.pop();
						changed = true;
						update();
						$("#patternOrderRemove").focus();
					} //remove if there are slots
				}); //remove clicked
				$(".patternOrderPlay").click(function () {
					var v = $(this).html().split(":")[0];
					v = (+v) - 1;
					songPlayer.playFromSlot(v);
				}); //play from pattern
			}, //build pattern order html table

			buildTrackerTable = function () {
				var p,
					res = "<table>";
				p = song.patterns[trackerCurPattern];
				res += "<tr><th>row</th>";
				for (var j = 0; j < trackerChanWidth; j++) {
					res += "<th>chn</th><th>smp</th><th>note</th><th>eff</th><th>|</th>";
				} //j
				res += "</tr>"
				for (var i = 0; i < p.length; i++) {
					res += '<tr><td><label><input type="checkbox" id="trackerRow-' + i + '" value = "' + i + '" class="trackerRowSelect">' + (i + 1) + '</label></td>';
					for (var j = trackerStartChan; j < trackerChanWidth + trackerStartChan; j++) {
						var n = p[i][j],
id="trackerBtn-" + i + "-" + j + "-";
						res += '<td><label><input type="checkbox" value="' + i + ':' + j + '" id="' + id + '0" class="trackerSelectNote">' + (j + 1) + '</label></td>';
						res += '<td><button id="' + id + '1" class = "trackerSample">' + n.sample + '</button></td>';
						res += '<td><button id="' + id + '2" class = "trackerNote">' + WebTracker.midiNoteToName(n.note) + '</button></td>';
						res += '<td><button id="' + id + '3" class="trackerEffect">' + WebTracker.effectToString(n.effect) + '</button></td>';
						res += "<td>|</td>";
					} //j
					res += "</tr>";
//alert("i: " + i + ", note: " + WebTracker.midiNoteToName(p[i][0].note) + ", effect: " + WebTracker.effectToString(p[i][0].effect));
				} //i
				res += "</table>";
				$("#trackerTable").html(res);
$(".trackerNote").click(function() {
setTrackerVarsFromId(this).attr("id");
trackerPlayNote();
}).focus(function() {
setTrackerVarsFromId($(this).attr("id"));
trackerPlayNote();
});
$(".trackerEffect").focus(function() {
setTrackerVarsFromId($(this).attr("id"));
updateEffectsPanel();
}).click(function() {
$("#trackerTable").hide();
setTrackerVarsFromId($(this).attr("id"));
updateEffectsPanel();
samplePlayers.trackerSampleChooser.active = false;
trackerKeys = false;
$("#trackerEffects").show();
$("#effectSample").focus();
});
$(".trackerRowSelect").click(function() {
var r = +this.value,
c=this.checked;
for (var i = trackerStartChan; i < trackerChanWidth - trackerStartChan; i++) {
$("#trackerBtn-" + r + "-" + i + "-0").attr('checked', c);
} //i
}); //row checkbox clicked
$(".trackerSelectNote").click(function() {
if (!this.checked) {
$("#trackerRow-" + +this.value.split(":")[0]).attr('checked', false);
} //if not checked
}); //note selector clicked
			}, //buildTrackerTable

setTrackerVarsFromId = function(id) {
var v = id.split("-");
trackerCurRow = v[1];
trackerCurChan = v[2];
trackerCurBtn = v[3];
}, //setTrackerVarsFromId

			trackerFocus = function () {
var id = "#trackerBtn-" + trackerCurRow + "-" + trackerCurChan + "-" + trackerCurBtn;
				$(id).focus();
			}, //trackerFocus

getSelectedNotes = function() {
var res = [];
$(".trackerSelectNote:checked").each(function(box) {
var p = this.value.split(":");
res.push({x: p[1], y: p[0]});
}); //for each selected box
if (res.length === 0) {
res.push({x: trackerCurChan, y: trackerCurRow});
} //if none are checked, we want to copy the currently active note.
return song.getNotesAtPoints(trackerCurPattern, res);
}, //getSelectedNotes

selectNoNotes = function() {
$(".trackerSelectNote:checked").prop('checked', false);
$(".trackerSelectRow:checked").prop('checked', false);
},

			trackerNextBtn = function () {
				var c = trackerCurChan,
					b = trackerCurBtn,
					cl = trackerStartChan + trackerChanWidth,
					bl = trackerButtonsPerChan;
				b++; //next
				if (b >= bl) {
if (c < cl-1) { //next channel
c++;
b=0;
} else {
b--;
} //if channels
} //if buttons
trackerCurBtn = b;
trackerCurChan = c;
				trackerFocus();
			}, //trackerNextBtn

			trackerPrevBtn = function () {
				var c = trackerCurChan,
					b = trackerCurBtn,
					bl = trackerButtonsPerChan;
				b--;
				if (b < 0) {
if (c > trackerStartChan) {
					b = bl - 1;
					c--;
				} else {
b++; //put it back
} //move channels?
} //b out of bounds
				trackerCurBtn = b;
 				trackerCurChan = c;
				trackerFocus();
			}, //trackerPrevBtn

			trackerPrevRow = function () {
				trackerCurRow = trackerCurRow >= 1 ? +trackerCurRow - 1 : +trackerCurRow; //do nothing if 0.
				trackerFocus();
			}, //trackerPrevRow

			trackerNextRow = function () {
				trackerCurRow = trackerCurRow < song.patterns[trackerCurPattern].length - 1 ? +trackerCurRow + 1 : +trackerCurRow; //do nothing if already at end
				trackerFocus();
			}, //trackerNextRow

			trackerPrevPattern = function () {
				trackerCurPattern = trackerCurPattern >= 1 ? trackerCurPattern - 1 : trackerCurPattern; //do nothing if 0.
				buildTrackerTable();
				trackerFocus();
			}, //trackerPrevRow

			trackerNextPattern = function () {
				trackerCurPattern = trackerCurPattern < song.patterns.length - 1 ? trackerCurPattern + 1 : trackerCurPattern; //do nothing if already at end
				buildTrackerTable();
				trackerFocus();
			}, //trackerNextPattern

			trackerNextChan = function () {
				if (trackerCurChan < trackerStartChan + trackerChanWidth - 1) {
					trackerCurChan++;
					trackerFocus();
				} //if there's room
			}, //trackerNextChan

			trackerPrevChan = function () {
				if (trackerCurChan > trackerStarChan) {
					trackerCurChan--;
					trackerFocus();
				} //if there's room, move
			}, //trackerPrevChan

trackerPlayNote = function() {
songPlayer.quickPlayNote(trackerCurPattern, trackerCurRow, trackerCurChan);
},

trackerNoteCallback = function(s, n) {
if (+trackerCurBtn === 2) {
s++;
song.patterns[trackerCurPattern][trackerCurRow][trackerCurChan].sample = s;
song.patterns[trackerCurPattern][trackerCurRow][trackerCurChan].note = n;
$("#trackerBtn-" + trackerCurRow + "-" + trackerCurChan + "-2").html(WebTracker.midiNoteToName(n));
$("#trackerBtn-" + trackerCurRow + "-" + trackerCurChan + "-1").html(s);
}
}, //trackerNoteCallback

			newSong = function () {
				changed = false;
				song = new WebTracker.AmigaSong();
				song.createPattern();
				song.patternOrder = [0];
				filename = "untitled.mod";
				refreshObjects();
			}, //newSong

			refreshObjects = function () {
				fillSamplePlayers();
				songPlayer = new WebTracker.SongPlayer(song, destination);
				trackerStartChan = 0;
				if (trackerChanWidth > song.channels) {
					trackerChanWidth = song.channels;
				} //make sure we're not showing more channels than the song has.
				update();
			}, //refresh players and other objects.

			init = function () {
				destination.connect(context.destination);
				newSong();
				$(".first").click();
$("#trackerEffects").hide();
var lst = "";
for (var i = 0; i < WebTracker.effects.length; i++) {
lst += '<option value="' + i + '">' + WebTracker.effects[i] + "</option>"
} //i
$("#effectEffects").append(lst).val(0);
			}; //initialize the program

		$(".menu").click(function () {
			showPanel($(this).html().toLowerCase());
			$(".menu").removeAttr("disabled");
			$(this).attr("disabled", "disabled");
		}); //click

		$(".submenu").click(function () {
			showSubpanel($(this).html().toLowerCase());
			$(".submenu").removeAttr("disabled");
			$(this).attr("disabled", "disabled");
		}); //click

		$("#fileOpen").change(function (e) {
			var f = e.target.files[0]; //only open the first selected file
			var reader = new FileReader();
			reader.onload = function (e) {
				var dv = new DataView(e.target.result),
					sng = new WebTracker.AmigaSong();
				if (sng.isValid(dv)) {
					song = sng;
					song.loadMod(dv);
					filename = f.name;
					refreshObjects();
					changed = false;
				} else {
					alert(f.name + " is an invalid Amiga module. Please select only amiga modules (*.mod).");
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
				newSong();
			} //if
		}); //new file creation

		$("#saveButton").click(function () {
			var zip = new JSZip();
			zip.file("readme.txt", "***   " + song.title + " ***\n\nCreated with WebTracker: http://webtracker.com\n\nUnleash your creativity!\n");
			zip.file(filename, song.saveMod(true)); //true = return ArrayBuffer. 
			var htm = '<a href="' + 'data:application/zip;base64,' + zip.generate() + '">Click to download</a>';
			$("#saveLink").html(htm);
			changed = false;
		}); //save click

		$("#importClear").click(function () {
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

		$("#importImport").click(function () {
			if (importSelected) {
				var smp = samplePlayers.importSamplesList.currentSample,
					i = samplePlayers.importSongSamples.sampleIndex;
				if (confirm("Warning: replacing sample " + (i + 1) + ": (" + song.samples[i].title + ") with the selected sample. Continue?")) {
					smp.title = song.samples[i].title;
					song.samples[i] = smp; //replace
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

		$("#importAdd").change(function (e) {
			var f = e.target.files; //all the files the user selected.
			var reader = new FileReader();
			reader.onload = function (e) {
				var data = e.target.result,
					dv = new DataView(data),
					s; //song or sample temp var
				s = new WebTracker.AmigaSong();
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
						function (audio) { //callback for successful decode
							s = new WebTracker.AmigaSample();
							s.data = audio;
							importSamples[importSamples.length] = s;
							fillSamplePlayers();
							update();
						}, //decodeAudioData success
						function () { //error callback
							alert("This browser is unable to decode the data in one of the files. Perhaps another browser will be able to, save your work and open another browser to add the file.");
						}); //decodeAudioData
				} //else
			}; //onload
			for (var i = 0; i < f.length; i++) {
				var theFile = f[i];
				reader.readAsArrayBuffer(theFile);
			}; //for
		}); //fileImportAdd change (in file/open menu

		$(".songPlay").click(function () {
			songPlayer.playSong();
		});

		$("#songTitle").focusout(function () {
			var t = $(this).prop('value');
			if (t !== song.title) {
				if (confirm("Changing song title to '" + t + "'. Proceed?")) {
					song.title = t;
					changed = false;
					update();
				} //if user says yes
			} //if titles don't match
		}); //songTitle leave focus

		$("#patternTempo").focusout(function () {
			var v = +this.value;
			if (v && v < 32) {
				alert("Please enter a number larger than 32.");
				this.value = songPlayer.bpm;
			} else {
				songPlayer.bpm = v;
			} //if
		}); //tempo loose focus

$("#trackerPlay").click(function() {
songPlayer.playPattern(trackerCurPattern);
}); //trackerPlay click

		$("#trackerChannelWidth").focusout(function () {
			var v = +this.value;
			if (v > song.channels) {
				v = this.value = song.channels;
			}
			trackerChanWidth = v;
			buildTrackerTable();
		}); //leave focus on tracker channel width

		$("#trackerPrevChan").click(function () {
			trackerStartChan -= trackerChanWidth;
			if (trackerStartChan < 0) {
				trackerStartChan = 0;
			}
			buildTrackerTable();
		}); //trackerPrevChan clicked

		$("#trackerNextChan").click(function () {
			trackerStartChan += trackerChanWidth;
			if (trackerStartChan + trackerChanWidth >= song.channels) {
				trackerStartChan = song.channels - 1 - trackerChanWidth;
			}
			buildTrackerTable();
		}); //trackerNextChan clicked

		$(document).keyup(function (e) {
			var k = e.which;
			if (e.ctrlKey) { //if control is down,
				if (k >= 49 && k <= 53) {
					var b = "#" + ("btnFiles btnSamples btnSong btnPatterns btnTracker".split(" ")[k - 49])
					$(b).click();
				} //ctrl+1--5
			} //ctrl down
			if (trackerKeys) {
				switch (k) {
				case 37: //left arrow
					trackerPrevBtn();
return false;
				break;
				case 39: //right
					trackerNextBtn();
return false;
					break;
				case 38: //up arrow
					trackerPrevRow();
return false;
					break;
				case 40: //down
					trackerNextRow();
return false;
					break;
case 51: //#
if (e.shiftKey) $("#trackerTranspose").click();
return false;
break;
case 220: //\
if (e.shiftKey) { // |
$("#trackerSelectRect").click();
} else { // \
$("#trackerCopy").click();
} //| or \
return false;
break;
case 191: // /
if (e.shiftKey) { // ?
$("#trackerSelectAll").click();
} else { // /
$("#trackerPaste").click();
} // ? or /
return false;
break;
case 13:
$("#trackerPlay").click();
return false;
break;
case 33: //pjup
if (e.shiftKey) {
if (trackerCurPattern - 1 > 0) {
trackerCurPattern -= 1;
buildTrackerTable();
trackerFocus();
$("#trackerCurrentPattern").val(trackerCurPattern);
} //if we can change patterns.
} else { //no shift key
trackerCurRow = 0;
trackerFocus();
} //if shift or not
return false;
break;
case 34: //pjdwn
if (e.shiftKey) {
if (trackerCurPattern + 1 < song.patternCount) {
trackerCurPattern += 1;
buildTrackerTable();
trackerFocus();
$("#trackerCurrentPattern").val(trackerCurPattern);
} //if can switch pattern
} else { //if shift key was down
trackerCurRow = song.patterns[trackerCurPattern].length - 1;
trackerFocus();
} //shift or not
return false;
break;
case 36: //home
if (e.shiftKey) {
trackerCurPattern = 0;
} else { //no shift
trackerCurChan = trackerStartChan;
} //shift or not
trackerFocus();
return false;
break;
case 35: //end
if (e.shiftKey) {
trackerCurPattern = song.patternCount - 1;
} else { //shift not down.
trackerCurChan = trackerStartChan + trackerChanWidth - 1;
} //shift or not
trackerFocus();
return false;
break;
				default:
					break;
				} //arrows
			} //trackerKeys
		}); //keydown

$("#effectNote").focusout(function() {
$("#effectPeriod").val(WebTracker.noteToAmigaPeriod(this.value));
}); //effectNote lose focus

$("#effectPeriod").focusout(function() {
$("#effectNote").val(WebTracker.amigaPeriodToNote(this.value));
}); //effectPeriod loose focus

$(".effectCancel").click( function() {
$("#trackerEffects").hide();
buildTrackerTable();
$("#trackerTable").show();
trackerFocus();
samplePlayers.trackerSampleChooser.active = true;
trackerKeys = true;
}); //effectCancel click

$(".effectSave").click(function() {
$("#trackerEffects").hide();
var n = song.patterns[trackerCurPattern][trackerCurRow][trackerCurChan];
n.sample = $("#effectSample").val();
n.note = $("#effectNote").val();
n.effect.effect = $("#effectEffects").val();
n.effect.p1 = $("#effectP1Box").val();
n.effect.p2 = $("#effectP2Box").val();
buildTrackerTable();
$("#trackerTable").show();
trackerFocus();
samplePlayers.trackerSampleChooser.active = true;
trackerKeys = true;
}); //save click

$("#trackerCurrentPattern").focusout(function() {
trackerCurPattern = this.value;
alert("changing to pattern " + trackerCurPattern);
trackerCurRow = trackerCurBtn = 0;
buildTrackerTable();
trackerFocus();
}); //trackerCurrentPattern focus out

$("#trackerSelectAll").click(function() {
$(".trackerSelectNote").attr("checked", true);
$(".trackerRowSelect").attr("checked", true);
}); //selectAll click

$("#trackerSelectRect").click(function() {
var rows = $(".trackerRowSelect:checked");
if (rows.length >= 2) {
var start = +rows[0].value,
end = +rows[rows.length-1].value;
for (var i = start+1; i < end; i++) {
var btn = $("#trackerRow-" + i);
if(!btn.prop('checked')) {
btn.click();
} //if not checked already, click it.
} // i
} else { //if it's not the rows, it's the notes.
var n = $(".trackerSelectNote:checked");
if (n.length !== 2) {
alert("Error, to select inside a boundary of notes, exactly two notes can be checked.");
} else {//if not 2 notes
var p1 = n[0].value.split(":"),
p2 = n[n.length-1].value.split(":");
p1 = {x: +p1[1], y: +p1[0]};
p2 = {x: +p2[1], y: +p2[0]};
var rect = WebTracker.getRectPoints(p1, p2);
for (var i = 0; i < rect.length; i++) {
for (var j = 0; j < rect[i].length; j++) {
var p = rect[i][j];
$("#trackerBtn-" + p.y + "-" + p.x + "-0").prop("checked", true);
} //j
} //i
} //if length is right
} //if rows or notes
}); //select rectangle

$("#trackerCopy").click(function() {
trackerClipboard = getSelectedNotes();
selectNoNotes();
}); //trackerCopy click

$("#trackerPaste").click(function() {
alert("pasting.");
if (trackerClipboard.length > 0) {
var p = trackerClipboard[0],
xoff = trackerCurChan - p.x,
yoff = trackerCurRow - p.y;
song.putNotesAtPoints(trackerCurPattern, xoff, yoff, trackerClipboard);
buildTrackerTable();
trackerFocus();
} //if the clibpoard isn't empty
}); //trackerPaste click

$("#trackerSelectNone").click(selectNoNotes) //clear selection

$("#trackerTranspose").click(function() {
var n = getSelectedNotes() 
if (n.length > 0) {
var t = +prompt("Please enter the number of simitones to transpose (negative `-~ numbers transpose down.)");
if (!isNaN(t)) {
song.transposeNotes(n, t);
buildTrackerTable();
trackerFocus();
} else { //now it's not a number.
alert("Error: Please enter a valid number. Ecamples: -5: transpose down 5 simitones; 9: transpose up 9 simitones.");
} //if the user entered a number
} else { //now we know no notes were selected.
alert("Error: Please select the notes to transpose first.");
} //if we have notes
}); //tracker transpose
		init();
	}); //ready
} else {
	alert('Some required features are unavailable in this browser. Please upgradee this browser or use another. We recommend Google Chrome or Mozilla Firefox.');
} //else