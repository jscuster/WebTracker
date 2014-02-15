
//files are at the bottom.
window.onload = function () {
	(function (scripts) {
		var l = scripts.length;
		ptr = 0,
		head = document.getElementsByTagName('head')[0],
		load = function () {
			var s = document.createElement('script');
			s.type = "text/javascript";
			s.src = 'scripts/' + scripts[ptr++] + ".js";
			if (ptr < l) {
				s.onload = load;
				s.onreadystatechange = function () {
					if (this.readyState == 'complete') load();
				} //onreadystatechange
			} //if
			head.appendChild(s);
		}; //load each script in the array after the prev one is done.
		load(); //start it off.
	})([ //files in order of priority, skip folder and .js extension. 
'jquery-2.0.3',
'log',
'utils',
'sample',
'note',
'instrument',
'song',
'amigaUtils',
'readAmiga',
'writeAmiga',
'sampler',
'songplayer',
'sampleManager',
'jszip',
'jszip-deflate',
'jszip-inflate',
'jszip-load',
'webtracker'
]); //outer func, prepairs to load files.
}; //onload