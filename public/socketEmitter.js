const handler = () => {
  
  const socket = io({ transports: ["websocket"] });
  
  //Copy-paste токен сюда. Обычно берется из local storage
  const jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjU4YzkwNmFiOGEzY2Y2MzEyYzUyNWEwNiIsImRpc3BsYXlOYW1lIjoiU2xhdmEiLCJlbWFpbCI6InNsYXZhbEBtYWlsLnJ1IiwiaWF0IjoxNDg5NTY5NDgzfQ.hl2KVGVUgRA-lfrj0izASTXckY1af203pY9uiwSMqGI"
  
  socket.on('connect', function () {
    socket.emit("clientEvent", "Я еще не отослал свой токен");
    socket
    .emit('authenticate', {token: jwt})
    .on('authenticated', function () {
      socket.emit("clientEvent", "Я отослал свой токен и прошел авторизацию");
    })
    .on('unauthorized', function(msg) {
      console.log("unauthorized: " + JSON.stringify(msg.data));
      throw new Error(msg.data.type);
    })
  });
    
  
};

document.addEventListener("DOMContentLoaded", handler);
