<script>
    let {
        isUsersOpen = $bindable(),
        onlineUsers,
        username,
        color,
        isVIP,
        pixelCount,
    } = $props();
</script>

<aside class="artists-drawer" class:show={isUsersOpen}>
    <div class="drawer-header">
        <div class="header-main">
            <h3>ARTISTS ONLINE</h3>
            <span class="online-pill">{onlineUsers.length + 1} LIVE</span>
        </div>
        <button class="btn-close" onclick={() => (isUsersOpen = false)}
            >✕</button
        >
    </div>

    <div class="user-stack">
        <!-- Me Section -->
        <div class="section-label">YOU</div>
        <div class="user-card mine" class:vip={isVIP}>
            <div
                class="avatar"
                style="background: {isVIP
                    ? 'linear-gradient(45deg, #fbbf24, #f59e0b)'
                    : color}"
            >
                {#if isVIP}<span class="crown">👑</span>{/if}
            </div>
            <div class="info">
                <p class="name">{username}</p>
                <div class="meta-row">
                    <span class="role">{isVIP ? "PRESTIGE VIP" : "ARTIST"}</span
                    >
                    <span class="px-contrib"
                        >{pixelCount.toLocaleString()} px</span
                    >
                </div>
            </div>
        </div>

        <!-- Others Section -->
        <div class="section-label">OTHERS</div>
        {#each onlineUsers as user}
            <div class="user-card" class:vip={user.isVIP}>
                <div
                    class="avatar"
                    style="background: {user.isVIP
                        ? 'linear-gradient(45deg, #fbbf24, #f59e0b)'
                        : user.color || '#94a3b8'}"
                >
                    {#if user.isVIP}<span class="crown">👑</span>{/if}
                </div>
                <div class="info">
                    <p class="name">{user.username}</p>
                    <div class="meta-row">
                        <span class="role"
                            >{user.isVIP ? "ELITE VIP" : "ACTIVE"}</span
                        >
                        <span class="px-contrib"
                            >{(user.pixelCount || 0).toLocaleString()} px</span
                        >
                    </div>
                </div>
            </div>
        {:else}
            <div class="empty-state">No other artists active...</div>
        {/each}
    </div>
</aside>

<style>
    .artists-drawer {
        position: absolute;
        top: 80px;
        right: 24px;
        bottom: 120px;
        width: 320px;
        background: var(--glass-bg);
        backdrop-filter: blur(32px);
        border-radius: 28px;
        border: 1px solid var(--glass-border);
        z-index: 150;
        display: flex;
        flex-direction: column;
        transform: translateX(400px);
        transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        padding: 24px;
        box-shadow: -15px 0 45px var(--glass-shadow);
        pointer-events: auto;
    }
    .artists-drawer.show {
        transform: translateX(0);
    }
    .drawer-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 24px;
    }
    .header-main {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }
    .drawer-header h3 {
        font-size: 0.8rem;
        font-weight: 900;
        letter-spacing: 0.15em;
        color: #94a3b8;
        margin: 0;
    }
    .online-pill {
        font-size: 0.65rem;
        font-weight: 900;
        color: #2563eb;
        background: rgba(37, 99, 235, 0.15);
        padding: 2px 8px;
        border-radius: 100px;
        width: fit-content;
    }
    .btn-close {
        background: var(--card-bg);
        border: none;
        color: var(--text-muted);
        width: 32px;
        height: 32px;
        border-radius: 10px;
        font-size: 0.8rem;
        cursor: pointer;
        transition: all 0.2s;
    }
    .btn-close:hover {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
    }

    .user-stack {
        flex: 1;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding-right: 4px;
    }
    .user-stack::-webkit-scrollbar {
        width: 4px;
    }
    .user-stack::-webkit-scrollbar-thumb {
        background: var(--glass-border);
        border-radius: 2px;
    }

    .section-label {
        font-size: 0.6rem;
        font-weight: 900;
        color: #475569;
        letter-spacing: 0.1em;
        margin-top: 16px;
        margin-bottom: 4px;
    }

    .user-card {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 12px;
        border-radius: 20px;
        background: var(--card-bg);
        border: 1px solid var(--glass-border);
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .user-card:hover {
        background: var(--glass-border);
        transform: scale(0.98);
    }
    .user-card.vip {
        background: rgba(251, 191, 36, 0.03);
        border-color: rgba(251, 191, 36, 0.15);
    }
    .user-card.mine {
        background: rgba(37, 99, 235, 0.05);
        border: 1px solid rgba(37, 99, 235, 0.3);
    }

    .avatar {
        width: 44px;
        height: 44px;
        border-radius: 14px;
        position: relative;
        flex-shrink: 0;
    }
    .crown {
        position: absolute;
        top: -8px;
        right: -8px;
        font-size: 1rem;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
    }

    .info {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }
    .info .name {
        font-weight: 700;
        font-size: 0.95rem;
        color: var(--text-main);
        margin: 0;
    }
    .info .role {
        font-size: 0.6rem;
        font-weight: 900;
        color: #64748b;
        letter-spacing: 0.05em;
    }

    .meta-row {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    .px-contrib {
        font-size: 0.65rem;
        font-weight: 900;
        color: #3b82f6;
        background: rgba(37, 99, 235, 0.1);
        padding: 2px 8px;
        border-radius: 100px;
    }
    .vip .px-contrib {
        color: #fbbf24;
        background: rgba(251, 191, 36, 0.15);
    }

    .empty-state {
        font-size: 0.8rem;
        color: #475569;
        text-align: center;
        margin-top: 20px;
        font-style: italic;
    }

    @media (max-width: 900px) {
        .artists-drawer {
            top: 0;
            right: 0;
            bottom: 0;
            width: 85vw;
            border-radius: 0;
            border-left: 1px solid var(--glass-border);
            transform: translateX(100%);
        }
        .user-card {
            padding: 10px;
            border-radius: 16px;
        }
    }
</style>
