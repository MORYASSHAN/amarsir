/* Amar Goswami: site interactions */
(function () {
  'use strict';

  // Amar sir's email address. Every "Email" button on the page uses it.
  const CONFIG = {
    email: 'shaanamar107@gmail.com'
  };

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasIO = 'IntersectionObserver' in window;

  /* ------------------------------------------------------------------
     Background: faint science doodles and formulas spread evenly from
     the top of the page to the bottom, kept clear of all content.
     ------------------------------------------------------------------ */
  (function scienceDrawings() {
    const NAMES = ['microscope', 'solar', 'dna', 'atom', 'flask', 'leaf', 'cell', 'molecule', 'saturn', 'tube', 'pendulum',
      'magnet', 'bulb', 'beaker', 'prism', 'rocket', 'bacteria', 'magnifier'];
    const FORMULAS = ['E = mc²', 'H₂O', 'F = ma', 'CO₂', 'π', 'λ', 'Δx', 'pH 7', 'NaCl', 'v = d/t', 'O₂', 'ATP', 'C₆H₁₂O₆', 'DNA', 'V = IR', 'g = 9.8 m/s²'];
    const SVG_NS = 'http://www.w3.org/2000/svg';
    const layer = document.createElement('div');
    layer.className = 'doodle-layer';
    layer.setAttribute('aria-hidden', 'true');
    document.body.prepend(layer);

    let seed = 1;
    const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    const pick = (list) => list[Math.floor(rand() * list.length)];
    let lastKey = '';

    function build() {
      const w = document.documentElement.clientWidth;
      const h = document.documentElement.scrollHeight;
      const key = w + 'x' + Math.round(h / 200);
      if (key === lastKey) return;
      lastKey = key;

      const small = w < 720;
      const cell = small ? 96 : 130;
      const minSize = small ? 26 : 32;
      const extra = small ? 24 : 40;
      seed = 7; // same layout on every visit
      layer.style.height = h + 'px';

      // Keep doodles off text, photos and buttons so everything stays readable.
      // Extra room above each block covers content that is still sliding up into place.
      const pad = small ? 6 : 10;
      const blocked = [...document.querySelectorAll('main h1, main h2, main h3, main p, main li, main dt, main dd, main blockquote, main img, main .btn, main .card, main .demo, main svg:not(.icon), .marquee, .site-header')]
        .map((el) => el.getBoundingClientRect())
        .filter((r) => r.width && r.height)
        .map((r) => ({ l: r.left - pad, t: r.top + window.scrollY - pad - 30, r: r.right + pad, b: r.bottom + window.scrollY + pad }));
      // Test a slightly larger box: tilting and the slow drift both grow the area a doodle covers
      const isFree = (l, t, bw, bh) => {
        const x0 = l - bw * 0.2, x1 = l + bw * 1.2, y0 = t - bh * 0.2 - 16, y1 = t + bh * 1.2;
        return l > -bw / 2 && l + bw < w + bw / 2 &&
          !blocked.some((b) => x0 < b.r && x1 > b.l && y0 < b.b && y1 > b.t);
      };

      const frag = document.createDocumentFragment();
      let row = 0, n = 0;

      for (let y = 30; y < h - 50; y += cell * 0.75, row++) {
        const shiftX = (row % 2) * cell / 2;
        for (let x = -cell / 3 + shiftX; x < w; x += cell) {
          if (rand() < 0.1) continue; // leave natural gaps
          const left = x + rand() * cell * 0.5;
          const top = y + rand() * cell * 0.4;
          const tilt = ((rand() - 0.5) * 36).toFixed(1);
          const isText = rand() < 0.3;
          const motion = (n % 3 === 0 ? ' drifts' : '') + (n % 6 === 0 ? ' slow' : '');
          let el;

          if (isText) {
            const text = pick(FORMULAS);
            const fs = (small ? 12 : 14) + rand() * (small ? 6 : 9);
            const bw = text.length * fs * 0.66, bh = fs * 1.4;
            if (!isFree(left, top, bw, bh)) continue;
            el = document.createElement('span');
            el.className = 'doodle doodle-text' + motion;
            el.textContent = text;
            el.style.fontSize = fs.toFixed(1) + 'px';
          } else {
            const name = pick(NAMES);
            const size = minSize + rand() * extra;
            if (!isFree(left, top, size, size)) continue;
            el = document.createElementNS(SVG_NS, 'svg');
            el.setAttribute('class', 'doodle' + motion);
            el.style.width = size + 'px';
            el.style.height = size + 'px';
            const use = document.createElementNS(SVG_NS, 'use');
            use.setAttribute('href', '#d-' + name);
            el.appendChild(use);
          }

          el.style.left = left + 'px';
          el.style.top = top + 'px';
          el.style.setProperty('--r', tilt + 'deg');
          frag.appendChild(el);
          n++;
        }
      }
      layer.replaceChildren(frag);
    }

    build();
    let timer;
    const rebuild = () => { clearTimeout(timer); timer = setTimeout(build, 150); };
    window.addEventListener('resize', rebuild);
    window.addEventListener('load', rebuild);
    if (document.fonts) document.fonts.ready.then(rebuild);
    if ('ResizeObserver' in window) new ResizeObserver(rebuild).observe(document.querySelector('main'));
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
     Gentle magnetic buttons
     ------------------------------------------------------------------ */
  if (finePointer && !reduceMotion) {
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
     Email-only contact: every booking and contact button opens a
     pre-filled Gmail message to Amar sir in a new tab.
     ------------------------------------------------------------------ */
  function enquiryBody(interest, batch) {
    return [
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
  }
  const enquirySubject = (interest) => (interest ? 'Enquiry: ' + interest : 'Enquiry for Amar sir');

  const gmailUrl = (subject, body) => 'https://mail.google.com/mail/?view=cm&fs=1' +
    '&to=' + encodeURIComponent(CONFIG.email) +
    '&su=' + encodeURIComponent(subject) +
    '&body=' + encodeURIComponent(body);
  const mailtoUrl = (subject, body) => 'mailto:' + CONFIG.email +
    '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);

  const toGmail = (a, interest, batch) => {
    a.href = gmailUrl(enquirySubject(interest), enquiryBody(interest, batch));
    a.target = '_blank';
    a.rel = 'noopener';
  };

  document.querySelectorAll('[data-email-text]').forEach((el) => { el.textContent = CONFIG.email; });
  document.querySelectorAll('[data-mail]').forEach((a) => toGmail(a));
  document.querySelectorAll('[data-interest]').forEach((a) => toGmail(a, a.dataset.interest));
  document.querySelectorAll('[data-mailto]').forEach((a) => { a.href = mailtoUrl(enquirySubject(), enquiryBody()); });

  // The batch link carries whichever batch size is selected at the moment of the click
  const batchLink = document.querySelector('[data-batch-link]');
  if (batchLink) {
    const syncBatch = () => {
      const chosen = document.querySelector('input[name="batch"]:checked');
      toGmail(batchLink, 'Classes', chosen ? chosen.value : '');
    };
    syncBatch();
    document.querySelectorAll('input[name="batch"]').forEach((r) => r.addEventListener('change', syncBatch));
  }

  const copyBtn = document.querySelector('[data-copy-email]');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
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

  /* Custom course builder */
  const customForm = document.getElementById('custom-course');
  if (customForm) {
    const summary = customForm.querySelector('.custom-summary');
    const picked = (name) => [...customForm.querySelectorAll('input[name="' + name + '"]:checked')].map((i) => i.value);

    const describe = () => {
      const subjects = picked('subject');
      const level = picked('level')[0];
      const focus = picked('focus');
      summary.classList.remove('is-warn');
      if (!subjects.length) { summary.textContent = 'Select at least one subject.'; return; }
      summary.textContent = subjects.join(', ') +
        (level ? ' for ' + level : '') +
        (focus.length ? ', focus on ' + focus.join(', ').toLowerCase() : '') + '.';
    };
    customForm.addEventListener('change', describe);

    customForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const subjects = picked('subject');
      if (!subjects.length) {
        summary.textContent = 'Please select at least one subject.';
        summary.classList.add('is-warn');
        return;
      }
      const body = [
        'Hello Amar sir,',
        '',
        'I would like a custom course.',
        '',
        'Subjects: ' + subjects.join(', '),
        'Class: ' + (picked('level')[0] || ''),
        'Focus: ' + picked('focus').join(', '),
        '',
        'Student name: ',
        'Batch (one-to-one / small batch / custom): ',
        'Country / time zone: ',
        '',
        'Message: ',
        ''
      ].join('\n');
      window.open(gmailUrl('Custom course: ' + subjects.join(', '), body), '_blank', 'noopener');
    });
  }

  /* Current year in the footer */
  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  /* Floating email button hides once the contact section is on screen */
  const mailFloat = document.querySelector('.mail-float');
  const contact = document.getElementById('contact');
  if (hasIO && mailFloat && contact) {
    new IntersectionObserver(([entry]) => {
      mailFloat.classList.toggle('is-hidden', entry.isIntersecting);
    }, { threshold: 0.1 }).observe(contact);
  }
})();
