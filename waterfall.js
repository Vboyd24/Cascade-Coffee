/* ============================================
   CASCADE COFFEE - Realistic Waterfall → Nitro Brew
   Full canvas animation with water physics,
   mist, splash, and nitro cascade effect
   ============================================ */

(function () {
    const canvas = document.getElementById('waterfall-hero-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let W, H;
    let particles = [];
    let splashParticles = [];
    let mistParticles = [];
    let nitroBubbles = [];
    let rockDroplets = [];
    let frame = 0;

    // --- Configuration ---
    const config = {
        // Waterfall
        fallX: 0.5,          // center X ratio
        fallTopY: 0.05,      // top of falls
        fallWidth: 90,       // width of main fall
        rockLedges: [],      // generated on resize
        // Glass
        glassWidth: 140,
        glassHeight: 190,
        glassBottomY: 0.88,  // bottom of glass ratio
        // Colors
        waterLight: 'rgba(160, 210, 230, ',
        waterMid: 'rgba(100, 180, 210, ',
        waterDark: 'rgba(60, 140, 175, ',
        coffeeColor: 'rgba(30, 18, 10, ',
        foamColor: 'rgba(245, 235, 220, ',
        nitroBubble: 'rgba(200, 185, 165, ',
    };

    function resize() {
        const rect = canvas.parentElement.getBoundingClientRect();
        W = canvas.width = rect.width;
        H = canvas.height = rect.height;

        // Define rock ledges for waterfall to cascade over
        const cx = W * config.fallX;
        config.rockLedges = [
            { x: cx - 60, y: H * 0.22, w: 120, h: 18 },
            { x: cx - 45, y: H * 0.38, w: 95, h: 14 },
            { x: cx - 55, y: H * 0.52, w: 110, h: 16 },
        ];
    }

    // --- Particle Classes ---
    function WaterParticle(x, y, vx, vy, size, opacity, type) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.size = size || 2;
        this.opacity = opacity || 0.6;
        this.type = type || 'fall'; // 'fall', 'stream', 'rock'
        this.life = 1;
        this.gravity = 0.18 + Math.random() * 0.08;
    }

    function SplashParticle(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = -Math.random() * 4 - 1;
        this.size = Math.random() * 2.5 + 0.5;
        this.opacity = 0.5 + Math.random() * 0.3;
        this.life = 1;
        this.decay = 0.02 + Math.random() * 0.02;
        this.gravity = 0.12;
    }

    function MistParticle(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 1.5;
        this.vy = -Math.random() * 0.8 - 0.2;
        this.size = Math.random() * 30 + 15;
        this.opacity = Math.random() * 0.12;
        this.life = 1;
        this.decay = 0.003 + Math.random() * 0.004;
    }

    function NitroBubble(x, y, glassLeft, glassRight, glassTop, glassBottom) {
        this.x = x;
        this.y = y;
        this.startY = y;
        this.size = Math.random() * 1.8 + 0.3;
        this.opacity = Math.random() * 0.5 + 0.2;
        this.speed = Math.random() * 0.6 + 0.15;
        this.drift = (Math.random() - 0.5) * 0.3;
        this.life = 1;
        this.glassLeft = glassLeft;
        this.glassRight = glassRight;
        this.glassTop = glassTop;
        this.glassBottom = glassBottom;
        // Nitro cascade: bubbles move DOWN first, then UP (signature effect)
        this.phase = 'down';
        this.downDistance = Math.random() * 25 + 10;
        this.traveled = 0;
    }

    // --- Spawn Functions ---
    function spawnWaterfall() {
        const cx = W * config.fallX;
        const topY = H * config.fallTopY;

        // Main waterfall stream - dense cluster of particles
        for (let i = 0; i < 6; i++) {
            const spread = (Math.random() - 0.5) * config.fallWidth;
            const p = new WaterParticle(
                cx + spread,
                topY + Math.random() * 10,
                spread * 0.01,
                1 + Math.random() * 2,
                Math.random() * 3 + 1,
                0.3 + Math.random() * 0.5,
                'fall'
            );
            particles.push(p);
        }

        // Side streams (thinner cascades from rocks)
        if (Math.random() < 0.4) {
            config.rockLedges.forEach((ledge) => {
                const side = Math.random() < 0.5 ? ledge.x : ledge.x + ledge.w;
                const p = new WaterParticle(
                    side + (Math.random() - 0.5) * 10,
                    ledge.y + ledge.h,
                    (side < cx ? -1 : 1) * Math.random() * 1.5,
                    1 + Math.random(),
                    Math.random() * 2 + 0.5,
                    0.2 + Math.random() * 0.3,
                    'rock'
                );
                particles.push(p);
            });
        }
    }

    function spawnSplash(x, y) {
        for (let i = 0; i < 3; i++) {
            splashParticles.push(new SplashParticle(x, y));
        }
    }

    function spawnMist(x, y) {
        if (Math.random() < 0.15) {
            mistParticles.push(new MistParticle(x, y));
        }
    }

    function spawnNitroBubbles() {
        const cx = W * config.fallX;
        const glassBottom = H * config.glassBottomY;
        const glassTop = glassBottom - config.glassHeight;
        const glassLeft = cx - config.glassWidth / 2;
        const glassRight = cx + config.glassWidth / 2;
        const coffeeTop = glassTop + config.glassHeight * 0.15; // foam line

        if (Math.random() < 0.35) {
            const bx = glassLeft + 12 + Math.random() * (config.glassWidth - 24);
            const by = coffeeTop + Math.random() * (config.glassHeight * 0.3);
            nitroBubbles.push(new NitroBubble(bx, by, glassLeft, glassRight, coffeeTop, glassBottom));
        }
    }

    // --- Draw Functions ---
    function drawRocks() {
        const cx = W * config.fallX;

        // Cliff face behind waterfall (subtle)
        const cliffGrad = ctx.createLinearGradient(cx - 80, 0, cx + 80, 0);
        cliffGrad.addColorStop(0, 'rgba(30, 35, 30, 0.3)');
        cliffGrad.addColorStop(0.3, 'rgba(45, 50, 45, 0.5)');
        cliffGrad.addColorStop(0.7, 'rgba(40, 45, 40, 0.5)');
        cliffGrad.addColorStop(1, 'rgba(30, 35, 30, 0.3)');

        ctx.fillStyle = cliffGrad;
        ctx.beginPath();
        ctx.moveTo(cx - 80, H * 0.02);
        ctx.lineTo(cx + 80, H * 0.02);
        ctx.lineTo(cx + 90, H * 0.65);
        ctx.lineTo(cx - 90, H * 0.65);
        ctx.closePath();
        ctx.fill();

        // Rock ledges
        config.rockLedges.forEach((ledge, i) => {
            const grad = ctx.createLinearGradient(ledge.x, ledge.y, ledge.x, ledge.y + ledge.h);
            grad.addColorStop(0, `rgba(60, 65, 55, ${0.7 - i * 0.1})`);
            grad.addColorStop(1, `rgba(40, 45, 38, ${0.5 - i * 0.1})`);
            ctx.fillStyle = grad;

            ctx.beginPath();
            ctx.moveTo(ledge.x - 8, ledge.y + 4);
            ctx.quadraticCurveTo(ledge.x + ledge.w / 2, ledge.y - 3, ledge.x + ledge.w + 8, ledge.y + 4);
            ctx.lineTo(ledge.x + ledge.w + 5, ledge.y + ledge.h);
            ctx.lineTo(ledge.x - 5, ledge.y + ledge.h);
            ctx.closePath();
            ctx.fill();

            // Moss/texture highlights
            ctx.fillStyle = `rgba(70, 90, 60, ${0.15 - i * 0.03})`;
            ctx.fillRect(ledge.x + 5, ledge.y + 2, ledge.w * 0.3, 3);
            ctx.fillRect(ledge.x + ledge.w * 0.5, ledge.y + 1, ledge.w * 0.25, 2);
        });
    }

    function drawMainWaterStream() {
        const cx = W * config.fallX;
        const topY = H * config.fallTopY;
        const glassBottom = H * config.glassBottomY;
        const glassTop = glassBottom - config.glassHeight;

        // Main water column (semi-transparent layered streams)
        for (let layer = 0; layer < 3; layer++) {
            const offset = Math.sin(frame * 0.03 + layer) * 3;
            const widthVar = config.fallWidth * (0.4 + layer * 0.2);
            const alpha = 0.06 - layer * 0.015;

            const grad = ctx.createLinearGradient(cx, topY, cx, glassTop);
            grad.addColorStop(0, `rgba(140, 200, 220, ${alpha})`);
            grad.addColorStop(0.3, `rgba(120, 190, 215, ${alpha + 0.02})`);
            grad.addColorStop(0.7, `rgba(100, 170, 200, ${alpha + 0.01})`);
            grad.addColorStop(1, `rgba(80, 150, 185, ${alpha})`);

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(cx - widthVar / 2 + offset, topY);
            ctx.quadraticCurveTo(cx + offset * 0.5, (topY + glassTop) / 2, cx - widthVar / 3, glassTop);
            ctx.lineTo(cx + widthVar / 3, glassTop);
            ctx.quadraticCurveTo(cx - offset * 0.5, (topY + glassTop) / 2, cx + widthVar / 2 + offset, topY);
            ctx.closePath();
            ctx.fill();
        }

        // Bright center stream
        const centerGrad = ctx.createLinearGradient(cx, topY, cx, glassTop);
        centerGrad.addColorStop(0, 'rgba(180, 220, 235, 0.12)');
        centerGrad.addColorStop(0.5, 'rgba(160, 210, 230, 0.15)');
        centerGrad.addColorStop(1, 'rgba(130, 190, 215, 0.08)');

        ctx.fillStyle = centerGrad;
        const wobble = Math.sin(frame * 0.05) * 2;
        ctx.beginPath();
        ctx.moveTo(cx - 12 + wobble, topY);
        ctx.quadraticCurveTo(cx + wobble, (topY + glassTop) * 0.5, cx - 8, glassTop);
        ctx.lineTo(cx + 8, glassTop);
        ctx.quadraticCurveTo(cx - wobble, (topY + glassTop) * 0.5, cx + 12 + wobble, topY);
        ctx.closePath();
        ctx.fill();
    }

    function drawGlass() {
        const cx = W * config.fallX;
        const glassBottom = H * config.glassBottomY;
        const glassTop = glassBottom - config.glassHeight;
        const gw = config.glassWidth;
        const gh = config.glassHeight;
        const left = cx - gw / 2;
        const right = cx + gw / 2;

        // Glass shadow
        const shadowGrad = ctx.createRadialGradient(cx, glassBottom + 10, 10, cx, glassBottom + 10, gw * 0.8);
        shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
        shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = shadowGrad;
        ctx.beginPath();
        ctx.ellipse(cx, glassBottom + 10, gw * 0.7, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Glass body (tapered)
        const taperTop = 8; // how much narrower at top
        ctx.save();

        // Coffee liquid fill
        const coffeeTop = glassTop + gh * 0.12;
        const coffeeFillGrad = ctx.createLinearGradient(cx, coffeeTop, cx, glassBottom);
        coffeeFillGrad.addColorStop(0, 'rgba(45, 28, 15, 0.95)');
        coffeeFillGrad.addColorStop(0.3, 'rgba(35, 20, 10, 0.97)');
        coffeeFillGrad.addColorStop(0.7, 'rgba(25, 14, 8, 0.98)');
        coffeeFillGrad.addColorStop(1, 'rgba(20, 10, 5, 0.99)');

        ctx.fillStyle = coffeeFillGrad;
        ctx.beginPath();
        ctx.moveTo(left + taperTop + 4, coffeeTop);
        ctx.lineTo(left + 2, glassBottom - 8);
        ctx.quadraticCurveTo(left + 2, glassBottom, left + 10, glassBottom);
        ctx.lineTo(right - 10, glassBottom);
        ctx.quadraticCurveTo(right - 2, glassBottom, right - 2, glassBottom - 8);
        ctx.lineTo(right - taperTop - 4, coffeeTop);
        ctx.closePath();
        ctx.fill();

        // Nitro cascade effect inside coffee (the signature swirl)
        const cascadeTime = (frame * 0.02) % 1;
        for (let i = 0; i < 5; i++) {
            const cy = coffeeTop + gh * (0.15 + i * 0.15);
            const wave = Math.sin(frame * 0.04 + i * 1.5) * 15;
            const alpha = 0.03 + Math.sin(frame * 0.02 + i) * 0.015;

            ctx.fillStyle = `rgba(180, 160, 140, ${alpha})`;
            ctx.beginPath();
            ctx.ellipse(cx + wave, cy, gw * 0.3, 8, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Foam head
        const foamBottom = coffeeTop + 2;
        const foamTop = glassTop + gh * 0.04;
        const foamGrad = ctx.createLinearGradient(cx, foamTop, cx, foamBottom + 10);
        foamGrad.addColorStop(0, 'rgba(255, 250, 240, 0.95)');
        foamGrad.addColorStop(0.3, 'rgba(245, 235, 215, 0.92)');
        foamGrad.addColorStop(0.7, 'rgba(230, 215, 190, 0.88)');
        foamGrad.addColorStop(1, 'rgba(200, 180, 155, 0.7)');

        ctx.fillStyle = foamGrad;
        ctx.beginPath();
        ctx.moveTo(left + taperTop + 2, foamBottom);
        // Bubbly top edge
        const foamPoints = 12;
        for (let i = 0; i <= foamPoints; i++) {
            const px = left + taperTop + 2 + (gw - taperTop * 2 - 4) * (i / foamPoints);
            const py = foamTop + Math.sin(frame * 0.03 + i * 0.8) * 2 + Math.sin(i * 1.2) * 3;
            if (i === 0) ctx.lineTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.lineTo(right - taperTop - 2, foamBottom);
        ctx.closePath();
        ctx.fill();

        // Foam bubbles texture
        for (let i = 0; i < 20; i++) {
            const bx = left + taperTop + 8 + Math.random() * (gw - taperTop * 2 - 16);
            const by = foamTop + 2 + Math.random() * (foamBottom - foamTop - 2);
            const br = Math.random() * 4 + 1.5;
            ctx.beginPath();
            ctx.arc(bx, by, br, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 252, 245, ${0.15 + Math.random() * 0.2})`;
            ctx.fill();
            ctx.strokeStyle = `rgba(220, 200, 175, ${0.1 + Math.random() * 0.1})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
        }

        // Glass outline (transparent glass look)
        ctx.strokeStyle = 'rgba(180, 210, 225, 0.25)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(left + taperTop, glassTop);
        ctx.lineTo(left, glassBottom - 8);
        ctx.quadraticCurveTo(left, glassBottom, left + 10, glassBottom);
        ctx.lineTo(right - 10, glassBottom);
        ctx.quadraticCurveTo(right, glassBottom, right, glassBottom - 8);
        ctx.lineTo(right - taperTop, glassTop);
        ctx.stroke();

        // Glass rim
        ctx.strokeStyle = 'rgba(200, 220, 235, 0.35)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(cx, glassTop, gw / 2 - taperTop, 6, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Glass reflection/highlight
        ctx.fillStyle = 'rgba(200, 225, 240, 0.06)';
        ctx.beginPath();
        ctx.moveTo(left + taperTop + 8, glassTop + 10);
        ctx.quadraticCurveTo(left + 14, (glassTop + glassBottom) / 2, left + 10, glassBottom - 15);
        ctx.lineTo(left + 18, glassBottom - 15);
        ctx.quadraticCurveTo(left + 22, (glassTop + glassBottom) / 2, left + taperTop + 16, glassTop + 10);
        ctx.closePath();
        ctx.fill();

        ctx.restore();

        // Water pouring into glass - splash zone
        const pourX = cx + Math.sin(frame * 0.04) * 3;
        const splashGrad = ctx.createRadialGradient(pourX, glassTop - 5, 2, pourX, glassTop + 5, 25);
        splashGrad.addColorStop(0, 'rgba(160, 210, 230, 0.2)');
        splashGrad.addColorStop(0.5, 'rgba(140, 195, 220, 0.08)');
        splashGrad.addColorStop(1, 'rgba(120, 180, 210, 0)');
        ctx.fillStyle = splashGrad;
        ctx.beginPath();
        ctx.ellipse(pourX, glassTop, 20, 12, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawParticles() {
        // Water particles
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.vy += p.gravity;
            p.x += p.vx;
            p.y += p.vy;

            // Interaction with rock ledges
            const cx = W * config.fallX;
            const glassBottom = H * config.glassBottomY;
            const glassTop = glassBottom - config.glassHeight;

            let hitRock = false;
            config.rockLedges.forEach((ledge) => {
                if (p.y >= ledge.y && p.y <= ledge.y + ledge.h + 4 &&
                    p.x >= ledge.x - 5 && p.x <= ledge.x + ledge.w + 5) {
                    // Bounce off rock
                    p.vy = Math.random() * 2;
                    p.vx = (p.x < cx ? -1 : 1) * (Math.random() * 2 + 0.5);
                    p.y = ledge.y + ledge.h + 2;
                    hitRock = true;
                    if (Math.random() < 0.3) spawnSplash(p.x, ledge.y);
                }
            });

            // Hit glass area - create splash
            if (p.y >= glassTop - 5 && p.y <= glassTop + 5 &&
                p.x >= cx - config.glassWidth / 2 && p.x <= cx + config.glassWidth / 2) {
                spawnSplash(p.x, glassTop);
                spawnMist(p.x, glassTop - 15);
                particles.splice(i, 1);
                continue;
            }

            // Remove if off screen
            if (p.y > H + 20 || p.x < -20 || p.x > W + 20) {
                particles.splice(i, 1);
                continue;
            }

            // Draw
            const alpha = p.opacity * p.life;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);

            if (p.type === 'fall') {
                ctx.fillStyle = `rgba(140, 205, 225, ${alpha})`;
            } else {
                ctx.fillStyle = `rgba(120, 190, 215, ${alpha * 0.7})`;
            }
            ctx.fill();

            // Motion trail
            if (p.vy > 2) {
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x - p.vx * 0.5, p.y - p.vy * 1.5);
                ctx.strokeStyle = `rgba(140, 205, 225, ${alpha * 0.3})`;
                ctx.lineWidth = p.size * 0.6;
                ctx.stroke();
            }
        }

        // Splash particles
        for (let i = splashParticles.length - 1; i >= 0; i--) {
            const s = splashParticles[i];
            s.vy += s.gravity;
            s.x += s.vx;
            s.y += s.vy;
            s.life -= s.decay;

            if (s.life <= 0) {
                splashParticles.splice(i, 1);
                continue;
            }

            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(180, 220, 235, ${s.opacity * s.life})`;
            ctx.fill();
        }

        // Mist
        for (let i = mistParticles.length - 1; i >= 0; i--) {
            const m = mistParticles[i];
            m.x += m.vx;
            m.y += m.vy;
            m.life -= m.decay;

            if (m.life <= 0) {
                mistParticles.splice(i, 1);
                continue;
            }

            const mistGrad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.size);
            mistGrad.addColorStop(0, `rgba(160, 210, 230, ${m.opacity * m.life})`);
            mistGrad.addColorStop(1, `rgba(160, 210, 230, 0)`);
            ctx.fillStyle = mistGrad;
            ctx.beginPath();
            ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Nitro bubbles inside glass
        const cx = W * config.fallX;
        const glassBottom = H * config.glassBottomY;
        const glassTop = glassBottom - config.glassHeight;
        const coffeeTop = glassTop + config.glassHeight * 0.12;

        for (let i = nitroBubbles.length - 1; i >= 0; i--) {
            const b = nitroBubbles[i];

            if (b.phase === 'down') {
                b.y += b.speed;
                b.traveled += b.speed;
                if (b.traveled >= b.downDistance) {
                    b.phase = 'up';
                }
            } else {
                b.y -= b.speed * 0.4;
            }

            b.x += b.drift + Math.sin(frame * 0.05 + i) * 0.15;
            b.life -= 0.004;

            // Keep within glass bounds
            const taperRatio = (b.y - glassTop) / config.glassHeight;
            const glassWidthAtY = config.glassWidth / 2 - 8 * (1 - taperRatio) - 4;
            if (b.x < cx - glassWidthAtY) b.x = cx - glassWidthAtY;
            if (b.x > cx + glassWidthAtY) b.x = cx + glassWidthAtY;

            if (b.life <= 0 || b.y < coffeeTop || b.y > glassBottom - 5) {
                nitroBubbles.splice(i, 1);
                continue;
            }

            ctx.beginPath();
            ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(200, 185, 165, ${b.opacity * b.life})`;
            ctx.fill();
        }
    }

    function drawWaterSource() {
        // Top pool / water source
        const cx = W * config.fallX;
        const topY = H * config.fallTopY;

        // Rock formation at top
        const topRockGrad = ctx.createLinearGradient(cx - 100, topY - 20, cx + 100, topY + 10);
        topRockGrad.addColorStop(0, 'rgba(40, 50, 40, 0.4)');
        topRockGrad.addColorStop(0.5, 'rgba(55, 65, 55, 0.6)');
        topRockGrad.addColorStop(1, 'rgba(40, 50, 40, 0.4)');

        ctx.fillStyle = topRockGrad;
        ctx.beginPath();
        ctx.moveTo(cx - 120, topY - 5);
        ctx.quadraticCurveTo(cx - 60, topY - 25, cx, topY - 15);
        ctx.quadraticCurveTo(cx + 60, topY - 25, cx + 120, topY - 5);
        ctx.lineTo(cx + 110, topY + 8);
        ctx.lineTo(cx - 110, topY + 8);
        ctx.closePath();
        ctx.fill();

        // Water pooling at top edge
        const poolGrad = ctx.createRadialGradient(cx, topY, 5, cx, topY, 50);
        poolGrad.addColorStop(0, 'rgba(120, 190, 215, 0.15)');
        poolGrad.addColorStop(1, 'rgba(100, 170, 200, 0)');
        ctx.fillStyle = poolGrad;
        ctx.beginPath();
        ctx.ellipse(cx, topY, 50, 8, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawEnvironment() {
        // Subtle gradient glow around waterfall
        const cx = W * config.fallX;
        const glassBottom = H * config.glassBottomY;

        // Ambient blue glow
        const ambientGrad = ctx.createRadialGradient(cx, H * 0.4, 50, cx, H * 0.4, H * 0.5);
        ambientGrad.addColorStop(0, 'rgba(74, 144, 164, 0.04)');
        ambientGrad.addColorStop(0.5, 'rgba(74, 144, 164, 0.02)');
        ambientGrad.addColorStop(1, 'rgba(74, 144, 164, 0)');
        ctx.fillStyle = ambientGrad;
        ctx.fillRect(0, 0, W, H);

        // Light rays through water
        if (frame % 3 === 0) {
            ctx.save();
            ctx.globalAlpha = 0.015 + Math.sin(frame * 0.01) * 0.008;
            const rayGrad = ctx.createLinearGradient(cx - 30, H * 0.1, cx + 50, H * 0.7);
            rayGrad.addColorStop(0, 'rgba(200, 230, 240, 0.5)');
            rayGrad.addColorStop(1, 'rgba(200, 230, 240, 0)');
            ctx.fillStyle = rayGrad;
            ctx.beginPath();
            ctx.moveTo(cx - 5, H * 0.05);
            ctx.lineTo(cx + 40, H * 0.65);
            ctx.lineTo(cx + 20, H * 0.65);
            ctx.lineTo(cx - 20, H * 0.05);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }

        // Surface/base under glass
        const baseGrad = ctx.createLinearGradient(cx - 120, glassBottom, cx + 120, glassBottom + 30);
        baseGrad.addColorStop(0, 'rgba(40, 45, 40, 0)');
        baseGrad.addColorStop(0.3, 'rgba(50, 55, 48, 0.3)');
        baseGrad.addColorStop(0.7, 'rgba(50, 55, 48, 0.3)');
        baseGrad.addColorStop(1, 'rgba(40, 45, 40, 0)');
        ctx.fillStyle = baseGrad;
        ctx.fillRect(cx - 120, glassBottom, 240, 6);
    }

    // --- Label under glass ---
    function drawLabel() {
        const cx = W * config.fallX;
        const glassBottom = H * config.glassBottomY;

        ctx.font = '600 11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(126, 200, 227, 0.5)';
        ctx.letterSpacing = '3px';
        ctx.fillText('N I T R O   B R E W', cx, glassBottom + 35);
    }

    // --- Main Loop ---
    function animate() {
        ctx.clearRect(0, 0, W, H);
        frame++;

        // Draw scene layers
        drawEnvironment();
        drawWaterSource();
        drawRocks();
        drawMainWaterStream();
        drawGlass();
        drawParticles();
        drawLabel();

        // Spawn new particles
        spawnWaterfall();
        spawnNitroBubbles();

        // Cap particle counts for performance
        if (particles.length > 500) particles.splice(0, particles.length - 500);
        if (splashParticles.length > 100) splashParticles.splice(0, splashParticles.length - 100);
        if (mistParticles.length > 30) mistParticles.splice(0, mistParticles.length - 30);
        if (nitroBubbles.length > 80) nitroBubbles.splice(0, nitroBubbles.length - 80);

        requestAnimationFrame(animate);
    }

    // --- Init ---
    window.addEventListener('resize', resize);
    resize();
    animate();
})();
