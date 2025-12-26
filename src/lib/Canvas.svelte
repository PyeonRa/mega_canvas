<script>
    import { onMount, createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();
    const channel = new BroadcastChannel("canvas_sync");

    // Constants
    const CANVAS_SIZE = 5000;

    let canvas;
    let ctx;
    let transform = { x: 0, y: 0, scale: 0.3 };
    let isPanning = false;
    let isDrawing = false;
    let lastPos = { x: 0, y: 0 };
    let pinchStartDist = 0;
    let pinchStartScale = 1;

    let strokes = [];
    let ads = [];
    let currentStroke = null;

    export let color = "#1e293b";
    export let brushSize = 5;
    export let mode = "draw";
    export let username = "Guest";
    export let isVIP = false;
    export let isRainbow = false;
    export let isGhost = false;
    let isShaking = false;
    let shockwaves = []; // { x, y, r, alpha, color }

    // Exported coordinate (only when inside canvas)
    export let mouseCoord = null;
    export let pixelCount = 0;

    // Remote users cursors
    let remoteCursors = new Map();
    let particles = [];
    let vipTrails = []; // { x, y, life, color }
    let sparkles = []; // { x, y, vx, vy, life, size, color }

    function isInBounds(x, y) {
        return (
            x >= -CANVAS_SIZE / 2 &&
            x <= CANVAS_SIZE / 2 &&
            y >= -CANVAS_SIZE / 2 &&
            y <= CANVAS_SIZE / 2
        );
    }

    function getMinScale() {
        if (!canvas) return 0.1;
        return Math.max(window.innerWidth, window.innerHeight) / CANVAS_SIZE;
    }

    function clampTransform() {
        const minScale = getMinScale();
        if (transform.scale < minScale) transform.scale = minScale;

        const limitX = (CANVAS_SIZE / 2) * transform.scale;
        const limitY = (CANVAS_SIZE / 2) * transform.scale;
        const margin = 50;

        transform.x = Math.max(
            window.innerWidth - limitX - margin,
            Math.min(limitX + margin, transform.x),
        );
        transform.y = Math.max(
            window.innerHeight - limitY - margin,
            Math.min(limitY + margin, transform.y),
        );
    }

    function getEventPos(e) {
        if (e.touches && e.touches.length > 0) {
            return {
                clientX: e.touches[0].clientX,
                clientY: e.touches[0].clientY,
            };
        }
        return { clientX: e.clientX, clientY: e.clientY };
    }

    function getCanvasPos(e) {
        const { clientX, clientY } = getEventPos(e);
        const rect = canvas.getBoundingClientRect();
        const x = (clientX - rect.left - transform.x) / transform.scale;
        const y = (clientY - rect.top - transform.y) / transform.scale;
        return { x, y };
    }

    function handlePointerDown(e) {
        if (e.touches && e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            pinchStartDist = Math.sqrt(dx * dx + dy * dy);
            pinchStartScale = transform.scale;
            return;
        }

        const pos = getCanvasPos(e);
        const { clientX, clientY } = getEventPos(e);

        if (
            e.button === 1 ||
            (e.button === 0 &&
                (mode === "pan" || mode === "nuke" || mode === "burst")) ||
            (e.touches &&
                (mode === "pan" || mode === "nuke" || mode === "burst"))
        ) {
            if (mode === "nuke" || mode === "burst") {
                const pos = getCanvasPos(e);
                if (mode === "nuke") triggerNuke(pos.x, pos.y);
                else triggerBurst(pos.x, pos.y);
                return;
            }
            isPanning = true;
            lastPos = { x: clientX, y: clientY };
        } else if ((e.button === 0 || e.touches) && mode === "draw") {
            if (!isInBounds(pos.x, pos.y)) return;
            isDrawing = true;
            currentStroke = {
                points: [pos],
                color,
                width: brushSize,
                id: Math.random(),
                username,
                isVIP,
                isRainbow,
                isGhost,
                timestamp: Date.now(),
            };
            strokes = [...strokes, currentStroke];
            sync("stroke_start", currentStroke);
        }
    }

    function handlePointerMove(e) {
        if (e.touches && e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const newScale = Math.min(
                Math.max(
                    pinchStartScale * (dist / pinchStartDist),
                    getMinScale(),
                ),
                8,
            );

            const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
            const rect = canvas.getBoundingClientRect();
            const centerX = midX - rect.left;
            const centerY = midY - rect.top;

            transform.x =
                centerX -
                (centerX - transform.x) * (newScale / transform.scale);
            transform.y =
                centerY - (centerY - transform.y) * (newScale / oldScale);
            transform.scale = newScale;

            clampTransform();
            requestAnimationFrame(draw);
            return;
        }

        const pos = getCanvasPos(e);
        const { clientX, clientY } = getEventPos(e);

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
            });

            // VIP Particle Trail locally
            if (isVIP) {
                spawnVIPTrial(pos.x, pos.y, "#fbbf24");
                if (isDrawing) spawnSparkle(pos.x, pos.y);
            }
        } else {
            mouseCoord = null;
        }

        if (isPanning) {
            const dx = clientX - lastPos.x;
            const dy = clientY - lastPos.y;
            transform.x += dx;
            transform.y += dy;
            lastPos = { x: clientX, y: clientY };
            clampTransform();
            requestAnimationFrame(draw);
        } else if (isDrawing) {
            if (isInBounds(pos.x, pos.y)) {
                currentStroke.points.push(pos);
                pixelCount += Math.ceil(brushSize / 4);
                sync("stroke_update", { id: currentStroke.id, point: pos });
            }
            requestAnimationFrame(draw);
        }
    }

    function spawnVIPTrial(x, y, tint) {
        vipTrails.push({
            x,
            y,
            life: 30,
            color: tint,
            size: Math.random() * 5 + 2,
        });
        if (vipTrails.length > 100) vipTrails.shift();
        requestAnimationFrame(draw);
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
                color: "#fff",
            });
        }
    }

    function handlePointerUp() {
        if (isDrawing) {
            save();
            localStorage.setItem("pixel_count_v3", pixelCount.toString());
        }
        isPanning = false;
        isDrawing = false;
        currentStroke = null;
        requestAnimationFrame(draw);
    }

    function handleWheel(e) {
        e.preventDefault();
        const zoomSpeed = 0.0015;
        const delta = -e.deltaY;
        zoom(delta * zoomSpeed, e.clientX, e.clientY);
    }

    export function zoomIn() {
        zoom(0.3, window.innerWidth / 2, window.innerHeight / 2);
    }
    export function zoomOut() {
        zoom(-0.3, window.innerWidth / 2, window.innerHeight / 2);
    }

    function zoom(factor, centerX, centerY) {
        const oldScale = transform.scale;
        let newScale = oldScale * (1 + factor);
        const minScale = getMinScale();
        newScale = Math.min(Math.max(newScale, minScale), 8);

        const rect = canvas.getBoundingClientRect();
        const mouseX = centerX - rect.left;
        const mouseY = centerY - rect.top;

        transform.x = mouseX - (mouseX - transform.x) * (newScale / oldScale);
        transform.y = mouseY - (mouseY - transform.y) * (newScale / oldScale);
        transform.scale = newScale;

        clampTransform();
        requestAnimationFrame(draw);
    }

    function save() {
        localStorage.setItem("canvas_strokes_v6", JSON.stringify(strokes));
        localStorage.setItem("canvas_ads_v6", JSON.stringify(ads));
    }

    function load() {
        const s = localStorage.getItem("canvas_strokes_v6");
        const a = localStorage.getItem("canvas_ads_v6");
        const p = localStorage.getItem("pixel_count_v3");
        if (s) strokes = JSON.parse(s);
        if (a) ads = JSON.parse(a);
        if (p) pixelCount = parseInt(p);
    }

    function sync(type, data) {
        channel.postMessage({ type, data });
    }

    function triggerNuke(x, y) {
        if (!isVIP) return;
        const radius = 350;
        strokes = strokes.filter(
            (s) => !s.points.some((p) => Math.hypot(p.x - x, p.y - y) < radius),
        );
        sync("nuke", { x, y, radius });
        spawnAtomicEffect(x, y);
        triggerShake(1.5);
        save();
    }

    function triggerBurst(x, y) {
        if (!isVIP) return;
        sync("confetti", { x, y, isVIP: true, mega: true });
        spawnConfetti(x, y, true, true);
        spawnShockwave(x, y, "#fbbf24", 500);
        triggerShake(0.8);
    }

    function spawnAtomicEffect(x, y) {
        // Flash
        spawnShockwave(x, y, "#ffffff", 600);
        // Fireball
        spawnShockwave(x, y, "#ef4444", 400);

        // Soot/Fire particles
        for (let i = 0; i < 80; i++) {
            particles.push({
                x,
                y,
                vx: (Math.random() - 0.5) * 60,
                vy: (Math.random() - 0.5) * 60 - 20,
                color: Math.random() > 0.3 ? "#451a03" : "#f97316",
                life: 150 + Math.random() * 50,
                size: 15 + Math.random() * 10,
            });
        }
    }

    function spawnShockwave(x, y, color, maxR) {
        shockwaves.push({ x, y, r: 0, maxR, alpha: 1, color });
    }

    function triggerShake(intensity = 1) {
        isShaking = intensity;
        setTimeout(() => (isShaking = false), 500);
    }

    export function placeAdAuto(imageData) {
        const width = 200 + Math.random() * 300;
        const height = width * 0.7;
        const maxX = CANVAS_SIZE / 2 - width - 50;
        const maxY = CANVAS_SIZE / 2 - height - 50;
        const x =
            -CANVAS_SIZE / 2 +
            50 +
            Math.random() * (maxX + CANVAS_SIZE / 2 - 50);
        const y =
            -CANVAS_SIZE / 2 +
            50 +
            Math.random() * (maxY + CANVAS_SIZE / 2 - 50);

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
        ads = [...ads, newAd];
        sync("new_ad", newAd);
        save();
        sync("confetti", { x: x + width / 2, y: y + height / 2, isVIP });
        spawnConfetti(x + width / 2, y + height / 2, isVIP);
        dispatch("adPlaced");
        requestAnimationFrame(draw);
    }

    function spawnConfetti(cx, cy, vip = false, mega = false) {
        const count = mega ? 300 : vip ? 150 : 40;
        const colors = vip ? ["#fbbf24", "#f59e0b", "#ffffff"] : null;
        for (let i = 0; i < count; i++) {
            particles.push({
                x: cx,
                y: cy,
                vx: (Math.random() - 0.5) * (mega ? 60 : vip ? 40 : 20),
                vy:
                    (Math.random() - 0.5) * (mega ? 60 : vip ? 40 : 20) -
                    (vip ? 25 : 15),
                color: colors
                    ? colors[Math.floor(Math.random() * colors.length)]
                    : `hsl(${Math.random() * 360}, 80%, 60%)`,
                life: (mega ? 200 : vip ? 150 : 80) + Math.random() * 40,
                size: (mega ? 12 : vip ? 8 : 6) + Math.random() * 10,
            });
        }
        animateParticles();
    }

    function animateParticles() {
        if (
            particles.length === 0 &&
            vipTrails.length === 0 &&
            sparkles.length === 0 &&
            shockwaves.length === 0
        )
            return;
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

        requestAnimationFrame(draw);
        if (
            particles.length > 0 ||
            vipTrails.length > 0 ||
            sparkles.length > 0 ||
            shockwaves.length > 0
        )
            requestAnimationFrame(animateParticles);
    }

    setInterval(() => {
        const now = Date.now();
        remoteCursors.forEach((cursor, key) => {
            if (now - cursor.timestamp > 3000) remoteCursors.delete(key);
        });
        dispatch("usersUpdate", Array.from(remoteCursors.values()));
    }, 1000);

    channel.onmessage = (event) => {
        const { type, data } = event.data;
        if (type === "stroke_start") {
            strokes = [...strokes, data];
        } else if (type === "stroke_update") {
            const s = strokes.find((s) => s.id === data.id);
            if (s) {
                s.points.push(data.point);
                strokes = strokes;
            }
        } else if (type === "new_ad") {
            ads = [...ads, data];
        } else if (type === "cursor") {
            remoteCursors.set(data.username, {
                ...data,
                timestamp: Date.now(),
            });
            dispatch("usersUpdate", Array.from(remoteCursors.values()));
            if (data.isVIP) {
                spawnVIPTrial(data.x, data.y, "#fbbf24");
                if (data.isDrawing) spawnSparkle(data.x, data.y);
            }
        } else if (type === "confetti") {
            spawnConfetti(data.x, data.y, data.isVIP, data.mega);
            if (data.mega) {
                spawnShockwave(data.x, data.y, "#fbbf24", 500);
                triggerShake(0.8);
            }
        } else if (type === "nuke") {
            const { x, y, radius } = data;
            strokes = strokes.filter(
                (s) =>
                    !s.points.some(
                        (p) => Math.hypot(p.x - x, p.y - y) < radius,
                    ),
            );
            spawnAtomicEffect(x, y);
            triggerShake(1.5);
        } else if (type === "clear") {
            strokes = [];
            ads = [];
            pixelCount = 0;
            localStorage.removeItem("canvas_strokes_v6");
            localStorage.removeItem("canvas_ads_v6");
            localStorage.removeItem("pixel_count_v3");
        }
        requestAnimationFrame(draw);
    };

    const imageCache = new Map();
    let time = 0;
    let rainbowHue = 0;
    let shockwaves = []; // Added shockwaves state variable

    function draw() {
        if (!ctx) return;
        time += 0.05;
        rainbowHue = (rainbowHue + 2) % 360;

        // If local user is drawing in rainbow mode, update their color
        if (isRainbow && isDrawing && currentStroke) {
            currentStroke.color = `hsl(${rainbowHue}, 100%, 50%)`;
        }

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.translate(transform.x, transform.y);
        ctx.scale(transform.scale, transform.scale);

        // Canvas surface
        ctx.fillStyle = "#ffffff";
        ctx.shadowBlur = 60 / transform.scale;
        ctx.shadowColor = "rgba(0,0,0,0.06)";
        ctx.fillRect(
            -CANVAS_SIZE / 2,
            -CANVAS_SIZE / 2,
            CANVAS_SIZE,
            CANVAS_SIZE,
        );
        ctx.shadowBlur = 0;

        // Subtle grid
        drawGrid();

        // Ads
        ads.forEach((ad) => {
            if (ad.image) {
                let img = imageCache.get(ad.image);
                if (!img) {
                    img = new Image();
                    img.src = ad.image;
                    img.onload = () => {
                        imageCache.set(ad.image, img);
                        requestAnimationFrame(draw);
                    };
                }
                if (img.complete) {
                    ctx.save();
                    const r = 12 / transform.scale;
                    ctx.beginPath();
                    ctx.roundRect(ad.x, ad.y, ad.width, ad.height, r);
                    ctx.clip();
                    ctx.drawImage(img, ad.x, ad.y, ad.width, ad.height);
                    ctx.restore();

                    if (ad.isVIP) {
                        // Animated Golden Border
                        ctx.strokeStyle = `hsl(45, 100%, ${50 + Math.sin(time) * 20}%)`;
                        ctx.lineWidth = 8 / transform.scale;
                        ctx.shadowBlur = 15 / transform.scale;
                        ctx.shadowColor = "#fbbf24";
                    } else {
                        ctx.strokeStyle = "rgba(0,0,0,0.08)";
                        ctx.lineWidth = 1 / transform.scale;
                    }
                    ctx.stroke();
                    ctx.shadowBlur = 0;
                }
            }
        });

        // Strokes
        const now = Date.now();
        strokes = strokes.filter((s) => {
            if (s.isGhost && now - s.timestamp > 5000) return false;
            return true;
        });

        strokes.forEach((stroke) => {
            if (stroke.points.length < 2) return;
            ctx.beginPath();
            ctx.lineWidth = stroke.width;
            ctx.strokeStyle = stroke.color;

            if (stroke.isVIP) {
                ctx.shadowBlur = (stroke.isRainbow ? 8 : 4) / transform.scale;
                ctx.shadowColor = stroke.color;
            }

            if (stroke.isGhost) {
                const age = now - stroke.timestamp;
                ctx.globalAlpha = Math.max(0, 1 - age / 5000);
            }

            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
            for (let i = 1; i < stroke.points.length; i++)
                ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
            ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
        });

        // VIP Trails
        vipTrails.forEach((p) => {
            ctx.globalAlpha = p.life / 30;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size / transform.scale, 0, Math.PI * 2);
            ctx.fill();
        });

        // Sparkles
        sparkles.forEach((s) => {
            ctx.globalAlpha = s.life / 60;
            ctx.fillStyle = "#fff";
            ctx.shadowBlur = 10 / transform.scale;
            ctx.shadowColor = "#fbbf24";
            ctx.beginPath();
            // Draw a diamond/star shape for sparkle
            const r = s.size / transform.scale;
            ctx.moveTo(s.x, s.y - r);
            ctx.lineTo(s.x + r, s.y);
            ctx.lineTo(s.x, s.y + r);
            ctx.lineTo(s.x - r, s.y);
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;
        });
        ctx.globalAlpha = 1;

        // Shockwaves
        shockwaves.forEach((s) => {
            ctx.globalAlpha = s.alpha;
            ctx.strokeStyle = s.color;
            ctx.lineWidth = 15 / transform.scale;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.stroke();
        });
        ctx.globalAlpha = 1;

        // Minimal Remote Cursors
        remoteCursors.forEach((cursor) => {
            if (cursor.username === username) return;

            const dotSize = (cursor.isVIP ? 6 : 4) / transform.scale;

            if (cursor.isVIP) {
                // VIP Aura
                ctx.beginPath();
                ctx.arc(cursor.x, cursor.y, dotSize * 2.5, 0, Math.PI * 2);
                const grad = ctx.createRadialGradient(
                    cursor.x,
                    cursor.y,
                    0,
                    cursor.x,
                    cursor.y,
                    dotSize * 2.5,
                );
                grad.addColorStop(0, "rgba(251, 191, 36, 0.4)");
                grad.addColorStop(1, "rgba(251, 191, 36, 0)");
                ctx.fillStyle = grad;
                ctx.fill();
            }

            ctx.beginPath();
            ctx.arc(cursor.x, cursor.y, dotSize, 0, Math.PI * 2);
            ctx.fillStyle = cursor.isVIP
                ? "#fbbf24"
                : cursor.color || "#3b82f6";
            ctx.fill();

            // Mini Label
            ctx.font = `${(cursor.isVIP ? 12 : 10) / transform.scale}px "Inter", sans-serif`;
            const label = cursor.username + (cursor.isVIP ? " ✨" : "");
            const textWidth = ctx.measureText(label).width;
            const padding = 6 / transform.scale;

            ctx.fillStyle = cursor.isVIP
                ? "rgba(251, 191, 36, 0.95)"
                : "rgba(15, 23, 42, 0.85)";
            const lx = cursor.x + 8 / transform.scale;
            const ly = cursor.y - 14 / transform.scale;
            ctx.beginPath();
            ctx.roundRect(
                lx,
                ly,
                textWidth + padding * 2,
                (cursor.isVIP ? 18 : 16) / transform.scale,
                4 / transform.scale,
            );
            ctx.fill();

            ctx.fillStyle = cursor.isVIP ? "#000" : "#ffffff";
            ctx.fillText(
                label,
                lx + padding,
                ly + (cursor.isVIP ? 13 : 11.5) / transform.scale,
            );
        });

        // Particles
        particles.forEach((p) => {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = Math.min(p.life / 50, 1);
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size / transform.scale, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
    }

    function drawGrid() {
        ctx.strokeStyle = "rgba(0,0,0,0.03)";
        ctx.lineWidth = 1 / transform.scale;
        ctx.beginPath();
        for (let x = -CANVAS_SIZE / 2; x <= CANVAS_SIZE / 2; x += 100) {
            ctx.moveTo(x, -CANVAS_SIZE / 2);
            ctx.lineTo(x, CANVAS_SIZE / 2);
        }
        for (let y = -CANVAS_SIZE / 2; y <= CANVAS_SIZE / 2; y += 100) {
            ctx.moveTo(-CANVAS_SIZE / 2, y);
            ctx.lineTo(CANVAS_SIZE / 2, y);
        }
        ctx.stroke();
    }

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        clampTransform();
        requestAnimationFrame(draw);
    }

    onMount(() => {
        load();
        ctx = canvas.getContext("2d");
        window.addEventListener("resize", resize);
        resize();
        transform = {
            x: canvas.width / 2,
            y: canvas.height / 2,
            scale: getMinScale() * 1.5,
        };
        requestAnimationFrame(draw);
        return () => {
            window.removeEventListener("resize", resize);
            channel.close();
        };
    });
</script>

<canvas
    bind:this={canvas}
    class:shaking={isShaking !== false}
    on:mousedown={handlePointerDown}
    on:mousemove={handlePointerMove}
    on:mouseup={handlePointerUp}
    on:mouseleave={handlePointerUp}
    on:touchstart|preventDefault={handlePointerDown}
    on:touchmove|preventDefault={handlePointerMove}
    on:touchend={handlePointerUp}
    on:wheel={handleWheel}
    on:contextmenu|preventDefault
></canvas>

<style>
    canvas {
        display: block;
        width: 100vw;
        height: 100vh;
        background: #f8fafc;
        cursor: crosshair;
        touch-action: none;
    }

    .shaking {
        animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
    }

    .shaking[intensity="1.5"] {
        animation: shake 0.6s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
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
            transform: translate3d(-4px, 1px, 0);
        }
        40%,
        60% {
            transform: translate3d(4px, 0, 0);
        }
    }
</style>
