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
    } = $props();
</script>

<div class="toolbar-wrapper">
    <div class="dock-main">
        <div class="dock-group modes">
            <button
                class:active={mode === "draw"}
                onclick={() => (mode = "draw")}
                class="tool-btn"
                title="Draw Tool"
            >
                <svg
                    width="18"
                    height="18"
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
                    width="18"
                    height="18"
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
                <div class="separator"></div>
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
                    title="Mega Burst">💥</button
                >
                <button
                    class:active={mode === "nuke"}
                    onclick={() => (mode = "nuke")}
                    class="tool-btn weapon nuke"
                    title="Atomic Nuke">☢️</button
                >
            {/if}
        </div>

        <div class="separator"></div>

        <div class="dock-group colors">
            <div class="color-grid">
                {#each palette as p}
                    <button
                        class="swatch"
                        style="background: {p}"
                        class:active={color === p}
                        onclick={() => {
                            color = p;
                            mode = "draw";
                        }}
                        title="Color {p}"
                    ></button>
                {/each}
            </div>
            <div class="custom-picker">
                <input
                    type="color"
                    bind:value={color}
                    oninput={() => (mode = "draw")}
                />
                <div class="preview" style="background: {color}"></div>
            </div>
        </div>

        <div class="separator hide-mobile"></div>

        <div class="dock-group config hide-mobile">
            <div class="size-slider">
                <input type="range" min="1" max="50" bind:value={brushSize} />
                <span class="label">{brushSize}px</span>
            </div>
        </div>

        <div class="separator"></div>

        <div class="dock-group actions">
            <button
                class="btn-primary-small add-media"
                onclick={() => (showAdModal = true)}
            >
                <svg
                    width="16"
                    height="16"
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
                <span>MEDIA</span>
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
</div>

<style>
    .toolbar-wrapper {
        position: absolute;
        bottom: 24px;
        left: 0;
        right: 0;
        display: flex;
        justify-content: center;
        z-index: 100;
        pointer-events: none;
    }
    .dock-main {
        pointer-events: auto;
        background: rgba(15, 23, 42, 0.85);
        backdrop-filter: blur(24px);
        padding: 8px 12px;
        border-radius: 24px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        align-items: center;
        gap: 12px;
        box-shadow: 0 12px 48px rgba(0, 0, 0, 0.4);
        max-width: 95vw;
    }
    .dock-group {
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .separator {
        width: 1px;
        height: 32px;
        background: rgba(255, 255, 255, 0.1);
        margin: 0 4px;
    }
    .tool-btn {
        width: 38px;
        height: 38px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        color: #94a3b8;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .tool-btn:hover {
        background: rgba(255, 255, 255, 0.12);
        color: white;
        transform: translateY(-2px);
    }
    .tool-btn.active {
        background: #2563eb;
        color: white;
        border-color: #3b82f6;
        box-shadow: 0 4px 15px rgba(37, 99, 235, 0.4);
    }
    .tool-btn.special {
        font-size: 1.2rem;
        border-color: rgba(251, 191, 36, 0.2);
    }
    .tool-btn.weapon {
        font-size: 1.3rem;
    }
    .tool-btn.weapon.active.burst {
        background: #fbbf24;
        box-shadow: 0 0 15px rgba(251, 191, 36, 0.5);
    }
    .tool-btn.weapon.active.nuke {
        background: #ef4444;
        box-shadow: 0 0 15px rgba(239, 68, 68, 0.5);
    }
    .color-grid {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 4px;
    }
    .swatch {
        width: 18px;
        height: 18px;
        border-radius: 6px;
        border: 1px solid rgba(0, 0, 0, 0.2);
        cursor: pointer;
        transition: transform 0.2s;
    }
    .swatch:hover {
        transform: scale(1.2);
    }
    .swatch.active {
        transform: scale(1.25);
        border: 2px solid white;
        box-shadow: 0 0 8px rgba(255, 255, 255, 0.4);
    }
    .custom-picker {
        position: relative;
        width: 32px;
        height: 32px;
        border-radius: 10px;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.1);
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
    }
    .size-slider {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 0 12px;
    }
    .size-slider input {
        width: 100px;
        accent-color: #2563eb;
        height: 4px;
    }
    .size-slider .label {
        font-size: 0.75rem;
        font-weight: 800;
        color: #94a3b8;
        min-width: 40px;
    }
    .btn-primary-small {
        background: #2563eb;
        color: white;
        border: none;
        padding: 10px 16px;
        border-radius: 12px;
        font-weight: 800;
        font-size: 0.7rem;
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        white-space: nowrap;
        flex-shrink: 0;
        transition: all 0.2s;
        letter-spacing: 0.02em;
    }
    .btn-primary-small:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(37, 99, 235, 0.4);
    }
    .mini-utils {
        display: flex;
        gap: 6px;
    }
    .btn-util {
        width: 36px;
        height: 36px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        cursor: pointer;
    }
    .btn-util.danger:hover {
        background: #fee2e2;
        color: #ef4444;
    }
    @media (max-width: 900px) {
        .dock-main {
            padding: 6px 10px;
            gap: 8px;
            flex-wrap: wrap;
            justify-content: center;
        }
        .color-grid {
            grid-template-columns: repeat(9, 1fr);
        }
        .hide-mobile {
            display: none;
        }
        .toolbar-wrapper {
            bottom: 12px;
        }
    }
</style>
