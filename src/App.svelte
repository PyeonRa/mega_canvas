<script>
  import Canvas from "./lib/Canvas.svelte";
  import { onMount } from "svelte";

  // State using Svelte 5 Runes
  let color = $state("#1e293b");
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
      alert(
        "✨ 프레스티지 VIP 등급으로 승격되었습니다! 전용 무기와 효과가 활성화됩니다.",
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

  function clearAll() {
    if (confirm("모든 데이터를 초기화할까요?")) {
      const channel = new BroadcastChannel("canvas_sync");
      channel.postMessage({ type: "clear" });
      window.location.reload();
    }
  }

  onMount(() => {
    const saved = localStorage.getItem("canvas_user_v6");
    if (saved) {
      username = saved;
      showNicknameModal = false;
    }
    const vip = localStorage.getItem("canvas_is_vip_v1");
    if (vip === "true") isVIP = true;
  });
</script>

<div class="viewport" class:vip-active={isVIP}>
  <div class="vip-bg-overlay" class:visible={isVIP}></div>

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

  <!-- App Bar -->
  <nav class="app-bar" class:vip-bar={isVIP}>
    <div class="bar-left">
      <div class="brand">
        <div class="b-logo" class:vip-logo={isVIP}>M</div>
        <div class="b-info">
          <h1>MEGA CANVAS {isVIP ? "PREMIUM" : ""}</h1>
          <button
            class="presence"
            onclick={() => (isUsersOpen = !isUsersOpen)}
            title="온라인 아티스트 목록 보기"
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
        onclick={toggleVIP}
        disabled={isVIP}
      >
        {isVIP ? "✨ ELITE ARTIST" : "GO PREMIUM"}
      </button>
      <button
        class="menu-btn"
        onclick={() => (isUsersOpen = !isUsersOpen)}
        aria-label="Toggle Side Panel"
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

  <!-- Side Panel -->
  <aside class="side-panel" class:open={isUsersOpen}>
    <div class="p-header">
      <h2>Artists Nearby</h2>
      <button
        class="close-x"
        onclick={() => (isUsersOpen = false)}
        aria-label="Close Panel">✕</button
      >
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
        onclick={() => (showShopModal = true)}>🛒 Marketplace</button
      >
    </div>
  </aside>

  <!-- Tools -->
  <div class="workspace">
    <div class="tool-dock" class:vip-dock={isVIP}>
      <section class="dock-section modes">
        <button
          class:active={mode === "draw"}
          onclick={() => (mode = "draw")}
          title="그리기 모드"
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
          onclick={() => (mode = "pan")}
          title="화면 이동"
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
            onclick={() => {
              isRainbow = !isRainbow;
              mode = "draw";
            }}
            title="무지개 브러시 (VIP)">🌈</button
          >
          <button
            class:active={mode === "burst"}
            onclick={() => (mode = "burst")}
            title="메가 버스트 투하 (VIP)"
            class="mega-btn">💥</button
          >
          <button
            class:active={mode === "nuke"}
            onclick={() => (mode = "nuke")}
            title="아토믹 누크 폭격 (VIP)"
            class="nuke-btn">☢️</button
          >
          <button
            class:active={isGhost}
            onclick={() => {
              isGhost = !isGhost;
              mode = "draw";
            }}
            title="유령 펜 (VIP)">👻</button
          >
        {/if}
      </section>

      <div class="v-divider"></div>

      <section class="dock-section colors">
        <div class="palette-scroll">
          {#each palette as p}
            <button
              class="c-swatch"
              style="background: {p}"
              class:active={color === p}
              onclick={() => {
                color = p;
                mode = "draw";
              }}
              aria-label="Color {p}"
            ></button>
          {/each}
        </div>
        <div class="c-picker">
          <input
            type="color"
            bind:value={color}
            oninput={() => (mode = "draw")}
            aria-label="Custom Color"
          />
          <div class="c-preview" style="background: {color}"></div>
        </div>
      </section>

      <div class="v-divider hide-mobile"></div>

      <section class="dock-section size">
        <input
          type="range"
          min="1"
          max="50"
          bind:value={brushSize}
          title="브러시 크기: {brushSize}px"
        />
        <span class="size-val">{brushSize}px</span>
      </section>

      <div class="v-divider hide-mobile"></div>

      <section class="dock-section actions">
        <button
          class="ad-trigger"
          class:vip-ad={isVIP}
          onclick={() => (showAdModal = true)}
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
          <button onclick={() => canvasRef?.resetView()} title="홈으로 이동"
            >🏠</button
          >
          <button onclick={clearAll} class="danger" title="모든 데이터 초기화"
            >🗑️</button
          >
        </div>
      </section>
    </div>
  </div>

  <div class="zoom-hud">
    <button onclick={() => canvasRef?.zoomIn()} title="확대">+</button>
    <button onclick={() => canvasRef?.zoomOut()} title="축소">−</button>
  </div>

  <!-- Modals -->
  {#if showNicknameModal}
    <div class="modal-wrap glass">
      <div class="modal welcome">
        <h2>Enter Workspace</h2>
        <p>전 세계 아티스트들과 함께 실시간으로 캔버스를 채워보세요.</p>
        <div class="form">
          <input
            type="text"
            placeholder="사용할 닉네임"
            bind:value={tempUsername}
            onkeydown={(e) => e.key === "Enter" && setUsername()}
            maxlength="12"
          />
          <button
            class="primary"
            onclick={setUsername}
            disabled={!tempUsername.trim()}>시작하기</button
          >
        </div>
      </div>
    </div>
  {/if}

  {#if showAdModal}
    <div
      class="modal-wrap dark"
      onclick={(e) => e.target === e.currentTarget && (showAdModal = false)}
    >
      <div class="modal">
        <h3>Sync Media to Canvas</h3>
        <p>이미지를 업로드하면 캔버스에 즉시 배치됩니다.</p>
        <div class="upload-box">
          {#if pendingAdImage}
            <img src={pendingAdImage} alt="Preview" />
            <button class="remove" onclick={() => (pendingAdImage = null)}
              >✕</button
            >
          {:else}
            <input
              type="file"
              accept="image/*"
              onchange={handleImageUpload}
              id="ad-inp"
              hidden
            />
            <label for="ad-inp">📁 이미지 선택</label>
          {/if}
        </div>
        <div class="m-footer">
          <button class="ghost" onclick={() => (showAdModal = false)}
            >취소</button
          >
          <button
            class="primary"
            class:vip-btn={isVIP}
            onclick={confirmAd}
            disabled={!pendingAdImage}>배치하기</button
          >
        </div>
      </div>
    </div>
  {/if}

  {#if showShopModal}
    <div
      class="modal-wrap glass"
      onclick={(e) => e.target === e.currentTarget && (showShopModal = false)}
    >
      <div class="modal shop">
        <h3>Canvas Marketplace</h3>
        <div class="s-items">
          <div class="s-card">
            <span class="s-icon">✨</span>
            <div class="s-info">
              <span class="s-name">VIP Artist Status</span>
              <span class="s-desc"
                >골든 트레일, 아토믹 누크, 고스트 펜 해제</span
              >
            </div>
            <button class="s-buy" onclick={toggleVIP} disabled={isVIP}
              >{isVIP ? "이미 보유중" : "무료로 활성화"}</button
            >
          </div>
        </div>
        <button class="full-btn" onclick={() => (showShopModal = false)}
          >닫기</button
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
    background: radial-gradient(circle, rgba(251, 191, 36, 0.03), transparent);
    pointer-events: none;
    opacity: 0;
    transition: opacity 1s;
    z-index: 1;
  }
  .vip-bg-overlay.visible {
    opacity: 1;
  }

  .app-bar {
    position: absolute;
    top: 12px;
    left: 12px;
    right: 12px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(12px);
    border-radius: 16px;
    border: 1px solid rgba(0, 0, 0, 0.05);
    z-index: 100;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  }
  .vip-bar {
    border-color: rgba(251, 191, 36, 0.2);
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
  }
  .vip-logo {
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
    color: #000;
    box-shadow: 0 0 15px rgba(251, 191, 36, 0.3);
  }
  .presence {
    background: none;
    border: none;
    padding: 0;
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
  }
  .presence .dot {
    width: 6px;
    height: 6px;
    background: #22c55e;
    border-radius: 50%;
    animation: pulse 2s infinite;
  }
  @keyframes pulse {
    0%,
    100% {
      opacity: 0.8;
    }
    50% {
      opacity: 0.3;
    }
  }
  .presence span {
    font-size: 0.65rem;
    font-weight: 800;
    color: #64748b;
  }

  .hud {
    display: flex;
    align-items: center;
    gap: 16px;
    background: #f1f5f9;
    padding: 6px 16px;
    border-radius: 12px;
  }
  .vip-hud {
    background: #fffbeb;
  }
  .hud-bit {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .hud-bit small {
    font-size: 0.5rem;
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

  .vip-toggle {
    background: #1e293b;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 10px;
    font-size: 0.75rem;
    font-weight: 800;
    cursor: pointer;
  }
  .vip-toggle.vip {
    background: linear-gradient(45deg, #fbbf24, #f59e0b);
    color: #000;
  }
  .menu-btn {
    background: none;
    border: none;
    color: #64748b;
    cursor: pointer;
  }

  .workspace {
    position: absolute;
    bottom: 16px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    z-index: 100;
    pointer-events: none;
  }
  .tool-dock {
    pointer-events: auto;
    background: white;
    padding: 10px 20px;
    border-radius: 20px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  }
  .vip-dock {
    border-color: rgba(251, 191, 36, 0.3);
  }

  .dock-section {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .modes button {
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
  .modes button.active {
    background: #2563eb;
    color: white;
    box-shadow: 0 4px 10px rgba(37, 99, 235, 0.3);
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
  }
  .c-swatch.active {
    transform: scale(1.2);
    box-shadow:
      0 0 0 2px white,
      0 0 0 4px #2563eb;
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
    padding: 8px 16px;
    border-radius: 12px;
    font-weight: 800;
    font-size: 0.75rem;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
  }
  .vip-ad {
    background: linear-gradient(45deg, #0f172a, #334155);
    border: 1px solid #fbbf24;
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
    cursor: pointer;
  }

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
    transition: transform 0.3s;
    display: flex;
    flex-direction: column;
  }
  .side-panel.open {
    transform: translateX(0);
    box-shadow: -10px 0 30px rgba(0, 0, 0, 0.05);
  }
  .p-header {
    padding: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .p-list {
    flex: 1;
    padding: 12px;
    overflow-y: auto;
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
    background: #fffbeb;
    border: 1px solid #fde68a;
  }
  .u-avatar {
    width: 32px;
    height: 32px;
    border-radius: 8px;
  }
  .u-meta {
    display: flex;
    flex-direction: column;
  }
  .u-name {
    font-size: 0.85rem;
    font-weight: 800;
  }
  .u-role {
    font-size: 0.65rem;
    color: #64748b;
  }
  .p-footer {
    padding: 16px;
  }
  .shop-btn {
    width: 100%;
    padding: 12px;
    background: #2563eb;
    color: white;
    border: none;
    border-radius: 12px;
    font-weight: 800;
    cursor: pointer;
  }

  .zoom-hud {
    position: absolute;
    bottom: 100px;
    right: 16px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .zoom-hud button {
    width: 34px;
    height: 34px;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    cursor: pointer;
  }

  .modal-wrap {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 500;
    padding: 20px;
  }
  .glass {
    background: rgba(255, 255, 255, 0.4);
    backdrop-filter: blur(20px);
  }
  .modal {
    background: white;
    border-radius: 24px;
    padding: 32px;
    width: 100%;
    max-width: 400px;
    text-align: center;
  }
  .form input {
    width: 100%;
    padding: 14px;
    border: 2px solid #f1f5f9;
    border-radius: 12px;
    margin-bottom: 12px;
    text-align: center;
  }
  .primary {
    width: 100%;
    padding: 14px;
    background: #2563eb;
    color: white;
    border: none;
    border-radius: 12px;
    font-weight: 800;
    cursor: pointer;
  }
  .upload-box {
    border: 2px dashed #e2e8f0;
    border-radius: 16px;
    height: 160px;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
  }
  .upload-box img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  .remove {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 24px;
    height: 24px;
    border: none;
    background: #000;
    color: #fff;
    border-radius: 50%;
    cursor: pointer;
  }

  .mega-btn,
  .nuke-btn {
    font-size: 1.1rem;
  }
  .mega-btn.active {
    background: #fbbf24 !important;
  }
  .nuke-btn.active {
    background: #ef4444 !important;
    color: white !important;
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
    .tool-dock {
      flex-direction: column;
      bottom: 80px;
      right: 12px;
      position: fixed;
      padding: 12px;
      border-radius: 16px;
    }
    .palette-scroll {
      grid-template-columns: repeat(4, 1fr);
    }
    .v-divider,
    .hide-mobile,
    .size {
      display: none;
    }
  }
</style>
