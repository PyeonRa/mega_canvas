<script>
    let {
        isVIP,
        mouseCoord,
        pixelCount,
        onlineUsersCount,
        showShopModal = $bindable(),
        isUsersOpen = $bindable(),
        isDarkMode,
        toggleTheme,
    } = $props();
</script>

<header class="top-nav">
    <div class="nav-container">
        <div class="brand">
            <div class="logo-box" class:vip={isVIP}>M</div>
            <div class="brand-text">
                <span class="title">MEGA CANVAS</span>
                {#if isVIP}<span class="badge-vip">PREMIUM</span>{/if}
            </div>
        </div>

        <div class="center-hud">
            <div class="stats-card">
                <div class="stat-item">
                    <span class="label">COORDS</span>
                    <span class="value"
                        >{mouseCoord
                            ? `${mouseCoord.x}, ${mouseCoord.y}`
                            : "MOVE TO VIEW"}</span
                    >
                </div>
                <div class="divider"></div>
                <div class="stat-item">
                    <span class="label">CONTRIB</span>
                    <span class="value"
                        >{pixelCount.toLocaleString()} <small>PX</small></span
                    >
                </div>
            </div>
        </div>

        <div class="nav-actions">
            {#if !isVIP}
                <button
                    class="btn-upgrade"
                    onclick={() => (showShopModal = true)}
                >
                    <span class="icon">✨</span>
                    <span class="text">UPGRADE</span>
                </button>
            {:else}
                <div class="vip-status">
                    <span class="dot-live"></span>
                    <span class="text">ELITE ACTIVE</span>
                </div>
            {/if}
            <button
                class="btn-icon theme-toggle"
                onclick={toggleTheme}
                aria-label="Toggle Theme"
                title="Switch Appearance"
            >
                {#if isDarkMode}
                    <span>☀️</span>
                {:else}
                    <span>🌙</span>
                {/if}
            </button>
            <button
                class="btn-icon sidebar-toggle"
                onclick={() => (isUsersOpen = !isUsersOpen)}
                aria-label="Users"
                title="People Online"
            >
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    ><path
                        d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
                    /><circle cx="9" cy="7" r="4" /><path
                        d="M23 21v-2a4 4 0 0 0-3-3.87"
                    /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg
                >
                <span class="count-badge">{onlineUsersCount}</span>
            </button>
        </div>
    </div>
</header>

<style>
    .top-nav {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 72px;
        z-index: 100;
        padding: 0 24px;
        display: flex;
        align-items: center;
        pointer-events: none;
    }
    .nav-container {
        width: 100%;
        height: 56px;
        background: var(--glass-bg);
        backdrop-filter: blur(20px);
        border-radius: 18px;
        border: 1px solid var(--glass-border);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 16px;
        pointer-events: auto;
        box-shadow: 0 8px 32px var(--glass-shadow);
    }
    .brand {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    .logo-box {
        width: 36px;
        height: 36px;
        background: #2563eb;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 10px;
        font-weight: 800;
        font-size: 1.2rem;
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
    }
    .logo-box.vip {
        background: linear-gradient(135deg, #fbbf24, #f59e0b);
        color: #1e293b;
        box-shadow: 0 0 15px rgba(251, 191, 36, 0.6);
    }
    .brand-text {
        display: flex;
        flex-direction: column;
        line-height: 1;
    }
    .brand-text .title {
        font-weight: 800;
        font-size: 0.95rem;
        letter-spacing: 0.05em;
    }
    .badge-vip {
        font-size: 0.65rem;
        font-weight: 800;
        color: #fbbf24;
        margin-top: 2px;
    }
    .stats-card {
        background: var(--card-bg);
        border: 1px solid var(--glass-border);
        padding: 6px 16px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        gap: 16px;
    }
    .stat-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        min-width: 80px;
    }
    .stat-item .label {
        font-size: 0.55rem;
        font-weight: 800;
        color: #94a3b8;
    }
    .stat-item .value {
        font-family: "JetBrains Mono", monospace;
        font-size: 0.8rem;
        font-weight: 600;
        color: var(--text-main);
        white-space: nowrap;
    }
    .divider {
        width: 1px;
        height: 20px;
        background: rgba(0, 0, 0, 0.05);
    }
    .nav-actions {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    .btn-upgrade {
        background: linear-gradient(45deg, #fbbf24, #f59e0b);
        border: none;
        padding: 8px 16px;
        border-radius: 10px;
        color: #1e293b;
        font-weight: 800;
        font-size: 0.75rem;
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        transition:
            transform 0.2s,
            box-shadow 0.2s;
    }
    .btn-upgrade:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(251, 191, 36, 0.4);
    }
    .vip-status {
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(251, 191, 36, 0.1);
        padding: 8px 14px;
        border-radius: 10px;
        border: 1px solid rgba(251, 191, 36, 0.3);
    }
    .dot-live {
        width: 8px;
        height: 8px;
        background: #fbbf24;
        border-radius: 50%;
        box-shadow: 0 0 10px #fbbf24;
        animation: blink 2s infinite;
    }
    @keyframes blink {
        0%,
        100% {
            opacity: 1;
        }
        50% {
            opacity: 0.4;
        }
    }
    .vip-status .text {
        font-size: 0.7rem;
        font-weight: 800;
        color: #fbbf24;
    }
    .btn-icon {
        background: var(--card-bg);
        border: 1px solid var(--glass-border);
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
        color: var(--text-muted);
        cursor: pointer;
        position: relative;
        transition: all 0.2s;
    }
    .btn-icon:hover {
        background: var(--glass-border);
        color: var(--text-main);
    }
    .count-badge {
        position: absolute;
        top: -5px;
        right: -5px;
        background: #2563eb;
        color: white;
        font-size: 0.6rem;
        font-weight: 800;
        min-width: 18px;
        height: 18px;
        padding: 0 4px;
        border-radius: 9px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid #fff;
    }
    @media (max-width: 900px) {
        .nav-container {
            padding: 0 12px;
            height: 48px;
        }
        .center-hud {
            display: none;
        }
    }
</style>
