// import { Server } from "socket.io";

// export default function handler(req, res) {
//   if (!res.socket.server.io) {
//     const io = new Server(res.socket.server, {
//       path: "/api/socket",
//     });

//     const room = "gameRoom"; // Single room for all players
//     let players = {};

//     io.on("connection", (socket) => {
//       console.log("A user connected:", socket.id);

//       // Add player to the room
//       socket.join(room);
//       players[socket.id] = { y: 250 }; // Default position

//       const playerCount = Object.keys(players).length;

//       if (playerCount === 2) {
//         // Start game when two players are connected
//         io.to(room).emit("startGame", players);
//       } else if (playerCount > 2) {
//         // Reject third player if two players are already in the game
//         socket.emit("roomFull");
//         socket.disconnect();
//         return;
//       }

//       // Send updated player positions to both players
//       io.to(room).emit("updatePlayers", players);

//       socket.on("flap", (data) => {
//         if (players[socket.id]) {
//           players[socket.id].y = data.y;
//           io.to(room).emit("updatePlayers", players);
//         }
//       });

//       socket.on("disconnect", () => {
//         console.log("A user disconnected:", socket.id);
//         delete players[socket.id];

//         // Inform the other player that they are alone again
//         io.to(room).emit("playerLeft");
//       });
//     });

//     res.socket.server.io = io;
//   }

//   res.end();
// }
import { Server } from "socket.io";

export default function handler(req, res) {
  if (!res.socket.server.io) {
    const io = new Server(res.socket.server, {
      path: "/api/socket",
    });

    const room = "gameRoom";
    let players = {};

    io.on("connection", (socket) => {
      console.log("A user connected:", socket.id);

      socket.join(room);
      players[socket.id] = { y: 250 };

      const playerCount = Object.keys(players).length;

      if (playerCount === 2) {
        io.to(room).emit("startGame", players);
      } else if (playerCount > 2) {
        socket.emit("roomFull");
        socket.disconnect();
        return;
      }

      io.to(room).emit("updatePlayers", players);

      socket.on("flap", (data) => {
        if (players[socket.id]) {
          players[socket.id].y = Math.max(0, data.y);
          io.to(room).emit("updatePlayers", players);
        }
      });

      socket.on("disconnect", () => {
        console.log("A user disconnected:", socket.id);
        
        if (!players[socket.id]) {
          console.log("Player not found in players list, exiting.");
          return;  // Avoid further execution if player isn't tracked
        }
        
        delete players[socket.id];
      
        console.log("Updated players list:", players);
        
        const remainingPlayers = Object.keys(players).length;
        console.log("Remaining players count:", remainingPlayers);
        console.log(remainingPlayers);
      
        if (remainingPlayers <2) {
          if (room) {
            io.to(room).emit("playerLeft");
            console.log("Emitted 'playerLeft' event");
          } else {
            console.log("Room is undefined, cannot emit events");
          }
        }
      
        if (room) {
          io.to(room).emit("updatePlayers", players);
          console.log("Emitted 'updatePlayers' event");
        }
      });
      
    });

    res.socket.server.io = io;
  }

  res.end();
}
