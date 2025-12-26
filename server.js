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
let stamps = [];
let chatHistory = [];

io.on("connection", (socket) => {
    console.log(`🚀 User Joined: ${socket.id}`);

    // Send initial state
    socket.emit("init", { strokes, ads, stamps, chatHistory });

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

    socket.on("new_stamp", (data) => {
        stamps.push(data);
        socket.broadcast.emit("new_stamp", data);
    });

    socket.on("cursor", (data) => {
        socket.broadcast.emit("cursor", { ...data, socketId: socket.id });
    });

    socket.on("confetti", (data) => {
        socket.broadcast.emit("confetti", data);
    });

    socket.on("ripple", (data) => {
        socket.broadcast.emit("ripple", data);
    });

    socket.on("sparkler", (data) => {
        socket.broadcast.emit("sparkler", data);
    });

    socket.on("nuke", (data) => {
        const { x, y, radius } = data;
        // Surgical Nuke: Filter individual points and split strokes
        strokes = strokes.flatMap((s) => {
            let result = [];
            let current = [];
            s.points.forEach((p) => {
                if (Math.hypot(p.x - x, p.y - y) > radius) {
                    current.push(p);
                } else if (current.length > 0) {
                    result.push({ ...s, points: current, id: Math.random() });
                    current = [];
                }
            });
            if (current.length > 0) result.push({ ...s, points: current, id: Math.random() });
            return result;
        });
        stamps = stamps.filter(s => Math.hypot(s.x - x, s.y - y) > radius);
        socket.broadcast.emit("nuke", data);
    });

    socket.on("chat_message", (msg) => {
        // Basic sanitization: only allow plain objects with needed fields
        const safeMsg = {
            id: Math.random().toString(36).substr(2, 9),
            text: String(msg.text).substring(0, 200), // Max length
            username: String(msg.username).substring(0, 20),
            color: String(msg.color),
            timestamp: Date.now()
        };
        chatHistory.push(safeMsg);
        if (chatHistory.length > 50) chatHistory.shift();
        io.emit("chat_message", safeMsg);
    });

    socket.on("clear", () => {
        strokes = [];
        ads = [];
        stamps = [];
        chatHistory = [];
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
