var WebTracker = WebTracker || {};

//initialize webaudio
WebTracker.context = window.AudioContext || window.webkitAudioContext;
WebTracker.context = new WebTracker.context();

WebTracker.stringReader = function (buffer) {
var dataView = (buffer instanceof ArrayBuffer) ? new DataView(buffer) : buffer;
return function(offset, length) {
var res = [],
end = offset + length,
chr;
while (offset < end) {
var tmp = dataView.getUint8(offset);
if (tmp === 0) break;
offset++;
res.push(tmp);
}
return String.fromCharCode.apply(null, res);
}; //readString
}; //stringReader

WebTracker.stringWriter = function (dataView) {
return function(txt, offset, length) {
var st = txt.slice(0, length),
l=st.length;
for (var i = 0; i < l; i++) {
dataView.setUint8(offset + i, st.charCodeAt(i));
} //i
}; //writeString
}; //stringWriter

//this function is not mine, find it at https://gist.github.com/jonleighton/958841
//Give credit where credit is due.
// Converts an ArrayBuffer directly to base64, without any intermediate 'convert to string then
// use window.btoa' step. According to my tests, this appears to be a faster approach:
// http://jsperf.com/encoding-xhr-image-data/5

WebTracker.base64ArrayBuffer = function(arrayBuffer) {
  var base64    = ''
  var encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

  var bytes         = new Uint8Array(arrayBuffer)
  var byteLength    = bytes.byteLength
  var byteRemainder = byteLength % 3
  var mainLength    = byteLength - byteRemainder

  var a, b, c, d
  var chunk

  // Main loop deals with bytes in chunks of 3
  for (var i = 0; i < mainLength; i = i + 3) {
    // Combine the three bytes into a single integer
    chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]

    // Use bitmasks to extract 6-bit segments from the triplet
    a = (chunk & 16515072) >> 18 // 16515072 = (2^6 - 1) << 18
    b = (chunk & 258048)   >> 12 // 258048   = (2^6 - 1) << 12
    c = (chunk & 4032)     >>  6 // 4032     = (2^6 - 1) << 6
    d = chunk & 63               // 63       = 2^6 - 1

    // Convert the raw binary segments to the appropriate ASCII encoding
    base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d]
  }

  // Deal with the remaining bytes and padding
  if (byteRemainder == 1) {
    chunk = bytes[mainLength]

    a = (chunk & 252) >> 2 // 252 = (2^6 - 1) << 2

    // Set the 4 least significant bits to zero
    b = (chunk & 3)   << 4 // 3   = 2^2 - 1

    base64 += encodings[a] + encodings[b] + '=='
  } else if (byteRemainder == 2) {
    chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1]

    a = (chunk & 64512) >> 10 // 64512 = (2^6 - 1) << 10
    b = (chunk & 1008)  >>  4 // 1008  = (2^6 - 1) << 4

    // Set the 2 least significant bits to zero
    c = (chunk & 15)    <<  2 // 15    = 2^4 - 1

    base64 += encodings[a] + encodings[b] + encodings[c] + '='
  }
  
  return base64
}; //base64ArrayBuffer

WebTracker.restrictRange = function(x, min, max) {
if (x < min) {
x = min;
} else if (x > max) {
x = max;
}
return x;
}; //restrictRange

WebTracker.midiNoteToName = (function() {
var notes = "c db d eb e f gb g ab a bb b".split(" "),
floor = Math.floor,
round = Math.round;
return function(n) {
if (n === 0) {
return "-";
} else {
n = round(n);
return (floor(n/12)) + notes[n % 12];
} //if note is 0 it's a non-note.
}; //inner
})(); //midiNoteToName

WebTracker.noteToAmigaPeriod = (function() {
var pow = Math.pow,
f = pow(2, 1 / 12); //12; //th root of 2
return function(n) {
			if (n != 0) {
return 428 * pow(f, -1 * (n - 60));
} else {
return 0;
} //0 note = 0 music.
}; //inner
})(); //noteToAmigaPeriod

WebTracker.amigaPeriodToNote = (function() {
var log = Math.log,
d = log(Math.pow(2, 1 / 12)); //devide log(period/428)/d = note.
return function(p) {
return p > 0 ? 60 + log(428 / p) / d : 0;
}; //amigaPeriodToNote
})(); //closure amigaPeriodToNote

