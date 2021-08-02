const fs = require('fs');
const path = require('path');
const RtpPacket = require('node-rtp/lib/rtppacket').RtpPacket;

const bufferSize = 320;

let fileName = "10sec";
let filePath = path.join(__dirname, 'uploads', fileName + '.wav');
let file = fs.readFileSync(filePath);
let numberOfSlices  = Math.ceil(file.length / bufferSize);
let lastBytes = file.length % bufferSize;
let buffers = [];

//console.log(`number of slices: ${numberOfSlices}`);

let buffSliceIter = bufferSize - 1; // from (buffer[0] to buffer[bufferSize - 1])
let lastIndexOfSlice = 0;

for(let i = 0; i < numberOfSlices; i++) {
  buffers.push(file.slice(lastIndexOfSlice, buffSliceIter + 1));
  lastIndexOfSlice = buffSliceIter + 1;
  buffSliceIter += bufferSize;
}

//console.log(`number of buffers: ${buffers.length}`);

 let numberOfRemainingBytes = buffers[buffers.length - 1].length;
 let lastBuffElement = buffers.length - 1;


 let fillRemains = function fillRemainingWithZeroes() {
   let buffer = new Buffer.alloc(320 - numberOfRemainingBytes);
   buffers[lastBuffElement].copy(this.buffer)
}

//  console.log(buffers);



let buffIter = 0;
let bufTmp = new Buffer.alloc(320);
//console.log(`Type of buffers[0]: ${typeof buffers[0]};\nType of Empty buffer: ${typeof bufTmp}`);



//DEBUGGING
  let tmpName = 0;
//

let udp = require('dgram')
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
      //console.log(`rtppacket: ${rtp.packet}`);
      rtp.payload = bufTmp;
      rtp.time += bufTmp.length;
      rtp.seq++;
      console.log(buffIter);
      console.log(numberOfSlices - 1);
      console.log("rtp time: " + rtp.time);
      console.log("rep seq: " + rtp.seq);
      buffIter++;

      if (!sock)
        sock = udp.createSocket('udp4');
          //console.log(`sock: ${sock}`);
      //fs.writeFileSync(`/home/alinux/tmp/${tmpName.toString()}.rtp`, rtp.packet);
      //tmpName++;


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
