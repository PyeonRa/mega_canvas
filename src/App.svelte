<script>
  import Canvas from "./lib/Canvas.svelte";
  import Header from "./lib/Header.svelte";
  import Sidebar from "./lib/Sidebar.svelte";
  import Toolbar from "./lib/Toolbar.svelte";
  import Modals from "./lib/Modals.svelte";
  import { onMount } from "svelte";

  // State
  let color = $state("#2563eb");
  let brushSize = $state(5);
  let mode = $state("draw");
  let showNicknameModal = $state(true);
  let showAdModal = $state(false);
  let showShopModal = $state(false);
  let username = $state("");
  let tempUsername = $state("");
  let mouseCoord = $state(null);
  let pixelCount = $state(0);
  let onlineUsers = $state([]);
  let pendingAdImage = $state(null);
  let canvasRef = $state();
  let isUsersOpen = $state(false);
  let isVIP = $state(false);
  let isRainbow = $state(false);
  let isGhost = $state(false);

  const palette = [
    "#0f172a",
    "#334155",
    "#64748b",
    "#94a3b8",
    "#cbd5e1",
    "#f8fafc",
    "#ef4444",
    "#f97316",
    "#f59e0b",
    "#fbbf24",
    "#22c55e",
    "#10b981",
    "#06b6d4",
    "#3b82f6",
    "#6366f1",
    "#8b5cf6",
    "#d946ef",
    "#f472b6",
  ];

  function setUsername() {
    if (tempUsername.trim()) {
      username = tempUsername.trim();
      localStorage.setItem("canvas_user_v7", username);
      showNicknameModal = false;
    }
  }

  function toggleVIP() {
    if (!isVIP) {
      isVIP = true;
      localStorage.setItem("canvas_is_vip_v1", "true");
    }
  }

  function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        pendingAdImage = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  function confirmAd() {
    if (pendingAdImage && canvasRef) {
      canvasRef.placeAdAuto(pendingAdImage);
      showAdModal = false;
      pendingAdImage = null;
    }
  }

  function clearAll() {
    if (confirm("⚠️ 모든 데이터를 초기화하고 캔버스를 비울까요?")) {
      const channel = new BroadcastChannel("mega_canvas_v7");
      channel.postMessage({ type: "clear" });
      window.location.reload();
    }
  }

  onMount(() => {
    const saved = localStorage.getItem("canvas_user_v7");
    if (saved) {
      username = saved;
      showNicknameModal = false;
    }
    const vip = localStorage.getItem("canvas_is_vip_v1");
    if (vip === "true") isVIP = true;
  });
</script>

<div class="app-root" class:is-vip={isVIP}>
  <div class="bg-vibe"></div>

  <Canvas
    bind:this={canvasRef}
    {color}
    {brushSize}
    bind:mode
    {username}
    {isVIP}
    {isRainbow}
    {isGhost}
    bind:mouseCoord
    bind:pixelCount
    onUsersUpdate={(users) => (onlineUsers = users)}
  />

  <Header
    {isVIP}
    {mouseCoord}
    {pixelCount}
    onlineUsersCount={onlineUsers.length + 1}
    bind:showShopModal
    bind:isUsersOpen
  />

  <Sidebar
    bind:isUsersOpen
    {onlineUsers}
    {username}
    {color}
    {isVIP}
    {pixelCount}
  />

  <Toolbar
    bind:mode
    bind:color
    bind:brushSize
    {isVIP}
    bind:isRainbow
    bind:isGhost
    {palette}
    bind:showAdModal
    {canvasRef}
    {clearAll}
  />

  <div class="floating-zoom">
    <button onclick={() => canvasRef.zoomIn()}>+</button>
    <button onclick={() => canvasRef.zoomOut()}>−</button>
  </div>

  <Modals
    bind:showNicknameModal
    bind:showAdModal
    bind:showShopModal
    bind:tempUsername
    {setUsername}
    bind:pendingAdImage
    {handleImageUpload}
    {confirmAd}
    {toggleVIP}
    {isVIP}
  />
</div>

<style>
  @import url("https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=JetBrains+Mono:wght@500&display=swap");

  :global(*) {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  :global(body) {
    font-family: "Outfit", sans-serif;
    background: #0f172a;
    color: #f8fafc;
    overflow: hidden;
  }

  .app-root {
    position: relative;
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .bg-vibe {
    position: absolute;
    inset: 0;
    background: radial-gradient(
        circle at 10% 20%,
        rgba(37, 99, 235, 0.05) 0%,
        transparent 40%
      ),
      radial-gradient(
        circle at 90% 80%,
        rgba(239, 68, 68, 0.05) 0%,
        transparent 40%
      );
    pointer-events: none;
    z-index: 1;
    transition: all 1s ease;
  }
  .is-vip .bg-vibe {
    background: radial-gradient(
      circle at center,
      rgba(251, 191, 36, 0.08) 0%,
      transparent 70%
    );
  }

  .floating-zoom {
    position: absolute;
    bottom: 100px;
    right: 24px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    z-index: 90;
    pointer-events: none;
  }
  .floating-zoom button {
    pointer-events: auto;
    width: 44px;
    height: 44px;
    background: rgba(15, 23, 42, 0.8);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 14px;
    color: white;
    font-size: 1.5rem;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  @media (max-width: 900px) {
    .floating-zoom {
      bottom: 140px;
      right: 12px;
    }
  }
</style>
