/**
 * Talukdar Pathshala — Content Protection Module
 * Prevents casual inspection of video/PDF links via DevTools.
 */

// ── URL Obfuscation (encode/decode links to hide from DOM) ────────────
export function encodeUrl(url: string): string {
    return btoa(encodeURIComponent(url));
}

export function decodeUrl(encoded: string): string {
    try { return decodeURIComponent(atob(encoded)); }
    catch { return ''; }
}

// ── DevTools detection ─────────────────────────────────────────────────
let devToolsOpen = false;
const THRESHOLD = 160;

function detectDevTools() {
    const widthDiff = window.outerWidth - window.innerWidth > THRESHOLD;
    const heightDiff = window.outerHeight - window.innerHeight > THRESHOLD;
    if (widthDiff || heightDiff) {
        if (!devToolsOpen) {
            devToolsOpen = true;
            document.body.classList.add('devtools-open');
        }
    } else {
        if (devToolsOpen) {
            devToolsOpen = false;
            document.body.classList.remove('devtools-open');
        }
    }
}

// ── Block keyboard shortcuts for DevTools ─────────────────────────────
function blockDevToolsKeys(e: KeyboardEvent) {
    // F12
    if (e.key === 'F12') { e.preventDefault(); return false; }
    // Ctrl+Shift+I / Cmd+Option+I
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i')) { e.preventDefault(); return false; }
    // Ctrl+Shift+J / Cmd+Option+J (Console)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'J' || e.key === 'j')) { e.preventDefault(); return false; }
    // Ctrl+Shift+C (Element picker)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'C' || e.key === 'c')) { e.preventDefault(); return false; }
    // Ctrl+U (View source)
    if ((e.ctrlKey || e.metaKey) && (e.key === 'U' || e.key === 'u')) { e.preventDefault(); return false; }
    // Ctrl+S (Save page)
    if ((e.ctrlKey || e.metaKey) && (e.key === 'S' || e.key === 's')) { e.preventDefault(); return false; }
    // Ctrl+A (Select all)
    if ((e.ctrlKey || e.metaKey) && (e.key === 'A' || e.key === 'a')) { e.preventDefault(); return false; }
}

// ── Disable right-click context menu ─────────────────────────────────
function blockRightClick(e: MouseEvent) {
    e.preventDefault();
    return false;
}

// ── Disable text selection on non-input elements ──────────────────────
function blockSelection(e: Event) {
    const target = e.target as HTMLElement;
    const tag = target?.tagName?.toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;
    e.preventDefault();
}

// ── CSS for DevTools-open blurring ────────────────────────────────────
function injectSecurityStyles() {
    const style = document.createElement('style');
    style.id = 'tp-security-styles';
    style.textContent = `
        /* Blur video/PDF content when DevTools is open */
        body.devtools-open .video-card,
        body.devtools-open .player-overlay,
        body.devtools-open .video-grid {
            filter: blur(12px) !important;
            pointer-events: none !important;
            user-select: none !important;
        }
        body.devtools-open::after {
            content: '🔒 তালুকদার পাঠশালা\\A Content Protected';
            white-space: pre;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 2rem;
            font-weight: bold;
            color: white;
            background: rgba(0,0,0,0.85);
            padding: 2rem 3rem;
            border-radius: 16px;
            border: 2px solid rgba(239,68,68,0.5);
            z-index: 99999;
            text-align: center;
            pointer-events: none;
        }
        /* Prevent text selection everywhere */
        * {
            -webkit-user-select: none !important;
            -moz-user-select: none !important;
            -ms-user-select: none !important;
            user-select: none !important;
        }
        /* Allow selection inside inputs */
        input, textarea, [contenteditable] {
            -webkit-user-select: text !important;
            -moz-user-select: text !important;
            user-select: text !important;
        }
        /* Prevent drag */
        img, a, iframe {
            -webkit-user-drag: none !important;
            pointer-events: auto;
        }
    `;
    document.head.appendChild(style);
}

// ── Initialize all protections ─────────────────────────────────────────
export function initSecurity() {
    injectSecurityStyles();

    // DevTools detection (poll every second)
    setInterval(detectDevTools, 1000);

    // Keyboard shortcut blocking
    document.addEventListener('keydown', blockDevToolsKeys, true);

    // Right-click blocking
    document.addEventListener('contextmenu', blockRightClick);

    // Drag + text selection blocking
    document.addEventListener('dragstart', (e) => e.preventDefault());
    document.addEventListener('selectstart', blockSelection);

    // Console warning
    console.log(
        '%c⚠ তালুকদার পাঠশালা — Protected Content',
        'color: #ef4444; font-size: 18px; font-weight: bold; background: #0f172a; padding: 10px 20px; border-radius: 8px;'
    );
    console.log(
        '%cThis content is protected. Unauthorized use is prohibited.',
        'color: #94a3b8; font-size: 12px;'
    );
}
