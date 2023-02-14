const socket = io();

const welcome = document.getElementById("welcome");
const form = welcome.querySelector("form");

function backendDone(e) {
  console.log(e);
}

function handleRoomSubmit(event) {
  event.preventDefault();
  const input = form.querySelector("input");
  socket.emit("enter_room", { payload: input.value }, backendDone);
  //오브젝트 직접 전송가능, 함수는 인자의 마지막에 위치해야하고 함수는 프론트에서 실행.
  input.value = "";
}

form.addEventListener("submit", handleRoomSubmit);
