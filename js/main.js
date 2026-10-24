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
     Email-only contact
     ------------------------------------------------------------------ */
  const mailStatus = document.querySelector('.mail-status');

  function mailto(interest, batch) {
    const subject = interest ? 'Enquiry: ' + interest : 'Enquiry for Amar sir';
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
    mailStatus.textContent = 'The email address will be added here soon. Please check back later.';
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
