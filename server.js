const express = require("express");
const http = require("http");  
const PORT = process.env.PORT || 3000;        
const { Server } = require("socket.io"); 
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

//stock les utilisateurs connectés
const users = {};

app.use(express.static(path.join(__dirname, "public")));


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

//quand un utilisateur se connecte au socket
io.on("connection", (socket) => {
  console.log("Un utilisateur connecté :", socket.id);


 //l'utilisateur envoie son pseudo
  socket.on("user_connected", (username) => {
    socket.username = username; 
    users[socket.id] = username;

    console.log(username, "vient de se connecter");

    // prévien qu"un utilisateur se connecte 
    io.emit("user_connected", username);
    //envoi de la liste des utilisateurs à jour 
    io.emit("users_list", users);
  });

    // message à tout le monde
  socket.on("chat message", (data) => {
      io.emit("chat message", data);
  });

   //message privé
  socket.on("private_message", (msg) => {
    socket.to(msg.to).emit("private_message", {
      from: msg.from,
      message: msg.message,
    });
  });

  //l'utilisateur est en train d'écrire
  socket.on("typing", (username) => {
    socket.broadcast.emit("typing", username);
  });

  //l'utilisateur arrete d'écrire
  socket.on("stop_typing", () => {
    socket.broadcast.emit("stop_typing");
  });

  // déconnexion
  socket.on("disconnect", () => {
    if (socket.username) {
      console.log(socket.username, "s'est déconnecté");

      io.emit("user_disconnected", socket.username);

      delete users[socket.id];
      io.emit("users_list", users);
    }
  });
});



server.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
  console.log(`Accédez à l'URL : http://localhost:${PORT}`);
});

