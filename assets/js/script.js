const themeSfx = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
const powerSfx = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
themeSfx.volume = 0.15;
powerSfx.volume = 0.2;

async function runSystem() {
    const fill = document.getElementById('batteryFill');
    const pctText = document.getElementById('pctText');
    const statText = document.getElementById('statText');
    const statusIcon = document.getElementById('statusIcon');
    const themeOrder = ['midnight', 'solar', 'cyber', 'sunset', 'forest'];

    const applyTheme = (t, playSound = true) => {
        if (document.documentElement.getAttribute('data-critical') === 'true') return;
        if (!themeOrder.includes(t)) return;

        if (playSound) {
            themeSfx.currentTime = 0;
            themeSfx.play().catch(() => { });
        }

        document.documentElement.setAttribute('data-theme', t);
        localStorage.setItem('user-theme', t);

        document.querySelectorAll('.theme-btn').forEach(btn => {
            const active = btn.dataset.t === t;
            btn.style.background = active ? 'var(--accent)' : 'var(--glass)';
            btn.style.color = active ? (t === 'solar' ? '#000' : '#fff') : 'inherit';
        });
    };

    // Click Listener
    document.getElementById('themeOptions').onclick = (e) => {
        const btn = e.target.closest('button');
        if (btn) applyTheme(btn.dataset.t);
    };

    // KEYBOARD SHORTCUTS (1-5)
    window.addEventListener('keydown', (e) => {
        // regex matches 'Digit1' through 'Digit5' AND 'Numpad1' through 'Numpad5'
        const match = e.code.match(/^(Digit|Numpad)([1-5])$/);
        if (match) {
            const index = parseInt(match[2]) - 1;
            applyTheme(themeOrder[index]);
        }
    });

    applyTheme(localStorage.getItem('user-theme') || 'midnight', false);

    try {
        const b = await navigator.getBattery();
        let wasCharging = b.charging;

        function updateState() {
            const l = Math.round(b.level * 100);
            pctText.innerText = l + '%';
            fill.style.width = l + '%';

            const isLow = l <= 20;
            document.documentElement.setAttribute('data-critical', isLow);

            if (b.charging) {
                if (!wasCharging) {
                    powerSfx.play().catch(() => { });
                    wasCharging = true;
                }
                fill.classList.add('charging-active');
                statusIcon.innerText = isLow ? "🚨" : "⚡️";
                statText.innerText = isLow ? "RECOVERY PROTOCOL: ACTIVE" : "ENERGY ABSORPTION: ON";
            } else {
                wasCharging = false;
                fill.classList.remove('charging-active');
                statusIcon.innerText = isLow ? "⚠️" : "🔋";
                statText.innerText = isLow ? "SYSTEM STARVATION: ALERT" : "ENERGY SYNC: OPTIMAL";
            }
        }

        let currentViewPct = 0;
        const targetPct = Math.round(b.level * 100);
        const riser = setInterval(() => {
            if (currentViewPct >= targetPct) {
                clearInterval(riser);
                updateState();
            } else {
                pctText.innerText = currentViewPct + '%';
                fill.style.width = currentViewPct + '%';
                currentViewPct++;
            }
        }, 15);

        b.onlevelchange = updateState;
        b.onchargingchange = updateState;
    } catch (e) {
        statText.innerText = "LINK FAILED";
        statusIcon.innerText = "❌";
    }
}
runSystem();