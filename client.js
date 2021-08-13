
console.log("aaa");

navigator.mediaDevices.getUserMedia({ audio: true })
    .then(function (stream) {
        console.log('You let me use your mic!')
    })
    .catch(function (err) {
        console.log('No mic for you!')
    });

window.addEventListener('decode', function () {
    console.log("decoded");
})


//let audio = window.AudioContext || window.webkitAudioContext;
let socketio = io();
let iter = 0;
//let context = new audio;
//let source = context.createBufferSource();
//let gain;
let key = false;

let player = new PCMPlayer({
    encoding: '8bitInt',
    channels: 1,
    sampleRate: 8000,
    flushingTime: 36
});


//let playBtn = document.getElementById("play-button");
let audio;
//playBtn.onclick(function() {
//  audio.play();
//})

socketio.on('connect', function () {
    console.log("connected");
    let key = false;
    socketio.on('recieve-and-play', function (data) {

        //let buffer = Uint8Array.from(data);
        //console.log(buffer);
        //player.feed(buffer);
        //console.log(player);
        let uint8 = new Uint8Array(data);
        console.log(uint8);
        let blob = new Blob([uint8], { type: 'PCMU', rate: 8000 });
        console.log(blob);
        //let audio = new Audio(blob);
        alert("ready");
        //console.log(uint8.length); 
        //player.feed(uint8);

    });
});