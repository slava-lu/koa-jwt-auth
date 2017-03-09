const handler = () => {
  
  const socket = io({ transports: ["websocket"] });
  
  //Copy pase токен сюда. Обычно берется из local storage
  const jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjU4YzE0MGZiMmIyZjgwMjA2YzBkMDVjNCIsIm5hbWUiOiJTbGF2YSIsImVtYWlsIjoic2xhdmFsQG1haWwucnUiLCJpYXQiOjE0ODkwNjg4Mjl9.QW1B8h8UH04lNBVaKcvKDMoY_vCYSHDOlIO4Igz8__k"
  
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
