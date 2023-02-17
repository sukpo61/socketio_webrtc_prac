const socket = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");
const welcome = document.getElementById("welcome");
const call = document.getElementById("call");

call.hidden = true;

let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;
let myDataChannel;

async function getCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    // 모든 연결된 디바이스를 불러옴.
    const cameras = devices.filter((device) => device.kind === "videoinput");
    // 디바이스에서 카메라만 고름.
    const currentCamera = myStream.getVideoTracks()[0];
    // 현재 카메라는 제일 첫번째로 오게되고 고름.
    cameras.forEach((camera) => {
      const option = document.createElement("option");
      option.value = camera.deviceId;
      option.innerText = camera.label;
      if (currentCamera.label === camera.label) {
        option.selected = true;
      }
      camerasSelect.appendChild(option);
    });
  } catch (e) {
    console.log(e);
  }
}

async function getMedia(deviceId) {
  const initialConstrains = {
    audio: true,
    video: { facingMode: "user" },
  };
  // initcall을 할때는 기본 카메라, 셀카 모드로.
  const cameraConstraints = {
    audio: true,
    video: { deviceId: { exact: deviceId } },
  };
  // 디바이스를 다른것을 선택했을떄는 이거.
  try {
    myStream = await navigator.mediaDevices.getUserMedia(
      deviceId ? cameraConstraints : initialConstrains
    );
    // 스트림에 정보를 담게됨.
    console.log(myStream);
    myFace.srcObject = myStream;
    //html에 하드코딩.
    if (!deviceId) {
      await getCameras();
    }
    // 처음 돌입할때 카메라 리스트를 불러옴.
  } catch (e) {
    console.log(e);
  }
}

function handleMuteClick() {
  myStream
    .getAudioTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  // 모든 오디오 트랙을 비활성화 시킴.
  if (!muted) {
    muteBtn.innerText = "Unmute";
    muted = true;
  } else {
    muteBtn.innerText = "Mute";
    muted = false;
  }
}

function handleCameraClick() {
  myStream
    .getVideoTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  // 모든 비디오 트랙을 비활성화 시킴.
  if (cameraOff) {
    cameraBtn.innerText = "Turn Camera Off";
    cameraOff = false;
  } else {
    cameraBtn.innerText = "Turn Camera On";
    cameraOff = true;
  }
}

async function handleCameraChange() {
  console.log(camerasSelect.value);
  await getMedia(camerasSelect.value);

  if (myPeerConnection) {
    const videoTrack = myStream.getVideoTracks()[0];
    //새로 고른 비디오 트랙을 가져옴 .
    const videoSender = myPeerConnection
      .getSenders()
      .find((sender) => sender.track.kind === "video");
    //오디오와 비디오중 비디오 센더만 고름.
    console.log(videoSender);
    videoSender.replaceTrack(videoTrack);
    // 보내는 놈을 바꿈.
  }
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
camerasSelect.addEventListener("input", handleCameraChange);

const welcomeForm = welcome.querySelector("form");

socket.on("welcome", async () => {
  const offer = await myPeerConnection.createOffer();
  //2. a 의 오퍼를 생성하고
  myPeerConnection.setLocalDescription(offer);
  // a 로컬에 자기 로컬 오퍼 추가
  socket.emit("offer", offer, roomName);
  //3. 백앤드로 보냄
  console.log("sent the offer");
});

socket.on("offer", async (offer) => {
  console.log("received the offer");

  //5. b가 a의 오퍼를 받게 됨
  myPeerConnection.setRemoteDescription(offer);
  // b 로컬에 a 리모트 오퍼 추가
  const answer = await myPeerConnection.createAnswer();
  //6. b의 오퍼를 생성함.
  // console.log(answer);
  myPeerConnection.setLocalDescription(answer);
  //7. b의 로컬에 자기 로컬 앤서 추가, 둘다 추가 됨.
  socket.emit("answer", answer, roomName);
  //8. 앤서 백앤으로 보내고
  console.log("sent the answer");
});

socket.on("answer", (answer) => {
  console.log("received the answer");
  myPeerConnection.setRemoteDescription(answer);
  //10. a로컬에 b 리모트 앤서 추가, 둘다 추가 됨.
});

socket.on("ice", (ice) => {
  console.log("received candidate");
  myPeerConnection.addIceCandidate(ice);
});

async function initCall() {
  welcome.hidden = true;
  call.hidden = false;
  await getMedia();
  // 유저의 디바이스를 불러옴.
  makeConnection();
}

function makeConnection() {
  myPeerConnection = new RTCPeerConnection({
    iceServers: [
      {
        urls: [
          "stun:stun.l.google.com:19302",
          "stun:stun1.l.google.com:19302",
          "stun:stun2.l.google.com:19302",
          "stun:stun3.l.google.com:19302",
          "stun:stun4.l.google.com:19302",
        ],
      },
    ],
  });
  // 방에 돌입하면. 독자적인 스턴서버를 운용하고 RTC 연결을 새로 생성함.
  myPeerConnection.addEventListener("icecandidate", handleIce);
  myPeerConnection.addEventListener("addstream", handleAddStream);
  myStream
    .getTracks()
    .forEach((track) => myPeerConnection.addTrack(track, myStream));
  // 넣는거인듯.
}

async function handleWelcomeSubmit(event) {
  event.preventDefault();
  const input = welcomeForm.querySelector("input");
  await initCall();

  socket.emit("join_room", input.value);
  roomName = input.value;
  // input.value = "";
}

function handleIce(data) {
  console.log("sent candidate");
  socket.emit("ice", data.candidate, roomName);
}

function handleAddStream(data) {
  // console.log("peer stream", data.stream);
  // console.log("My stream", myStream);

  const peerFace = document.getElementById("peerFace");
  peerFace.srcObject = data.stream;
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);
// 방에 처음 돌입할 때 실행.
