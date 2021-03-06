const fs = require('fs');
const path = require('path');
const RtpPacket = require('node-rtp/lib/rtppacket').RtpPacket;

const bufferSize = 320;


let numberOfSlices  = Math.ceil(data.length / bufferSize);
let buffers = [];


let buffSliceIter = bufferSize - 1; // from (buffer[0] to buffer[bufferSize - 1])
let lastIndexOfSlice = 0;

for(let i = 0; i < numberOfSlices; i++) {
  buffers.push(data.slice(lastIndexOfSlice, buffSliceIter + 1));
  lastIndexOfSlice = buffSliceIter + 1;
  buffSliceIter += bufferSize;
}

console.log(buffers[0]);
console.log(buffers);

let buffIter = 0;
let bufTmp = new Buffer.alloc(320);
const udp = require('dgram');
let	fd, sock, rtp, intvl, buf, bytesRead, ip, port,
writeData = function() {
  if (buffIter < numberOfSlices) {
    if(buffIter == numberOfSlices - 1) {
      buffIter = 0;
    }
    bufTmp = buffers[buffIter];
    if (!rtp)
    {
      rtp = new RtpPacket(bufTmp);
    }
    else
    {
      console.log(`rtppacket: ${rtp.packet}`);
      rtp.payload = bufTmp;
      rtp.time += bufTmp.length;
      rtp.seq++;
      console.log(buffIter);
      console.log(numberOfSlices - 1);
      buffIter++;

      if (!sock)
        sock = udp.createSocket('udp4');
//fs.writeFileSync(`/home/alinux/tmp/${tmpName.toString()}.rtp`, rtp.packet);


      sock.send(rtp.packet, 0, rtp.packet.length, port, ip);
      
      /*if (intvl)
        clearInterval(intvl);*/
        //fs.closeSync(fd);
      //if (sock)
        //sock.close(); // dgram module automatically listens on the port even if we only wanted to send... -_-

      }
  }
};



ip = "192.168.98.222";
port = 60000;
//fd = fs.openSync('audio.g711', 'r');
intvl = setInterval(writeData, 10);
