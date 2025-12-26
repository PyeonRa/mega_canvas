import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Store canvas state in memory
let strokes = [];
let ads = [];

io.on("connection", (socket) => {
    console.log(`🚀 User Joined: ${socket.id}`);

    // Send initial state
    socket.emit("init", { strokes, ads });

    socket.on("stroke_start", (data) => {
        strokes.push(data);
        socket.broadcast.emit("stroke_start", data);
    });

    socket.on("stroke_update", (data) => {
        const s = strokes.find(s => s.id === data.id);
        if (s) {
            s.points.push(data.point);
        }
        socket.broadcast.emit("stroke_update", data);
    });

    socket.on("new_ad", (data) => {
        ads.push(data);
        socket.broadcast.emit("new_ad", data);
    });

    socket.on("cursor", (data) => {
        socket.broadcast.emit("cursor", { ...data, socketId: socket.id });
    });

    socket.on("confetti", (data) => {
        socket.broadcast.emit("confetti", data);
    });

    socket.on("nuke", (data) => {
        const { x, y, radius } = data;
        strokes = strokes.filter(s => !s.points.some(p => Math.hypot(p.x - x, p.y - y) < radius));
        socket.broadcast.emit("nuke", data);
    });

    socket.on("clear", () => {
        strokes = [];
        ads = [];
        io.emit("clear");
    });

    socket.on("disconnect", () => {
        console.log(`👋 User Left: ${socket.id}`);
    });
});

const PORT = 3001;
httpServer.listen(PORT, "0.0.0.0", () => {
    console.log("-----------------------------------------");
    console.log(`✨ MEGA CANVAS SERVER IS LIVE!`);
    console.log(`📡 Port: ${PORT}`);
    console.log(`🌐 Local: http://localhost:${PORT}`);
    console.log("-----------------------------------------");
});
