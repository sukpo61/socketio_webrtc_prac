import http from "http";
import express from "express";
import path from "path";
import { Server } from "socket.io";
import { connect } from "http2";
//IO 백설치
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

const handlelisten = () => console.log(`Listening on http://localhost:4001`);

const httpServer = http.createServer(app);

const wsServer = new Server(httpServer);

wsServer.on("connection", (socket) => {
  console.log(wsServer);
  socket.on("join_room", (roomName) => {
    socket.join(roomName);
    // 소켓서버의 방을 생성함.
    socket.to(roomName).emit("welcome");
    //1. b가 a 를 실행함.
    socket.on("offer", (offer, roomName) => {
      socket.to(roomName).emit("offer", offer);
      //4. a 의 오퍼를 받고 b에게 a의 오퍼를 보냄
    });
    socket.on("answer", (answer, roomName) => {
      socket.to(roomName).emit("answer", answer);
      // 9.b의 앤서를 받고 a에게 b의 앤서를 보냄
    });
    socket.on("ice", (ice, roomName) => {
      socket.to(roomName).emit("ice", ice);
    });
  });
});

httpServer.listen(4001, handlelisten);
