import { io } from "socket.io-client";

class GlobalState {
    socket = $state(null);
    onlineUsers = $state([]);

    connect() {
        if (this.socket) return;

        console.log("🔌 Connecting to Global Socket...");
        this.socket = io({
            reconnection: true,
            reconnectionAttempts: 10,
            timeout: 10000,
            autoConnect: true
        });

        this.socket.on("connect", () => {
            console.log("✅ Synced to Global Board");
        });

        this.socket.on("cursor", (data) => {
            // This will be handled by the Canvas component but we store the socket here
        });
    }
}

export const globalState = new GlobalState();
