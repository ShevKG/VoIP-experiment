const http = require('http');
const server = http.createServer(app);
const url = require('url');
const fs = require('fs');
const uuid = require('node-uuid');
const port = 3001;


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

var io = require('socket.io')(app);

  console.log(`listening on: ${port}`);


io.sockets.on('connection', function(socket) {
  socket.on('message', function(data) {
    let fileName = uuid.v4();
    console.log(data);
    console.log("sss");
    socket.emit('ffmpeg-output', 0);

    writeToDisk(data, fileName + '.wav');
    merge(socket, fileName);
  });

  socket.on('stop-recording', function() {
    console.log(`Before: fileSequance = ${fileSequance}`);
    fileSequance = 0;
    console.log(`After: fileSequance = ${fileSequance}`);
  })
});



function writeToDisk(data, fileName) {
  var fileExtension = fileName.split('.').pop(),
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

function merge(socket, fileName) {
  let FFmpeg = require('fluent-ffmpeg');
  let curDateAndTime = new Date();
  let dateTimeString = curDateAndTime.getHours().toString() + curDateAndTime.getMinutes().toString() + curDateAndTime.getMilliseconds().toString();
  console.log('\n\n\n\n\n' + dateTimeString + '\n\n\n\n\n\n\n\n');
  let audioFile = path.join(__dirname, 'uploads', fileName + '.wav');
  let audioFile_new = path.join(__dirname, 'uploads', fileSequance.toString() + '-' + dateTimeString + fileName + '-pcm_mulaw.wav');
  new FFmpeg({
    source: audioFile
  })
  .audioCodec('pcm_mulaw')
  .on('error', function(err) {
    socket.emit('ffmpeg-error', 'ffmpeg : сообщение ошибки: ' + err.message);
  })
  .on('progress', function(progress) {
    socket.emit('ffmpeg-output', Math.round(progress.percent));
  })
  .on('end', function(){
    socket.emit('merged', dateTimeString + fileName + '-pcm_mulaw.wav');
    console.log('Formating finished!');
    fs.unlinkSync(audioFile);
  })
  .saveToFile(audioFile_new);

  fileSequance++;
}
