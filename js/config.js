// config.js - Global Configuration and Utilities for EduMath TBS

// ======================= CONSTANTS =======================
const GOOGLE_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxs6EVw0A7GjsyKKlveL0STj1ZTa_iDS0XpliDMKfpuACN_ZmNFIpIKU23XKHQm_oSu/exec";
const SUPER_ADMIN_EMAIL = 'tailieutoantbs@gmail.com';
const CLOUD_NAME = "drbxhjhur"; 
const UPLOAD_PRESET = "TAILIEUTBS";

// ======================= FIREBASE INIT =======================
const firebaseConfig = { 
    apiKey: "AIzaSyAyL8ezUs1OuxTYBD6PATYk-WpBxOqMGj8", 
    authDomain: "cosodulieutbs.firebaseapp.com", 
    databaseURL: "https://cosodulieutbs-default-rtdb.asia-southeast1.firebasedatabase.app", 
    projectId: "cosodulieutbs", 
    storageBucket: "cosodulieutbs.firebasestorage.app", 
    messagingSenderId: "14840398924", 
    appId: "1:14840398924:web:eccc6942166181d6c8e0e9" 
};

// Initialize Firebase if not already initialized
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// ======================= UTILITIES =======================
/**
 * Show a toast notification
 * @param {string} msg - The message to display
 * @param {boolean} isError - True if it's an error message
 */
function showToast(msg, isError = false) {
    const toast = document.getElementById('toast-success') || document.getElementById('toast'); 
    if (toast) {
        // Remove previous color classes
        toast.classList.remove('bg-green-500', 'bg-red-500', 'bg-emerald-500', 'bg-rose-500', 'bg-main');
        
        // Add new color class
        const bgClass = isError ? 'bg-rose-500' : 'bg-emerald-500';
        toast.classList.add(bgClass);
        
        // Setup icon
        const iconClass = isError ? 'fa-circle-xmark' : 'fa-circle-check';
        
        // Render content with crisp font-sans and proper gap
        toast.innerHTML = `<i class="fa-solid ${iconClass} text-2xl md:text-3xl shrink-0"></i><span id="toast-msg" class="ml-2 md:ml-3 font-bold font-sans text-sm md:text-base leading-snug">${msg}</span>`;

        toast.classList.remove('-translate-y-32', 'opacity-0'); 
        if (toast.classList.contains('show') !== undefined) toast.classList.add('show');
        
        // Clear any existing timeout
        if (window.toastTimeout) {
            clearTimeout(window.toastTimeout);
        }
        
        window.toastTimeout = setTimeout(() => {
            toast.classList.add('-translate-y-32', 'opacity-0');
            toast.classList.remove('show');
        }, 3200);
    } else {
        console.log(isError ? "Error: " : "Success: ", msg);
    }
}

/**
 * Play a sound effect
 * @param {string} type - 'correct', 'wrong', or 'powerup'
 */
function playSound(type) { 
    try {
        const audio = document.getElementById('audio-' + type); 
        if (audio && audio.src && !audio.src.includes('mixkit.co')) { 
            audio.currentTime = 0; 
            let p = audio.play();
            if (p) {
                p.catch(() => playSynthSound(type));
                return;
            }
        }
    } catch(e) {}
    playSynthSound(type);
}

function playSynthSound(type) {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        if (!window._audioCtx) window._audioCtx = new AudioCtx();
        const ctx = window._audioCtx;
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
        const now = ctx.currentTime;
        if (type === 'correct') {
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(523.25, now);
            osc1.frequency.setValueAtTime(783.99, now + 0.1);
            gain1.gain.setValueAtTime(0.3, now);
            gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
            osc1.connect(gain1);
            gain1.connect(ctx.destination);
            osc1.start(now);
            osc1.stop(now + 0.4);
        } else if (type === 'wrong') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(180, now);
            osc.frequency.linearRampToValueAtTime(110, now + 0.25);
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.3);
        } else if (type === 'powerup') {
            [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(0.2, now + idx * 0.07);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.2);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + idx * 0.07);
                osc.stop(now + idx * 0.07 + 0.2);
            });
        }
    } catch(e) {
        console.warn("Synth audio error:", e);
    }
}

/**
 * Trigger MathJax and Highlight.js to re-render
 */
function triggerMathJax() { 
    if(window.MathJax) MathJax.typesetPromise(); 
    if(window.hljs) hljs.highlightAll(); 
}

/**
 * Trigger Confetti effect
 */
function triggerConfetti() { 
    if(window.confetti) {
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } }); 
    }
}

/**
 * Clean and normalize LaTeX / Math expressions in text before rendering.
 * Fixes unclosed dollar signs, dollar signs spanning across Vietnamese text, 
 * and auto-wraps raw LaTeX expressions (e.g. \mathbb{R}, \frac{...}) in \( ... \).
 */
