var WebTrackerScripts = [ //files in order of priority, skip folder and .js extension. 
'jquery-2.0.3', //Yes, I know using a global var is a sin, but I am open to suggestions, see bottom.
'log',
'utils',
'modHandler',
'sampler',
'modplayer',
'buttontable',
'jszip',
'jszip-deflate',
'jszip-inflate',
'jszip-load'
];
window.onload = function() {
alert(document.getElementById('testingWebTracker'));
if (document.getElementById('testingWebTracker')) {
alert("loading test suite.");
WebTrackerScripts.push('modtester');
} else {
WebTrackerScripts.push('WebTracker');
}; //if we're testing, we need another script.
WebTrackerScripts.forEach((function() {
var head = document.getElementsByTagName( 'head')[0];
return function(file) {
var s = document.createElement('script');
s.type="text/javascript";
s.src = 'scripts/' + file + ".js";
head.appendChild(s);
}; //load each script in the array.
})()); //closure returning inner func, caching head to cut down on load time.
}; //load