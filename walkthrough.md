# MEGA CANVAS | Development Walkthrough

Welcome to the internal development guide for **Mega Canvas**. This document tracks the evolution of our real-time multiplayer doodle engine.

---

## 🚀 Core Technology Stack
- **Frontend**: Svelte 5 (Runes) + Vite
- **Backend**: Node.js + Express + Socket.IO
- **Communication**: Bidirectional Socket.IO for real-time synchronization
- **Graphics**: HTML5 Canvas API with transformation matrix logic

---

## 🎨 Design Philosophy: "Modern & Airy"
Mega Canvas follows a **Premium Light Theme** aesthetic:
- **Frosted Glass (Glassmorphism)**: All UI elements use semi-transparent white backgrounds with high-blur backdrops.
- **Airy Palette**: Transitioned from a heavy dark theme to a clean #F1F5F9 foundation with subtle shadows.
- **Micro-Animations**: Smooth GPU-accelerated transitions for modals, sidebars, and chat.
- **Mobile-First**: Fully responsive Smart Dock and side-drawers for touch devices.

---

## � Features & Capabilities

### 1. Advanced Drawing Engine
- **Infinite Resolution Logic**: Seamless zooming and panning using matrix transformations.
- **Pressure-Simulated Strokes**: Adjustable brush sizes with smooth line-joining and capping.
- **Surgical Nuke**: A nuke weapon that intelligently splits lines instead of just deleting them, maintaining part of the artwork.

### 2. Real-Time Collaborative Environment
- **Multi-User Sync**: Instantly see other users' cursors, strokes, and stickers.
- **Secure Live Chat**: Integrated real-time chat with Svelte-native XSS/Injection protection.
- **Online Presence**: Sidebar showing all active artists with VIP status indicators.

### 3. Progressive Visual Effects (VFX)
- **Subtle Feedback**: Polished ripples and floating EXP (pixel gain) numbers that provide juice without cluttering the view.
- **Magical Tools**: Includes a 'Magic Sparkler' that creates temporary fizzling particles.
- **Cinematic Events**: Screen-flash effects and globally synchronized milestone celebrations (+1,000px).

### 4. Monetization & Engagement (Mockup)
- **VIP Prestige**: Specialized tools like Rainbow Mode, Ghost Ink, and Mega Burst.
- **Media Assets**: Integrated system for users to 'stamp' emojis or upload image ads to the canvas.

---

## � Security & Performance
- **Injection Defense**: Server-side structure validation for chat and strokes.
- **VFX Optimization**: Strict particle pooling and lifecycle management to maintain 60 FPS on mobile.
- **Viewport Locking**: Prevented browser-level zooming to ensure drawing precision on mobile.

---

## 📍 Developer Notes
- **CORS**: Currently set to `*` for development ease. Must be restricted for production.
- **State Persistence**: Local storage is used for nicknames and VIP status.
- **Scale Management**: Transformation logic is handled in `Canvas.svelte` via the `transform` state.

---

*Updated: Dec 2025*
