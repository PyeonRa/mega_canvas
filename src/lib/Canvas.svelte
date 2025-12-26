<script>
    import { onMount } from "svelte";

    let { 
        color = "#1e293b", 
        brushSize = 5, 
        mode = $bindable("draw"), 
        username = "Guest", 
        isVIP = false, 
        isRainbow = false, 
        isGhost = false,
        mouseCoord = $bindable(null),
        pixelCount = $bindable(0),
        onUsersUpdate
    } = $props();

    const channel = new BroadcastChannel("canvas_sync");
    const CANVAS_SIZE = 5000;

    let canvas = $state();
    let ctx = $state();
    let transform = $state({ x: 0, y: 0, scale: 0.3 });
    let isPanning = $state(false);
    let isDrawing = $state(false);
    let lastPos = $state({ x: 0, y: 0 });
    let pinch = $state({ startDist: 0, startScale: 1 });
    
    let strokes = $state([]);
    let ads = $state([]);
    let currentStroke = $state(null);
    let remoteCursors = $state(new Map());
    let particles = $state([]);
    let vipTrails = $state([]);
    let sparkles = $state([]);
    let shockwaves = $state([]);
    let isShaking = $state(false);
    let time = $state(0);
    let rainbowHue = $state(0);

    const imageCache = new Map();

    function isInBounds(x, y) {
        return x >= -CANVAS_SIZE/2 && x <= CANVAS_SIZE/2 && 
               y >= -CANVAS_SIZE/2 && y <= CANVAS_SIZE/2;
    }

    function getMinScale() {
        if (!canvas) return 0.1;
        return Math.max(window.innerWidth, window.innerHeight) / CANVAS_SIZE;
    }

    function clampTransform() {
        const minScale = getMinScale();
        if (transform.scale < minScale) transform.scale = minScale;
        const limit = (CANVAS_SIZE / 2) * transform.scale;
        const margin = 50;
        transform.x = Math.max(window.innerWidth - limit - margin, Math.min(limit + margin, transform.x));
        transform.y = Math.max(window.innerHeight - limit - margin, Math.min(limit + margin, transform.y));
    }

    function getCanvasPos(e) {
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const rect = canvas.getBoundingClientRect();
        return {
            x: (clientX - rect.left - transform.x) / transform.scale,
            y: (clientY - rect.top - transform.y) / transform.scale
        };
    }

    function handlePointerDown(e) {
        if (e.touches && e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            pinch.startDist = Math.hypot(dx, dy);
            pinch.startScale = transform.scale;
            return;
        }

        const pos = getCanvasPos(e);
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        if (e.button === 1 || (e.button === 0 && (mode === "pan" || mode === "nuke" || mode === "burst"))) {
            if (mode === "nuke" || mode === "burst") {
                if (mode === "nuke") triggerNuke(pos.x, pos.y);
                else triggerBurst(pos.x, pos.y);
                mode = "draw"; // Return to draw after use
                return;
            }
            isPanning = true;
            lastPos = { x: clientX, y: clientY };
        } else if ((e.button === 0 || e.touches) && mode === "draw") {
            if (!isInBounds(pos.x, pos.y)) return;
            isDrawing = true;
            currentStroke = { 
                points: [pos], color, width: brushSize, id: Math.random(), 
                username, isVIP, isRainbow, isGhost, timestamp: Date.now() 
            };
            strokes.push(currentStroke);
            sync("stroke_start", currentStroke);
        }
    }

    function handlePointerMove(e) {
        if (e.touches && e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const dist = Math.hypot(dx, dy);
            const newScale = Math.min(Math.max(pinch.startScale * (dist / pinch.startDist), getMinScale()), 8);
            const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
            const rect = canvas.getBoundingClientRect();
            const centerX = midX - rect.left;
            const centerY = midY - rect.top;
            transform.x = centerX - (centerX - transform.x) * (newScale / transform.scale);
            transform.y = centerY - (centerY - transform.y) * (newScale / transform.scale);
            transform.scale = newScale;
            clampTransform();
            return;
        }

        const pos = getCanvasPos(e);
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        if (isInBounds(pos.x, pos.y)) {
            mouseCoord = { x: Math.round(pos.x), y: Math.round(pos.y) };
            sync("cursor", { x: pos.x, y: pos.y, username, color, isDrawing, isVIP, isRainbow, isGhost });
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
                pixelCount += Math.ceil(brushSize / 4);
                sync("stroke_update", { id: currentStroke.id, point: pos });
                if (isVIP) spawnSparkle(pos.x, pos.y);
            }
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
    }

    function handleWheel(e) {
        e.preventDefault();
        const factor = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.min(Math.max(transform.scale * factor, getMinScale()), 8);
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        transform.x = mouseX - (mouseX - transform.x) * (newScale / transform.scale);
        transform.y = mouseY - (mouseY - transform.y) * (newScale / transform.scale);
        transform.scale = newScale;
        clampTransform();
    }

    function spawnVIPTrial(x, y, tint) {
        vipTrails.push({ x, y, life: 30, color: tint, size: Math.random() * 5 + 2 });
        if (vipTrails.length > 50) vipTrails.shift();
    }

    function spawnSparkle(x, y) {
        for(let i=0; i<2; i++) {
            sparkles.push({
                x, y, vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5,
                life: 40 + Math.random() * 20, size: Math.random() * 4 + 2
            });
        }
    }

    function spawnShockwave(x, y, color, maxR) {
        shockwaves.push({ x, y, r: 0, maxR, alpha: 1, color });
    }

    function triggerNuke(x, y) {
        const radius = 350;
        strokes = strokes.filter(s => !s.points.some(p => Math.hypot(p.x - x, p.y - y) < radius));
        sync("nuke", { x, y, radius });
        spawnAtomicEffect(x, y);
        triggerShake(1.5);
        save();
    }

    function triggerBurst(x, y) {
        sync("confetti", { x, y, isVIP: true, mega: true });
        spawnConfetti(x, y, true, true);
        spawnShockwave(x, y, "#fbbf24", 500);
        triggerShake(0.8);
    }

    function spawnAtomicEffect(x, y) {
        spawnShockwave(x, y, "#ffffff", 600);
        spawnShockwave(x, y, "#ef4444", 400);
        for(let i=0; i<80; i++) {
            particles.push({
                x, y, vx: (Math.random() - 0.5) * 60, vy: (Math.random() - 0.5) * 60 - 20,
                color: Math.random() > 0.3 ? "#451a03" : "#f97316", life: 150 + Math.random() * 50, size: 15 + Math.random() * 10
            });
        }
    }

    function spawnConfetti(cx, cy, vip = false, mega = false) {
        const count = mega ? 300 : (vip ? 150 : 40);
        const colors = vip ? ["#fbbf24", "#f59e0b", "#ffffff"] : null;
        for (let i = 0; i < count; i++) {
            particles.push({
                x: cx, y: cy,
                vx: (Math.random() - 0.5) * (mega ? 60 : (vip ? 40 : 20)),
                vy: (Math.random() - 0.5) * (mega ? 60 : (vip ? 40 : 20)) - (vip ? 25 : 15),
                color: colors ? colors[Math.floor(Math.random() * colors.length)] : `hsl(${Math.random() * 360}, 80%, 60%)`,
                life: (mega ? 200 : (vip ? 150 : 80)) + Math.random() * 40, size: (mega ? 12 : (vip ? 8 : 6)) + Math.random() * 10,
            });
        }
    }

    function triggerShake(intensity = 1) {
        isShaking = intensity;
        setTimeout(() => isShaking = false, 500);
    }

    function sync(type, data) { channel.postMessage({ type, data }); }
    function save() {
        localStorage.setItem("canvas_strokes_v6", JSON.stringify(strokes));
        localStorage.setItem("canvas_ads_v6", JSON.stringify(ads));
    }

    export function resetView() {
        transform = { x: canvas.width / 2, y: canvas.height / 2, scale: getMinScale() * 1.5 };
    }

    export function placeAdAuto(imageData) {
        const width = 200 + Math.random() * 300;
        const height = width * 0.7;
        const maxX = CANVAS_SIZE / 2 - width - 50;
        const maxY = CANVAS_SIZE / 2 - height - 50;
        const x = -CANVAS_SIZE / 2 + 50 + Math.random() * (maxX + CANVAS_SIZE / 2 - 50);
        const y = -CANVAS_SIZE / 2 + 50 + Math.random() * (maxY + CANVAS_SIZE / 2 - 50);
        const newAd = { x, y, width, height, image: imageData, id: Math.random(), username, isVIP };
        ads.push(newAd);
        sync("new_ad", newAd);
        save();
        spawnAtomicEffect(x + width/2, y + height/2);
    }

    onMount(() => {
        ctx = canvas.getContext("2d");
        const s = localStorage.getItem("canvas_strokes_v6");
        const a = localStorage.getItem("canvas_ads_v6");
        const p = localStorage.getItem("pixel_count_v3");
        if (s) strokes = JSON.parse(s);
        if (a) ads = JSON.parse(a);
        if (p) pixelCount = parseInt(p);

        window.addEventListener("resize", () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            clampTransform();
        });
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        resetView();

        const loop = () => {
            time += 0.05;
            rainbowHue = (rainbowHue + 2) % 360;
            if (isRainbow && isDrawing && currentStroke) currentStroke.color = `hsl(${rainbowHue}, 100%, 50%)`;
            
            const now = Date.now();
            particles = particles.map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + 0.5, life: p.life - 1 })).filter(p => p.life > 0);
            vipTrails = vipTrails.map(p => ({ ...p, life: p.life - 1, size: p.size * 0.95 })).filter(p => p.life > 0);
            sparkles = sparkles.map(s => ({ ...s, x: s.x + s.vx, y: s.y + s.vy, life: s.life - 1, size: s.size * 0.98 })).filter(s => s.life > 0);
            shockwaves = shockwaves.map(s => ({ ...s, r: s.r + 20, alpha: Math.max(0, 1 - s.r / s.maxR) })).filter(s => s.alpha > 0);
            
            strokes = strokes.filter(s => !(s.isGhost && now - s.timestamp > 5000));
            
            draw();
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);

        channel.onmessage = (e) => {
            const { type, data } = e.data;
            if (type === "stroke_start") strokes.push(data);
            else if (type === "stroke_update") {
                const s = strokes.find(s => s.id === data.id);
                if (s) s.points.push(data.point);
            } else if (type === "new_ad") ads.push(data);
            else if (type === "cursor") {
                remoteCursors.set(data.username, { ...data, timestamp: Date.now() });
                onUsersUpdate?.(Array.from(remoteCursors.values()));
            } else if (type === "confetti") {
                spawnConfetti(data.x, data.y, data.isVIP, data.mega);
                if (data.mega) { spawnShockwave(data.x, data.y, "#fbbf24", 500); triggerShake(0.8); }
            } else if (type === "nuke") {
                strokes = strokes.filter(s => !s.points.some(p => Math.hypot(p.x - data.x, p.y - data.y) < data.radius));
                spawnAtomicEffect(data.x, data.y);
                triggerShake(1.5);
            } else if (type === "clear") {
                strokes = []; ads = []; pixelCount = 0;
                localStorage.removeItem("canvas_strokes_v6");
                localStorage.removeItem("canvas_ads_v6");
                localStorage.removeItem("pixel_count_v3");
            }
        };

        return () => channel.close();
    });

    function draw() {
        if (!ctx) return;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.translate(transform.x, transform.y);
        ctx.scale(transform.scale, transform.scale);

        // Surface
        ctx.fillStyle = "#ffffff";
        ctx.shadowBlur = 60 / transform.scale;
        ctx.shadowColor = "rgba(0,0,0,0.06)";
        ctx.fillRect(-CANVAS_SIZE/2, -CANVAS_SIZE/2, CANVAS_SIZE, CANVAS_SIZE);
        ctx.shadowBlur = 0;

        // Grid
        ctx.strokeStyle = "rgba(0,0,0,0.03)";
        ctx.lineWidth = 1 / transform.scale;
        ctx.beginPath();
        for (let x = -CANVAS_SIZE/2; x <= CANVAS_SIZE/2; x += 100) { ctx.moveTo(x, -CANVAS_SIZE/2); ctx.lineTo(x, CANVAS_SIZE/2); }
        for (let y = -CANVAS_SIZE/2; y <= CANVAS_SIZE/2; y += 100) { ctx.moveTo(-CANVAS_SIZE/2, y); ctx.lineTo(CANVAS_SIZE/2, y); }
        ctx.stroke();

        // Ads
        ads.forEach(ad => {
            let img = imageCache.get(ad.image);
            if (!img) {
                img = new Image(); img.src = ad.image;
                img.onload = () => imageCache.set(ad.image, img);
            }
            if (img?.complete) {
                ctx.save();
                ctx.beginPath(); ctx.roundRect(ad.x, ad.y, ad.width, ad.height, 12/transform.scale); ctx.clip();
                ctx.drawImage(img, ad.x, ad.y, ad.width, ad.height);ctx.restore();
                if (ad.isVIP) {
                    ctx.strokeStyle = `hsl(45, 100%, ${50 + Math.sin(time)*20}%)`;
                    ctx.lineWidth = 8/transform.scale;
                    ctx.shadowBlur = 15/transform.scale; ctx.shadowColor = "#fbbf24";
                } else {
                    ctx.strokeStyle = "rgba(0,0,0,0.08)"; ctx.lineWidth = 1/transform.scale;
                }
                ctx.stroke(); ctx.shadowBlur = 0;
            }
        });

        // Strokes
        const now = Date.now();
        strokes.forEach(s => {
            if (s.points.length < 2) return;
            ctx.beginPath();
            ctx.lineWidth = s.width;
            ctx.strokeStyle = s.color;
            if (s.isVIP) { ctx.shadowBlur = (s.isRainbow ? 8 : 4)/transform.scale; ctx.shadowColor = s.color; }
            if (s.isGhost) ctx.globalAlpha = Math.max(0, 1 - (now - s.timestamp)/5000);
            ctx.lineCap = "round"; ctx.lineJoin = "round";
            ctx.moveTo(s.points[0].x, s.points[0].y);
            for(let i=1; i<s.points.length; i++) ctx.lineTo(s.points[i].x, s.points[i].y);
            ctx.stroke(); ctx.shadowBlur = 0; ctx.globalAlpha = 1;
        });

        // VFX
        vipTrails.forEach(p => { ctx.globalAlpha = p.life/30; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size/transform.scale, 0, Math.PI*2); ctx.fill(); });
        sparkles.forEach(s => {
            ctx.globalAlpha = s.life/60; ctx.fillStyle = "#fff"; ctx.shadowBlur = 10/transform.scale; ctx.shadowColor = "#fbbf24";
            const r = s.size/transform.scale;
            ctx.beginPath(); ctx.moveTo(s.x, s.y-r); ctx.lineTo(s.x+r, s.y); ctx.lineTo(s.x, s.y+r); ctx.lineTo(s.x-r, s.y); ctx.fill(); ctx.shadowBlur = 0;
        });
        shockwaves.forEach(s => {
            ctx.globalAlpha = s.alpha; ctx.strokeStyle = s.color; ctx.lineWidth = 15/transform.scale;
            ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2); ctx.stroke();
        });
        particles.forEach(p => { ctx.globalAlpha = Math.min(p.life/50, 1); ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size/transform.scale, 0, Math.PI*2); ctx.fill(); });
        ctx.globalAlpha = 1;

        // Cursors
        remoteCursors.forEach(c => {
            if (c.username === username) return;
            const dot = (c.isVIP ? 6 : 4)/transform.scale;
            if (c.isVIP) {
                ctx.beginPath(); ctx.arc(c.x, c.y, dot*2.5, 0, Math.PI*2);
                const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, dot*2.5);
                g.addColorStop(0, "rgba(251, 191, 36, 0.4)"); g.addColorStop(1, "rgba(251, 191, 36, 0)");
                ctx.fillStyle = g; ctx.fill();
            }
            ctx.beginPath(); ctx.arc(c.x, c.y, dot, 0, Math.PI*2); ctx.fillStyle = c.isVIP ? "#fbbf24" : (c.color || "#3b82f6"); ctx.fill();
            ctx.font = `${(c.isVIP ? 12 : 10)/transform.scale}px "Inter"`;
            const txt = c.username + (c.isVIP ? " ✨" : "");
            const tw = ctx.measureText(txt).width;
            ctx.fillStyle = c.isVIP ? "rgba(251,191,36,0.95)" : "rgba(15,23,42,0.85)";
            ctx.beginPath(); ctx.roundRect(c.x+8/transform.scale, c.y-14/transform.scale, tw + 12/transform.scale, (c.isVIP ? 18 : 16)/transform.scale, 4/transform.scale); ctx.fill();
            ctx.fillStyle = c.isVIP ? "#000" : "#fff"; ctx.fillText(txt, c.x + 14/transform.scale, c.y-1/transform.scale);
        });
    }
</script>

<canvas
    bind:this={canvas}
    class:shaking={isShaking !== false}
    intensity={isShaking || 0}
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
        background: #f8fafc;
        cursor: crosshair;
        touch-action: none;
    }
    .shaking {
        animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
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
            transform: translate3d(4px, -1px, 0);
        }
    }
</style>
