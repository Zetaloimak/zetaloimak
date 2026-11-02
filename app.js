/* app.js: page switching with animation, count-up numbers, scroll effects and mobile menu. */
(() => {
  'use strict';

  const PAGES = ['home', 'about', 'programmer', 'taekwondo'];
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const topbar = $('#topbar');
  const menuBtn = $('#menuBtn');
  const progress = $('.progress');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let timer = null;
  let booted = false;

  // Page switch: the old page fades out, then the new page fades in
  function show(page) {
    const next = $(`#view-${page}`);
    const prev = $$('.view').find(v => !v.hidden && v !== next);
    clearTimeout(timer);
    $$('.view').forEach(v => { if (v !== next && v !== prev) v.hidden = true; });
    if (!prev) { enter(next); return; }
    prev.classList.add('leaving');
    timer = setTimeout(() => { prev.hidden = true; enter(next); }, reduceMotion ? 0 : 250);
  }

  // Show a page and play its entrance animation
  function enter(el) {
    el.classList.remove('leaving', 'entering');
    el.hidden = false;
    void el.offsetWidth; // restarts the animation
    el.classList.add('entering');
    window.scrollTo({ top: 0, behavior: 'instant' });
    countUp(el);
    onScroll();
  }

  // Numbers in stat cards count up from 0
  function countUp(el) {
    if (reduceMotion) return;
    el.querySelectorAll('.stat b').forEach(b => {
      if (!b.dataset.to) b.dataset.to = b.textContent.trim();
      const to = Number(b.dataset.to);
      if (!Number.isInteger(to) || to > 999) return; // years like 2016 stay as they are
      const start = performance.now() + 250;
      const tick = now => {
        const t = Math.min(Math.max((now - start) / 1400, 0), 1);
        b.textContent = Math.round(to * (1 - (1 - t) ** 3));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  // Open the page named in the URL hash (#about, #programmer, #taekwondo). Default is home.
  function route() {
    const name = decodeURIComponent(location.hash.slice(1));
    const page = PAGES.includes(name) ? name : 'home';
    $$('.nav-links a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${page}`));
    if (!booted) {
      booted = true;
      $$('.view').forEach(v => { v.hidden = v.id !== `view-${page}`; });
      enter($(`#view-${page}`));
    } else {
      show(page);
    }
  }

  // Scroll progress bar and navbar shadow
  function onScroll() {
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    topbar.classList.toggle('scrolled', scrollY > 40);
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);

  // Stagger sibling cards so they appear one after another
  $$('.reveal').forEach(el => {
    if (el.style.getPropertyValue('--d')) return;
    const siblings = [...el.parentElement.children].filter(c => c.classList.contains('reveal'));
    el.style.setProperty('--d', `${(siblings.indexOf(el) % 4) * 0.09}s`);
  });

  // Fade in sections and draw timelines when they reach the screen
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        en.target.classList.add('in');
        obs.unobserve(en.target);
      }
    });
  }, { threshold: 0.15 });
  $$('.reveal, .timeline').forEach(el => io.observe(el));

  // Glow that follows the cursor on cards
  addEventListener('pointermove', e => {
    const tile = e.target.closest?.('.tile');
    if (!tile) return;
    const r = tile.getBoundingClientRect();
    tile.style.setProperty('--mx', `${e.clientX - r.left}px`);
    tile.style.setProperty('--my', `${e.clientY - r.top}px`);
  }, { passive: true });

  // Mobile menu
  menuBtn.addEventListener('click', () => {
    const open = topbar.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  $$('.nav-links a').forEach(a => a.addEventListener('click', () => {
    topbar.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
  }));

  $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

  addEventListener('hashchange', route);
  route();
})();