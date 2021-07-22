const fs = require('fs');
const path = require('path');
const util = require('util');
let buffer = require('buffer').Buffer;
/*const RtpPacket = require('.../lib/rtppacket').RtpPacket;
let sock,	fd, sock, rtp, intvl, buf, bytesRead, ip, port,
writeData = function() {

}*/
let bufferSize = 320;

buffer = new Buffer(bufferSize);

let fileName = "123";
let filePath = path.join(__dirname, 'uploads', fileName + '.wav');

console.log(filePath);

let file = fs.readFileSync(filePath);

let file_1 = file.slice(0, 319);
let toRound = Math.ceil;
let numberOfSlices  = toRound(file.length / bufferSize);
let lastBytes = file.length % bufferSize;
let buffers = [];
let buffSliceIter = bufferSize - 1; // from (buffer[0] to buffer[bufferSize - 1])
let tmp = 0;
  console.log(buffSliceIter);

let completeLength = 0;

for(let i = 0; i < numberOfSlices; i++) {
  buffers.push(file.slice(tmp, buffSliceIter));
  tmp = buffSliceIter + 1;
  buffSliceIter += bufferSize;
}

console.log(`number of slices: ${numberOfSlices}`);
