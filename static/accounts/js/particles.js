(function() {
  'use strict';

  var canvas = document.getElementById('particles-canvas');
  if (!canvas) return;

  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Respect reduced motion preference
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    canvas.style.display = 'none';
    return;
  }

  var particles = [];
  var shootingStars = [];
  var W, H, dpr;
  var PARTICLE_COUNT = 120;
  var SHOOTING_STAR_INTERVAL = 8000; // ms between shooting stars
  var lastShootingStar = 0;
  var animId = null;
  var isVisible = true;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function createParticle() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      r: 0.4 + Math.random() * 1.2,
      baseAlpha: 0.15 + Math.random() * 0.55,
      alpha: 0,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.12,
      // twinkle
      twinkleSpeed: 0.003 + Math.random() * 0.008,
      twinklePhase: Math.random() * Math.PI * 2
    };
  }

  function createShootingStar() {
    var startX = Math.random() * W * 0.8;
    var startY = Math.random() * H * 0.4;
    var angle = (Math.PI / 6) + Math.random() * (Math.PI / 4); // 30-75 degrees
    var speed = 4 + Math.random() * 6;
    return {
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1.0,
      decay: 0.012 + Math.random() * 0.008,
      length: 40 + Math.random() * 60,
      width: 0.5 + Math.random() * 1
    };
  }

  function init() {
    resize();
    particles = [];
    for (var i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(createParticle());
    }
  }

  function draw(now) {
    ctx.clearRect(0, 0, W, H);

    // Draw particles
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];

      // Update position
      p.x += p.vx;
      p.y += p.vy;

      // Wrap around
      if (p.x < -5) p.x = W + 5;
      if (p.x > W + 5) p.x = -5;
      if (p.y < -5) p.y = H + 5;
      if (p.y > H + 5) p.y = -5;

      // Twinkle
      p.twinklePhase += p.twinkleSpeed;
      var twinkle = 0.5 + 0.5 * Math.sin(p.twinklePhase);
      p.alpha = p.baseAlpha * (0.4 + 0.6 * twinkle);

      // Draw
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, ' + p.alpha + ')';
      ctx.fill();
    }

    // Shooting stars
    if (now - lastShootingStar > SHOOTING_STAR_INTERVAL) {
      shootingStars.push(createShootingStar());
      lastShootingStar = now;
    }

    for (var j = shootingStars.length - 1; j >= 0; j--) {
      var s = shootingStars[j];
      s.x += s.vx;
      s.y += s.vy;
      s.life -= s.decay;

      if (s.life <= 0) {
        shootingStars.splice(j, 1);
        continue;
      }

      var tailX = s.x - (s.vx / Math.sqrt(s.vx * s.vx + s.vy * s.vy)) * s.length * s.life;
      var tailY = s.y - (s.vy / Math.sqrt(s.vx * s.vx + s.vy * s.vy)) * s.length * s.life;

      var grad = ctx.createLinearGradient(s.x, s.y, tailX, tailY);
      grad.addColorStop(0, 'rgba(255, 255, 255, ' + (s.life * 0.7) + ')');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(tailX, tailY);
      ctx.strokeStyle = grad;
      ctx.lineWidth = s.width;
      ctx.stroke();
    }

    animId = requestAnimationFrame(draw);
  }

  // Pause when tab is hidden
  document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
      isVisible = false;
      if (animId) {
        cancelAnimationFrame(animId);
        animId = null;
      }
    } else {
      isVisible = true;
      if (!animId) {
        animId = requestAnimationFrame(draw);
      }
    }
  });

  var resizeTimeout;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
      resize();
    }, 150);
  });

  init();
  animId = requestAnimationFrame(draw);
})();