function sanitizeMathText(text) {
    if (!text || typeof text !== 'string') return '';
    let s = text.trim();

    // Remove AI citation tags like [cite: 1], [cite: 1, 2], [1], [doc: 2]
    s = s.replace(/\[\s*(?:cite|doc)\s*:[^\]]*\]/gi, '');
    s = s.replace(/\[\s*\d+\s*\]/g, (m, offset, str) => {
        if (offset > 0 && /[a-zA-Z0-9_]/.test(str[offset - 1])) return '';
        return m;
    });

    // Fix double backslashes in math delimiters: \\( -> \(, \\) -> \), \\n -> \n
    s = s.replace(/\\\\([()\[\]$])/g, '\\$1');
    // ONLY replace literal \n with newline if NOT followed by a letter (prevents breaking \nearrow, \notin, \neq, \nu, etc.)
    s = s.replace(/\\n(?![a-zA-Z])/g, '\n');
    // Clean excessive backslashes (e.g. \\\\\\neq -> \neq)
    s = s.replace(/\\{3,}(?=[a-zA-Z])/g, '\\');

    // Protect SVG blocks from math sanitization
    let svgBlocks = [];
    s = s.replace(/<svg[\s\S]*?<\/svg>/gi, (match) => {
        svgBlocks.push(match);
        return `___SVG_BLOCK_${svgBlocks.length - 1}___`;
    });

    // Fix dollar signs spanning across Vietnamese text / paragraphs
    const vnWordsRegex = /(?:hoặc|và|đồng biến|nghịch biến|Cho|Ta có|Suy ra|Khi đó|Tập xác định|Bảng xét dấu|Bảng biến thiên|hàm số|mệnh đề|kết luận|thỏa mãn|giá trị|phương trình|bất phương trình|hệ phương trình|điều kiện|khoảng|đoạn|nửa khoảng|bằng|là|khi|thuộc|với|tại)/i;

    // Check $...$ blocks
    s = s.replace(/(?<!\\)\$([^$\n]+?)(?<!\\)\$/g, (match, inner) => {
        if (vnWordsRegex.test(inner) && !inner.includes('\\text')) {
            return inner; // strip outer dollars if spanning across VN text
        }
        return match;
    });

    // Strip remaining isolated single $ signs if odd count
    let dollarCount = (s.match(/(?<!\\)\$/g) || []).length;
    if (dollarCount % 2 !== 0) {
        s = s.replace(/(?<!\\)\$/g, '');
    }

    // Auto-wrap raw LaTeX commands that are NOT inside $...$ or \(...\) or \[...\]
    let mathBlocks = [];
    let hidden = s.replace(/(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|(?<!\\)\$[^$\n]+?(?<!\\)\$)/g, (match) => {
        mathBlocks.push(match);
        return `___MATH_SAFE_${mathBlocks.length - 1}___`;
    });

    // Auto-wrap TeX expressions
    hidden = hidden.replace(/((?:[a-zA-Z0-9_'^=+\-*/\s,.:();{}[\]\-]*?\\(?:mathbb|frac|sqrt|setminus|infty|nearrow|searrow|neq|to|le|ge|perp|parallel|Leftrightarrow|Rightarrow|rightarrow|Leftarrow|leftarrow|angle|triangle|in|notin|subset|cap|cup|int|lim|sum|alpha|beta|pi|theta|vec|overline|underline|text|mathrm|mathbf)[a-zA-Z0-9_'^=+\-*/\s,.:();{}[\]\-]*)|(?:\([^)]*\\infty[^)]*\))|(?:\([-+]?\d+\s*;\s*[-+]?\d+\)))/gi, (match) => {
        let m = match.trim();
        if (!m) return match;
        if (vnWordsRegex.test(m) && !m.includes('\\text')) return match;
        return `\\(${m}\\)`;
    });

    // Unhide math blocks
    hidden = hidden.replace(/___MATH_SAFE_(\d+)___/g, (match, idx) => {
        return mathBlocks[parseInt(idx, 10)];
    });

    // Unhide SVG blocks
    hidden = hidden.replace(/___SVG_BLOCK_(\d+)___/g, (match, idx) => {
        return svgBlocks[parseInt(idx, 10)];
    });

    return hidden;
}

/**
 * Remove prefixes like "Câu 12: ", "Bài 3. " from question text
 */
function stripQuestionPrefix(text) {
    if (!text) return "";
    return String(text).replace(/^(?:Câu|Bài)\s*\d+[\.\:]\s*/i, '');
}

/**
 * Remove prefixes like "A. ", "B) " from option text
 */
function stripOptionPrefix(text) {
    if (!text) return "";
    return String(text).replace(/^[A-D][\.\:\)]\s*/i, '');
}

/**
 * Render Markdown safely without corrupting LaTeX math syntax.
 * @param {string} text - Raw Markdown + LaTeX text
 * @param {boolean} isInline - True for inline rendering (no wrapper <p> tags)
 * @returns {string} Safe HTML with intact MathJax delimiters
 */
