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
const waveheaders = require('wav-headers');
const { setInterval, setTimeout } = require('timers');

let socketUDP, rtp, socketioID;


let isRtpDeployed = false;

var app = http.createServer(function (request, response) {
  var uri = url.parse(request.url).pathname,
    filename = path.join(process.cwd(), uri);

  fs.exists(filename, function (exists) {
    if (!exists) {
      response.writeHead(404, {
        "Conten-Type": "text/plain"
      });
      response.write('404 Not Found: ' + filename + '\n');
      response.end();
      return;
    }

    if (fs.statSync(filename).isDirectory()) filename += '/merged.html';



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
let rtpForCompare;


io.sockets.on('connection', function (iosocket) {
  //#region recieving server


  iosocket.on("manual-disconnection", function(data) {
    console.log("User Manually Disconnected. \n\tID: " + data);
  })

  iosocket.on('disconnect', function () {
    console.log("user disconnected");
  })

  console.log("CONNECTION WITH CLIENT-SOCKET IS ESTABLISHED");
  
  //#endregion receiving server 
  //=============================================================================================
  //#region sending server


  iosocket.on('message', function (data) {
    let buffNum = data;
    let wav = new WaveFile(buffNum);
    wav.toSampleRate(8000);
    wav.toMuLaw();
    let buffer = new Buffer.alloc(wav.toBuffer().length, wav.toBuffer(), 'base64');
    createAndSendRtpFromBuffer(buffer, ip, 60000);
  });


  iosocket.on('id', function(id) {
    socketioID = id;
  })

  iosocket.on('delete-id', function() {
    setTimeout(function() {
      socketioID = undefined;
    }, 1000);
  })

  

  iosocket.on('stop-recording', function () {
    fileSequance = 0;
    console.log(socketioID);
    if (isRtpDeployed == true) {
      rtp.time = 0;
      rtp.seq = Math.floor(1000 * Math.random()); //Частота должна быть случайным числом
    }
  })
});


socketUDP = udp.createSocket('udp4');
  socketUDP.bind(60000, '0.0.0.0', () => {
  });
  socketUDP.on('listening', () => {
    socketUDP.setBroadcast(true);
    console.log("CONNECTION WITH UDP-BROADCAST IS ESTABLISHED");
    const adress = socketUDP.address();
    console.log(adress);
  });

  let buffers = [];
  let options = { format: 7, channels: 1, sampleRate: 8000, bitDepth: 8, dataLength: 0 };


  socketUDP.on('message', function (message) {
    
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

      // За что отвечают магические числа в вычислении длительности wav файла
      // ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓
      // 8000 - samplerate; 1 - number of channels; 16 - bitdepth; 8 - sample size; 1000 - от миллисекунд к секундам
      let wavDuration = ((wav.chunkSize) / (8000 * 1 * (16 / 8))) * 1000;
      wav.fromMuLaw();

      //console.log("my duration: " + duration);
      let wavBuffer = wav.toBuffer();
      let onlyPCMBuffer = wavBuffer.slice(42, wavBuffer.length);

      let pcmData = {
        payload: onlyPCMBuffer,
        duration: wavDuration
      }
      console.log(socketioID);
      io.sockets.emit('recieve-and-play', pcmData, socketioID);
      buffers = [];
    }
  });


/**
 * @param {function} createAndSendRtpFromBuffer - Эта функция берёт обработанный в 'message' сокете wav файл, затем нарезает
 * его на равные 320 байтовые отрезки. К ним добавляются RTP заголовки, затем они асинхронно
 * отправляются на udp-broadcast адресс
 *  
 */
function createAndSendRtpFromBuffer(data, ip, port) {

  const bufferSize = 320;

  let numberOfSlices = Math.ceil(data.length / bufferSize);
  let buffers = [];

  //console.log(`Number of slices: ${numberOfSlices}`);
  //console.log(`Length of packets: ${data.length}`);

  let buffSliceIter = bufferSize - 1; // от buffer[0] до buffer[bufferSize - 1]
  let lastIndexOfSlice = 0;

  for (let i = 0; i < numberOfSlices; i++) {
    buffers.push(data.slice(lastIndexOfSlice, buffSliceIter));
    lastIndexOfSlice = buffSliceIter;
    buffSliceIter += bufferSize;
  }



  let iter = 0;
  let interval = setInterval(function () {

    if (iter < buffers.length) {

      if (iter == 0) {
        buffers[iter] = new Buffer(buffers[iter].slice(80, buffers[iter].length));
      }
      if (!rtp) {
        rtp = new RtpPacket(buffers[iter]);
        isRtpDeployed = true;

      }
      else {
        rtp.payload = buffers[iter];
        rtp.time += buffers[iter].length;
        rtp.seq++;

        //console.log(`----------${iter + 1}----------`);
        //console.log("rtp time: " + rtp.time);
        //console.log("rtp seq: " + rtp.seq);
        //console.log("rtp length: ", rtp.packet.length);
        socketUDP.send(rtp.packet, 0, rtp.packet.length, port, ip);
        iter++;
      }
    }
    else {
      iter = 0;
      clearInterval(interval);
    }
  }, 30);
}


