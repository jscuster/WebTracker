var WebTracker = WebTracker || {};
if (window.File && window.FileReader && window.FileList && window.Blob && (window.AudioContext || window.webkitAudioContext)) {
	$(function () {
		'use strict';
		var context = WebTracker.context,
			destination = context.createDynamicsCompressor(),
			changed = false,
			song,
			initialized = false;

		destination.connect(context.destination);

		$(".songPlay").click(function () {
			if (initialized) {
				songPlayer.playSong();
			} //don't try it if not initialized.
		});

		$("#fileOpen").change(function (e) {
			var f = e.target.files[0]; //only open the first selected file
			var reader = new FileReader();
			reader.onload = function (e) {
				var dv = new DataView(e.target.result);
				if (WebTracker.isValidAmigaModule(dv)) {
					song = WebTracker.loadAmigaMod(dv);
				var songPlayer = new WebTracker.SongPlayer(song, destination);
				songPlayer.playSong();
				} else {
					alert("No loader was found to load " + f.name + ". This file is unsupported. Currently we support: .mod formats.");
				} //else
			}; //onload
			reader.readAsArrayBuffer(f);
		}); //fileOpen change (in file/open menu
}); //on load
} //if audio supported
