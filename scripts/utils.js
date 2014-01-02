var WebTracker = WebTracker || {};

WebTracker.readString = function (buffer, offset, length) {
var dataView = (buffer instanceof ArrayBuffer) ? new DataView(buffer) : buffer,
res = [],
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

WebTracker.writeString = function (dataView, txt, offset, length) {
var st = txt.slice(0, length),
l=st.length;
for (var i = 0; i < l; i++) {
dataView.setUint8(offset + i, st.charCodeAt(i));
} //i
}; //writeString
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

//initialize webaudio
WebTracker.context = window.AudioContext || window.webkitAudioContext;
WebTracker.context = new WebTracker.context();

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