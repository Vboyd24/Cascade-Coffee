/* ============================================
   CASCADE COFFEE — Cinematic Hero Animation
   5-10s looping sequence @ 60fps

   PHASES:
   0.0s–2.5s  Natural waterfall (golden hour, mist, foliage)
   2.5s–5.0s  Transformation (water → coffee shimmer)
   5.0s–7.5s  Nitro cascade (bubbles, foam head forming)
   7.5s–9.0s  Branding reveal
   9.0s–10.0s Fade/loop reset
   ============================================ */

(function () {
    const canvas = document.getElementById('cascade-hero-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let W, H, dpr;
    let frame = 0;
    let time = 0;
    const LOOP_DURATION = 10; // seconds
    const FPS = 60;
    const DT = 1 / FPS;

    // Particle pools
    let waterfallDrops = [];
    let mistParticles = [];
    let nitroBubbles = [];
    let lightFlares = [];
    let foliageLeaves = [];
    let splashDrops = [];
    let transitionParticles = [];

    // --- COLORS ---
    const C = {
        waterLight: [160, 215, 235],
        waterMid: [100, 180, 210],
        waterWhite: [230, 240, 245],
        coffeeLight: [120, 70, 30],
        coffeeMid: [60, 32, 12],
        coffeeDark: [30, 16, 6],
        foam: [245, 238, 220],
        foamEdge: [220, 205, 180],
        nitroGold: [200, 175, 130],
        rockDark: [55, 60, 48],
        rockMid: [80, 85, 68],
        rockLight: [105, 110, 90],
        mossDark: [40, 80, 35],
        mossLight: [70, 130, 55],
        foliageDark: [20, 70, 28],
        foliageMid: [40, 115, 45],
        foliageLight: [65, 160, 60],
        goldenLight: [255, 220, 150],
        mistWhite: [220, 235, 240],
        brandCream: [240, 230, 208],
    };

    function lerpColor(c1, c2, t) {
        return [
            c1[0] + (c2[0] - c1[0]) * t,
            c1[1] + (c2[1] - c1[1]) * t,
            c1[2] + (c2[2] - c1[2]) * t,
        ];
    }

    function rgba(c, a) {
        return `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
    }

    // --- EASING ---
    function easeInOut(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }
    function easeOut(t) { return 1 - (1 - t) * (1 - t); }
    function easeIn(t) { return t * t; }

    // Phase progress (0-1) for each animation phase
    function phaseProgress(phaseStart, phaseDuration) {
        let t = time % LOOP_DURATION;
        if (t < phaseStart) return 0;
        if (t > phaseStart + phaseDuration) return 1;
        return (t - phaseStart) / phaseDuration;
    }

    // --- RESIZE ---
    function resize() {
        const parent = canvas.parentElement;
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = parent.offsetWidth;
        H = parent.offsetHeight;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // =============================================
    //  SCENE DRAWING FUNCTIONS
    // =============================================

    // --- SKY / BACKGROUND ---
    function drawBackground() {
        // Jungle gradient - brighter
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, 'rgb(18, 40, 22)');
        grad.addColorStop(0.3, 'rgb(22, 52, 28)');
        grad.addColorStop(0.6, 'rgb(25, 55, 30)');
        grad.addColorStop(1, 'rgb(15, 30, 18)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
    }

    // --- GOLDEN HOUR LIGHT RAYS ---
    function drawLightRays() {
        const t = time % LOOP_DURATION;
        // Light rays are strongest in phase 1, dim during transition
        let intensity = 1;
        if (t > 2.5 && t < 5) intensity = 1 - (t - 2.5) / 2.5 * 0.5;
        if (t > 7.5) intensity = 0.5 + (t - 7.5) / 2.5 * 0.5;

        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        // Multiple light shafts from upper right
        const rays = [
            { x: W * 0.75, angle: -25, width: W * 0.15, opacity: 0.07 },
            { x: W * 0.65, angle: -20, width: W * 0.1, opacity: 0.05 },
            { x: W * 0.85, angle: -30, width: W * 0.12, opacity: 0.04 },
            { x: W * 0.55, angle: -15, width: W * 0.08, opacity: 0.035 },
        ];

        rays.forEach((ray, i) => {
            const flicker = 1 + Math.sin(time * 0.5 + i * 1.7) * 0.15;
            const alpha = ray.opacity * intensity * flicker;

            ctx.save();
            ctx.translate(ray.x, 0);
            ctx.rotate((ray.angle * Math.PI) / 180);

            const g = ctx.createLinearGradient(0, 0, 0, H * 1.3);
            g.addColorStop(0, rgba(C.goldenLight, alpha * 1.5));
            g.addColorStop(0.3, rgba(C.goldenLight, alpha));
            g.addColorStop(0.7, rgba(C.goldenLight, alpha * 0.3));
            g.addColorStop(1, rgba(C.goldenLight, 0));

            ctx.fillStyle = g;
            ctx.fillRect(-ray.width / 2, -H * 0.1, ray.width, H * 1.5);
            ctx.restore();
        });

        ctx.restore();
    }

    // --- VOLCANIC ROCK CLIFF ---
    function drawCliffFace() {
        const cx = W * 0.48;
        const cliffW = W * 0.28;
        const t = time % LOOP_DURATION;

        // Main cliff face
        ctx.save();

        // Left cliff wall
        const leftGrad = ctx.createLinearGradient(cx - cliffW, 0, cx - cliffW * 0.3, 0);
        leftGrad.addColorStop(0, rgba(C.rockDark, 1));
        leftGrad.addColorStop(0.5, rgba(C.rockMid, 0.95));
        leftGrad.addColorStop(1, rgba(C.rockLight, 0.5));

        ctx.fillStyle = leftGrad;
        ctx.beginPath();
        ctx.moveTo(cx - cliffW * 1.2, 0);
        ctx.lineTo(cx - cliffW * 0.25, 0);
        ctx.quadraticCurveTo(cx - cliffW * 0.2, H * 0.3, cx - cliffW * 0.15, H * 0.65);
        ctx.lineTo(cx - cliffW * 1.2, H * 0.7);
        ctx.closePath();
        ctx.fill();

        // Right cliff wall
        const rightGrad = ctx.createLinearGradient(cx + cliffW * 0.3, 0, cx + cliffW, 0);
        rightGrad.addColorStop(0, rgba(C.rockLight, 0.5));
        rightGrad.addColorStop(0.5, rgba(C.rockMid, 0.95));
        rightGrad.addColorStop(1, rgba(C.rockDark, 1));

        ctx.fillStyle = rightGrad;
        ctx.beginPath();
        ctx.moveTo(cx + cliffW * 0.25, 0);
        ctx.lineTo(cx + cliffW * 1.2, 0);
        ctx.lineTo(cx + cliffW * 1.2, H * 0.7);
        ctx.quadraticCurveTo(cx + cliffW * 0.2, H * 0.5, cx + cliffW * 0.15, H * 0.6);
        ctx.closePath();
        ctx.fill();

        // Rock ledge/overhang at top
        ctx.fillStyle = rgba(C.rockDark, 0.9);
        ctx.beginPath();
        ctx.moveTo(cx - cliffW * 0.6, H * 0.04);
        ctx.quadraticCurveTo(cx, H * 0.02, cx + cliffW * 0.6, H * 0.04);
        ctx.lineTo(cx + cliffW * 0.5, H * 0.08);
        ctx.quadraticCurveTo(cx, H * 0.1, cx - cliffW * 0.5, H * 0.08);
        ctx.closePath();
        ctx.fill();

        // Moss on rocks
        const mossPatches = [
            { x: cx - cliffW * 0.9, y: H * 0.15, w: 60, h: 80 },
            { x: cx - cliffW * 0.7, y: H * 0.35, w: 45, h: 60 },
            { x: cx + cliffW * 0.6, y: H * 0.2, w: 55, h: 70 },
            { x: cx + cliffW * 0.8, y: H * 0.4, w: 40, h: 55 },
            { x: cx - cliffW * 0.4, y: H * 0.05, w: 30, h: 40 },
            { x: cx + cliffW * 0.35, y: H * 0.06, w: 35, h: 35 },
        ];

        mossPatches.forEach((patch, i) => {
            const mossGrad = ctx.createRadialGradient(
                patch.x, patch.y, 0,
                patch.x, patch.y, Math.max(patch.w, patch.h)
            );
            const mossColor = i % 2 === 0 ? C.mossDark : C.mossLight;
            mossGrad.addColorStop(0, rgba(mossColor, 0.6));
            mossGrad.addColorStop(0.5, rgba(mossColor, 0.3));
            mossGrad.addColorStop(1, rgba(mossColor, 0));
            ctx.fillStyle = mossGrad;
            ctx.fillRect(patch.x - patch.w, patch.y - patch.h / 2, patch.w * 2, patch.h);
        });

        // Rock texture details (cracks, lines)
        ctx.strokeStyle = rgba(C.rockDark, 0.15);
        ctx.lineWidth = 1;
        for (let i = 0; i < 8; i++) {
            const sx = cx + (Math.random() - 0.5) * cliffW * 2;
            const sy = Math.random() * H * 0.6;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx + (Math.random() - 0.5) * 30, sy + 20 + Math.random() * 40);
            ctx.stroke();
        }

        ctx.restore();
    }

    // --- FOLIAGE FRAME (tropical leaves, ferns) ---
    function drawFoliage() {
        ctx.save();

        // Left foliage cluster
        drawFoliageCluster(W * 0.02, H * 0.1, -0.1, 1);
        drawFoliageCluster(W * -0.02, H * 0.35, 0.05, 0.8);
        drawFoliageCluster(W * 0.05, H * 0.6, -0.15, 0.9);

        // Right foliage cluster
        drawFoliageCluster(W * 0.88, H * 0.05, 0.2, 1);
        drawFoliageCluster(W * 0.92, H * 0.3, 0.1, 0.85);
        drawFoliageCluster(W * 0.85, H * 0.55, 0.25, 0.75);

        // Top canopy
        drawCanopy();

        // Bottom foliage (ferns)
        drawBottomFoliage();

        ctx.restore();
    }

    function drawFoliageCluster(x, y, rotation, scale) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        ctx.scale(scale, scale);

        const sway = Math.sin(time * 0.8) * 0.02;
        ctx.rotate(sway);

        // Large tropical leaf
        for (let l = 0; l < 3; l++) {
            const leafAngle = (l - 1) * 0.4;
            const leafLen = 120 + l * 30;
            ctx.save();
            ctx.rotate(leafAngle);

            const leafColor = l === 1 ? C.foliageMid : (l === 0 ? C.foliageDark : C.foliageLight);

            ctx.fillStyle = rgba(leafColor, 0.85);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(leafLen * 0.3, -leafLen * 0.15, leafLen, -leafLen * 0.05);
            ctx.quadraticCurveTo(leafLen * 0.3, leafLen * 0.15, 0, 0);
            ctx.fill();

            // Leaf vein
            ctx.strokeStyle = rgba(C.foliageDark, 0.3);
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(5, 0);
            ctx.lineTo(leafLen * 0.9, -leafLen * 0.02);
            ctx.stroke();

            ctx.restore();
        }
        ctx.restore();
    }

    function drawCanopy() {
        // Top of frame - overhanging canopy leaves
        const canopyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.15);
        canopyGrad.addColorStop(0, rgba(C.foliageDark, 0.9));
        canopyGrad.addColorStop(0.5, rgba(C.foliageDark, 0.4));
        canopyGrad.addColorStop(1, rgba(C.foliageDark, 0));
        ctx.fillStyle = canopyGrad;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(W, 0);
        ctx.lineTo(W, H * 0.06);
        // Irregular canopy edge
        for (let x = W; x >= 0; x -= 20) {
            const depth = Math.sin(x * 0.02) * H * 0.03 + Math.sin(x * 0.05) * H * 0.02;
            ctx.lineTo(x, H * 0.04 + depth);
        }
        ctx.closePath();
        ctx.fill();

        // Hanging vines
        ctx.strokeStyle = rgba(C.foliageDark, 0.4);
        ctx.lineWidth = 2;
        [W * 0.1, W * 0.25, W * 0.78, W * 0.93].forEach((vx, i) => {
            const vineLen = 40 + i * 15;
            const sway = Math.sin(time * 0.6 + i * 2) * 8;
            ctx.beginPath();
            ctx.moveTo(vx, 0);
            ctx.quadraticCurveTo(vx + sway, vineLen / 2, vx + sway * 0.5, vineLen);
            ctx.stroke();
        });
    }

    function drawBottomFoliage() {
        // Ferns and ground cover at bottom
        const groundY = H * 0.85;

        // Ground gradient
        const groundGrad = ctx.createLinearGradient(0, groundY, 0, H);
        groundGrad.addColorStop(0, rgba(C.foliageDark, 0));
        groundGrad.addColorStop(0.3, rgba(C.foliageDark, 0.5));
        groundGrad.addColorStop(1, rgba(C.foliageDark, 0.9));
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, groundY, W, H - groundY);

        // Fern fronds
        const ferns = [
            { x: W * 0.05, y: H * 0.92, scale: 0.8, flip: false },
            { x: W * 0.15, y: H * 0.88, scale: 1, flip: false },
            { x: W * 0.82, y: H * 0.9, scale: 0.9, flip: true },
            { x: W * 0.94, y: H * 0.87, scale: 1.1, flip: true },
        ];

        ferns.forEach((fern, i) => {
            ctx.save();
            ctx.translate(fern.x, fern.y);
            if (fern.flip) ctx.scale(-1, 1);
            ctx.scale(fern.scale, fern.scale);
            const sway = Math.sin(time * 0.7 + i * 1.5) * 0.03;
            ctx.rotate(sway);

            // Fern stalk
            ctx.strokeStyle = rgba(C.foliageMid, 0.7);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(40, -30, 80, -50);
            ctx.stroke();

            // Fern leaflets
            for (let j = 0; j < 8; j++) {
                const t = j / 8;
                const px = 10 + t * 70;
                const py = -t * 50 + t * t * 10;
                const leafSize = 15 - j * 1;

                ctx.fillStyle = rgba(j < 4 ? C.foliageMid : C.foliageLight, 0.6);
                ctx.beginPath();
                ctx.moveTo(px, py);
                ctx.quadraticCurveTo(px + leafSize * 0.5, py - leafSize, px + leafSize, py - leafSize * 0.3);
                ctx.quadraticCurveTo(px + leafSize * 0.5, py + 2, px, py);
                ctx.fill();
            }

            ctx.restore();
        });

        // Rocky ground elements at bottom center
        const rockBaseGrad = ctx.createRadialGradient(W * 0.5, H * 0.92, 20, W * 0.5, H * 0.95, W * 0.3);
        rockBaseGrad.addColorStop(0, rgba(C.rockMid, 0.5));
        rockBaseGrad.addColorStop(0.5, rgba(C.rockDark, 0.4));
        rockBaseGrad.addColorStop(1, rgba(C.rockDark, 0));
        ctx.fillStyle = rockBaseGrad;
        ctx.beginPath();
        ctx.ellipse(W * 0.5, H * 0.93, W * 0.25, H * 0.06, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    // --- POOL AT BASE ---
    function drawPool() {
        const t = time % LOOP_DURATION;
        const transformT = Math.max(0, Math.min(1, (t - 2.5) / 2.5));
        const cx = W * 0.48;
        const poolY = H * 0.78;

        // Pool water color transitions from water to coffee
        const poolColor = lerpColor(C.waterMid, C.coffeeDark, easeInOut(transformT));

        const poolGrad = ctx.createRadialGradient(cx, poolY, 10, cx, poolY + 20, W * 0.22);
        poolGrad.addColorStop(0, rgba(lerpColor(C.waterWhite, C.foam, easeInOut(transformT)), 0.3));
        poolGrad.addColorStop(0.4, rgba(poolColor, 0.5));
        poolGrad.addColorStop(1, rgba(poolColor, 0));

        ctx.fillStyle = poolGrad;
        ctx.beginPath();
        ctx.ellipse(cx, poolY + 15, W * 0.2, H * 0.07, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ripple rings
        for (let r = 0; r < 3; r++) {
            const ripplePhase = (time * 0.4 + r * 0.33) % 1;
            const rippleSize = 20 + ripplePhase * 80;
            const rippleAlpha = (1 - ripplePhase) * 0.12;
            ctx.strokeStyle = rgba(lerpColor(C.waterLight, C.foamEdge, transformT), rippleAlpha);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.ellipse(cx, poolY + 10, rippleSize, rippleSize * 0.3, 0, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    // =============================================
    //  WATERFALL / COFFEE TRANSFORMATION
    // =============================================

    function drawWaterfallStream() {
        const t = time % LOOP_DURATION;
        const transformT = Math.max(0, Math.min(1, (t - 2.5) / 2.5)); // 0-1 during phase 2
        const cx = W * 0.48;
        const topY = H * 0.08;
        const bottomY = H * 0.78;
        const streamWidth = W * 0.09;

        // --- MAIN STREAM ---
        // Color shifts from water to coffee during transformation
        const streamColorTop = lerpColor(C.waterWhite, C.coffeeLight, easeInOut(transformT));
        const streamColorMid = lerpColor(C.waterMid, C.coffeeMid, easeInOut(transformT));
        const streamColorBot = lerpColor(C.waterLight, C.coffeeDark, easeInOut(transformT));

        // Multiple stream layers for depth
        for (let layer = 0; layer < 4; layer++) {
            const wobble = Math.sin(time * 2.5 + layer * 1.2) * (3 + layer * 1.5);
            const layerWidth = streamWidth * (0.5 + layer * 0.18);
            const layerAlpha = 0.35 - layer * 0.05;

            const streamGrad = ctx.createLinearGradient(cx, topY, cx, bottomY);
            streamGrad.addColorStop(0, rgba(streamColorTop, layerAlpha + 0.1));
            streamGrad.addColorStop(0.2, rgba(streamColorTop, layerAlpha + 0.15));
            streamGrad.addColorStop(0.5, rgba(streamColorMid, layerAlpha));
            streamGrad.addColorStop(0.8, rgba(streamColorBot, layerAlpha + 0.05));
            streamGrad.addColorStop(1, rgba(streamColorBot, layerAlpha * 0.5));

            ctx.fillStyle = streamGrad;
            ctx.beginPath();
            ctx.moveTo(cx - layerWidth / 2 + wobble, topY);

            // Curved stream with turbulence
            const steps = 20;
            for (let i = 0; i <= steps; i++) {
                const py = topY + (bottomY - topY) * (i / steps);
                const turbulence = Math.sin(py * 0.02 + time * 3 + layer) * 4 +
                    Math.sin(py * 0.04 + time * 1.5) * 2;
                // Stream widens slightly as it falls
                const widthAtY = layerWidth / 2 * (0.8 + (i / steps) * 0.3);
                ctx.lineTo(cx - widthAtY + wobble + turbulence, py);
            }

            for (let i = steps; i >= 0; i--) {
                const py = topY + (bottomY - topY) * (i / steps);
                const turbulence = Math.sin(py * 0.02 + time * 3 + layer + 1) * 4 +
                    Math.sin(py * 0.04 + time * 1.5 + 1) * 2;
                const widthAtY = layerWidth / 2 * (0.8 + (i / steps) * 0.3);
                ctx.lineTo(cx + widthAtY + wobble + turbulence, py);
            }

            ctx.closePath();
            ctx.fill();
        }

        // Bright center highlight
        const highlightGrad = ctx.createLinearGradient(cx, topY, cx, bottomY);
        const hlColor = lerpColor([255, 255, 255], C.foam, transformT);
        highlightGrad.addColorStop(0, rgba(hlColor, 0.3));
        highlightGrad.addColorStop(0.3, rgba(hlColor, 0.2));
        highlightGrad.addColorStop(0.7, rgba(hlColor, 0.1));
        highlightGrad.addColorStop(1, rgba(hlColor, 0));

        ctx.fillStyle = highlightGrad;
        const hlWobble = Math.sin(time * 2) * 2;
        ctx.beginPath();
        ctx.moveTo(cx - 4 + hlWobble, topY);
        ctx.lineTo(cx - 3, bottomY * 0.7);
        ctx.lineTo(cx + 3, bottomY * 0.7);
        ctx.lineTo(cx + 4 + hlWobble, topY);
        ctx.closePath();
        ctx.fill();

        // Transformation shimmer effect - golden wave sweeping down
        if (transformT > 0 && transformT < 1) {
            const shimmerY = topY + (bottomY - topY) * easeInOut(transformT);
            const shimmerSize = streamWidth * 2;
            const pulse = Math.abs(Math.sin(time * 4));

            // Main shimmer band
            const shimmerGrad = ctx.createRadialGradient(cx, shimmerY, 0, cx, shimmerY, shimmerSize);
            shimmerGrad.addColorStop(0, rgba(C.nitroGold, 0.35 * pulse));
            shimmerGrad.addColorStop(0.3, rgba(C.goldenLight, 0.15 * pulse));
            shimmerGrad.addColorStop(0.7, rgba(C.nitroGold, 0.05));
            shimmerGrad.addColorStop(1, rgba(C.nitroGold, 0));
            ctx.fillStyle = shimmerGrad;
            ctx.fillRect(cx - shimmerSize, shimmerY - 60, shimmerSize * 2, 120);

            // Horizontal shimmer line
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            ctx.strokeStyle = rgba(C.goldenLight, 0.2 * pulse);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx - streamWidth * 1.2, shimmerY);
            ctx.lineTo(cx + streamWidth * 1.2, shimmerY);
            ctx.stroke();
            ctx.restore();
        }
    }

    // --- WATERFALL DROPLETS ---
    function spawnWaterfallDrops() {
        const t = time % LOOP_DURATION;
        const transformT = Math.max(0, Math.min(1, (t - 2.5) / 2.5));
        const cx = W * 0.48;
        const topY = H * 0.08;

        // Spawn rate varies
        const spawnCount = 3;
        for (let i = 0; i < spawnCount; i++) {
            const drop = {
                x: cx + (Math.random() - 0.5) * W * 0.12,
                y: topY + Math.random() * H * 0.1,
                vx: (Math.random() - 0.5) * 2,
                vy: 2 + Math.random() * 4,
                size: 1 + Math.random() * 2.5,
                opacity: 0.2 + Math.random() * 0.4,
                gravity: 0.15 + Math.random() * 0.1,
                transformT: transformT,
            };
            waterfallDrops.push(drop);
        }
    }

    function updateAndDrawWaterfallDrops() {
        const t = time % LOOP_DURATION;
        const transformT = Math.max(0, Math.min(1, (t - 2.5) / 2.5));
        const bottomY = H * 0.78;

        for (let i = waterfallDrops.length - 1; i >= 0; i--) {
            const d = waterfallDrops[i];
            d.vy += d.gravity;
            d.x += d.vx;
            d.y += d.vy;

            if (d.y > bottomY) {
                // Splash
                if (Math.random() < 0.3) {
                    splashDrops.push({
                        x: d.x, y: bottomY,
                        vx: (Math.random() - 0.5) * 5,
                        vy: -2 - Math.random() * 4,
                        size: d.size * 0.5,
                        opacity: d.opacity * 0.6,
                        gravity: 0.15,
                        life: 1,
                        transformT: transformT,
                    });
                }
                waterfallDrops.splice(i, 1);
                continue;
            }

            // Draw
            const dropColor = lerpColor(C.waterLight, C.coffeeLight, easeInOut(transformT));
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
            ctx.fillStyle = rgba(dropColor, d.opacity);
            ctx.fill();

            // Motion streak
            if (d.vy > 3) {
                ctx.beginPath();
                ctx.moveTo(d.x, d.y);
                ctx.lineTo(d.x - d.vx * 0.3, d.y - d.vy * 1.2);
                ctx.strokeStyle = rgba(dropColor, d.opacity * 0.3);
                ctx.lineWidth = d.size * 0.5;
                ctx.stroke();
            }
        }

        // Splash drops
        for (let i = splashDrops.length - 1; i >= 0; i--) {
            const s = splashDrops[i];
            s.vy += s.gravity;
            s.x += s.vx;
            s.y += s.vy;
            s.life -= 0.025;

            if (s.life <= 0) { splashDrops.splice(i, 1); continue; }

            const sColor = lerpColor(C.waterLight, C.foamEdge, s.transformT);
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
            ctx.fillStyle = rgba(sColor, s.opacity * s.life);
            ctx.fill();
        }
    }

    // --- MIST ---
    function spawnMist() {
        const cx = W * 0.48;
        const poolY = H * 0.76;

        if (Math.random() < 0.06) {
            mistParticles.push({
                x: cx + (Math.random() - 0.5) * W * 0.3,
                y: poolY + (Math.random() - 0.5) * 30,
                vx: (Math.random() - 0.5) * 0.8,
                vy: -0.3 - Math.random() * 0.5,
                size: 30 + Math.random() * 70,
                opacity: 0.02 + Math.random() * 0.04,
                life: 1,
                decay: 0.002 + Math.random() * 0.003,
            });
        }
    }

    function updateAndDrawMist() {
        for (let i = mistParticles.length - 1; i >= 0; i--) {
            const m = mistParticles[i];
            m.x += m.vx;
            m.y += m.vy;
            m.life -= m.decay;

            if (m.life <= 0) { mistParticles.splice(i, 1); continue; }

            const grad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.size);
            grad.addColorStop(0, rgba(C.mistWhite, m.opacity * m.life));
            grad.addColorStop(1, rgba(C.mistWhite, 0));
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // =============================================
    //  NITRO BUBBLE CASCADE (Phase 3)
    // =============================================

    function spawnNitroBubbles() {
        const t = time % LOOP_DURATION;
        if (t < 4.0 || t > 9) return; // Active during phases 3-4
        const nitroT = Math.min(1, (t - 4.0) / 3.5);

        const cx = W * 0.48;
        const streamTop = H * 0.15;
        const streamBottom = H * 0.75;

        const spawnRate = nitroT * 0.5;
        if (Math.random() < spawnRate) {
            nitroBubbles.push({
                x: cx + (Math.random() - 0.5) * W * 0.08,
                y: streamTop + Math.random() * (streamBottom - streamTop),
                size: 0.5 + Math.random() * 2.5,
                opacity: 0.2 + Math.random() * 0.5,
                // Nitro cascade: down first, then up
                phase: 'down',
                vy: 0.5 + Math.random() * 1.5,
                vx: (Math.random() - 0.5) * 0.5,
                downDist: 15 + Math.random() * 40,
                traveled: 0,
                life: 1,
            });
        }
    }

    function updateAndDrawNitroBubbles() {
        for (let i = nitroBubbles.length - 1; i >= 0; i--) {
            const b = nitroBubbles[i];

            if (b.phase === 'down') {
                b.y += b.vy;
                b.traveled += b.vy;
                if (b.traveled >= b.downDist) b.phase = 'up';
            } else {
                b.y -= b.vy * 0.3;
            }

            b.x += b.vx + Math.sin(time * 3 + i) * 0.2;
            b.life -= 0.005;

            if (b.life <= 0 || b.y < H * 0.1 || b.y > H * 0.8) {
                nitroBubbles.splice(i, 1);
                continue;
            }

            // Draw with highlight
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
            ctx.fillStyle = rgba(C.nitroGold, b.opacity * b.life * 0.6);
            ctx.fill();

            // Tiny highlight on bubble
            if (b.size > 1.5) {
                ctx.beginPath();
                ctx.arc(b.x - b.size * 0.25, b.y - b.size * 0.25, b.size * 0.3, 0, Math.PI * 2);
                ctx.fillStyle = rgba([255, 255, 255], 0.3 * b.life);
                ctx.fill();
            }
        }
    }

    // --- FOAM HEAD FORMATION ---
    function drawFoamHead() {
        const t = time % LOOP_DURATION;
        if (t < 4.5) return;

        const foamT = Math.min(1, (t - 4.5) / 2.5);
        const cx = W * 0.48;
        const foamY = H * 0.72;
        const foamWidth = W * 0.12 * easeOut(foamT);
        const foamHeight = 18 * easeOut(foamT);

        // Foam layer
        const foamGrad = ctx.createLinearGradient(cx, foamY - foamHeight, cx, foamY + foamHeight);
        foamGrad.addColorStop(0, rgba(C.foam, 0.8 * foamT));
        foamGrad.addColorStop(0.4, rgba(C.foamEdge, 0.6 * foamT));
        foamGrad.addColorStop(1, rgba(C.foamEdge, 0.1 * foamT));

        ctx.fillStyle = foamGrad;
        ctx.beginPath();
        ctx.ellipse(cx, foamY, foamWidth, foamHeight, 0, 0, Math.PI * 2);
        ctx.fill();

        // Foam bubbles
        if (foamT > 0.3) {
            const bubbleCount = Math.floor(foamT * 15);
            for (let i = 0; i < bubbleCount; i++) {
                const bx = cx + (Math.random() - 0.5) * foamWidth * 1.6;
                const by = foamY + (Math.random() - 0.5) * foamHeight * 1.2;
                const br = 1 + Math.random() * 3;
                ctx.beginPath();
                ctx.arc(bx, by, br, 0, Math.PI * 2);
                ctx.fillStyle = rgba(C.foam, 0.15 + Math.random() * 0.15);
                ctx.fill();
                ctx.strokeStyle = rgba(C.foamEdge, 0.08);
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }
        }
    }

    // --- TRANSFORMATION SHIMMER PARTICLES ---
    function spawnTransitionParticles() {
        const t = time % LOOP_DURATION;
        if (t < 2.0 || t > 5.5) return;

        const cx = W * 0.48;

        if (Math.random() < 0.2) {
            transitionParticles.push({
                x: cx + (Math.random() - 0.5) * W * 0.15,
                y: H * 0.1 + Math.random() * H * 0.6,
                size: 1 + Math.random() * 3,
                opacity: 0.3 + Math.random() * 0.5,
                life: 1,
                decay: 0.015 + Math.random() * 0.01,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                hue: Math.random() < 0.5 ? C.goldenLight : C.nitroGold,
            });
        }
    }

    function updateAndDrawTransitionParticles() {
        for (let i = transitionParticles.length - 1; i >= 0; i--) {
            const p = transitionParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;

            if (p.life <= 0) { transitionParticles.splice(i, 1); continue; }

            ctx.save();
            ctx.globalCompositeOperation = 'screen';

            const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
            glow.addColorStop(0, rgba(p.hue, p.opacity * p.life));
            glow.addColorStop(0.5, rgba(p.hue, p.opacity * p.life * 0.3));
            glow.addColorStop(1, rgba(p.hue, 0));
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
            ctx.fill();

            // Star/flare shape
            ctx.fillStyle = rgba([255, 255, 255], p.opacity * p.life * 0.8);
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    }

    // --- LIGHT FLARES ---
    function drawLightFlares() {
        const t = time % LOOP_DURATION;
        const cx = W * 0.48;

        // Subtle flares that catch light on water/coffee droplets
        const flarePositions = [
            { x: cx - W * 0.05, y: H * 0.25, phase: 0 },
            { x: cx + W * 0.04, y: H * 0.45, phase: 1.5 },
            { x: cx - W * 0.03, y: H * 0.6, phase: 3 },
            { x: cx + W * 0.02, y: H * 0.35, phase: 4.5 },
        ];

        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        flarePositions.forEach(f => {
            const intensity = Math.max(0, Math.sin(time * 1.2 + f.phase)) * 0.15;
            if (intensity < 0.02) return;

            const flareGrad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, 15);
            flareGrad.addColorStop(0, rgba([255, 255, 255], intensity));
            flareGrad.addColorStop(0.3, rgba(C.goldenLight, intensity * 0.5));
            flareGrad.addColorStop(1, rgba(C.goldenLight, 0));
            ctx.fillStyle = flareGrad;
            ctx.beginPath();
            ctx.arc(f.x, f.y, 15, 0, Math.PI * 2);
            ctx.fill();

            // Cross flare
            ctx.strokeStyle = rgba([255, 255, 255], intensity * 0.5);
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(f.x - 8, f.y);
            ctx.lineTo(f.x + 8, f.y);
            ctx.moveTo(f.x, f.y - 8);
            ctx.lineTo(f.x, f.y + 8);
            ctx.stroke();
        });

        ctx.restore();
    }

    // =============================================
    //  BRANDING
    // =============================================

    function drawBranding() {
        const t = time % LOOP_DURATION;
        window._dbgBrand = { time, t, LOOP_DURATION, frame };
        // Show branding from 1s onwards (always visible, fades with loop)
        if (t < 0.5) return;

        const brandT = Math.min(1, (t - 0.5) / 1.5);
        let alpha = easeOut(brandT);

        // Fade out briefly before loop
        if (t > 9.2) {
            alpha *= Math.max(0, 1 - (t - 9.2) / 0.8);
        }

        if (alpha < 0.01) return;

        const cx = W * 0.48;
        const brandY = H * 0.32;

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Strong dark backdrop band for readability
        const bandH = H * 0.28;
        const bandGrad = ctx.createLinearGradient(0, brandY - bandH * 0.4, 0, brandY + bandH * 0.7);
        bandGrad.addColorStop(0, `rgba(5, 10, 5, 0)`);
        bandGrad.addColorStop(0.15, `rgba(5, 10, 5, ${0.65 * alpha})`);
        bandGrad.addColorStop(0.5, `rgba(5, 10, 5, ${0.75 * alpha})`);
        bandGrad.addColorStop(0.85, `rgba(5, 10, 5, ${0.65 * alpha})`);
        bandGrad.addColorStop(1, `rgba(5, 10, 5, 0)`);
        ctx.fillStyle = bandGrad;
        ctx.fillRect(0, brandY - bandH * 0.4, W, bandH);

        // Main title
        const fontSize = Math.min(W * 0.06, 80);
        ctx.font = `900 ${fontSize}px Cinzel, Playfair Display, Georgia, serif`;
        ctx.fillStyle = rgba([255, 245, 225], alpha);
        ctx.shadowColor = `rgba(0, 0, 0, ${0.8 * alpha})`;
        ctx.shadowBlur = 25;
        ctx.shadowOffsetY = 3;
        ctx.fillText('CASCADE COFFEE', cx, brandY);

        // Decorative line
        const lineWidth = 150 * easeOut(brandT);
        ctx.shadowBlur = 0;
        ctx.strokeStyle = rgba(C.nitroGold, 0.7 * alpha);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx - lineWidth, brandY + fontSize * 0.55);
        ctx.lineTo(cx + lineWidth, brandY + fontSize * 0.55);
        ctx.stroke();

        // Tagline
        const tagSize = Math.min(W * 0.022, 28);
        ctx.font = `700 ${tagSize}px Cinzel, Playfair Display, Georgia, serif`;
        ctx.fillStyle = rgba(C.brandCream, alpha * 0.85);
        ctx.shadowBlur = 15;
        ctx.fillText('EXPERIENCE THE CASCADE', cx, brandY + fontSize * 0.55 + tagSize + 14);

        // Subtitle
        const subSize = Math.min(W * 0.015, 18);
        ctx.font = `italic 400 ${subSize}px Cormorant Garamond, Georgia, serif`;
        ctx.fillStyle = rgba(C.brandCream, alpha * 0.65);
        ctx.shadowBlur = 10;
        ctx.fillText('Nature\'s Purest Pour. Nitro\'s Smoothest Finish.', cx, brandY + fontSize * 0.55 + tagSize + subSize + 30);

        ctx.restore();
    }

    // =============================================
    //  VIGNETTE & POST-PROCESSING
    // =============================================

    function drawVignette() {
        const t = time % LOOP_DURATION;

        // Subtle corner vignette only
        const vigGrad = ctx.createRadialGradient(W * 0.5, H * 0.5, W * 0.3, W * 0.5, H * 0.5, W * 0.85);
        vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
        vigGrad.addColorStop(0.7, 'rgba(0,0,0,0)');
        vigGrad.addColorStop(1, 'rgba(0,0,0,0.25)');
        ctx.fillStyle = vigGrad;
        ctx.fillRect(0, 0, W, H);

        // Gentle loop crossfade
        if (t > 9.5) {
            const fadeT = (t - 9.5) / 0.5;
            ctx.fillStyle = `rgba(15, 30, 18, ${easeIn(fadeT) * 0.5})`;
            ctx.fillRect(0, 0, W, H);
        }
        if (t < 0.3) {
            const fadeT = 1 - t / 0.3;
            ctx.fillStyle = `rgba(15, 30, 18, ${fadeT * 0.3})`;
            ctx.fillRect(0, 0, W, H);
        }
    }

    // =============================================
    //  MAIN ANIMATION LOOP
    // =============================================

    function animate() {
        try {
            time += DT;
            frame++;

            ctx.clearRect(0, 0, W, H);

            // Layer order (back to front):
            drawBackground();
            drawLightRays();
            drawCliffFace();
            drawPool();
            drawWaterfallStream();
            spawnWaterfallDrops();
            updateAndDrawWaterfallDrops();
            spawnMist();
            updateAndDrawMist();
            spawnNitroBubbles();
            updateAndDrawNitroBubbles();
            drawFoamHead();
            spawnTransitionParticles();
            updateAndDrawTransitionParticles();
            drawLightFlares();
            drawFoliage();
            drawVignette();

            // Particle caps
            if (waterfallDrops.length > 400) waterfallDrops.splice(0, waterfallDrops.length - 400);
            if (splashDrops.length > 100) splashDrops.splice(0, splashDrops.length - 100);
            if (mistParticles.length > 20) mistParticles.splice(0, mistParticles.length - 20);
            if (nitroBubbles.length > 150) nitroBubbles.splice(0, nitroBubbles.length - 150);
            if (transitionParticles.length > 50) transitionParticles.splice(0, transitionParticles.length - 50);
        } catch (e) {
            console.error('Animation error at frame ' + frame + ':', e.message, e.stack);
        }
    }

    // Use setInterval as fallback for environments that throttle rAF
    let animId = null;
    function startLoop() {
        function tick() {
            animate();
            animId = requestAnimationFrame(tick);
        }
        // Also run via setInterval as backup
        setInterval(animate, 1000 / 30); // 30fps fallback
        tick();
    }

    // --- INIT ---
    window.addEventListener('resize', resize);
    resize();
    startLoop();
})();