WebTracker.getRectPoints = function(p1, p2) {
var ctrStats = function(a, b) {
var diff = b-a,
dir = diff < 0 ? -1 : 1;
return {diff:diff, dir:dir};
}, //ctrStats
tmp,
res = [],
xdir = ctrStats(p1.x, p2.x);
ydir = ctrStats(p1.y, p2.y);
//fix crazy points.
if (p1.x > p2.x && p1.y > p2.y) {
tmp = p2;
p2=p1;
p1=tmp;
} //swap if backwards.
else if (p1.x > p2.x) {
tmp = p2.x;
p2.x = p1.x;
p1.x = tmp;
} //if p1.x > p2.x
else if (p1.y > p2.y) {
tmp = p2.y;
p2.y = p1.y;
p1.y = tmp;
} //if points are crazy
for (var j = p1.y; j !== p1.y + ydir.diff + ydir.dir; j += ydir.dir) {
var jIdx = j-p1.y;
res[jIdx] = [];
for (var i = p1.x; i !== p1.x + xdir.diff + xdir.dir; i += xdir.dir) {
var iIdx = i-p1.x;
res[jIdx][iIdx] = {x: i, y: j};
} //i
} //j
return res;
}; //getRectPoints

WebTracker.resample = function(buffer, oldRate, newRate, callback) {
var context = window.OfflineAudioContext || window.webkitOfflineAudioContext;
var playRate = oldRate / newRate,
newLen = Math.ceil(buffer.length * (newRate / oldRate)),
chans=buffer.numberOfChannels,
src;
context = new context(chans, newLen, WebTracker.context.sampleRate); //it's the constructor we get, instanciate it.
src = context.createBufferSource();
src.buffer = buffer;
src.playbackRate.value = playRate;
src.start(0); //starts when renderBuffer called.
src.connect(context.destination);
context.oncomplete = function(e) {
callback(e.renderedBuffer);
}; //resampleCallback
//setup complete. Play the sample.
context.startRendering();
}; //resample

	WebTracker.amigaEffect = (function() {
var effect = WebTracker.effect;
return function (e, p) {
		var x = ((p & 0xf0) >> 4),
			y = p & 0x0f;
		//set efects
		switch(e) {
			case 0:
			if (p === 0) {
				return effect(e, p);
			} else {
return effect(1, x, y);
}
break;
//falls through
case 1: //slide up
case 2: //slide down
case 3: //slide to note
return effect(e+1, p);
break;
case 4: //vibrato
return effect(5, x, y);
break;
//next ones fall through
case 5: //continue note slide + slice volume
case 6: //continue note slide + vibrato
return effect(e+1, x > 0 ? x : -y);
break;
case 7: //tremolo
return effect(e, x, y);
break;
case 8: //supposed to be unused, suspect pan.
return effect(e+1, p);
break;
case 9: //set ssample offset
return effect(10, p << 8);
break;
case 10: //volume slide
return effect(11, x > 0 ? x : -y);
break;
case 11: //position jump
return effect(e+1, p);
break;
case 12:  //set volume
return effect(13, p/64);
break;
case 13: //pattern break
return effect(14, (x*10) + y);
break;
case 14: //sub-effect
			e = x + 15;
			return effect(e, y);
break;
case 15: //set tempo
var r = p <= 32 ? Math.round(750 / p) : p
return effect(31, r); //< 32 = ticks per row.
break;
} //switch
	}; //amigaEffect
})(); //closure amegaEffect

	WebTracker.toAmigaEffect = function (effect) {
		var e = +effect.effect,
p1=+effect.p1,
p2=+effect.p2,

			encode = function (e, x, y) {
				return [e, (x << 4) | y];
			}; //encode

		//set efects
switch (e) {
case 0: //no effect
return [0, 0];
break;
			case 1: //arpeggio
return encode(0, p1, p2);
break;
//falls through
case 2: //slide up
case 3: //slide down
case 4: //slide to note
return [e-1, p1];
break;
case 5: //vibrato
return encode(e-1, p1, p2);
break;
//next ones fall through
case 6: //continue note slide + slide volume
case 7: //continue note slide + vibrato
if (p1 < 0) {
return encode(e-1, 0, -1 * p1);
} else { //p1 posative
return encode(e-1, p1, 0);
} //x or y for p1
break;
case 8: //tremolo
return encode(7, p1, p2);
break;
case 9: //supposed to be unused, suspect pan.
return [e-1, p1];
break;
case 10: //set ssample offset
return [9, p1 >> 8];
break;
case 11: //volume slide
if (p1 < 0) {
return encode(e-1, 0, p1 * -1);
} else { //p1 posative
return encode(e-1, p1, 0);
} //x or y for p1
break;
case 12: //position jump
return [e-1, p1];
break;
case 13:  //set volume
return [12, p1 * 64];
break;
case 14: //pattern break
var y = p1 % 10;
return encode(13, (p1 - y) / 10, y);
break;
//next ones fall through, be ware.
case 25:
case 26:
return encode(14, e - 15, p1);
break;
case 31: //set tempo
return [15, p1];
break;
default: // the others
return encode(14, e - 15, p1 * 64);
break;
} //switch
	}; //toAmigaEffect
