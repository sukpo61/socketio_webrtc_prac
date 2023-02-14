const socket = new WebSocket(`ws://${window.location.host}`);
const nickform = document.querySelector("#nick");
const messageform = document.querySelector("#message");
const messagelist = document.querySelector("ul");

function MakeMessage(type, payload) {
  const msg = { type, payload };
  return JSON.stringify(msg);
}

socket.addEventListener("open", () => {
  console.log("1");
});
socket.addEventListener("message", (message) => {
  const li = document.createElement("li");
  li.innerText = message.data;
  messagelist.append(li);
});
socket.addEventListener("close", (message) => {
  console.log("disconnect");
});

const handlesubmit = (e) => {
  e.preventDefault();
  const input = messageform.querySelector("input");
  socket.send(MakeMessage("new_message", input.value));
};

const handleNicksubmit = (e) => {
  e.preventDefault();
  const input = nickform.querySelector("input");
  socket.send(MakeMessage("nickname", input.value));
};

messageform.addEventListener("submit", handlesubmit);
nickform.addEventListener("submit", handleNicksubmit);
