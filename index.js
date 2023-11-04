const http = require("http");
const { Server } = require("socket.io");
const express = require("express");
const app = express();
const server = http.createServer(app);
require("dotenv").config();

const io = new Server(server);

let rooms = [
    // {
    //     name: "nnn",
    //     pass: "n",
    //     players: ["aKBoyAKvL3qiUdt0AAAB"],
    // },
];

function playWith(socket, id, myRoom) {
    
    socket.on("paddlemove", (data) => {
        io.to(id).emit("paddlemove", data);
    });

    socket.on("hit", (state) => {
        io.to(id).emit("hit", state);
    });

    socket.on("point", () => {
        io.to(id).emit("point");
    });

    socket.on("restart", () => {
        io.to(id).emit("restart");
    });

}

io.on("connection", (socket) => {
    // console.log(socket.id + " connected");

    socket.on("join", ({ name, player, pass }) => {

        // check if room is already present
        let myRoom = rooms.filter((room) => room.name === name)[0];

        if (myRoom) {
            // return if room is full
            if (myRoom.players.length > 1) return;

            const isPresent = myRoom.players.filter((id) => id === player)[0];
            if (!isPresent) {
                myRoom.players.push(player);

                // game is ready to start
                io.to(myRoom.players[0]).emit("ready", myRoom.players[1], true);
                io.to(myRoom.players[1]).emit("ready", myRoom.players[0], false);
            }
        } else {
            // create room
            myRoom = {
                name: name,
                pass: pass,
                players: [player,],
            };
            rooms.push(myRoom);
        }

        socket.on("play", (id) => {
            socket.removeAllListeners("paddlemove");
            socket.removeAllListeners("hit");
            socket.removeAllListeners("point");
            socket.removeAllListeners("restart");
            socket.removeAllListeners("join");
            socket.removeAllListeners("play");
            playWith(socket, id, myRoom);
        })

        socket.on("disconnect", () => {
            // console.log(socket.id + " disconnected");
            const toID = myRoom.players[0] === player ? myRoom.players[1] : myRoom.players[0];

            // remove player from room
            myRoom.players = myRoom.players.filter((id) => id !== socket.id);

            // remove room from list if there isn't any player.
            if(myRoom.players.length === 0) {
                rooms = rooms.filter(room => room.name !== myRoom.name);
            }

            // abort the game if one of the player leaves
            if(toID) {
                io.to(toID).emit("refresh");
            }

        });

    });

});

app.use(express.static(__dirname + "/client"));

const port = process.env.PORT || 80;

server.listen(port, () => {
    console.log(`app live at: http://localhost:${port}\nLet's Play 😎`);
});