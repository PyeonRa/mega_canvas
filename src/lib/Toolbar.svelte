<script>
    let {
        mode = $bindable(),
        color = $bindable(),
        brushSize = $bindable(),
        isVIP,
        isRainbow = $bindable(),
        isGhost = $bindable(),
        palette,
        showAdModal = $bindable(),
        canvasRef,
        clearAll,
        nukeCooldown = 0,
    } = $props();

    let showColorPopup = $state(false);
</script>

<div class="toolbar-wrapper">
    <div class="dock-main">
        <!-- Main Drawing/Panning Tools -->
        <div class="dock-group modes">
            <button
                class:active={mode === "draw"}
                onclick={() => (mode = "draw")}
                class="tool-btn"
                title="Draw Tool"
            >
                <svg
                    width="20"
                    height="20"
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
                class="tool-btn"
                title="Pan Tool"
            >
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    ><circle cx="12" cy="12" r="10" /><path
                        d="M12 8l-4 4 4 4M16 12H12"
                    /></svg
                >
            </button>
            <button
                class:active={mode === "stamp"}
                onclick={() => (mode = "stamp")}
                class="tool-btn"
                title="Emoji Stamp Tool"
            >
                <span>🎨</span>
            </button>
            <button
                class:active={mode === "sparkle"}
                onclick={() => (mode = "sparkle")}
                class="tool-btn"
                title="Magic Sparkler"
            >
                <span>✨</span>
            </button>
        </div>

        <div class="separator"></div>

        <!-- Color Trigger -->
        <div class="dock-group color-trigger">
            <button
                class="color-btn"
                onclick={() => (showColorPopup = !showColorPopup)}
                style="--current-color: {color}"
            >
                <div class="inner-swatch"></div>
                <span class="hide-mobile">COLOR</span>
            </button>
        </div>

        <div class="separator"></div>

        <!-- Brush Size -->
        <div class="dock-group config">
            <div class="size-control">
                <input type="range" min="1" max="50" bind:value={brushSize} />
                <span class="label">{brushSize}px</span>
            </div>
        </div>

        {#if isVIP}
            <div class="separator hide-mobile"></div>
            <div class="dock-group special-tools hide-mobile">
                <button
                    class:active={isRainbow}
                    onclick={() => {
                        isRainbow = !isRainbow;
                        mode = "draw";
                    }}
                    class="tool-btn special"
                    title="Rainbow Mode">🌈</button
                >
                <button
                    class:active={isGhost}
                    onclick={() => {
                        isGhost = !isGhost;
                        mode = "draw";
                    }}
                    class="tool-btn special"
                    title="Ghost Mode">👻</button
                >
                <button
                    class:active={mode === "burst"}
                    onclick={() => (mode = "burst")}
                    class="tool-btn weapon burst"
                    title="Mega Burst"
                >
                    <span>💥</span>
                </button>
                <button
                    class:active={mode === "nuke"}
                    onclick={() => (mode = "nuke")}
                    class="tool-btn weapon nuke"
                    class:disabled={nukeCooldown > 0}
                    title="Atomic Nuke"
                >
                    {#if nukeCooldown > 0}
                        <span class="cooldown-text">{nukeCooldown}</span>
                    {:else}
                        <span>☢️</span>
                    {/if}
                </button>
            </div>
        {/if}

        <div class="separator"></div>

        <!-- Global Actions -->
        <div class="dock-group actions">
            <button
                class="tool-btn"
                onclick={() => (showAdModal = true)}
                title="Media"
            >
                <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    ><rect
                        x="3"
                        y="3"
                        width="18"
                        height="18"
                        rx="2"
                        ry="2"
                    /><circle cx="8.5" cy="8.5" r="1.5" /><polyline
                        points="21 15 16 10 5 21"
                    /></svg
                >
            </button>
            <div class="mini-utils">
                <button
                    onclick={() => canvasRef.resetView()}
                    class="btn-util"
                    title="Home View">🏠</button
                >
                <button
                    onclick={clearAll}
                    class="btn-util danger"
                    title="Clear Canvas">🗑️</button
                >
            </div>
        </div>
    </div>

    <!-- Mobile-First Color Panel -->
    {#if showColorPopup}
        <div
            class="color-panel glass-heavy"
            role="dialog"
            tabindex="0"
            aria-label="Color Palette and Tools"
            onmouseleave={() => {
                if (window.innerWidth > 900) showColorPopup = false;
            }}
        >
            <div class="panel-header">
                <span>PALETTE</span>
                <button
                    class="close-btn"
                    onclick={() => (showColorPopup = false)}>✕</button
                >
            </div>
            <div class="color-grid">
                {#each palette as p}
                    <button
                        class="swatch"
                        style="background: {p}"
                        class:active={color === p}
                        onclick={() => {
                            color = p;
                            mode = "draw";
                            if (window.innerWidth < 900) showColorPopup = false;
                        }}
                        title="Pick {p}"
                        aria-label="Color {p}"
                    ></button>
                {/each}
            </div>
            <div class="picker-section">
                <div class="custom-picker">
                    <input
                        type="color"
                        bind:value={color}
                        oninput={() => (mode = "draw")}
                        aria-label="Custom Color Picker"
                    />
                    <div class="preview" style="background: {color}"></div>
                </div>
                <span class="hex-label">{color.toUpperCase()}</span>
            </div>

            <div class="mobile-special-wrap">
                <div class="panel-header"><span>QUICK TOOLS</span></div>
                <div class="special-row">
                    <button
                        class:active={mode === "stamp"}
                        onclick={() => {
                            mode = "stamp";
                            showColorPopup = false;
                        }}
                        class="tool-btn"
                        title="Emoji Stamp">🎨</button
                    >
                    <button
                        class:active={mode === "sparkle"}
                        onclick={() => {
                            mode = "sparkle";
                            showColorPopup = false;
                        }}
                        class="tool-btn"
                        title="Magic Sparkler">✨</button
                    >
                    {#if isVIP}
                        <button
                            class:active={isRainbow}
                            onclick={() => {
                                isRainbow = !isRainbow;
                                mode = "draw";
                            }}
                            class="tool-btn special">🌈</button
                        >
                        <button
                            class:active={isGhost}
                            onclick={() => {
                                isGhost = !isGhost;
                                mode = "draw";
                            }}
                            class="tool-btn special">👻</button
                        >
                        <button
                            class:active={mode === "burst"}
                            onclick={() => (mode = "burst")}
                            class="tool-btn weapon burst">💥</button
                        >
                        <button
                            class:active={mode === "nuke"}
                            onclick={() => (mode = "nuke")}
                            class="tool-btn weapon nuke">☢️</button
                        >
                    {/if}
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    .toolbar-wrapper {
        position: absolute;
        bottom: 24px;
        left: 0;
        right: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        z-index: 100;
        pointer-events: none;
    }
    .dock-main {
        pointer-events: auto;
        background: var(--glass-bg);
        backdrop-filter: blur(24px);
        padding: 8px 14px;
        border-radius: 28px;
        border: 1px solid var(--glass-border);
        display: flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 12px 32px var(--glass-shadow);
        max-width: 95vw;
    }
    .dock-group {
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .separator {
        width: 1px;
        height: 24px;
        background: var(--glass-border);
        margin: 0 2px;
    }
    .tool-btn {
        width: 42px;
        height: 42px;
        background: var(--card-bg);
        border: 1px solid var(--glass-border);
        border-radius: 14px;
        color: var(--text-muted);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .tool-btn:hover {
        background: var(--glass-border);
        color: var(--text-main);
        transform: translateY(-2px);
    }
    .tool-btn.active {
        background: #2563eb;
        color: white;
        border-color: #3b82f6;
        box-shadow: 0 4px 15px rgba(37, 99, 235, 0.4);
    }
    .color-btn {
        height: 42px;
        padding: 0 16px;
        background: var(--card-bg);
        border: 1px solid var(--glass-border);
        border-radius: 14px;
        display: flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
        color: var(--text-main);
        font-weight: 800;
        font-size: 0.75rem;
    }
    .color-btn .inner-swatch {
        width: 22px;
        height: 22px;
        background: var(--current-color);
        border-radius: 6px;
        border: 2px solid var(--glass-border);
    }
    .size-control {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 0 8px;
    }
    .size-control input {
        width: 80px;
        accent-color: #2563eb;
    }
    .size-control .label {
        font-size: 0.7rem;
        font-weight: 900;
        color: #94a3b8;
        min-width: 35px;
    }
    .mini-utils {
        display: flex;
        gap: 4px;
    }
    .btn-util {
        width: 38px;
        height: 38px;
        background: var(--card-bg);
        border: 1px solid var(--glass-border);
        border-radius: 12px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
    }
    .btn-util:hover {
        background: var(--glass-border);
    }
    .btn-util.danger:hover {
        background: rgba(239, 68, 68, 0.08);
    }

    .cooldown-text {
        font-size: 0.8rem;
        font-weight: 900;
        color: var(--text-main);
        font-family: "JetBrains Mono", monospace;
    }
    .tool-btn.disabled {
        opacity: 0.5;
        cursor: not-allowed;
        filter: grayscale(1);
    }

    /* Color Panel Popover */
    .color-panel {
        pointer-events: auto;
        position: absolute;
        bottom: 80px;
        background: var(--glass-bg);
        backdrop-filter: blur(20px);
        width: 280px;
        padding: 16px;
        border-radius: 24px;
        border: 1px solid var(--glass-border);
        box-shadow: 0 20px 40px var(--glass-shadow);
        display: flex;
        flex-direction: column;
        gap: 12px;
        animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.65rem;
        font-weight: 900;
        color: #64748b;
        letter-spacing: 0.1em;
    }
    .close-btn {
        background: none;
        border: none;
        color: #64748b;
        font-size: 1.2rem;
        cursor: pointer;
    }
    .color-grid {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 8px;
    }
    .swatch {
        aspect-ratio: 1;
        border-radius: 8px;
        border: 1px solid rgba(0, 0, 0, 0.3);
        cursor: pointer;
        transition: transform 0.2s;
    }
    .swatch:hover {
        transform: scale(1.1);
    }
    .swatch.active {
        border: 2px solid white;
        box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
    }
    .picker-section {
        display: flex;
        align-items: center;
        gap: 12px;
        padding-top: 8px;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
    }
    .custom-picker {
        position: relative;
        width: 36px;
        height: 36px;
        border-radius: 10px;
        overflow: hidden;
    }
    .custom-picker input {
        position: absolute;
        inset: -5px;
        width: 200%;
        height: 200%;
        opacity: 0;
        cursor: pointer;
    }
    .custom-picker .preview {
        position: absolute;
        inset: 0;
        pointer-events: none;
        border: 2px solid rgba(255, 255, 255, 0.1);
        border-radius: 10px;
    }
    .hex-label {
        font-family: "JetBrains Mono", monospace;
        font-size: 0.8rem;
        color: #94a3b8;
    }

    .mobile-special-wrap {
        display: none;
    }
    .special-row {
        display: flex;
        gap: 8px;
        margin-top: 8px;
    }

    @media (max-width: 900px) {
        .hide-mobile {
            display: none;
        }
        .dock-main {
            padding: 6px 10px;
            gap: 6px;
            border-radius: 20px;
        }
        .tool-btn {
            width: 38px;
            height: 38px;
            border-radius: 10px;
        }
        .color-btn {
            padding: 0 10px;
            height: 38px;
            border-radius: 10px;
        }
        .size-control input {
            width: 60px;
        }
        .color-panel {
            bottom: 70px;
            width: calc(100vw - 40px);
            left: 20px;
            right: 20px;
        }
        .mobile-special-wrap {
            display: block;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
            padding-top: 8px;
        }
        .toolbar-wrapper {
            bottom: 16px;
        }
    }
</style>
