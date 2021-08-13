const http = require('http');
const url = require('url');
const fs = require('fs');
const udp = require('dgram');
const path = require('path');
const port = 3000;
const ip = "0.0.0.0";
//const ip = "192.168.98.222";
const WaveFile = require('wavefile').WaveFile;

const RtpPacket = require('node-rtp/lib/rtppacket').RtpPacket;
let sock, rtp;


let fileSequance = 0;
let isRtpDeployed = false;

var app = http.createServer(function (request, response) {
  var uri = url.parse(request.url).pathname,
    filename = path.join(process.cwd(), uri);
  console.log(filename);

  fs.exists(filename, function (exists) {
    if (!exists) {
      response.writeHead(404, {
        "Conten-Type": "text/plain"
      });
      response.write('404 Not Found: ' + filename + '\n');
      response.end();
      return;
    }

    if (fs.statSync(filename).isDirectory()) filename += '/index.html';



    fs.readFile(filename, 'binary', function (err, file) {
      if (err) {
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



let io = require('socket.io')(app);

console.log(`listening on: ${port}`);


io.sockets.on('connection', function (socket) {
  
  socket.on('message', function (data) {
    let buffNum = data;
    let bufferNew = new Buffer(data, 'base64');
    let wav = new WaveFile(buffNum);
    wav.toSampleRate(8000);
    wav.toMuLaw();
    let buffer = new Buffer.alloc(wav.toBuffer().length, wav.toBuffer(), 'base64');
    createAndSendRtpFromBuffer(buffer, ip, 60000);
  });

  socket.on('stop-recording', function () {
    fileSequance = 0;


    if (isRtpDeployed == true) {
      rtp.time = 0;
      rtp.seq = Math.floor(1000 * Math.random());
    }
  })
});


function createAndSendRtpFromBuffer(data, ip, port) {

  const bufferSize = 320;

  let numberOfSlices = Math.ceil(data.length / bufferSize);
  let buffers = [];

  //console.log(`Number of slices: ${numberOfSlices}`);
  //console.log(`Length of packets: ${data.length}`);
  let buffSliceIter = bufferSize - 1; // from (buffer[0] to buffer[bufferSize - 1])
  let lastIndexOfSlice = 0;
  let key = false;
  let base64string = ``;

  for (let i = 0; i < numberOfSlices; i++) {
    buffers.push(data.slice(lastIndexOfSlice, buffSliceIter));
    lastIndexOfSlice = buffSliceIter;
    buffSliceIter += bufferSize;
  }



  let iter = 0;
  let interval = setInterval(function () {

    if (iter < buffers.length) {

      if (iter == 0) {
        //console.log(buffers[iter].slice(0, 88));
        //console.log(buffers[iter].slice(0, 88).toString());
        buffers[iter] = new Buffer(buffers[iter].slice(80, buffers[iter].length));
        
        /* console.log(buffers[iter]);
         console.log("--------------------------------------");
         buffers[iter][0] = 0x52;
         buffers[iter][1] = 0x49;
         buffers[iter][2] = 0x46;
         buffers[iter][3] = 0x46;
         console.log(buffers[iter]);*/
      }
      if (!rtp) {
        rtp = new RtpPacket(buffers[iter]);
        isRtpDeployed = true;

      }
      else {
        rtp.payload = buffers[iter];
        rtp.time += buffers[iter].length;
        rtp.seq++;

        //console.log('========================================================');
        //console.log(buffers[iter]);
        //console.log('++++++++++++++++++++++++++++++++++++++++++++++++++++++++');
        //console.log(rtp.payload);
        //console.log('========================================================\n\n\n\n');

        console.log(`--------------------------------${iter + 1}--------------------------`);
        //console.log("------------RTP---PACKET-----------");
        //console.log(buffers[iter]);
        //console.log(rtp.payload);
        //console.log("-----------------------------------");
        console.log("rtp time: " + rtp.time);
        console.log("rtp seq: " + rtp.seq);
        console.log("rtp length: ", rtp.packet.length);
        //console.log(buffers[iter]);
        if (!sock)
          sock = udp.createSocket('udp4');
        //if(iter != 0)
        sock.send(rtp.packet, 0, rtp.packet.length, port, ip);
        iter++;
      }
    }
    else {
      iter = 0;
      clearInterval(interval);
    }
  }, 30);
}

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

}