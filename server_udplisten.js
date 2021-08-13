const http = require('http');
const udp = require('dgram');
const url = require('url');
const path = require('path');
const fs = require('fs');
const { WaveFile } = require('wavefile');
const waveheaders = require('wav-headers');


let port = 3002;
let socketUDP, rtp;
console.log("a");
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

    if (fs.statSync(filename).isDirectory()) filename += '/testpage.html';



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


io.on('connection', function (iosocket) {
  console.log("CONNECTION WITH CLIENT-SOCKET IS ESTABLISHED");
  socketUDP = udp.createSocket('udp4');
  socketUDP.bind(60000, '0.0.0.0', () => {
  });
  socketUDP.on('listening', () => {
    socketUDP.setBroadcast(true);
    console.log("CONNECTION WITH UDP-BROADCAST IS ESTABLISHED");
    const adress = socketUDP.address();
    console.log("udp4:" + adress);
  });

  let buffers = [];
  let options = {
    format: 7,
    channels: 1,
    sampleRate: 8000,
    bitDepth: 8,
    dataLength: 0
  };

  socketUDP.on('message', function (message, rinfo) {
    let buffer = new Buffer(message.slice(12, message.length), 'base64');

    buffers.push(buffer);
    console.log(`${buffers.length}`);

   if (buffers.length == 5) {
      let concat = new Buffer.concat(buffers)
      console.log(concat.length);
      options.dataLength = concat.length;
      let buffHeaders = waveheaders(options);
      let mergedBuffer = Buffer.concat([buffHeaders, concat]);
      let wav = new WaveFile();
      wav.fromBuffer(mergedBuffer);

      // 8000 - samplerate; 1 - number of channels; 16 - bitdepth; 8 - sample size; 1000 from seconds to milliseconds
      let duration = ((wav.chunkSize) / (8000 * 1 * (16 / 8))) * 1000;
      wav.fromMuLaw();      

      console.log("my duration: " + duration);
      let wavBuffer = wav.toBuffer();
      let newBuffer = wavBuffer.slice(42, wavBuffer.length);
      
      let rtpData = {
        payload: newBuffer,
        duration: duration
      }
      iosocket.emit('recieve-and-play', rtpData);
      buffers = [];
   }
  });


});


