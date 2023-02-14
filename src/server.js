import http from "http";
import WebSocket, { WebSocketServer } from "ws";
import express from "express";
import path from "path";

const __dirname = path.resolve();

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/src/public/views");
// 기본적으로 접근하는 디렉토리 설정
app.use("/public", express.static(__dirname + "/src/public"));
//pug 에서 script 접근할때 static 설정을 함

app.get("/", (_, res) => res.render("home"));
// 주소가 "/" 일떄 기본디렉토리 + 인자 값을 랜더함 /src/public/views/home 을 랜더하는거지
app.get("/*", (_, res) => res.redirect("/"));

const handlelisten = () => console.log(`Listening on http://localhost:3000`);

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

function handleConnection(socket) {
  console.log(socket);
}

const sockets = [];

wss.on("connection", (socket) => {
  sockets.push(socket);
  socket["nickname"] = "Anon";
  console.log("connect");
  socket.on("close", () => {
    "disconnect";
  });
  socket.on("message", (msg) => {
    const message = JSON.parse(msg);

    console.log(message.payload);

    switch (message.type) {
      case "new_message":
        sockets.forEach((aSocket) =>
          aSocket.send(`${socket.nickname}:${message.payload}`)
        );
        break;

      case "nickname":
        socket["nickname"] = message.payload;
        break;
    }
  });
});

server.listen(3000, handlelisten);
