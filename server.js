
const http = require('http');
//const server = http.createServer(app);
const url = require('url');
const fs = require('fs');
const uuid = require('node-uuid');
const port = 3000;
const ip = "192.168.98.222";
const Readable = require('stream');
const stream = require('stream');
const WaveFile = require('wavefile').WaveFile;
const udp = require('dgram');
const RtpPacket = require('node-rtp/lib/rtppacket').RtpPacket;
//variable for dubigging this freaking shitty code
let timerVal = 10000;
let	sock, rtp;
let iter = 0;

let fileSequance = 0;


var app = http.createServer(function(request, response) {
  var uri = url.parse(request.url).pathname,
  filename = path.join(process.cwd(), uri);
  console.log(filename);

  fs.exists(filename, function(exists) {
    if(!exists) {
      response.writeHead(404, {
        "Conten-Type": "text/plain"
      });
      response.write('404 Not Found: ' + filename + '\n');
      response.end();
      return;
    }

    if (fs.statSync(filename).isDirectory()) filename += '/index.html';



    fs.readFile(filename, 'binary', function(err, file) {
      if(err) {
        response.writeHead(500, {
          "Content-Type": "text/plain"
        });

        response.write(err + "\n");
        response.end();
      }

      response.writeHead(200);
      response.write(file, 'binary');
      response.end();
    });
  });
}).listen(parseInt(port, 10));

const path = require('path');
const exec = require('child_process').exec;

let io = require('socket.io')(app);

  console.log(`listening on: ${port}`);


io.sockets.on('connection', function(socket) {
  socket.on('message', function(data) {
    socket.emit('ffmpeg-output', 0);
    let bufferNew = new Buffer(data, 'base64');
    let wav = new WaveFile(bufferNew);
    wav.toSampleRate(8000);
    wav.toMuLaw();
    let buffer = new Buffer.alloc(wav.toBuffer().length, wav.toBuffer(), 'base64');
    createAndSendRtpFromBuffer(buffer, ip, 60000);
  });

  socket.on('stop-recording', function() {
    console.log(`Before: fileSequance = ${fileSequance}`);
    fileSequance = 0;
    console.log(`After: fileSequance = ${fileSequance}`);
  })
});



function writeToDisk(data, fileName) {
  let fileExtension = fileName.split('.').pop(),
  fileRootNameWithBase = './uploads/' + fileName,
  filePath = fileRootNameWithBase,
  fileID = 2,
  fileBuffer;

  while (fs.existsSync(filePath)) {
    filePath = fileRootNameWithBase + '(' + fileID + ').' + fileExtension;
    fileID += 1;
  }

  //dataURL = dataURL.split(',').pop();
  fileBuffer = new Buffer(data, 'base64');
  fs.writeFileSync(filePath, fileBuffer);

  console.log('filePath', filePath);
}

function createAndSendRtpFromBuffer(data, ip, port) {


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

  /*for (let i = 0; i < buffers.length; i++) {

  }*/

  buffers.forEach(function(buffer, i) {
    if (!rtp)
    {
      rtp = new RtpPacket(buffer);
    }
    else
    {
      //console.log(`rtppacket: ${rtp.packet}`);
      console.log("rtp time: " + rtp.time);
      console.log("rtp seq: " + rtp.seq);
      rtp.payload = buffer;
      rtp.time += buffer.length;
      rtp.seq++;



      if (!sock)
        sock = udp.createSocket('udp4');
      setTimeout( () => { sock.send(rtp.packet, 0, rtp.packet.length, port, ip)
      console.log("time pass: " + (5*(iter + 1) + "ms"));
      iter++; }, 10 *(i + 1));
   }
  });
}


