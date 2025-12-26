<script>
    import { onMount, tick } from "svelte";

    let { socket, username, color, isVIP } = $props();

    let messages = $state([]);
    let newMessage = $state("");
    let isOpen = $state(false);
    let scrollContainer = $state();
    let unreadCount = $state(0);

    // Listen for messages from the socket
    $effect(() => {
        if (!socket) return;

        const handleMsg = (msg) => {
            messages = [...messages, msg]; // Ensure reactivity via assignment
            if (messages.length > 50) messages.shift();
            if (!isOpen) unreadCount++;
            scrollToBottom();
        };

        const handleInit = (data) => {
            if (data.chatHistory) {
                messages = data.chatHistory;
                scrollToBottom();
            }
        };

        socket.on("chat_message", handleMsg);
        socket.on("init", handleInit);

        return () => {
            socket.off("chat_message", handleMsg);
            socket.off("init", handleInit);
        };
    });

    async function scrollToBottom() {
        await tick();
        if (scrollContainer) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
    }

    function toggleChat() {
        isOpen = !isOpen;
        if (isOpen) unreadCount = 0;
        scrollToBottom();
    }

    function sendMessage() {
        if (!newMessage.trim() || !socket) return;

        socket.emit("chat_message", {
            text: newMessage.trim(),
            username,
            color,
            isVIP,
        });

        newMessage = "";
    }

    function handleKeydown(e) {
        if (e.key === "Enter") sendMessage();
    }
</script>

<div class="chat-container" class:open={isOpen}>
    <!-- Toggle Button -->
    <button
        class="chat-toggle glass-heavy"
        onclick={toggleChat}
        aria-label="Toggle Chat"
    >
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
        >
            <path
                d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
            ></path>
        </svg>
        {#if unreadCount > 0 && !isOpen}
            <span class="badge">{unreadCount}</span>
        {/if}
    </button>

    <!-- Chat Box -->
    {#if isOpen}
        <div class="chat-box glass-heavy">
            <div class="chat-header">
                <span>LIVE CHAT</span>
                <button class="close-btn" onclick={toggleChat}>✕</button>
            </div>

            <div class="messages" bind:this={scrollContainer}>
                {#each messages as msg (msg.id)}
                    <div class="msg-wrap">
                        <span class="sender" style="color: {msg.color}"
                            >{msg.username || "Guest"}:</span
                        >
                        <span class="text">{msg.text}</span>
                    </div>
                {/each}
            </div>

            <div class="chat-input-wrap">
                <input
                    type="text"
                    placeholder="Say something..."
                    bind:value={newMessage}
                    onkeydown={handleKeydown}
                />
                <button onclick={sendMessage} aria-label="Send">
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="3"
                    >
                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"></path>
                    </svg>
                </button>
            </div>
        </div>
    {/if}
</div>

<style>
    .chat-container {
        position: absolute;
        bottom: 24px;
        left: 24px;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        pointer-events: none;
    }
    .chat-toggle {
        pointer-events: auto;
        width: 50px;
        height: 50px;
        border-radius: 25px;
        background: var(--glass-bg);
        border: 1px solid var(--glass-border);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--text-main);
        cursor: pointer;
        position: relative;
        box-shadow: 0 4px 12px var(--glass-shadow);
        transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .chat-toggle:hover {
        transform: scale(1.1);
        background: var(--glass-bg);
        opacity: 0.9;
    }
    .badge {
        position: absolute;
        top: -2px;
        right: -2px;
        background: #ef4444;
        color: white;
        font-size: 10px;
        font-weight: 900;
        padding: 2px 6px;
        border-radius: 10px;
        border: 2px solid var(--bg-app);
    }

    .chat-box {
        pointer-events: auto;
        position: absolute;
        bottom: 60px;
        left: 0;
        width: 320px;
        height: 400px;
        background: var(--glass-bg);
        backdrop-filter: blur(24px);
        border-radius: 20px;
        border: 1px solid var(--glass-border);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        box-shadow: 0 20px 40px var(--glass-shadow);
    }
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(10px) scale(0.95);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }

    .chat-header {
        padding: 12px 16px;
        background: var(--card-bg);
        border-bottom: 1px solid var(--glass-border);
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.7rem;
        font-weight: 900;
        color: var(--text-muted);
        letter-spacing: 0.1em;
    }
    .close-btn {
        background: none;
        border: none;
        color: #64748b;
        cursor: pointer;
        font-size: 14px;
    }

    .messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    .messages::-webkit-scrollbar {
        width: 4px;
    }
    .messages::-webkit-scrollbar-thumb {
        background: var(--glass-border);
        border-radius: 2px;
    }

    .msg-wrap {
        font-size: 0.85rem;
        line-height: 1.4;
        word-break: break-all;
        color: var(--text-main);
    }
    .sender {
        font-weight: 700;
        margin-right: 6px;
    }
    .text {
        color: var(--text-main);
        opacity: 0.9;
    }

    .chat-input-wrap {
        padding: 12px;
        background: var(--card-bg);
        display: flex;
        gap: 8px;
        border-top: 1px solid var(--glass-border);
    }
    .chat-input-wrap input {
        flex: 1;
        background: var(--bg-app);
        border: 1px solid var(--glass-border);
        border-radius: 12px;
        padding: 8px 12px;
        color: var(--text-main);
        font-family: inherit;
        font-size: 0.85rem;
    }
    .chat-input-wrap input:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    }
    .chat-input-wrap button {
        width: 38px;
        height: 38px;
        background: #2563eb;
        color: white;
        border: none;
        border-radius: 10px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
    }
    .chat-input-wrap button:hover {
        background: #3b82f6;
        transform: translateY(-1px);
    }

    @media (max-width: 900px) {
        .chat-container {
            bottom: 85px;
            left: 16px;
        }
        .chat-box {
            width: calc(100vw - 32px);
            height: 50vh;
        }
    }
</style>
