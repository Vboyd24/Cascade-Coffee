/* ============================================
   CASCADE COFFEE - Waterfall Mist & Spray Overlay
   Subtle animated particles over the hero photo
   ============================================ */

(function () {
    const canvas = document.getElementById('waterfall-hero-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let W, H;
    let mistParticles = [];
    let sprayDroplets = [];
    let lightRays = [];
    let frame = 0;

    function resize() {
        const parent = canvas.parentElement;
        if (!parent) return;
        W = canvas.width = parent.offsetWidth;
        H = canvas.height = parent.offsetHeight;
    }

    // Mist particles - large, slow, drifting
    function MistParticle() {
        this.x = Math.random() * W;
        this.y = H * (0.3 + Math.random() * 0.5); // middle to lower area
        this.size = 60 + Math.random() * 120;
        this.opacity = Math.random() * 0.06 + 0.01;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = -Math.random() * 0.15 - 0.05;
        this.life = 1;
        this.decay = 0.0008 + Math.random() * 0.001;
    }

    // Small water spray droplets
    function SprayDroplet() {
        // Originate from left-center area (where waterfall would be in photo)
        this.x = W * (0.2 + Math.random() * 0.3);
        this.y = H * (0.4 + Math.random() * 0.3);
        this.size = Math.random() * 2 + 0.5;
        this.opacity = Math.random() * 0.3 + 0.1;
        this.vx = (Math.random() - 0.3) * 1.5;
        this.vy = -Math.random() * 1.5 - 0.3;
        this.gravity = 0.02;
        this.life = 1;
        this.decay = 0.008 + Math.random() * 0.01;
    }

    // Light ray
    function LightRay() {
        this.x = W * (0.3 + Math.random() * 0.4);
        this.width = 20 + Math.random() * 40;
        this.opacity = 0;
        this.maxOpacity = 0.02 + Math.random() * 0.03;
        this.phase = 'in';
        this.speed = 0.0005 + Math.random() * 0.001;
        this.angle = -5 + Math.random() * 10; // degrees
    }

    function init() {
        resize();
        // Pre-populate some mist
        for (let i = 0; i < 8; i++) {
            const m = new MistParticle();
            m.life = Math.random();
            mistParticles.push(m);
        }
        // A couple of light rays
        for (let i = 0; i < 2; i++) {
            lightRays.push(new LightRay());
        }
    }

    function animate() {
        ctx.clearRect(0, 0, W, H);
        frame++;

        // --- Light Rays ---
        lightRays.forEach((ray, i) => {
            if (ray.phase === 'in') {
                ray.opacity += ray.speed;
                if (ray.opacity >= ray.maxOpacity) ray.phase = 'hold';
            } else if (ray.phase === 'hold') {
                if (Math.random() < 0.001) ray.phase = 'out';
            } else {
                ray.opacity -= ray.speed;
                if (ray.opacity <= 0) {
                    lightRays[i] = new LightRay();
                }
            }

            ctx.save();
            ctx.translate(ray.x, 0);
            ctx.rotate((ray.angle * Math.PI) / 180);
            const grad = ctx.createLinearGradient(0, 0, 0, H);
            grad.addColorStop(0, `rgba(255, 250, 220, ${ray.opacity})`);
            grad.addColorStop(0.5, `rgba(255, 250, 220, ${ray.opacity * 0.5})`);
            grad.addColorStop(1, `rgba(255, 250, 220, 0)`);
            ctx.fillStyle = grad;
            ctx.fillRect(-ray.width / 2, 0, ray.width, H);
            ctx.restore();
        });

        // --- Mist ---
        if (Math.random() < 0.04) {
            mistParticles.push(new MistParticle());
        }

        for (let i = mistParticles.length - 1; i >= 0; i--) {
            const m = mistParticles[i];
            m.x += m.vx;
            m.y += m.vy;
            m.life -= m.decay;

            if (m.life <= 0 || m.y < -m.size) {
                mistParticles.splice(i, 1);
                continue;
            }

            const grad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.size);
            grad.addColorStop(0, `rgba(220, 235, 240, ${m.opacity * m.life})`);
            grad.addColorStop(0.5, `rgba(200, 220, 230, ${m.opacity * m.life * 0.5})`);
            grad.addColorStop(1, `rgba(200, 220, 230, 0)`);
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
            ctx.fill();
        }

        // --- Spray Droplets ---
        if (Math.random() < 0.15) {
            sprayDroplets.push(new SprayDroplet());
        }

        for (let i = sprayDroplets.length - 1; i >= 0; i--) {
            const d = sprayDroplets[i];
            d.vy += d.gravity;
            d.x += d.vx;
            d.y += d.vy;
            d.life -= d.decay;

            if (d.life <= 0) {
                sprayDroplets.splice(i, 1);
                continue;
            }

            ctx.beginPath();
            ctx.arc(d.x, d.y, d.size * d.life, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(220, 240, 250, ${d.opacity * d.life})`;
            ctx.fill();
        }

        // Cap particles
        if (mistParticles.length > 15) mistParticles.splice(0, mistParticles.length - 15);
        if (sprayDroplets.length > 60) sprayDroplets.splice(0, sprayDroplets.length - 60);

        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', resize);
    init();
    animate();
})();
