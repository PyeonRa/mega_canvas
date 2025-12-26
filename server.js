import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*", // In production, limit this to your domain
        methods: ["GET", "POST"]
    }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Store canvas state in memory
let strokes = [];
let ads = [];

io.on("connection", (socket) => {
    console.log("🚀 Artist Connected:", socket.id);

    // Send initial state to new user
    socket.emit("init", { strokes, ads });

    // Handle drawing
    socket.on("stroke_start", (data) => {
        strokes.push(data);
        socket.broadcast.emit("stroke_start", data);
    });

    socket.on("stroke_update", (data) => {
        const s = strokes.find(s => s.id === data.id);
        if (s) s.points.push(data.point);
        socket.broadcast.emit("stroke_update", data);
    });

    // Handle Ads
    socket.on("new_ad", (data) => {
        ads.push(data);
        socket.broadcast.emit("new_ad", data);
    });

    // Handle Cursor/Presence
    socket.on("cursor", (data) => {
        socket.broadcast.emit("cursor", { ...data, id: socket.id });
    });

    // Handle Explosions
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
        console.log("👋 Artist Disconnected:", socket.id);
    });
});

const PORT = 3001;
httpServer.listen(PORT, () => {
    console.log(`✨ MEGA CANVAS SERVER RUNNING ON http://localhost:${PORT}`);
});
