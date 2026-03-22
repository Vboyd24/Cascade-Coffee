/* ============================================
   CASCADE COFFEE - JavaScript
   Waterfall canvas, scroll animations, nav, form
   ============================================ */

// --- Waterfall Particle Canvas ---
(function () {
    const canvas = document.getElementById('waterfall-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    let w, h;

    function resize() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
    }

    function createParticle() {
        return {
            x: Math.random() * w,
            y: -10,
            speed: 1 + Math.random() * 2.5,
            size: Math.random() * 2 + 0.5,
            opacity: Math.random() * 0.5 + 0.1,
            drift: (Math.random() - 0.5) * 0.3,
        };
    }

    function init() {
        resize();
        particles = [];
        for (let i = 0; i < 80; i++) {
            const p = createParticle();
            p.y = Math.random() * h;
            particles.push(p);
        }
    }

    function animate() {
        ctx.clearRect(0, 0, w, h);

        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.y += p.speed;
            p.x += p.drift;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(126, 200, 227, ${p.opacity})`;
            ctx.fill();

            // Draw a small trail
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x - p.drift * 2, p.y - p.speed * 3);
            ctx.strokeStyle = `rgba(126, 200, 227, ${p.opacity * 0.3})`;
            ctx.lineWidth = p.size * 0.5;
            ctx.stroke();

            if (p.y > h + 10 || p.x < -10 || p.x > w + 10) {
                particles[i] = createParticle();
            }
        }

        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', resize);
    init();
    animate();
})();

// --- Navbar Scroll Effect ---
(function () {
    const navbar = document.getElementById('navbar');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const current = window.scrollY;
        if (current > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        lastScroll = current;
    });
})();

// --- Mobile Menu Toggle ---
(function () {
    const toggle = document.getElementById('mobile-toggle');
    const menu = document.getElementById('mobile-menu');

    if (toggle && menu) {
        toggle.addEventListener('click', () => {
            menu.classList.toggle('active');
            toggle.classList.toggle('active');
        });

        // Close menu on link click
        menu.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => {
                menu.classList.remove('active');
                toggle.classList.remove('active');
            });
        });
    }
})();

// --- Scroll Reveal Animations ---
(function () {
    const reveals = document.querySelectorAll(
        '.section-content, .section-visual, .experience-card, .wholesale-card, .cascade-quote, .contact-info, .contact-form'
    );

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        },
        {
            threshold: 0.15,
            rootMargin: '0px 0px -50px 0px',
        }
    );

    reveals.forEach((el) => observer.observe(el));
})();

// --- Smooth Scroll for Anchor Links ---
(function () {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', function (e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                const navHeight = document.getElementById('navbar').offsetHeight;
                const top = target.getBoundingClientRect().top + window.scrollY - navHeight;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        });
    });
})();

// --- Contact Form Handler ---
(function () {
    const form = document.getElementById('contact-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.textContent;

        btn.textContent = 'Sending...';
        btn.disabled = true;
        btn.style.opacity = '0.6';

        // Simulate form submission (replace with real endpoint)
        setTimeout(() => {
            btn.textContent = 'Inquiry Sent!';
            btn.style.background = '#2d6a4f';

            setTimeout(() => {
                form.reset();
                btn.textContent = originalText;
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.style.background = '';
            }, 3000);
        }, 1500);
    });
})();

// --- Parallax on Hero (subtle) ---
(function () {
    const hero = document.getElementById('hero');
    if (!hero) return;

    window.addEventListener('scroll', () => {
        const scroll = window.scrollY;
        if (scroll < window.innerHeight) {
            const content = hero.querySelector('.hero-content');
            if (content) {
                content.style.transform = `translateY(${scroll * 0.15}px)`;
                content.style.opacity = 1 - scroll / (window.innerHeight * 0.8);
            }
        }
    });
})();
