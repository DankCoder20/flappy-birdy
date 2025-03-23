// import { useEffect, useRef, useState } from "react";
// import io from "socket.io-client";

// export default function Game() {
//   const canvasRef = useRef(null);
//   const birdYRef = useRef(250);
//   const velocity = useRef(0);
//   const gravity = 0.6;
//   const lift = -10;
//   const [players, setPlayers] = useState({});
//   const [isGameStarted, setIsGameStarted] = useState(false);
//   const socketRef = useRef(null);

//   useEffect(() => {
//     const socket = io({ path: "/api/socket" });
//     socketRef.current = socket;

//     socket.on("connect", () => {
//       console.log("Connected:", socket.id);
//     });

//     socket.on("startGame", (playersData) => {
//       console.log("Game Started!");
//       setPlayers(playersData);
//       setIsGameStarted(true);
//     });

//     socket.on("updatePlayers", (playersData) => {
//       setPlayers(playersData);
//     });

//     socket.on("playerLeft", () => {
//       setIsGameStarted(false);
//       setPlayers({});
//     });

//     socket.on("roomFull", () => {
//       alert("Room is full. Try again later.");
//     });

//     const canvas = canvasRef.current;
//     const ctx = canvas.getContext("2d");

//     const birdImg = new Image();
//     birdImg.src = "/bird.png";
//     const bgImg = new Image();
//     bgImg.src = "/background.png";

//     let imagesLoaded = 0;
//     const checkImagesLoaded = () => {
//       imagesLoaded++;
//       if (imagesLoaded === 2) {
//         gameLoop();
//       }
//     };

//     birdImg.onload = checkImagesLoaded;
//     bgImg.onload = checkImagesLoaded;

//     const gameLoop = () => {
//       ctx.clearRect(0, 0, canvas.width, canvas.height);
//       ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

//       Object.keys(players).forEach((playerId, index) => {
//         const birdX = index === 0 ? 100 : 300; // Different X positions for players
//         ctx.drawImage(birdImg, birdX, players[playerId].y, 40, 40);
//       });

//       if (isGameStarted) {
//         velocity.current += gravity;
//         birdYRef.current += velocity.current;
//         socket.emit("flap", { y: birdYRef.current });
//       }

//       requestAnimationFrame(gameLoop);
//     };

//     const handleFlap = () => {
//       if (isGameStarted) {
//         velocity.current = lift;
//         socket.emit("flap", { y: birdYRef.current });
//       }
//     };

//     window.addEventListener("keydown", handleFlap);

//     return () => {
//       window.removeEventListener("keydown", handleFlap);
//       socket.disconnect();
//     };
//   }, []);

//   if (!isGameStarted) {
//     return <div>Waiting for another player...</div>;
//   }

//   return <canvas ref={canvasRef} width={1800} height={700}></canvas>;
// }
import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

export default function Game() {
  const canvasRef = useRef(null);
  const birdYRef = useRef(250); // Initial Y position of the bird
  const velocity = useRef(0); // Current velocity of the bird
  const gravity = 0.02; // Gravity force
  const lift = -10; // Lift force when flapping
  const [players, setPlayers] = useState({}); // Players' data
  const [isGameStarted, setIsGameStarted] = useState(false); // Game state
  const socketRef = useRef(null); // Socket reference

  // Connect to the server and set up event listeners
  useEffect(() => {
    const socket = io({ path: "/api/socket" });
    socketRef.current = socket;

    socket.on("connect", () => {
      // console.log("Connected:", socket.id);
    });

    socket.on("startGame", (playersData) => {
      // console.log("Game Started!");
      setPlayers(playersData);
      setIsGameStarted(true);
    });

    socket.on("updatePlayers", (playersData) => {
      // console.log("Updated players:", playersData);
      setPlayers(playersData);
    });

    socket.on("playerLeft", (playerId) => {
      // console.log("A player left!");
      setPlayers((prevPlayers) => {
        const remainingPlayers = { ...prevPlayers };
        delete remainingPlayers[playerId]; // Remove the disconnected player
        setIsGameStarted(false);
        return remainingPlayers;
      });
    });

    socket.on("roomFull", () => {
      alert("Room is full. Try again later.");
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Game loop and rendering logic
  useEffect(() => {
    if (!isGameStarted || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    // Load images
    const birdImg = new Image();
    birdImg.src = "/bird.png";
    const bgImg = new Image();
    bgImg.src = "/background.png";

    let imagesLoaded = 0;
    const checkImagesLoaded = () => {
      imagesLoaded++;
      if (imagesLoaded === 2) {
        gameLoop(); // Start the game loop once images are loaded
      }
    };

    birdImg.onload = checkImagesLoaded;
    bgImg.onload = checkImagesLoaded;

    // Update game state (bird position, velocity, etc.)
    const updateGameState = () => {
      if (isGameStarted && socketRef.current.id in players) {
        // Apply gravity to velocity
        velocity.current += gravity;

        // Update the bird's Y position based on velocity
        birdYRef.current += velocity.current;
        console.log(`birdYRef.current: ${birdYRef.current}, velocity.current: ${velocity.current}`);

        
        // Ensure the bird doesn't fall off the screen
        birdYRef.current = Math.max(0, Math.min(660, birdYRef.current));

        // Send update to server only for the current player
        socketRef.current.emit("flap", { y: birdYRef.current });

        // Debugging logs
        // console.log(`birdYRef.current: ${birdYRef.current}, velocity.current: ${velocity.current}`);
      }
    };

    // Render the game (background, birds, etc.)
    const renderGame = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
      ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height); // Draw background

      // Draw each player's bird
      Object.keys(players).forEach((playerId, index) => {
        const birdX = index === 0 ? 100 : 300; // X position for each bird
        ctx.drawImage(birdImg, birdX, players[playerId]?.y || 250, 40, 40); // Draw bird
      });

      // Debugging logs
      // console.log(`players: ${JSON.stringify(players)}`);
    };

    // Main game loop
    const gameLoop = () => {
      if (!isGameStarted) return; // Stop the game loop if the game is not started

      updateGameState(); // Update game state
      renderGame(); // Render the game
      requestAnimationFrame(gameLoop); // Continue the loop
    };

    // Handle space bar press (flap)
    const handleFlap = (event) => {
      if (event.code === "Space") {
        console.log(`yay handleflap was called once ${event.code}`);
        velocity.current = lift;
        console.log(`velocity.current: ${velocity.current}`);  // Reset velocity to lift (jump)
        socketRef.current.emit("flap", { y: birdYRef.current });
      }
    };

    // Add event listener for space bar
    window.addEventListener("keydown", handleFlap);

    // Cleanup event listener
    return () => {
      window.removeEventListener("keydown", handleFlap);
    };
  }, [isGameStarted, players]);

  // Render waiting message if the game hasn't started
  if (!isGameStarted) {
    return <div>Waiting for another player...</div>;
  }

  // Render the canvas
  return <canvas ref={canvasRef} width={1200} height={700}></canvas>;
}