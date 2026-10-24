/* Amar Goswami — site interactions */
(function () {
  'use strict';

  // Amar sir's email address. Every "Email" button on the page uses it.
  const CONFIG = {
    email: '' // e.g. 'amar@prjgyanjaya.in'
  };

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasIO = 'IntersectionObserver' in window;

  /* ------------------------------------------------------------------
     Background: a quiet field of science symbols that lights up
     around the cursor (and drifts on its own when idle / on touch).
     ------------------------------------------------------------------ */
  (function symbolField() {
    const canvas = document.querySelector('.field-bg');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');

    const GLYPHS = ['+', '+', '+', '−', '−', '×', '×', '÷', '=', 'Δ', 'π', 'λ', 'Σ', 'µ', '√', '∞', '°', 'α', 'β', '→', '⇌', '·', '·', '·'];
    const CELL = 30;
    const RADIUS = finePointer ? 260 : 200;
    const INTENSITY = finePointer ? 0.8 : 0.5; // keep text readable on phones, where the glow drifts under copy
    const PARALLAX = 0.18;
    const FONT = '400 13px "Geist Mono", ui-monospace, Menlo, Consolas, monospace';

    let w = 0, h = 0, dpr = 1, cols = 0, rows = 0, grid = [], base = null, shift = -1;
    const p = { x: window.innerWidth * 0.72, y: window.innerHeight * 0.4, tx: 0, ty: 0, last: -Infinity };
    p.tx = p.x; p.ty = p.y;

    const pick = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];

    function drawBase() {
      const b = base.getContext('2d');
      b.setTransform(dpr, 0, 0, dpr, 0, 0);
      b.clearRect(0, 0, w, h + CELL);
      b.font = FONT;
      b.textAlign = 'center';
      b.textBaseline = 'middle';
      b.fillStyle = 'rgba(255, 255, 255, 0.065)';
      for (let r = 0; r < rows; r++) {
        const gr = (r + shift) % rows;
        for (let c = 0; c < cols; c++) {
          b.fillText(grid[gr * cols + c], c * CELL + CELL / 2, r * CELL + CELL / 2);
        }
      }
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(w / CELL) + 1;
      rows = Math.ceil(h / CELL) + 2;
      grid = Array.from({ length: cols * rows }, pick);
      base = document.createElement('canvas');
      base.width = w * dpr;
      base.height = (h + CELL) * dpr;
      shift = -1;
    }

    function render(t) {
      const scrolled = window.scrollY * PARALLAX;
      const nextShift = Math.floor(scrolled / CELL) % rows;
      const off = scrolled % CELL;
      if (nextShift !== shift) { shift = nextShift; drawBase(); }

      // Drift on a slow path when the visitor isn't moving the mouse
      if (t - p.last > 3500) {
        p.tx = w * (0.55 + 0.3 * Math.sin(t * 0.00021));
        p.ty = h * (0.45 + 0.28 * Math.sin(t * 0.00029 + 1.3));
      }
      p.x += (p.tx - p.x) * 0.075;
      p.y += (p.ty - p.y) * 0.075;

      ctx.clearRect(0, 0, w, h);

      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, RADIUS * 1.8);
      glow.addColorStop(0, 'rgba(123, 224, 166, 0.10)');
      glow.addColorStop(1, 'rgba(123, 224, 166, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      ctx.drawImage(base, 0, -off, w, h + CELL);

      ctx.font = FONT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const c0 = Math.max(0, Math.floor((p.x - RADIUS) / CELL));
      const c1 = Math.min(cols - 1, Math.ceil((p.x + RADIUS) / CELL));
      const r0 = Math.max(0, Math.floor((p.y + off - RADIUS) / CELL));
      const r1 = Math.min(rows - 1, Math.ceil((p.y + off + RADIUS) / CELL));
      for (let r = r0; r <= r1; r++) {
        const gr = (r + shift) % rows;
        const cy = r * CELL + CELL / 2 - off;
        for (let c = c0; c <= c1; c++) {
          const cx = c * CELL + CELL / 2;
          const d = Math.hypot(cx - p.x, cy - p.y);
          if (d > RADIUS) continue;
          let k = 1 - d / RADIUS;
          k = k * k * (0.7 + 0.3 * Math.sin(d * 0.045 - t * 0.003)); // soft ripple
          ctx.fillStyle = 'rgba(123, 224, 166, ' + (k * INTENSITY) + ')';
          ctx.fillText(grid[gr * cols + c], cx, cy);
        }
      }
    }

    function loop(t) {
      render(t);
      requestAnimationFrame(loop);
    }

    resize();
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { resize(); if (reduceMotion) render(0); }, 120);
    });

    if (reduceMotion) {
      (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => render(0));
      window.addEventListener('scroll', () => render(0), { passive: true });
      return;
    }

    window.addEventListener('pointermove', (e) => {
      p.tx = e.clientX;
      p.ty = e.clientY;
      p.last = performance.now();
    }, { passive: true });

    // Redraw the faint layer once the mono font has loaded
    if (document.fonts) document.fonts.ready.then(() => { shift = -1; });
    requestAnimationFrame(loop);
  })();

  /* ------------------------------------------------------------------
     Header: shadow, hide on scroll down, show on scroll up + progress
     ------------------------------------------------------------------ */
  const header = document.querySelector('.site-header');
  const progress = document.querySelector('.progress');
  const nav = document.getElementById('site-nav');
  const toggle = document.querySelector('.menu-toggle');
  let lastY = window.scrollY;

  function onScroll() {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 8);
    const menuOpen = nav.classList.contains('is-open');
    if (!menuOpen && y > 320 && y > lastY + 4) header.classList.add('is-hidden');
    else if (y < lastY - 4 || y < 320) header.classList.remove('is-hidden');
    lastY = y;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* Mobile menu */
  const setMenu = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
    if (open) header.classList.remove('is-hidden');
  };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  document.addEventListener('click', (e) => {
    if (nav.classList.contains('is-open') && !e.target.closest('.site-header')) setMenu(false);
  });

  /* Active nav link */
  const navLinks = [...document.querySelectorAll('.nav-list a')];
  if (hasIO) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navLinks.forEach((a) => {
      const s = document.querySelector(a.getAttribute('href'));
      if (s) spy.observe(s);
    });
  }

  /* ------------------------------------------------------------------
     Reveal on scroll + number count-up
     ------------------------------------------------------------------ */
  function countUp(el) {
    const target = Number(el.dataset.count);
    if (!target || reduceMotion) return;
    const fmt = (n) => n.toLocaleString('en-IN');
    const start = performance.now();
    const dur = target > 100 ? 1800 : 1300;
    el.textContent = '0';
    (function tick(now) {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 4);
      el.textContent = fmt(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(tick);
    })(start);
  }

  const revealEls = document.querySelectorAll('[data-reveal]');
  if (reduceMotion || !hasIO) {
    revealEls.forEach((el) => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        entry.target.querySelectorAll('[data-count]').forEach(countUp);
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealEls.forEach((el) => {
      const siblings = [...el.parentElement.children].filter((s) => s.hasAttribute('data-reveal'));
      const index = siblings.indexOf(el);
      if (index > 0) el.style.transitionDelay = Math.min(index * 80, 400) + 'ms';
      io.observe(el);
    });
  }

  /* ------------------------------------------------------------------
     Cursor spotlight on cards + gentle magnetic buttons
     ------------------------------------------------------------------ */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll('[data-spot]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });

    document.querySelectorAll('[data-magnetic]').forEach((btn) => {
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.18;
        const y = (e.clientY - r.top - r.height / 2) * 0.3;
        btn.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
      });
      btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
    });
  }

  /* ------------------------------------------------------------------
     Email-only contact
     ------------------------------------------------------------------ */
  const mailStatus = document.querySelector('.mail-status');

  function mailto(interest, batch) {
    const subject = interest ? interest + ' — enquiry' : 'Enquiry for Amar sir';
    const body = [
      'Hello Amar sir,',
      '',
      'Student name: ',
      'Class: ',
      'Subject / course: ' + (interest || ''),
      'Batch (one-to-one / small batch / custom): ' + (batch || ''),
      'Country / time zone: ',
      '',
      'Message: ',
      ''
    ].join('\n');
    return 'mailto:' + CONFIG.email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  }

  const notConnected = () => {
    if (!mailStatus) return;
    mailStatus.textContent = 'The email address will be added here soon — please check back.';
  };

  if (CONFIG.email) {
    document.querySelectorAll('[data-email-text]').forEach((el) => { el.textContent = CONFIG.email; });
    document.querySelectorAll('[data-mail]').forEach((a) => { a.href = mailto(); });
    document.querySelectorAll('[data-interest]').forEach((a) => { a.href = mailto(a.dataset.interest); });
  }

  // Course / demo / consultation links jump to the contact card when no email is set
  document.querySelectorAll('[data-mail]').forEach((a) => {
    a.addEventListener('click', (e) => {
      if (CONFIG.email) return;
      if (a.closest('.mail-card')) { e.preventDefault(); notConnected(); }
    });
  });

  const batchLink = document.querySelector('[data-batch-link]');
  if (batchLink && CONFIG.email) {
    batchLink.addEventListener('click', () => {
      const chosen = document.querySelector('input[name="batch"]:checked');
      batchLink.href = mailto('Classes', chosen ? chosen.value : '');
    });
  }

  const copyBtn = document.querySelector('[data-copy-email]');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      if (!CONFIG.email) { notConnected(); return; }
      try {
        await navigator.clipboard.writeText(CONFIG.email);
      } catch (err) {
        const ta = document.createElement('textarea');
        ta.value = CONFIG.email;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      copyBtn.textContent = 'Copied';
      copyBtn.classList.add('is-done');
      setTimeout(() => { copyBtn.textContent = 'Copy'; copyBtn.classList.remove('is-done'); }, 1800);
    });
  }

  /* Floating email button hides once the contact section is on screen */
  const mailFloat = document.querySelector('.mail-float');
  const contact = document.getElementById('contact');
  if (hasIO && mailFloat && contact) {
    new IntersectionObserver(([entry]) => {
      mailFloat.classList.toggle('is-hidden', entry.isIntersecting);
    }, { threshold: 0.1 }).observe(contact);
  }
})();