function parseMarkdownSafe(text, isInline = false) {
    if (!text || typeof text !== 'string') return '';

    let cleaned = sanitizeMathText(text);

    // Protect all SVG blocks and math delimiters before passing to marked
    let mathBlocks = [];
    let placeholderText = cleaned.replace(/(<svg[\s\S]*?<\/svg>|\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|(?<!\\)\$[^$\n]+?(?<!\\)\$)/gi, (match) => {
        mathBlocks.push(match);
        return `@@@MATH_BLOCK_${mathBlocks.length - 1}@@@`;
    });

    let html = placeholderText;
    if (typeof marked !== 'undefined') {
        if (isInline && marked.parseInline) {
            html = marked.parseInline(placeholderText);
        } else if (marked.parse) {
            html = marked.parse(placeholderText, { breaks: true });
        }
    }

    // Restore protected math blocks
    html = html.replace(/@@@MATH_BLOCK_(\d+)@@@/g, (match, idx) => {
        return mathBlocks[parseInt(idx, 10)];
    });

    return html;
}

/**
 * Format mathematical explanation scientifically with clear line breaks, spacing, and structure.
 * @param {string} text - Raw explanation text
 * @returns {string} HTML string rendered from formatted Markdown
 */
function formatExplanation(text) {
    if (!text || typeof text !== 'string') return '';

    let formatted = sanitizeMathText(text);

    // 2. If explanation is a single block without double newlines, insert smart line breaks
    if (!formatted.includes('\n\n')) {
        // Break before question parts: Ý a), Ý b), a), b), c), d), Mệnh đề a...
        formatted = formatted.replace(/([.;?!]|\b)\s*([+*•]|\bÝ\s*[a-d1-4][):.]|\bMệnh đề\s*[a-d1-4][):.]|\([a-d]\)|^[a-d]\))/gi, '\n\n$2');

        // Break before logical steps or transitions when preceded by punctuation (.;?!), or when starting key phrases
        formatted = formatted.replace(/([.;?!])\s*(Ta có|Tại|Thay|Vận tốc|Gia tốc|Quãng đường|Khi đó|Do đó|Suy ra|Bảng biến thiên|Xét hàm|Tập xác định|Điều kiện|Kết luận|Lời giải|Phương trình|Hệ phương trình|Bất phương trình)\b/g, '$1\n\n$2');
        
        // Break before "Xét ý a", "Xét ý b", "Ý a", "Ý b"
        formatted = formatted.replace(/([.;?!])\s*(Xét\s+ý\s+[a-d])/gi, '$1\n\n$2');
    }

    // 3. Ensure single newlines become double newlines for Marked paragraph separation
    let lines = formatted.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    let mdText = lines.join('\n\n');

    return parseMarkdownSafe(mdText, false);
}

/**
 * Safely parse date strings in Vietnamese format (dd/MM/yyyy HH:mm:ss or dd/MM/yyyy) or ISO formats
 * @param {string|number|Date} str 
 * @returns {Date|null}
 */
function parseVietnameseDateTime(str) {
    if (!str) return null;
    if (str instanceof Date) return isNaN(str.getTime()) ? null : str;
    if (typeof str === 'number') {
        let d = new Date(str);
        return isNaN(d.getTime()) ? null : d;
    }
    let s = String(str).trim();
    if (!s) return null;

    // Check if ISO format or standard YYYY-MM-DD
    if (s.includes('T') || (s.includes('-') && s.indexOf('-') === 4)) {
        let d = new Date(s.replace(' ', 'T'));
        if (!isNaN(d.getTime())) return d;
        let d2 = new Date(s);
        if (!isNaN(d2.getTime())) return d2;
    }

    // Handle dd/MM/yyyy or MM/dd/yyyy with optional time
    let clean = s.replace(',', ' ').replace(/\s+/g, ' ');
    let parts = clean.split(' ');
    let datePart = parts[0];
    let timePart = parts[1] || '00:00:00';

    let timeSub = timePart.split(':');
    let hours = parseInt(timeSub[0] || '0', 10);
    let minutes = parseInt(timeSub[1] || '0', 10);
    let seconds = parseInt(timeSub[2] || '0', 10);

    let dateSub = datePart.split('/');
    if (dateSub.length === 3) {
        let p1 = parseInt(dateSub[0], 10);
        let p2 = parseInt(dateSub[1], 10);
        let year = parseInt(dateSub[2], 10);
        if (year < 100) year += 2000;

        let day = p1;
        let month = p2 - 1;
        if (p2 > 12 && p1 <= 12) {
            day = p2;
            month = p1 - 1;
        }

        let d = new Date(year, month, day, hours, minutes, seconds);
        if (!isNaN(d.getTime())) return d;
    } else {
        let dashSub = datePart.split('-');
        if (dashSub.length === 3) {
            if (dashSub[0].length === 4) {
                let d = new Date(parseInt(dashSub[0], 10), parseInt(dashSub[1], 10) - 1, parseInt(dashSub[2], 10), hours, minutes, seconds);
                if (!isNaN(d.getTime())) return d;
            } else {
                let d = new Date(parseInt(dashSub[2], 10), parseInt(dashSub[1], 10) - 1, parseInt(dashSub[0], 10), hours, minutes, seconds);
                if (!isNaN(d.getTime())) return d;
            }
        }
    }

    let fallback = new Date(s);
    return isNaN(fallback.getTime()) ? null : fallback;
}

