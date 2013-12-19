var WebTracker = WebTracker || {};
if (window.File && window.FileReader && window.FileList && window.Blob) {
	$(function () {
 		'use strict';
		window.AudioContext = window.AudioContext || window.webkitAudioContext;
		var context = new window.AudioContext();
WebTracker.context = context;

			$("#file").change(function (e) {
				var files = e.target.files;
				for (var i = 0, f; f = files[i]; i++) {
					var reader = new FileReader();
					reader.onload = function (e) {
						var dv = new DataView(e.target.result);
WebTracker.context = context;
						var sng = new WebTracker.AmigaMod();
sng.loadMod(dv);
						var o = "<table><tr><td>title:</td><td>" + sng.title + "</td></tr>";
						o += "<tr><td>channels</td><td>" + sng.channels + "</td></tr>";
						o += "<tr><td>patterns</td><td>" + sng.patternCount + "</td></tr>";
						o += "<tr><td>samples</td></tr>"
						for (var i = 0; i < 31; i++) {
							o += "<tr><td>sample " + i + "</td><td><table><tr><td>title:</td><td>" + sng.samples[i].title + "</td></tr>";
							o += "<tr><td>length</td><td>" + sng.samples[i].length + "</td></tr>";
							o += "<tr><td>volume</td><td>" + sng.samples[i].volume + "</td></tr>";
							o += "<tr><td>finetune</td><td>" + sng.samples[i].finetune + "</td></tr>";
							o += "<tr><td>loop start</td><td>" + sng.samples[i].loopStart + "</td></tr>";
							o += "<tr><td>loop Length</td><td>" + sng.samples[i].loopLength + "</td></tr></table></tr>";
						} //i
						for (var i = 0; i < sng.patternCount; i++) {
							o += "<H1>Pattern " + (i + 1) + "</h1><table><tr>" + "<th></th><th>Channel</th><th>1</th><th></th>" + "<th></th><th>Channel</th><th>2</th><th></th>" + "<th></th><th>Channel</th><th>3</th><th></th>" + "<th></th><th>Channel</th><th>4</th><th></th></tr><tr>" + "<td>sample</td><td>period</td><td>factor</td><td>effect</td><td>command</td><td>x</td><td>y</td>" + "<td>sample</td><td>period</td><td>effect</td><td>command</td><td>x</td><td>y</td>" + "<td>sample</td><td>period</td><td>factor</td><td>effect</td><td>command</td><td>x</td><td>y</td>" + "<td>sample</td><td>period</td><td>factor</td><td>effect</td><td>command</td><td>x</td><td>y</td></tr>";
							for (var j = 0; j < 64; j++) {
								o += "<tr>";
								for (var k = 0; k < sng.channels; k++) {
									var p = sng.patterns[i][j][k];
									o += "<td>" + p.sample + "</td><td>" + p.period + "</td><td>" + p.factor + "</td><td>" + "</td><td>" + p.effect + "</td><td>" + p.param + "</td><td>" + p.x + "</td><td>" + p.y + "</td>";
								} //k
								o += "</tr>";
							} //j
							o += "</table>";
						} //i
						o += '<h3>Player</H3><input type="button" value="click" id="smp"><input type="button" id="play" value="play"><input type="button" value="save" id="save"><a href="" id="saveLnk">Click save to create file</A>';
						$("#output").html(o);
						var sptr = 0,
							player = new WebTracker.Sampler(sng.samples);
						$("#smp").click(function () {
							$(this).prop('value', ("" + (sptr + 1)) + sng.samples[sptr].title);
							player.stop(sptr === 0 ? 30 : sptr - 1);
//							player.play(sptr++);
player.play(sptr++, 0, context.currentTime + 1);
player.play(sptr+1, 3, context.currentTime + 2);
player.play(sptr++, 6, context.currentTime + 3);
							sptr = sptr < 31 ? sptr : 0;
						}); //click
						var keys = "zsxdcvgbhnjm".toUpperCase();
						var notes = [];
						for (var i = 0; i < 12; i++) notes[i] = keys.charCodeAt(i);
						var downKey = -1;
						$("#smp").keydown(function (e) {
							var i = notes.indexOf(e.which);
							if (i >= 0 && downKey != i) {
								player.play(sptr, i);
								downKey = i;
							} //if
						}); //keyDown
						$("#smp").keyup(function (e) {
							var i = notes.indexOf(e.which);
							if (i >= 0 && i === downKey) {
								player.stop();
								downKey = -1;
							} //if
						}); //keyUp
$("#play").click(function() {
var n = context.createDynamicsCompressor();
n.ratio.value = 20;
var m = context.createGainNode();
m.gain.value = 0.5;
m.connect(n);
n.connect(context.destination);
var modPlayer = new WebTracker.ModPlayer(sng, context, m);
modPlayer.playSong();
}); //play click
$("#save").click(function() {
var l = $("#saveLnk");
l.html("Generating file.");
var r = sng.saveMod(false);
l.prop("href", "data:application/zip;base64," + r);
l.html("Click to download, rename to [yourname].mod.");
}); //save click
					}; //onload
					reader.readAsArrayBuffer(f);
				} //i
			}); //file changed
	}); //document ready
} else {
	alert('Some required features are unavailable in this browser. Please upgradee this browser or use another. We recommend Google Chrome or Mozilla Firefox.');
} //else