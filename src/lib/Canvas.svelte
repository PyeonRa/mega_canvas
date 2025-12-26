<script>
    import { onMount } from "svelte";
    import { io } from "socket.io-client";

    let {
        color = "#2563eb",
        brushSize = 5,
        mode = $bindable("draw"),
        username = "Guest",
        isVIP = false,
        isRainbow = false,
        isGhost = false,
        mouseCoord = $bindable(null),
        pixelCount = $bindable(0),
        onUsersUpdate,
        nukeCooldown = $bindable(0),
        socket = $bindable(),
        isDarkMode = false,
    } = $props();

    // Multi-Device Sync (Socket.io)
    const channel = new BroadcastChannel("mega_canvas_v7");
    const CANVAS_SIZE = 5000;

    let canvas = $state();
    let ctx = $state();
    let transform = $state({ x: 0, y: 0, scale: 0.3 });
    let isPanning = $state(false);
    let isDrawing = $state(false);
    let lastPos = $state({ x: 0, y: 0 });
    let pinch = $state({
        startDist: 0,
        startScale: 1,
        startMid: { x: 0, y: 0 },
        startOffset: { x: 0, y: 0 },
    });

    let strokes = $state([]);
    let ads = $state([]);
    let currentStroke = $state(null);
    let remoteUsers = $state({});

    let particles = $state([]);
    let vipTrails = $state([]);
    let sparkles = $state([]);
    let shockwaves = $state([]);
    let stamps = $state([]);
    let ripples = $state([]);
    let floatingTexts = $state([]);
    let sparklers = $state([]);
    let lastNukeTime = $state(0);
    let flashOpacity = $state(0);
    let isShaking = $state(false);
    let time = $state(0);
    let rainbowHue = $state(0);
    let grainCanvas = null;

    const imageCache = new Map();

    function isInBounds(x, y) {
        return (
            x >= -CANVAS_SIZE / 2 &&
            x <= CANVAS_SIZE / 2 &&
            y >= -CANVAS_SIZE / 2 &&
            y <= CANVAS_SIZE / 2
        );
    }

    function getMargin() {
        return Math.min(
            350,
            Math.min(window.innerWidth, window.innerHeight) * 0.35,
        );
    }

    function getMinScale() {
        if (!canvas) return 0.05;
        const margin = getMargin();
        const availableW = window.innerWidth - margin * 2;
        const availableH = window.innerHeight - margin * 2;
        return Math.min(availableW, availableH) / CANVAS_SIZE;
    }

    function clampTransform() {
        const minScale = getMinScale();
        if (transform.scale < minScale) transform.scale = minScale;

        const limitW = (CANVAS_SIZE / 2) * transform.scale;
        const limitH = (CANVAS_SIZE / 2) * transform.scale;
        const margin = getMargin();

        const minX = window.innerWidth - limitW - margin;
        const maxX = limitW + margin;
        if (minX > maxX) transform.x = window.innerWidth / 2;
        else transform.x = Math.max(minX, Math.min(maxX, transform.x));

        const minY = window.innerHeight - limitH - margin;
        const maxY = limitH + margin;
        if (minY > maxY) transform.y = window.innerHeight / 2;
        else transform.y = Math.max(minY, Math.min(maxY, transform.y));
    }

    function getCanvasPos(e) {
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const rect = canvas.getBoundingClientRect();
        return {
            x: (clientX - rect.left - transform.x) / transform.scale,
            y: (clientY - rect.top - transform.y) / transform.scale,
        };
    }

    function handlePointerDown(e) {
        if (e.touches && e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            pinch.startDist = Math.hypot(dx, dy);
            pinch.startScale = transform.scale;
            pinch.startMid = {
                x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
                y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
            };
            pinch.startOffset = { x: transform.x, y: transform.y };
            return;
        }

        const pos = getCanvasPos(e);
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        if (
            e.button === 1 ||
            (e.button === 0 &&
                (mode === "pan" || mode === "nuke" || mode === "burst")) ||
            (e.touches && mode === "pan")
        ) {
            if (mode === "nuke" || mode === "burst") {
                if (mode === "nuke") triggerNuke(pos.x, pos.y);
                else triggerBurst(pos.x, pos.y);
                mode = "draw";
                return;
            }
            isPanning = true;
            lastPos = { x: clientX, y: clientY };
        } else if ((e.button === 0 || e.touches) && mode === "stamp") {
            if (!isInBounds(pos.x, pos.y)) return;
            spawnRipple(pos.x, pos.y, "#3b82f6");
            const emojiList = [
                "🔥",
                "💎",
                "❤️",
                "👑",
                "☢️",
                "🦄",
                "🌈",
                "☀️",
                "💀",
            ];
            const randomEmoji =
                emojiList[Math.floor(Math.random() * emojiList.length)];
            const newStamp = {
                x: pos.x,
                y: pos.y,
                text: randomEmoji,
                size: 60 + Math.random() * 40,
                rotation: (Math.random() - 0.5) * 0.5,
                id: Math.random(),
                username,
            };
            stamps.push(newStamp);
            sync("new_stamp", newStamp);
            spawnConfetti(pos.x, pos.y, false, false);
        } else if ((e.button === 0 || e.touches) && mode === "draw") {
            if (!isInBounds(pos.x, pos.y)) return;
            spawnRipple(pos.x, pos.y, color);
            isDrawing = true;
            currentStroke = {
                points: [pos],
                color: isRainbow ? `hsl(${rainbowHue}, 100%, 50%)` : color,
                width: brushSize,
                id: Math.random(),
                username,
                isVIP,
                isRainbow,
                isGhost,
                timestamp: Date.now(),
            };
            strokes.push(currentStroke);
            sync("stroke_start", currentStroke);
        } else if ((e.button === 0 || e.touches) && mode === "sparkle") {
            if (!isInBounds(pos.x, pos.y)) return;
            isDrawing = true;
        }
    }

    function handlePointerMove(e) {
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        if (e.touches && e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const dist = Math.hypot(dx, dy);
            const newScale = Math.min(
                Math.max(
                    pinch.startScale * (dist / pinch.startDist),
                    getMinScale(),
                ),
                8,
            );
            const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
            const moveX = midX - pinch.startMid.x;
            const moveY = midY - pinch.startMid.y;
            const rect = canvas.getBoundingClientRect();
            const centerX = pinch.startMid.x - rect.left;
            const centerY = pinch.startMid.y - rect.top;
            const zoomX =
                centerX -
                (centerX - pinch.startOffset.x) * (newScale / pinch.startScale);
            const zoomY =
                centerY -
                (centerY - pinch.startOffset.y) * (newScale / pinch.startScale);
            transform.scale = newScale;
            transform.x = zoomX + moveX;
            transform.y = zoomY + moveY;
            clampTransform();
            return;
        }

        const pos = getCanvasPos(e);
        if (isInBounds(pos.x, pos.y)) {
            mouseCoord = { x: Math.round(pos.x), y: Math.round(pos.y) };
            sync("cursor", {
                x: pos.x,
                y: pos.y,
                username,
                color,
                isDrawing,
                isVIP,
                isRainbow,
                isGhost,
                pixelCount,
            });
            if (isVIP) spawnVIPTrial(pos.x, pos.y, "#fbbf24");
        } else {
            mouseCoord = null;
        }

        if (isPanning) {
            transform.x += clientX - lastPos.x;
            transform.y += clientY - lastPos.y;
            lastPos = { x: clientX, y: clientY };
            clampTransform();
        } else if (isDrawing && currentStroke) {
            if (isInBounds(pos.x, pos.y)) {
                currentStroke.points.push(pos);
                const pAdded = Math.ceil(brushSize / 4);
                pixelCount += pAdded;
                // Much lower frequency for floating text (5% -> 2%)
                if (Math.random() > 0.98)
                    spawnFloatingText(pos.x, pos.y - 20, `+${pAdded}`);
                sync("stroke_update", { id: currentStroke.id, point: pos });
                if (isVIP) spawnSparkle(pos.x, pos.y);

                // High-End Progress Feedback
                if (pixelCount > 0 && pixelCount % 1000 === 0) {
                    spawnFloatingText(
                        pos.x,
                        pos.y - 50,
                        "⭐ MILESTONE REACHED!",
                    );
                    spawnConfetti(pos.x, pos.y, true, false);
                }
            }
        } else if (isDrawing && mode === "sparkle") {
            if (isInBounds(pos.x, pos.y)) {
                for (let i = 0; i < 3; i++) {
                    sparklers.push({
                        x: pos.x + (Math.random() - 0.5) * 10,
                        y: pos.y + (Math.random() - 0.5) * 10,
                        vx: (Math.random() - 0.5) * 2,
                        vy: (Math.random() - 0.5) * 2,
                        life: 40 + Math.random() * 20,
                        hue: Math.random() * 360,
                    });
                }
                sync("sparkler", { x: pos.x, y: pos.y });
            }
        }
    }

    function handlePointerUp() {
        if (isDrawing) save();
        isPanning = false;
        isDrawing = false;
        currentStroke = null;
    }

    function handleWheel(e) {
        e.preventDefault();
        const factor = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.min(
            Math.max(transform.scale * factor, getMinScale()),
            8,
        );
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        transform.x =
            mouseX - (mouseX - transform.x) * (newScale / transform.scale);
        transform.y =
            mouseY - (mouseY - transform.y) * (newScale / transform.scale);
        transform.scale = newScale;
        clampTransform();
    }

    export function zoomIn() {
        applyZoom(1.3);
    }
    export function zoomOut() {
        applyZoom(0.7);
    }

    function applyZoom(factor) {
        const newScale = Math.min(
            Math.max(transform.scale * factor, getMinScale()),
            8,
        );
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        transform.x =
            centerX - (centerX - transform.x) * (newScale / transform.scale);
        transform.y =
            centerY - (centerY - transform.y) * (newScale / transform.scale);
        transform.scale = newScale;
        clampTransform();
    }

    function spawnVIPTrial(x, y, tint) {
        vipTrails.push({
            x,
            y,
            life: 30,
            color: tint,
            size: Math.random() * 5 + 2,
        });
        if (vipTrails.length > 50) vipTrails.shift();
    }
    function spawnSparkle(x, y) {
        for (let i = 0; i < 2; i++) {
            sparkles.push({
                x,
                y,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                life: 40 + Math.random() * 20,
                size: Math.random() * 4 + 2,
            });
        }
    }
    function spawnShockwave(x, y, color, maxR) {
        shockwaves.push({ x, y, r: 0, maxR, alpha: 1, color });
    }
    function triggerNuke(x, y) {
        const radius = 350;
        const now = Date.now();
        if (now - lastNukeTime < 60000) return;

        lastNukeTime = now;
        sync("nuke", { x, y, radius });
        applyNukeEffect(x, y, radius);
    }
    function applyNukeEffect(x, y, radius) {
        flashOpacity = 0.25; // Even subtler flash
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
            if (current.length > 0)
                result.push({ ...s, points: current, id: Math.random() });
            return result;
        });
        stamps = stamps.filter((s) => Math.hypot(s.x - x, s.y - y) > radius);
        spawnAtomicEffect(x, y);
        triggerShake(1.5);
    }
    function triggerBurst(x, y) {
        sync("confetti", { x, y, isVIP: true, mega: true });
        spawnConfetti(x, y, true, true);
        spawnShockwave(x, y, "#fbbf24", 500);
        triggerShake(0.8);
    }
    function spawnRipple(x, y, color) {
        // Reduced life and alpha for subtler look
        ripples.push({ x, y, r: 0, alpha: 0.4, color, life: 30 });
        sync("ripple", { x, y, color });
    }
    function spawnFloatingText(x, y, text) {
        // Smaller and faster
        floatingTexts.push({ x, y, text, life: 60, vy: -1.0, opacity: 0.8 });
    }
    function triggerShake(intensity = 1) {
        isShaking = intensity;
        setTimeout(() => (isShaking = false), 500);
    }
    function spawnAtomicEffect(x, y) {
        spawnShockwave(x, y, "#ffffff", 600);
        spawnShockwave(x, y, "#ef4444", 400);
        // Reduced particle count for performance (80 -> 35)
        for (let i = 0; i < 35; i++) {
            if (particles.length > 150) particles.shift(); // Hard limit
            particles.push({
                x,
                y,
                vx: (Math.random() - 0.5) * 50,
                vy: (Math.random() - 0.5) * 50 - 15,
                color: Math.random() > 0.4 ? "#f97316" : "#451a03",
                life: 100 + Math.random() * 50,
                size: 10 + Math.random() * 8,
            });
        }
    }
    function spawnConfetti(cx, cy, vip = false, mega = false) {
        // Significantly reduced counts for performance
        const count = mega ? 80 : vip ? 40 : 20;
        const colors = vip ? ["#fbbf24", "#f59e0b", "#ffffff"] : null;
        for (let i = 0; i < count; i++) {
            if (particles.length > 150) particles.shift();
            particles.push({
                x: cx,
                y: cy,
                vx: (Math.random() - 0.5) * (mega ? 40 : 15),
                vy: (Math.random() - 0.5) * (mega ? 40 : 15) - (vip ? 15 : 5),
                color: colors
                    ? colors[Math.floor(Math.random() * colors.length)]
                    : `hsl(${Math.random() * 360}, 80%, 60%)`,
                life: (mega ? 120 : 60) + Math.random() * 30,
                size: (mega ? 10 : 5) + Math.random() * 5,
            });
        }
    }

    function sync(type, data) {
        // Svelte 5 state proxies cannot be cloned for BroadcastChannel
        const cleanData = JSON.parse(JSON.stringify(data));
        if (socket?.connected) socket.emit(type, cleanData);
        channel.postMessage({ type, data: cleanData });
    }

    function save() {
        localStorage.setItem("canvas_strokes_v8", JSON.stringify(strokes));
        localStorage.setItem("canvas_ads_v8", JSON.stringify(ads));
        localStorage.setItem("canvas_stamps_v8", JSON.stringify(stamps));
    }

    export function resetView() {
        if (!canvas) return;
        transform = {
            x: canvas.width / 2,
            y: canvas.height / 2,
            scale: getMinScale() * 1.5,
        };
    }

    export function placeAdAuto(imageData) {
        const width = 200 + Math.random() * 300;
        const height = width * 0.7;
        const x =
            -CANVAS_SIZE / 2 +
            100 +
            Math.random() * (CANVAS_SIZE - 200 - width);
        const y =
            -CANVAS_SIZE / 2 +
            100 +
            Math.random() * (CANVAS_SIZE - 200 - height);
        const newAd = {
            x,
            y,
            width,
            height,
            image: imageData,
            id: Math.random(),
            username,
            isVIP,
        };
        ads.push(newAd);
        sync("new_ad", newAd);
        save();
        spawnAtomicEffect(x + width / 2, y + height / 2);
    }

    onMount(() => {
        ctx = canvas.getContext("2d");

        // Pre-render paper texture for stable performance
        grainCanvas = document.createElement("canvas");
        grainCanvas.width = 500;
        grainCanvas.height = 500;
        const gctx = grainCanvas.getContext("2d");
        gctx.fillStyle = "#000";
        gctx.globalAlpha = 0.08;
        for (let i = 0; i < 2000; i++) {
            gctx.fillRect(Math.random() * 500, Math.random() * 500, 1, 1);
        }

        try {
            // Intelligent Server URL Detection
            const isLocal =
                window.location.hostname === "localhost" ||
                window.location.hostname === "127.0.0.1";
            const serverUrl = isLocal
                ? `http://${window.location.hostname}:3001`
                : window.location.origin;

            socket = io(serverUrl, {
                transports: ["polling", "websocket"], // Crucial for cloud proxies
                reconnection: true,
                reconnectionAttempts: 10,
                timeout: 10000,
                autoConnect: true,
            });
            socket.on("connect", () =>
                console.log("✅ Synced to Global Board"),
            );
            socket.on("init", (data) => {
                strokes = data.strokes || [];
                ads = data.ads || [];
                stamps = data.stamps || [];
            });
            socket.on("stroke_start", (data) => strokes.push(data));
            socket.on("new_stamp", (data) => stamps.push(data));
            socket.on("stroke_update", (data) => {
                const s = strokes.find((s) => s.id === data.id);
                if (s) s.points.push(data.point);
            });
            socket.on("new_ad", (data) => ads.push(data));
            socket.on("cursor", (data) => {
                remoteUsers[data.username] = { ...data, timestamp: Date.now() };
                onUsersUpdate?.(Object.values(remoteUsers));
            });
            socket.on("confetti", (data) => {
                spawnConfetti(data.x, data.y, data.isVIP, data.mega);
                if (data.mega) {
                    spawnShockwave(data.x, data.y, "#fbbf24", 500);
                    triggerShake(0.8);
                }
            });
            socket.on("nuke", (data) => {
                applyNukeEffect(data.x, data.y, data.radius);
            });
            socket.on("ripple", (data) => {
                ripples.push({
                    x: data.x,
                    y: data.y,
                    r: 0,
                    alpha: 1,
                    color: data.color,
                    life: 60,
                });
            });
            socket.on("clear", () => {
                strokes = [];
                ads = [];
                stamps = [];
                window.location.reload();
            });
        } catch (e) {
            console.warn("Socket.io offline. Using fallbacks.");
        }

        const s = localStorage.getItem("canvas_strokes_v8");
        const a = localStorage.getItem("canvas_ads_v8");
        const st = localStorage.getItem("canvas_stamps_v8");
        if (s && strokes.length === 0) strokes = JSON.parse(s);
        if (a && ads.length === 0) ads = JSON.parse(a);
        if (st && stamps.length === 0) stamps = JSON.parse(st);

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            if (typeof clampTransform === "function") clampTransform();
        };
        window.addEventListener("resize", handleResize);
        handleResize();
        resetView();

        const loop = () => {
            time += 0.05;
            rainbowHue = (rainbowHue + 2) % 360;
            if (isRainbow && isDrawing && currentStroke)
                currentStroke.color = `hsl(${rainbowHue}, 100%, 50%)`;
            flashOpacity = Math.max(0, flashOpacity - 0.03); // Faster fade
            const now = Date.now();

            // Update Cooldown Prop
            const left = Math.ceil((60000 - (now - lastNukeTime)) / 1000);
            nukeCooldown = left > 0 && left <= 60 ? left : 0;

            particles = particles
                .map((p) => ({
                    ...p,
                    x: p.x + p.vx,
                    y: p.y + p.vy,
                    vy: p.vy + 0.5,
                    life: p.life - 1,
                }))
                .filter((p) => p.life > 0);
            vipTrails = vipTrails
                .map((p) => ({ ...p, life: p.life - 1, size: p.size * 0.95 }))
                .filter((p) => p.life > 0);
            sparkles = sparkles
                .map((s) => ({
                    ...s,
                    x: s.x + s.vx,
                    y: s.y + s.vy,
                    life: s.life - 1,
                    size: s.size * 0.98,
                }))
                .filter((s) => s.life > 0);
            shockwaves = shockwaves
                .map((s) => ({
                    ...s,
                    r: s.r + 20,
                    alpha: Math.max(0, 1 - s.r / s.maxR),
                }))
                .filter((s) => s.alpha > 0);
            ripples = ripples
                .map((r) => ({
                    ...r,
                    r: r.r + 3,
                    alpha: (r.life / 30) * 0.4,
                    life: r.life - 1,
                }))
                .filter((r) => r.life > 0);
            floatingTexts = floatingTexts
                .map((f) => ({
                    ...f,
                    y: f.y + f.vy,
                    opacity: f.life / 60,
                    life: f.life - 1,
                }))
                .filter((f) => f.life > 0);
            sparklers = sparklers
                .map((s) => ({
                    ...s,
                    x: s.x + s.vx,
                    y: s.y + s.vy,
                    life: s.life - 1,
                }))
                .filter((s) => s.life > 0);
            strokes = strokes.filter(
                (s) => !(s.isGhost && now - s.timestamp > 5000),
            );
            let changed = false;
            for (let id in remoteUsers) {
                if (now - remoteUsers[id].timestamp > 3000) {
                    delete remoteUsers[id];
                    changed = true;
                }
            }
            if (changed) onUsersUpdate?.(Object.values(remoteUsers));

            // Limit total interactive objects for extreme optimization
            if (particles.length > 100) particles = particles.slice(-100);
            if (sparkles.length > 50) sparkles = sparkles.slice(-50);
            if (vipTrails.length > 30) vipTrails = vipTrails.slice(-30);

            draw();
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);

        channel.onmessage = (e) => {
            if (socket?.connected) return;
            const { type, data } = e.data;
            if (type === "stroke_start") strokes.push(data);
            else if (type === "stroke_update") {
                const s = strokes.find((s) => s.id === data.id);
                if (s) s.points.push(data.point);
            } else if (type === "new_ad") ads.push(data);
            else if (type === "new_stamp") stamps.push(data);
            else if (type === "sparkler") {
                for (let i = 0; i < 2; i++) {
                    sparklers.push({
                        x: data.x,
                        y: data.y,
                        vx: (Math.random() - 0.5) * 2,
                        vy: (Math.random() - 0.5) * 2,
                        life: 40,
                        hue: Math.random() * 360,
                    });
                }
            } else if (type === "ripple") {
                ripples.push({
                    x: data.x,
                    y: data.y,
                    r: 0,
                    alpha: 1,
                    color: data.color,
                    life: 60,
                });
            } else if (type === "cursor") {
                remoteUsers[data.username] = { ...data, timestamp: Date.now() };
                onUsersUpdate?.(Object.values(remoteUsers));
            } else if (type === "nuke") {
                applyNukeEffect(data.x, data.y, data.radius);
            } else if (type === "clear") {
                strokes = [];
                ads = [];
                stamps = [];
                window.location.reload();
            }
        };

        return () => {
            window.removeEventListener("resize", handleResize);
            socket?.disconnect();
            channel.close();
        };
    });

    function draw() {
        if (!ctx) return;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.translate(transform.x, transform.y);
        ctx.scale(transform.scale, transform.scale);
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(
            -CANVAS_SIZE / 2 + 10,
            -CANVAS_SIZE / 2 + 10,
            CANVAS_SIZE,
            CANVAS_SIZE,
        );
        ctx.fillStyle = isDarkMode ? "#1e293b" : "#ffffff";
        ctx.fillRect(
            -CANVAS_SIZE / 2,
            -CANVAS_SIZE / 2,
            CANVAS_SIZE,
            CANVAS_SIZE,
        );

        // Draw Grid (Infinite feel)
        ctx.beginPath();
        ctx.strokeStyle = isDarkMode
            ? "rgba(255, 255, 255, 0.05)"
            : "rgba(0, 0, 0, 0.03)";
        ctx.lineWidth = 1 / transform.scale;
        for (let x = -CANVAS_SIZE / 2; x <= CANVAS_SIZE / 2; x += 100) {
            ctx.moveTo(x, -CANVAS_SIZE / 2);
            ctx.lineTo(x, CANVAS_SIZE / 2);
        }
        for (let y = -CANVAS_SIZE / 2; y <= CANVAS_SIZE / 2; y += 100) {
            ctx.moveTo(-CANVAS_SIZE / 2, y);
            ctx.lineTo(CANVAS_SIZE / 2, y);
        }
        ctx.stroke();

        // Stable Paper Grain Texture (Pattern)
        if (grainCanvas) {
            ctx.save();
            ctx.globalAlpha = 0.04;
            const pattern = ctx.createPattern(grainCanvas, "repeat");
            ctx.fillStyle = pattern;
            ctx.fillRect(
                -CANVAS_SIZE / 2,
                -CANVAS_SIZE / 2,
                CANVAS_SIZE,
                CANVAS_SIZE,
            );
            ctx.restore();
        }

        ads.forEach((ad) => {
            let img = imageCache.get(ad.image);
            if (!img) {
                img = new Image();
                img.src = ad.image;
                img.onload = () => imageCache.set(ad.image, img);
            }
            if (img?.complete) {
                ctx.save();
                ctx.beginPath();
                ctx.roundRect(
                    ad.x,
                    ad.y,
                    ad.width,
                    ad.height,
                    20 / transform.scale,
                );
                ctx.clip();
                ctx.drawImage(img, ad.x, ad.y, ad.width, ad.height);
                ctx.restore();
                if (ad.isVIP) {
                    ctx.strokeStyle = `hsl(45, 100%, ${50 + Math.sin(time * 3) * 15}%)`;
                    ctx.lineWidth = 12 / transform.scale;
                    ctx.shadowBlur = 30 / transform.scale;
                    ctx.shadowColor = "#fbbf24";
                } else {
                    ctx.strokeStyle = "#1e293b";
                    ctx.lineWidth = 4 / transform.scale;
                }
                ctx.stroke();
                ctx.shadowBlur = 0;
            }
        });

        const now = Date.now();

        stamps.forEach((s) => {
            ctx.save();
            ctx.translate(s.x, s.y);
            ctx.rotate(s.rotation || 0);
            ctx.font = `${s.size}px Arial`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(s.text, 0, 0);
            ctx.restore();
        });

        strokes.forEach((s) => {
            if (s.points.length < 2) return;
            ctx.beginPath();
            ctx.lineWidth = s.width;
            ctx.strokeStyle = s.color;
            if (s.isVIP) {
                ctx.shadowBlur = (s.isRainbow ? 12 : 6) / transform.scale;
                ctx.shadowColor = s.color;
            }
            if (s.isGhost)
                ctx.globalAlpha = Math.max(0, 1 - (now - s.timestamp) / 5000);
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.moveTo(s.points[0].x, s.points[0].y);
            for (let i = 1; i < s.points.length; i++)
                ctx.lineTo(s.points[i].x, s.points[i].y);
            ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
        });

        vipTrails.forEach((p) => {
            ctx.globalAlpha = p.life / 30;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size / transform.scale, 0, Math.PI * 2);
            ctx.fill();
        });
        sparkles.forEach((s) => {
            ctx.globalAlpha = s.life / 60;
            ctx.fillStyle = "#fff";
            ctx.shadowBlur = 12 / transform.scale;
            ctx.shadowColor = "#fbbf24";
            const r = (s.size + Math.sin(time * 12) * 3) / transform.scale;
            ctx.beginPath();
            ctx.moveTo(s.x, s.y - r);
            ctx.lineTo(s.x + r, s.y);
            ctx.lineTo(s.x, s.y + r);
            ctx.lineTo(s.x - r, s.y);
            ctx.fill();
            ctx.shadowBlur = 0;
        });
        shockwaves.forEach((s) => {
            ctx.globalAlpha = s.alpha;
            ctx.strokeStyle = s.color;
            ctx.lineWidth = 30 / transform.scale;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.stroke();
        });
        particles.forEach((p) => {
            ctx.globalAlpha = Math.min(p.life / 50, 1);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size / transform.scale, 0, Math.PI * 2);
            ctx.fill();
        });

        ripples.forEach((r) => {
            ctx.globalAlpha = r.alpha;
            ctx.strokeStyle = r.color;
            ctx.lineWidth = 2 / transform.scale;
            ctx.beginPath();
            ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
            ctx.stroke();
        });

        floatingTexts.forEach((f) => {
            ctx.globalAlpha = f.opacity * 0.6; // Even more transparent
            ctx.fillStyle = "#64748b"; // Soft slate color
            ctx.font = `bold ${12 / transform.scale}px "Inter"`;
            ctx.textAlign = "center";
            ctx.fillText(f.text, f.x, f.y);
        });

        sparklers.forEach((s) => {
            ctx.globalAlpha = s.life / 60;
            ctx.fillStyle = `hsl(${s.hue}, 100%, 70%)`;
            ctx.shadowBlur = 10 / transform.scale;
            ctx.shadowColor = `hsl(${s.hue}, 100%, 70%)`;
            ctx.beginPath();
            ctx.arc(s.x, s.y, 3 / transform.scale, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.shadowBlur = 0;

        ctx.globalAlpha = 1;

        Object.values(remoteUsers).forEach((c) => {
            if (c.username === username) return;
            // Draw Cursor Pulse (Subtler)
            ctx.save();
            ctx.globalAlpha = 0.1;
            ctx.lineWidth = 1 / transform.scale;
            ctx.beginPath();
            ctx.arc(
                c.x,
                c.y,
                (10 + Math.sin(time * 6) * 3) / transform.scale,
                0,
                Math.PI * 2,
            );
            ctx.strokeStyle = c.color || "#3b82f6";
            ctx.stroke();
            ctx.restore();

            const dot = (c.isVIP ? 10 : 6) / transform.scale;
            if (c.isVIP) {
                ctx.beginPath();
                ctx.arc(c.x, c.y, dot * 3.5, 0, Math.PI * 2);
                const g = ctx.createRadialGradient(
                    c.x,
                    c.y,
                    0,
                    c.x,
                    c.y,
                    dot * 3.5,
                );
                g.addColorStop(0, "rgba(251, 191, 36, 0.6)");
                g.addColorStop(1, "rgba(251, 191, 36, 0)");
                ctx.fillStyle = g;
                ctx.fill();
            }
            ctx.beginPath();
            ctx.arc(c.x, c.y, dot, 0, Math.PI * 2);
            ctx.fillStyle = c.isVIP ? "#fbbf24" : c.color || "#3b82f6";
            ctx.fill();
            ctx.font = `800 ${14 / transform.scale}px "Outfit"`;
            const txt = c.username + (c.isVIP ? " ✨" : "");
            const tw = ctx.measureText(txt).width;
            ctx.fillStyle = c.isVIP ? "#fbbf24" : "#1e293b";
            ctx.beginPath();
            ctx.roundRect(
                c.x + 15 / transform.scale,
                c.y - 20 / transform.scale,
                tw + 20 / transform.scale,
                28 / transform.scale,
                10 / transform.scale,
            );
            ctx.fill();
            ctx.fillStyle = c.isVIP ? "#000" : "#fff";
            ctx.fillText(
                txt,
                c.x + 25 / transform.scale,
                c.y + 0 / transform.scale,
            );
        });

        // Global Effects (Flash)
        if (flashOpacity > 0) {
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.fillStyle = `rgba(255, 255, 255, ${flashOpacity})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }
</script>

<canvas
    bind:this={canvas}
    class:shaking={isShaking !== false}
    style="--intensity: {isShaking || 1}"
    onmousedown={handlePointerDown}
    onmousemove={handlePointerMove}
    onmouseup={handlePointerUp}
    onmouseleave={handlePointerUp}
    ontouchstart={(e) => {
        e.preventDefault();
        handlePointerDown(e);
    }}
    ontouchmove={(e) => {
        e.preventDefault();
        handlePointerMove(e);
    }}
    ontouchend={handlePointerUp}
    onwheel={handleWheel}
    oncontextmenu={(e) => e.preventDefault()}
></canvas>

<style>
    canvas {
        display: block;
        width: 100vw;
        height: 100vh;
        background: var(--bg-app);
        transition: background 0.5s ease;
        cursor: crosshair;
        touch-action: none;
    }
    .shaking {
        animation: shake calc(0.4s / var(--intensity))
            cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
    }
    @keyframes shake {
        10%,
        90% {
            transform: translate3d(-1px, 0, 0);
        }
        20%,
        80% {
            transform: translate3d(2px, 0, 0);
        }
        30%,
        50%,
        70% {
            transform: translate3d(-4px, 0, 0);
        }
        40%,
        60% {
            transform: translate3d(4px, 0, 0);
        }
    }
</style>
