<script>
    let {
        showNicknameModal = $bindable(),
        showAdModal = $bindable(),
        showShopModal = $bindable(),
        tempUsername = $bindable(),
        setUsername,
        pendingAdImage = $bindable(),
        handleImageUpload,
        confirmAd,
        toggleVIP,
        isVIP,
    } = $props();
</script>

<!-- NICKNAME MODAL -->
{#if showNicknameModal}
    <div class="modal-overlay glass-heavy">
        <div class="premium-modal welcome">
            <div class="modal-icon">👋</div>
            <h2>What's your name?</h2>
            <p>
                Welcome to the giant board! Grab a pen and start doodling with
                everyone.
            </p>
            <div class="input-form">
                <input
                    type="text"
                    placeholder="Nick name here..."
                    bind:value={tempUsername}
                    onkeydown={(e) => e.key === "Enter" && setUsername()}
                    maxlength="15"
                />
                <button
                    class="btn-submit"
                    onclick={setUsername}
                    disabled={!tempUsername.trim()}>START DOODLING</button
                >
            </div>
        </div>
    </div>
{/if}

<!-- AD MODAL -->
{#if showAdModal}
    <div
        class="modal-overlay dark-blur"
        role="button"
        tabindex="0"
        onclick={(e) => e.target === e.currentTarget && (showAdModal = false)}
        onkeydown={(e) =>
            (e.key === "Enter" || e.key === " ") &&
            e.target === e.currentTarget &&
            (showAdModal = false)}
    >
        <div class="premium-modal ad-drop">
            <div class="modal-header">
                <h3>Drop Media Assets</h3>
                <p>Sync high-quality images directly into the shared canvas.</p>
            </div>
            <div class="upload-zone" class:has-file={!!pendingAdImage}>
                {#if pendingAdImage}
                    <div class="preview-wrap">
                        <img src={pendingAdImage} alt="Preview" />
                        <button
                            class="btn-remove"
                            onclick={() => (pendingAdImage = null)}>✕</button
                        >
                    </div>
                {:else}
                    <input
                        type="file"
                        accept="image/*"
                        onchange={handleImageUpload}
                        id="file-inp"
                        hidden
                    />
                    <label for="file-inp" class="drop-label">
                        <div class="up-icon">📂</div>
                        <span>Click or Drag Image File</span>
                        <small>JPEG, PNG, WebP supported</small>
                    </label>
                {/if}
            </div>
            <div class="modal-footer">
                <button class="btn-ghost" onclick={() => (showAdModal = false)}
                    >CANCEL</button
                >
                <button
                    class="btn-submit neon"
                    onclick={confirmAd}
                    disabled={!pendingAdImage}>SYNC TO CANVAS</button
                >
            </div>
        </div>
    </div>
{/if}

<!-- SHOP MODAL -->
{#if showShopModal}
    <div
        class="modal-overlay glass-heavy"
        role="button"
        tabindex="0"
        onclick={(e) => e.target === e.currentTarget && (showShopModal = false)}
        onkeydown={(e) =>
            (e.key === "Enter" || e.key === " ") &&
            e.target === e.currentTarget &&
            (showShopModal = false)}
    >
        <div class="premium-modal shop">
            <div class="shop-badge">UNLIMITED ACCESS</div>
            <h2>Prestige Marketplace</h2>
            <p>Unlock elite weapons and artistic tools permanently.</p>
            <div class="shop-offers">
                <div class="offer-card best-value">
                    <div class="offer-header">
                        <span class="icon">👑</span>
                        <h3>VIP PRESTIGE</h3>
                    </div>
                    <ul class="features">
                        <li>☢️ Atomic Nuke Launch</li>
                        <li>💥 Mega Burst Celebration</li>
                        <li>🌈 Rainbow Spectrum Pen</li>
                        <li>👻 Ghost Ink (Disappearing)</li>
                        <li>✨ Golden Particle Aura</li>
                    </ul>
                    <div class="price">FREE FOR TESTING</div>
                    <button
                        class="btn-buy"
                        onclick={() => {
                            toggleVIP();
                            showShopModal = false;
                        }}
                        disabled={isVIP}
                    >
                        {isVIP ? "ALREADY ACTIVE" : "ACTIVATE PERMANENTLY"}
                    </button>
                </div>
            </div>
            <button
                class="btn-text-only"
                onclick={() => (showShopModal = false)}>Maybe Later</button
            >
        </div>
    </div>
{/if}

<style>
    .modal-overlay {
        position: fixed;
        inset: 0;
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        pointer-events: auto;
    }
    .glass-heavy {
        background: var(--glass-shadow);
        backdrop-filter: blur(32px);
    }
    .dark-blur {
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(12px);
    }
    .premium-modal {
        background: var(--bg-app);
        border: 1px solid var(--glass-border);
        border-radius: 32px;
        padding: 40px;
        width: 100%;
        max-width: 460px;
        text-align: center;
        box-shadow: 0 24px 64px var(--glass-shadow);
    }
    .modal-icon {
        font-size: 3.5rem;
        margin-bottom: 16px;
    }
    .premium-modal h2 {
        font-size: 1.75rem;
        font-weight: 800;
        margin-bottom: 12px;
        color: var(--text-main);
    }
    .premium-modal p {
        color: #94a3b8;
        line-height: 1.6;
        margin-bottom: 32px;
    }
    .input-form {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }
    .input-form input {
        background: var(--card-bg);
        border: 2px solid var(--glass-border);
        padding: 16px;
        border-radius: 16px;
        color: var(--text-main);
        font-family: inherit;
        font-size: 1rem;
        text-align: center;
        transition: all 0.2s;
    }
    .input-form input:focus {
        border-color: #2563eb;
        outline: none;
        background: var(--bg-app);
    }
    .btn-submit {
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        color: white;
        border: none;
        padding: 18px;
        border-radius: 18px;
        font-weight: 800;
        cursor: pointer;
        font-size: 0.95rem;
        letter-spacing: 0.05em;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 4px 15px rgba(37, 99, 235, 0.2);
    }
    .btn-submit:hover:not(:disabled) {
        transform: translateY(-3px);
        box-shadow: 0 8px 32px rgba(37, 99, 235, 0.5);
    }
    .btn-submit:active:not(:disabled) {
        transform: translateY(-1px);
    }
    .btn-submit:disabled {
        opacity: 0.3;
        cursor: not-allowed;
        filter: grayscale(1);
    }
    .btn-submit.neon {
        background: linear-gradient(135deg, #0ea5e9, #2563eb);
    }
    .upload-zone {
        border: 3px dashed var(--glass-border);
        border-radius: 24px;
        min-height: 200px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 24px;
        transition: all 0.3s;
    }
    .upload-zone.has-file {
        border-style: solid;
        border-color: rgba(37, 99, 235, 0.3);
    }
    .drop-label {
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
    }
    .drop-label .up-icon {
        font-size: 2.5rem;
    }
    .drop-label small {
        color: #64748b;
    }
    .preview-wrap {
        position: relative;
        width: 100%;
        height: 100%;
        padding: 16px;
    }
    .preview-wrap img {
        width: 100%;
        max-height: 300px;
        object-fit: contain;
        border-radius: 12px;
    }
    .btn-remove {
        position: absolute;
        top: 0;
        right: 0;
        width: 32px;
        height: 32px;
        background: #ef4444;
        border: none;
        border-radius: 50%;
        color: white;
        cursor: pointer;
    }
    .modal-footer {
        display: flex;
        gap: 12px;
    }
    .modal-footer button {
        flex: 1;
    }
    .btn-ghost {
        background: rgba(0, 0, 0, 0.03);
        color: #64748b;
        border: none;
        border-radius: 16px;
        font-weight: 800;
        cursor: pointer;
    }
    .offer-card {
        background: var(--card-bg);
        border: 1px solid var(--glass-border);
        border-radius: 24px;
        padding: 32px;
        position: relative;
    }
    .best-value {
        border-color: #fbbf24;
        background: linear-gradient(
            135deg,
            rgba(251, 191, 36, 0.05),
            transparent
        );
    }
    .shop-badge {
        background: #fbbf24;
        color: #000;
        font-size: 0.65rem;
        font-weight: 800;
        padding: 4px 12px;
        border-radius: 10px;
        display: inline-block;
        margin-bottom: 16px;
    }
    .offer-header {
        display: flex;
        align-items: center;
        gap: 12px;
        justify-content: center;
        margin-bottom: 20px;
    }
    .features {
        list-style: none;
        text-align: left;
        margin-bottom: 24px;
        display: grid;
        gap: 10px;
    }
    .features li {
        font-size: 0.9rem;
        color: #475569;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .features li::before {
        content: "✔️";
        font-size: 0.7rem;
    }
    .price {
        font-size: 1.5rem;
        font-weight: 800;
        margin-bottom: 20px;
        color: #fbbf24;
    }
    .btn-buy {
        width: 100%;
        padding: 16px;
        background: #fbbf24;
        color: #000;
        border: none;
        border-radius: 16px;
        font-weight: 800;
        cursor: pointer;
    }
    .btn-buy:disabled {
        background: #1e293b;
        color: #64748b;
    }
    .btn-text-only {
        background: none;
        border: none;
        color: #94a3b8;
        font-weight: 600;
        margin-top: 24px;
        cursor: pointer;
    }
</style>
