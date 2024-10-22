// here we get a reference to the webpage elements
var divSelectRoom = document.getElementById("selectRoom");
var divConsultingRoom = document.getElementById("consultingRoom");
var inputRoomNumber = document.getElementById("roomNumber");
var btnGoRoom = document.getElementById("goRoom");
var localVideo = document.getElementById("localVideo");
var remoteVideo = document.getElementById("remoteVideo");

let inputCallName = document.getElementById("inputCallName")
let btnSetName = document.getElementById("sendButton")

// these are the global variables
var sendButton;
var localStream;
var remoteStream;
var rtcPeerConnection;

var isCaller;
let dataChannel

//these are the STUN servers
    var iceServers = {
      'iceServers':[
        {'url': 'stun:stun.services.mozilla.com' },
        {'url': 'stun:stun.l.google.com:19302'}
      ]
    }
var streamConstraints = { audio: true, video: true };
var isCaller;

// Here we connect to the socket.io server. We will create it later.
var socket = io();

// Here we add a click event to the button
btnGoRoom.onclick= function() {
  if (inputRoomNumber.value ==='') {
    alert("Please type a room number")
  } else {
    roomNumber = inputRoomNumber.value; //we take the value from the element
    socket.emit('create or join', roomNumber); //we send a message to server
    divSelectRoom.style = "display: none;";//hide selectRoom div
    divConsultingRoom.style = "display: block;";//show consultingRoom div
}};


//for the datachanel
btnSetName.onclick  = () => {
  if (inputCallName.value ==='') {
    alert("Please type a call name")
  } else {
    dataChannel.send(inputCallName.value)
    displayChatMessage(inputCallName.value, 'local');
}};



// when server emits created
socket.on('created', function (room) {

  //caller gets user media devices with defined constraints
  navigator.mediaDevices.getUserMedia(streamConstraints).then(function (stream) {
    localStream = stream; //sets local stream to variable
    //localVideo.src = URL.createObjectURL(stream);//shows stream to user
    localVideo.srcObject = stream;
    isCaller = true; //sets current user as caller
  }).catch(function (err) {
    console.log('An error ocurred when accessing media devices');
  });
});

//when server emits joined
socket.on('joined', function (room) {
  //callee gets user media devices
  navigator.mediaDevices.getUserMedia(streamConstraints).then(function (stream) {
    localStream = stream; //sets local stream to variable
    localVideo.srcObject = stream;
    socket.emit('ready', roomNumber); //sends message to server
  }).catch(function (err) {
    console.log('An error ocurred when accessing media devices');
  });
});


//when server emits candidate
socket.on('candidate', function (event) {
  //creates a candidate object
  var candidate = new RTCIceCandidate({
    sdpMLineIndex: event.label,
    candidate: event.candidate
  })
//  console.log('received candidate', candidate)
  //stores candidate
  rtcPeerConnection.addIceCandidate(candidate)
});

//when server emits ready
socket.on('ready', function () {
  if (isCaller) {
    //creates an RTCPeerConnection object
    rtcPeerConnection = new RTCPeerConnection(iceServers);

    //adds event listeners to the newly created object
    rtcPeerConnection.onicecandidate = onIceCandidate;
    rtcPeerConnection.onaddstream = onAddStream;

    //adds the current local stream to the object
    rtcPeerConnection.addStream(localStream);
    //prepares an Offer
    dataChannel = rtcPeerConnection.createDataChannel(roomNumber)

    dataChannel.onmessage = event =>  {

        var message = event.data;
        displayChatMessage(message, 'remote');
    }
    rtcPeerConnection.createOffer(setLocalAndOffer, function(e){console.log(e)});

  }
});

//when servers emits offer
socket.on('offer', function (event){
  if(!isCaller){
    //creates an RTCPeerConnection object
    rtcPeerConnection = new RTCPeerConnection(iceServers);

    //adds event listeners to the newly created object
    rtcPeerConnection.onicecandidate = onIceCandidate;
    rtcPeerConnection.onaddstream = onAddStream;
    //adds the current local stream to the object
    rtcPeerConnection.addStream(localStream);

    //console.log('received offer', event )

    //stores the offer as remote description
    rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
    //Prepares an Answer
    rtcPeerConnection.createAnswer(setLocalAndAnswer, function(e){console.log(e)});



    rtcPeerConnection.ondatachannel = event =>{
         dataChannel = event.channel
         dataChannel.onmessage = event =>  {

             var message = event.data;
             displayChatMessage(message, 'remote');
         }
    }
  }
});


//when server emits answer
socket.on('answer', function (event){
  //console.log('received answer', event)
  //stores it as remote description
  rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
});




// when a user receives the other user's video and audio stream
function onAddStream(event) {
  remoteStream = event.stream;
  remoteVideo.srcObject = remoteStream;
}


//These are the functions referenced before as listeners for the peer connection
//sends a candidate message to server
function onIceCandidate(event) {
  if (event.candidate) {
    console.log('sending ice candidate');
    socket.emit('candidate', {
      type: 'candidate',
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate,
      room: roomNumber
    })
  }
}


//stores offer and sends message to server
function setLocalAndOffer(sessionDescription) {
  rtcPeerConnection.setLocalDescription(sessionDescription);
  socket.emit('offer', {
    type: 'offer',
    sdp: sessionDescription,
    room: roomNumber
  });
}


//stores answer and sends message to server
function setLocalAndAnswer(sessionDescription) {
  rtcPeerConnection.setLocalDescription(sessionDescription);
  socket.emit('answer', {
    type: 'answer',
    sdp: sessionDescription,
    room: roomNumber
  });
}

// Function to display chat messages
function displayChatMessage(message, sender) {
  const chatMessages = document.getElementById('chatMessages');
  const messageElement = document.createElement('li');
  messageElement.textContent = `${sender === 'local' ? 'You' : 'remote'}: ${message}`;
  chatMessages.appendChild(messageElement);
}


