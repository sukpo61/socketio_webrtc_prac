const socket = io();

const welcome = document.getElementById("welcome");
const form = welcome.querySelector("form");

function handleRoomSubmit(event) {
  event.preventDefault();
  const input = form.querySelector("input");
  socket.emit("enter_room", { payload: input.value });
  //오브젝트 직접 전송가능
  input.value = "";
}

form.addEventListener("submit", handleRoomSubmit);
