<script>
  import Canvas from "./lib/Canvas.svelte";
  import { onMount } from "svelte";

  let color = "#1e293b";
  let brushSize = 5;
  let mode = "draw";
  let showNicknameModal = true;
  let showAdModal = false;
  let showShopModal = false;
  let username = "";
  let tempUsername = "";
  let mouseCoord = null;
  let pixelCount = 0;
  let onlineUsers = [];
  let pendingAdImage = null;
  let canvasRef;
  let isUsersOpen = false;
  let isVIP = false;
  let isRainbow = false;
  let isGhost = false;

  const palette = [
    "#0f172a",
    "#334155",
    "#64748b",
    "#94a3b8",
    "#cbd5e1",
    "#f1f5f9",
    "#ef4444",
    "#f87171",
    "#f97316",
    "#fb923c",
    "#fbbf24",
    "#fcd34d",
    "#22c55e",
    "#4ade80",
    "#06b6d4",
    "#22d3ee",
    "#3b82f6",
    "#60a5fa",
    "#6366f1",
    "#818cf8",
    "#8b5cf6",
    "#a78bfa",
    "#d946ef",
    "#f472b6",
  ];

  function setUsername() {
    if (tempUsername.trim()) {
      username = tempUsername.trim();
      localStorage.setItem("canvas_user_v6", username);
      showNicknameModal = false;
    }
  }

  function toggleVIP() {
    if (!isVIP) {
      isVIP = true;
      localStorage.setItem("canvas_is_vip_v1", "true");
      triggerVIPCelebration();
    }
  }

  function triggerVIPCelebration() {
    if (canvasRef) {
      // Mock celebration event
      alert(
        "✨ 프레스티지 VIP 등급으로 승격되었습니다! 골든 트레일과 오라가 활성화됩니다.",
      );
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

  onMount(() => {
    const saved = localStorage.getItem("canvas_user_v6");
    if (saved) {
      username = saved;
      showNicknameModal = false;
    }
    const vip = localStorage.getItem("canvas_is_vip_v1");
    if (vip === "true") {
      isVIP = true;
    }
  });

  const channel = new BroadcastChannel("canvas_sync");
  function clearAll() {
    if (confirm("모든 데이터를 초기화할까요?")) {
      channel.postMessage({ type: "clear" });
      window.location.reload();
    }
  }
</script>

<div class="viewport" class:vip-active={isVIP}>
  <div class="vip-bg-overlay" class:visible={isVIP}></div>

  <Canvas
    bind:this={canvasRef}
    {color}
    {brushSize}
    {mode}
    {username}
    {isVIP}
    {isRainbow}
    {isGhost}
    bind:mouseCoord
    bind:pixelCount
    on:usersUpdate={(e) => (onlineUsers = e.detail)}
    on:adPlaced={() => (mode = "draw")}
  />

  <!-- Redesigned Minimal Header -->
  <nav class="app-bar" class:vip-bar={isVIP}>
    <div class="bar-left">
      <div class="brand">
        <div class="b-logo" class:vip-logo={isVIP}>M</div>
        <div class="b-info">
          <h1>MEGA CANVAS {isVIP ? "PREMIUM" : ""}</h1>
          <button
            class="presence"
            on:click={() => (isUsersOpen = !isUsersOpen)}
          >
            <div class="dot"></div>
            <span>{onlineUsers.length + 1} ON AIR</span>
          </button>
        </div>
      </div>
    </div>

    <div class="bar-center">
      <div class="hud" class:vip-hud={isVIP}>
        <div class="hud-bit">
          <small>COORDS</small>
          <span
            >{mouseCoord ? `${mouseCoord.x}, ${mouseCoord.y}` : "-- : --"}</span
          >
        </div>
        <div class="sep"></div>
        <div class="hud-bit">
          <small>CONTRIB</small>
          <span>{pixelCount.toLocaleString()} <small>PX</small></span>
        </div>
      </div>
    </div>

    <div class="bar-right">
      <button
        class="vip-toggle"
        class:vip={isVIP}
        on:click={toggleVIP}
        disabled={isVIP}
      >
        {isVIP ? "✨ ELITE ARTIST" : "GO PREMIUM"}
      </button>
      <button
        class="menu-btn"
        on:click={() => (isUsersOpen = !isUsersOpen)}
        aria-label="Toggle User List"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg
        >
      </button>
    </div>
  </nav>

  <!-- Side Panel (Users) -->
  <aside class="side-panel" class:open={isUsersOpen}>
    <div class="p-header">
      <h2>Artists Nearby</h2>
      <button class="close-x" on:click={() => (isUsersOpen = false)}>✕</button>
    </div>
    <div class="p-list">
      <div class="u-row self" class:vip={isVIP}>
        <div
          class="u-avatar"
          style="background: {isVIP ? '#fbbf24' : color}"
        ></div>
        <div class="u-meta">
          <span class="u-name">{username} (You)</span>
          <span class="u-role">{isVIP ? "Prestige VIP" : "Member"}</span>
        </div>
      </div>
      {#each onlineUsers as user}
        <div class="u-row" class:vip={user.isVIP}>
          <div
            class="u-avatar"
            style="background: {user.isVIP
              ? '#fbbf24'
              : user.color || '#cbd5e1'}"
          ></div>
          <div class="u-meta">
            <span class="u-name">{user.username} {user.isVIP ? "✨" : ""}</span>
            <span class="u-role">{user.isDrawing ? "Painting..." : "Idle"}</span
            >
          </div>
        </div>
      {/each}
    </div>
    <div class="p-footer">
      <button
        class="shop-btn"
        class:vip-btn={isVIP}
        on:click={() => (showShopModal = true)}>🛍️ Marketplace</button
      >
    </div>
  </aside>

  <!-- Bottom Workspace -->
  <div class="workspace">
    <div class="tool-dock" class:vip-dock={isVIP}>
      <!-- Mode & Tools -->
      <section class="dock-section modes">
        <button
          class:active={mode === "draw"}
          on:click={() => (mode = "draw")}
          title="Draw (D)"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            ><path d="M12 19l7-7 3 3-7 7-3-3z" /><path
              d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"
            /></svg
          >
        </button>
        <button
          class:active={mode === "pan"}
          on:click={() => (mode = "pan")}
          title="Pan (P)"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            ><circle cx="12" cy="12" r="10" /><path
              d="M12 8l-4 4 4 4M16 12H12"
            /></svg
          >
        </button>

        {#if isVIP}
          <button
            class:active={isRainbow}
            on:click={() => {
              isRainbow = !isRainbow;
              if (isRainbow) mode = "draw";
            }}
            title="Rainbow Brush (VIP)"
            class="rainbow-btn"
          >
            🌈
          </button>
          <button
            class:active={mode === "burst"}
            on:click={() => (mode = "burst")}
            title="Mega Burst Targeting (VIP)"
            class="mega-btn"
          >
            💥
          </button>
          <button
            class:active={mode === "nuke"}
            on:click={() => (mode = "nuke")}
            title="Atomic Nuke Targeting (VIP)"
            class="nuke-btn"
          >
            ☢️
          </button>
          <button
            class:active={isGhost}
            on:click={() => {
              isGhost = !isGhost;
              if (isGhost) mode = "draw";
            }}
            title="Ghost Pen (VIP)"
            class="ghost-btn"
          >
            👻
          </button>
        {/if}
      </section>

      <div class="v-divider"></div>

      <!-- Colors -->
      <section class="dock-section colors">
        <div class="palette-scroll">
          {#each palette as p}
            <button
              class="c-swatch"
              style="background: {p}"
              class:active={color === p}
              on:click={() => {
                color = p;
                mode = "draw";
              }}
            ></button>
          {/each}
        </div>
        <div class="c-picker">
          <input
            type="color"
            bind:value={color}
            on:input={() => (mode = "draw")}
          />
          <div class="c-preview" style="background: {color}"></div>
        </div>
      </section>

      <div class="v-divider"></div>

      <!-- Config -->
      <section class="dock-section size">
        <input type="range" min="1" max="50" bind:value={brushSize} />
        <span class="size-val">{brushSize}px</span>
      </section>

      <div class="v-divider hide-mobile"></div>

      <!-- Actions -->
      <section class="dock-section actions">
        <button
          class="ad-trigger"
          class:vip-ad={isVIP}
          on:click={() => (showAdModal = true)}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            ><path
              d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4m4-5l5-5 5 5m-5-5v12"
            /></svg
          >
          <span class="hide-mobile">Add Media</span>
        </button>
        <div class="util-btns">
          <button
            on:click={() => canvasRef.resetView()}
            aria-label="Reset View"
            title="Reset View">🏠</button
          >
          <button
            on:click={clearAll}
            class="danger"
            aria-label="Clear All"
            title="Clear All Data">🗑️</button
          >
        </div>
      </section>
    </div>
  </div>

  <!-- Zoom Controls -->
  <div class="zoom-hud">
    <button on:click={() => canvasRef.zoomIn()}>+</button>
    <button on:click={() => canvasRef.zoomOut()}>−</button>
  </div>

  <!-- Modals -->
  {#if showNicknameModal}
    <div class="modal-wrap glass">
      <div class="modal welcome">
        <h2>Enter Workspace</h2>
        <p>Connect with other artists in real-time. Pick your handle.</p>
        <div class="form">
          <input
            type="text"
            placeholder="Your Nickname"
            bind:value={tempUsername}
            on:keydown={(e) => e.key === "Enter" && setUsername()}
            autofocus
          />
          <button
            class="primary"
            on:click={setUsername}
            disabled={!tempUsername.trim()}>Connect</button
          >
        </div>
      </div>
    </div>
  {/if}

  {#if showAdModal}
    <div class="modal-wrap dark" on:click|self={() => (showAdModal = false)}>
      <div class="modal ad-form">
        <h3 class:vip-text={isVIP}>Sync Media to Canvas</h3>
        <p>Your image will be placed and synced for everyone browsing now.</p>
        <div class="upload-box {pendingAdImage ? 'has-file' : ''}">
          {#if pendingAdImage}
            <img src={pendingAdImage} alt="Preview" />
            <button class="remove" on:click={() => (pendingAdImage = null)}
              >✕</button
            >
          {:else}
            <input
              type="file"
              accept="image/*"
              on:change={handleImageUpload}
              id="ad-inp"
              hidden
            />
            <label for="ad-inp">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"><path d="M12 4v16m8-8H4" /></svg
              >
              <span>Choose Image</span>
            </label>
          {/if}
        </div>
        <div class="m-footer">
          <button class="ghost" on:click={() => (showAdModal = false)}
            >Cancel</button
          >
          <button
            class="primary"
            class:vip-btn={isVIP}
            on:click={confirmAd}
            disabled={!pendingAdImage}>Place Now</button
          >
        </div>
      </div>
    </div>
  {/if}

  <!-- Simulated Shop Modal -->
  {#if showShopModal}
    <div class="modal-wrap glass">
      <div class="modal shop">
        <h2>Canvas Marketplace</h2>
        <div class="s-items">
          <div class="s-card">
            <span class="s-icon">✨</span>
            <div class="s-info">
              <span class="s-name">VIP Artist Status</span>
              <span class="s-desc"
                >Golden cursor, VIP badge, special colors</span
              >
            </div>
            <button
              class="s-buy"
              on:click={() => {
                toggleVIP();
                showShopModal = false;
              }}>Unlock Free</button
            >
          </div>
          <div class="s-card locked">
            <span class="s-icon">📍</span>
            <div class="s-info">
              <span class="s-name">Persistent Marker</span>
              <span class="s-desc">Keep your drawing visible forever</span>
            </div>
            <button class="s-buy" disabled>Soon</button>
          </div>
        </div>
        <button class="full-btn" on:click={() => (showShopModal = false)}
          >Close</button
        >
      </div>
    </div>
  {/if}
</div>

<style>
  :global(*) {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  :global(body) {
    font-family: "Inter", system-ui, sans-serif;
    background: #fff;
    color: #0f172a;
    overflow: hidden;
  }

  .viewport {
    position: relative;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transition: background 0.5s;
  }
  .vip-active {
    background: #fafaf9;
  }

  .vip-bg-overlay {
    position: absolute;
    inset: 0;
    background: radial-gradient(
      circle at center,
      rgba(251, 191, 36, 0.03),
      transparent
    );
    pointer-events: none;
    opacity: 0;
    transition: opacity 1s;
    z-index: 10;
  }
  .vip-bg-overlay.visible {
    opacity: 1;
  }

  /* Redesigned App Bar */
  .app-bar {
    position: absolute;
    top: 12px;
    left: 12px;
    right: 12px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 12px;
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(12px);
    border-radius: 16px;
    border: 1px solid rgba(0, 0, 0, 0.05);
    z-index: 100;
    box-shadow: 0 4px 20px -4px rgba(0, 0, 0, 0.05);
    transition: all 0.3s;
  }
  .vip-bar {
    border-color: rgba(251, 191, 36, 0.4);
    background: rgba(255, 255, 255, 0.9);
    box-shadow: 0 4px 30px rgba(251, 191, 36, 0.1);
  }

  .bar-left {
    flex: 1;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .b-logo {
    background: #2563eb;
    color: white;
    width: 34px;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    font-weight: 900;
    transition: all 0.5s;
  }
  .vip-logo {
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
    color: #000;
    box-shadow: 0 0 15px rgba(251, 191, 36, 0.5);
  }
  .b-info h1 {
    font-size: 0.9rem;
    font-weight: 800;
    letter-spacing: -0.02em;
  }
  .presence {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    background: none;
    border: none;
    padding: 0;
  }
  .presence .dot {
    width: 6px;
    height: 6px;
    background: #22c55e;
    border-radius: 50%;
    box-shadow: 0 0 0 3px rgba(34, 197, 14, 0.2);
    animation: pulse 2s infinite;
  }
  @keyframes pulse {
    0% {
      opacity: 0.8;
    }
    50% {
      opacity: 0.4;
    }
    100% {
      opacity: 0.8;
    }
  }
  .presence span {
    font-size: 0.65rem;
    font-weight: 800;
    color: #64748b;
  }

  .bar-center {
    flex: 0 0 auto;
  }
  .hud {
    display: flex;
    align-items: center;
    gap: 16px;
    background: #f1f5f9;
    padding: 6px 16px;
    border-radius: 12px;
    transition: all 0.5s;
  }
  .vip-hud {
    background: #fffbeb;
    border: 1px solid rgba(251, 191, 36, 0.2);
  }
  .hud-bit {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .hud-bit small {
    font-size: 0.55rem;
    font-weight: 900;
    color: #94a3b8;
  }
  .hud-bit span {
    font-size: 0.8rem;
    font-weight: 700;
    font-family: "JetBrains Mono", monospace;
  }
  .sep {
    width: 1px;
    height: 16px;
    background: #cbd5e1;
  }

  .bar-right {
    flex: 1;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 8px;
  }
  .vip-toggle {
    background: #1e293b;
    color: white;
    border: none;
    padding: 8px 14px;
    border-radius: 10px;
    font-size: 0.75rem;
    font-weight: 800;
    cursor: pointer;
    transition: all 0.3s;
  }
  .vip-toggle.vip {
    background: linear-gradient(45deg, #fbbf24, #f59e0b);
    color: #000;
    transform: scale(1.05);
    box-shadow: 0 4px 15px rgba(251, 191, 36, 0.3);
  }
  .menu-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: #64748b;
  }

  /* Unified Workspace Dock */
  .workspace {
    position: absolute;
    bottom: 16px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    pointer-events: none;
    z-index: 100;
  }
  .tool-dock {
    pointer-events: auto;
    background: white;
    padding: 8px 16px;
    border-radius: 20px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.15);
    max-width: 95vw;
    transition: all 0.5s;
  }
  .vip-dock {
    border-color: rgba(251, 191, 36, 0.3);
    box-shadow: 0 10px 40px rgba(251, 191, 36, 0.15);
  }

  .dock-section {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .modes button,
  .rainbow-btn {
    width: 36px;
    height: 36px;
    border: none;
    background: #f1f5f9;
    color: #64748b;
    border-radius: 10px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }
  .modes button svg {
    width: 18px;
    height: 18px;
  }
  .modes button:hover,
  .rainbow-btn:hover {
    background: #e2e8f0;
    transform: translateY(-1px);
  }
  .modes button.active,
  .rainbow-btn.active {
    background: #2563eb;
    color: white;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
  }
  .rainbow-btn.active {
    background: linear-gradient(
      45deg,
      #ef4444,
      #f97316,
      #eab308,
      #22c55e,
      #3b82f6,
      #8b5cf6
    );
    color: white;
  }
  .mega-btn {
    width: 36px;
    height: 36px;
    border: none;
    background: #fffbeb;
    border: 1px solid #fef3c7;
    border-radius: 10px;
    cursor: pointer;
    font-size: 1.1rem;
    transition: all 0.2s;
  }
  .mega-btn:hover {
    transform: scale(1.1) rotate(5deg);
    background: #fef3c7;
  }
  .mega-btn.active {
    background: #fbbf24;
    border-color: #f59e0b;
    box-shadow: 0 0 15px rgba(251, 191, 36, 0.4);
  }
  .nuke-btn,
  .ghost-btn {
    width: 36px;
    height: 36px;
    border: none;
    background: #f1f5f9;
    border-radius: 10px;
    cursor: pointer;
    font-size: 1.1rem;
    transition: all 0.2s;
  }
  .nuke-btn:hover {
    background: #fee2e2;
    transform: scale(1.1);
  }
  .nuke-btn.active {
    background: #ef4444;
    color: white;
    border-color: #b91c1c;
    box-shadow: 0 0 15px rgba(239, 68, 68, 0.4);
  }
  .ghost-btn.active {
    background: #e2e8f0;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  }
  .v-divider {
    width: 1px;
    height: 28px;
    background: #e2e8f0;
  }

  .palette-scroll {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 4px;
  }
  .c-swatch {
    width: 16px;
    height: 16px;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    transition: transform 0.2s;
  }
  .c-swatch.active {
    transform: scale(1.2);
    box-shadow:
      0 0 0 2px white,
      0 0 0 3px #2563eb;
  }
  .c-picker {
    position: relative;
    width: 22px;
    height: 22px;
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid #cbd5e1;
  }
  .c-picker input {
    position: absolute;
    inset: -5px;
    width: 200%;
    height: 200%;
    opacity: 0;
    cursor: pointer;
  }
  .c-preview {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .size input {
    width: 80px;
    accent-color: #2563eb;
  }
  .size-val {
    font-size: 0.7rem;
    font-weight: 800;
    color: #94a3b8;
    min-width: 32px;
  }

  .ad-trigger {
    background: #0f172a;
    color: white;
    border: none;
    padding: 6px 14px;
    border-radius: 10px;
    font-weight: 800;
    font-size: 0.75rem;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    transition: all 0.5s;
  }
  .vip-ad {
    background: linear-gradient(45deg, #0f172a, #334155);
    border: 1px solid #fbbf24;
    box-shadow: 0 0 10px rgba(251, 191, 36, 0.2);
  }
  .ad-trigger svg {
    width: 14px;
    height: 14px;
  }

  .util-btns {
    display: flex;
    gap: 4px;
  }
  .util-btns button {
    width: 34px;
    height: 34px;
    background: #f1f5f9;
    border: none;
    border-radius: 10px;
    font-size: 1rem;
    cursor: pointer;
  }
  .util-btns button.danger:hover {
    background: #fee2e2;
    color: #ef4444;
  }

  /* Side Panel */
  .side-panel {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 280px;
    background: white;
    border-left: 1px solid #e2e8f0;
    z-index: 200;
    transform: translateX(280px);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    flex-direction: column;
  }
  .side-panel.open {
    transform: translateX(0);
    box-shadow: -10px 0 30px rgba(0, 0, 0, 0.05);
  }
  .p-header {
    padding: 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #f1f5f9;
  }
  .p-header h2 {
    font-size: 1rem;
    font-weight: 850;
  }
  .close-x {
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    color: #94a3b8;
  }
  .p-list {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
  }
  .u-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px;
    border-radius: 12px;
    margin-bottom: 8px;
    background: #f8fafc;
  }
  .u-row.vip {
    background: #fef3c7;
    border: 1px solid #f59e0b;
  }
  .u-avatar {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
  .u-meta {
    display: flex;
    flex-direction: column;
  }
  .u-name {
    font-size: 0.85rem;
    font-weight: 750;
    color: #1e293b;
  }
  .u-role {
    font-size: 0.65rem;
    color: #64748b;
    font-weight: 600;
  }
  .p-footer {
    padding: 16px;
  }
  .shop-btn {
    width: 100%;
    padding: 14px;
    background: #2563eb;
    color: white;
    border: none;
    border-radius: 14px;
    font-weight: 800;
    cursor: pointer;
    transition: all 0.5s;
  }
  .vip-btn {
    background: linear-gradient(45deg, #fbbf24, #f59e0b);
    color: #000;
  }

  /* Zoom Hud */
  .zoom-hud {
    position: absolute;
    bottom: 100px;
    right: 16px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .zoom-hud button {
    width: 32px;
    height: 32px;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 1.1rem;
    font-weight: 500;
    color: #64748b;
    cursor: pointer;
  }

  .vip-text {
    color: #f59e0b !important;
  }

  /* Modals */
  .modal-wrap {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 500;
    padding: 20px;
  }
  .glass {
    background: rgba(255, 255, 255, 0.45);
    backdrop-filter: blur(20px);
  }
  .dark {
    background: rgba(15, 23, 42, 0.4);
    backdrop-filter: blur(8px);
  }
  .modal {
    background: white;
    border-radius: 24px;
    padding: 40px;
    width: 100%;
    max-width: 440px;
    text-align: center;
    box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.2);
  }
  .modal h2 {
    font-size: 1.8rem;
    font-weight: 900;
    margin-bottom: 12px;
    letter-spacing: -0.04em;
  }
  .modal h3 {
    font-size: 1.4rem;
    font-weight: 800;
    margin-bottom: 8px;
  }
  .modal p {
    color: #64748b;
    font-size: 0.95rem;
    margin-bottom: 32px;
    line-height: 1.6;
  }
  .form input {
    width: 100%;
    padding: 16px;
    border: 2px solid #f1f5f9;
    border-radius: 16px;
    font-size: 1.1rem;
    outline: none;
    margin-bottom: 12px;
    text-align: center;
    background: #f8fafc;
  }
  .primary {
    width: 100%;
    padding: 16px;
    background: #2563eb;
    color: white;
    border: none;
    border-radius: 16px;
    font-weight: 800;
    font-size: 1rem;
    cursor: pointer;
  }
  .primary:disabled {
    opacity: 0.5;
  }

  .upload-box {
    border: 2px dashed #e2e8f0;
    border-radius: 20px;
    height: 180px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    margin-bottom: 24px;
    overflow: hidden;
  }
  .upload-box img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  .upload-box label {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    color: #94a3b8;
    font-weight: 600;
  }
  .remove {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: none;
    background: #0f172a;
    color: white;
    cursor: pointer;
  }
  .m-footer {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 12px;
  }
  .ghost {
    background: #f1f5f9;
    border: none;
    border-radius: 14px;
    font-weight: 700;
    cursor: pointer;
  }

  .s-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 14px;
    background: #f8fafc;
    border-radius: 16px;
    border: 1px solid #e2e8f0;
    margin-bottom: 12px;
  }
  .s-icon {
    font-size: 1.8rem;
  }
  .s-info {
    flex: 1;
    text-align: left;
  }
  .s-name {
    font-weight: 800;
    font-size: 0.9rem;
    display: block;
  }
  .s-desc {
    font-size: 0.7rem;
    color: #64748b;
    font-weight: 600;
  }
  .s-buy {
    background: #2563eb;
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 10px;
    font-size: 0.75rem;
    font-weight: 800;
    cursor: pointer;
  }
  .full-btn {
    width: 100%;
    padding: 14px;
    background: #f1f5f9;
    border: none;
    border-radius: 14px;
    font-weight: 700;
    cursor: pointer;
  }

  @media (max-width: 800px) {
    .app-bar {
      top: 8px;
      left: 8px;
      right: 8px;
      height: 50px;
    }
    .bar-center {
      display: none;
    }
    .b-info h1 {
      font-size: 0.8rem;
    }
    .tool-dock {
      flex-direction: column;
      width: auto;
      max-width: none;
      padding: 12px;
      gap: 12px;
      bottom: 80px;
      position: fixed;
      right: 12px;
      border-radius: 16px;
    }
    .palette-scroll {
      grid-template-columns: repeat(4, 1fr);
    }
    .v-divider,
    .size,
    .hide-mobile {
      display: none;
    }
    .dock-section.modes {
      flex-direction: column;
    }
    .side-panel {
      width: 85vw;
    }
    .workspace {
      display: block;
      pointer-events: none;
    }
  }
</style>
