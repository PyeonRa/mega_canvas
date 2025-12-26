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
        <h3>Active People</h3>
        <button class="btn-close" onclick={() => (isUsersOpen = false)}
            >✕</button
        >
    </div>
    <div class="user-stack">
        <!-- Me -->
        <div class="user-card mine" class:vip={isVIP}>
            <div
                class="avatar"
                style="background: {isVIP
                    ? 'linear-gradient(45deg, #fbbf24, #f59e0b)'
                    : color}"
            ></div>
            <div class="info">
                <p class="name">{username} (Me)</p>
                <div class="meta-row">
                    <span class="role"
                        >{isVIP ? "Prestige VIP" : "Drawing..."}</span
                    >
                    <span class="px-contrib">{pixelCount} px</span>
                </div>
            </div>
        </div>
        <!-- Others -->
        {#each onlineUsers as user}
            <div class="user-card" class:vip={user.isVIP}>
                <div
                    class="avatar"
                    style="background: {user.isVIP
                        ? 'linear-gradient(45deg, #fbbf24, #f59e0b)'
                        : user.color || '#94a3b8'}"
                ></div>
                <div class="info">
                    <p class="name">{user.username}</p>
                    <div class="meta-row">
                        <span class="role"
                            >{user.isVIP ? "Elite VIP" : "Online"}</span
                        >
                        <span class="px-contrib">{user.pixelCount || 0} px</span
                        >
                    </div>
                </div>
                {#if user.isVIP}<span class="vip-spark">✨</span>{/if}
            </div>
        {/each}
    </div>
</aside>

<style>
    .artists-drawer {
        position: absolute;
        top: 72px;
        right: 24px;
        bottom: 120px;
        width: 300px;
        background: rgba(15, 23, 42, 0.9);
        backdrop-filter: blur(24px);
        border-radius: 24px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        z-index: 150;
        display: flex;
        flex-direction: column;
        transform: translateX(350px);
        transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        padding: 24px;
        box-shadow: -20px 0 50px rgba(0, 0, 0, 0.3);
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
    .drawer-header h3 {
        font-size: 1.1rem;
        font-weight: 800;
    }
    .btn-close {
        background: none;
        border: none;
        color: #64748b;
        font-size: 1.2rem;
        cursor: pointer;
    }
    .user-stack {
        flex: 1;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 12px;
    }
    .user-card {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 12px;
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.05);
        transition: all 0.2s;
        position: relative;
    }
    .user-card.vip {
        background: rgba(251, 191, 36, 0.05);
        border-color: rgba(251, 191, 36, 0.2);
    }
    .user-card.mine {
        border: 2px solid #2563eb;
    }
    .user-card.mine.vip {
        border-color: #fbbf24;
    }
    .avatar {
        width: 40px;
        height: 40px;
        border-radius: 12px;
    }
    .info {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }
    .info .name {
        font-weight: 600;
        font-size: 0.9rem;
    }
    .info .role {
        font-size: 0.7rem;
        color: #64748b;
        font-weight: 600;
    }
    .meta-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 2px;
    }
    .px-contrib {
        font-size: 0.65rem;
        font-weight: 800;
        color: #2563eb;
        background: rgba(37, 99, 235, 0.1);
        padding: 1px 6px;
        border-radius: 6px;
    }
    .vip .px-contrib {
        color: #f59e0b;
        background: rgba(245, 158, 11, 0.1);
    }
    .vip-spark {
        position: absolute;
        right: 12px;
        font-size: 1.2rem;
    }
</style>
