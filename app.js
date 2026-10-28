(function(){
  "use strict";
  const DATA = window.SITE_DATA || { articles: [], posts: [], regs: [], bloggers: [] };

  /* ---------------- Scroll progress + header shadow ---------------- */
  const progress = document.getElementById('scrollProgress');
  const header = document.getElementById('siteHeader');
  const toTop = document.getElementById('toTop');
  function onScroll(){
    const h = document.documentElement;
    const scrolled = h.scrollTop;
    const max = h.scrollHeight - h.clientHeight;
    const pct = max > 0 ? (scrolled / max) * 100 : 0;
    if (progress) progress.style.width = pct + '%';
    if (header) header.classList.toggle('scrolled', scrolled > 10);
    if (toTop) toTop.classList.toggle('show', scrolled > 600);
  }
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if (toTop) toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* ---------------- Floating particle dots in bg-field zones ---------------- */
  // Skip the footer: it's the last thing on the page, and these dots spawn a little
  // below the field's own bottom edge before drifting up - inside the footer (whose
  // glow is pinned flush to the real page bottom) that extra travel room would poke
  // past the page's true end and open up blank scrollable space below it.
  document.querySelectorAll('.bg-field').forEach(field => {
    if (field.closest('footer.site-footer')) return;
    const n = 7;
    for (let i = 0; i < n; i++) {
      const dot = document.createElement('span');
      dot.className = 'bg-dot';
      const size = 3 + Math.random() * 5;
      dot.style.width = size + 'px';
      dot.style.height = size + 'px';
      dot.style.left = (Math.random() * 100) + '%';
      dot.style.bottom = (-10 - Math.random() * 20) + 'px';
      dot.style.animationDuration = (10 + Math.random() * 14) + 's';
      dot.style.animationDelay = (Math.random() * 10) + 's';
      field.appendChild(dot);
    }
  });

  /* ---------------- Mobile menu ---------------- */
  const menuToggle = document.getElementById('menuToggle');
  const mainNav = document.getElementById('mainNav');
  if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', () => {
      const open = mainNav.style.display === 'flex';
      mainNav.style.cssText = open ? '' : 'display:flex; position:fixed; top:64px; left:16px; right:16px; flex-direction:column; background:#fff; border-radius:20px; padding:10px; box-shadow:0 20px 50px -12px rgba(0,0,0,.25); z-index:1200;';
    });
    mainNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { if (window.innerWidth <= 980) mainNav.style.display = ''; }));
  }

  /* ---------------- Reveal on scroll ---------------- */
  const revealEls = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  revealEls.forEach(el => io.observe(el));

  /* ---------------- Animated counters ---------------- */
  function animateCount(el) {
    const target = parseFloat(el.getAttribute('data-count'));
    const suffix = el.getAttribute('data-suffix') || '';
    const dur = 1400;
    const start = performance.now();
    function step(now) {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      const val = Math.round(target * eased);
      el.textContent = val.toLocaleString('ru-RU') + suffix;
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  const counters = document.querySelectorAll('[data-count]');
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        animateCount(e.target);
        countIO.unobserve(e.target);
      }
    });
  }, { threshold: 0.4 });
  counters.forEach(c => countIO.observe(c));

  /* ---------------- Scrollspy (header nav + side nav) ---------------- */
  const sections = ['hero','pillars','articles','bloggers','forums','roadmap'].map(id => document.getElementById(id)).filter(Boolean);
  const navLinks = document.querySelectorAll('nav.main-nav a, .side-nav a');
  const mainNavEl = document.querySelector('nav.main-nav');
  const navPill = document.getElementById('navPill');
  function moveNavPill() {
    if (!navPill || !mainNavEl) return;
    const active = mainNavEl.querySelector('a.active');
    if (!active) { navPill.classList.remove('show'); return; }
    const navRect = mainNavEl.getBoundingClientRect();
    const r = active.getBoundingClientRect();
    navPill.style.width = r.width + 'px';
    navPill.style.transform = `translateX(${r.left - navRect.left}px)`;
    navPill.classList.add('show');
  }
  function updateSpy() {
    let current = sections[0] ? sections[0].id : '';
    const probe = window.scrollY + window.innerHeight * 0.3;
    sections.forEach(s => { if (s.offsetTop <= probe) current = s.id; });
    navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('data-sec') === current));
    moveNavPill();
  }
  document.addEventListener('scroll', updateSpy, { passive: true });
  window.addEventListener('resize', moveNavPill);
  updateSpy();
  // Fonts/layout can still be settling on first paint - snap the pill into place once more.
  window.addEventListener('load', moveNavPill);
  setTimeout(moveNavPill, 300);

  /* ---------------- Roadmap timeline: scroll-driven progress fill + staircase reveal ---------------- */
  const crumbTimeline = document.getElementById('crumbTimeline');
  const crumbFill = document.getElementById('crumbFill');
  const crumbItems = crumbTimeline ? Array.from(crumbTimeline.querySelectorAll('.crumb-item')) : [];
  function updateCrumbFill(){
    if (!crumbTimeline || !crumbFill) return;
    const rect = crumbTimeline.getBoundingClientRect();
    const vh = window.innerHeight;
    const total = rect.height;
    const visibleStart = vh * 0.82;
    const visibleEnd = vh * 0.3;
    let progress = (visibleStart - rect.top) / (visibleStart - (visibleEnd - total));
    progress = Math.max(0, Math.min(1, progress));
    // Guarantee the line always reaches 100% once the page is scrolled to (or
    // past) the bottom, even if the geometric formula above falls just short.
    const doc = document.documentElement;
    const atBottom = (window.scrollY + window.innerHeight) >= (doc.scrollHeight - 24);
    if (atBottom) progress = 1;
    const fillPx = progress * total;
    crumbFill.style.height = fillPx + 'px';
  }
  document.addEventListener('scroll', updateCrumbFill, { passive: true });
  window.addEventListener('resize', updateCrumbFill);
  updateCrumbFill();

  /* ---------------- Articles table ---------------- */
  let state = { status: 'all', dir: 'all', q: '' };

  function linkIcon(url) {
    if (!url) return '';
    return `<a class="link-ico" href="${url}" target="_blank" rel="noopener" title="Открыть публикацию">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7"/><path d="M8 7h9v9"/></svg>
    </a>`;
  }

  function renderArticles() {
    const body = document.getElementById('articlesBody');
    const countEl = document.getElementById('articlesCount');
    if (!body) return;
    const rows = DATA.articles.filter(a => {
      if (state.status !== 'all' && a.status !== state.status) return false;
      if (state.dir !== 'all' && a.dir !== state.dir) return false;
      if (state.q && !a.topic.toLowerCase().includes(state.q.toLowerCase())) return false;
      return true;
    });
    body.innerHTML = rows.map(a => {
      const topic = a.topic && a.topic !== '-' ? a.topic : '<span style="color:var(--ink-faint)">— ответ на форуме / вопрос —</span>';
      return `<tr>
        <td class="td-num">${a.n}</td>
        <td>${a.date || ''}</td>
        <td><span class="platform-pill">${a.dir || '—'}</span></td>
        <td class="td-topic">${topic}</td>
        <td><span class="platform-pill">${a.platform || '—'}</span></td>
        <td>${linkIcon(a.pub)}</td>
      </tr>`;
    }).join('');
    countEl.textContent = `${rows.length} из ${DATA.articles.length} материалов`;
  }

  document.getElementById('statusSeg')?.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    document.querySelectorAll('#statusSeg button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.status = btn.getAttribute('data-status');
    renderArticles();
  });
  document.getElementById('dirChips')?.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    document.querySelectorAll('#dirChips .chip').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.dir = btn.getAttribute('data-dir');
    renderArticles();
  });
  document.getElementById('articleSearch')?.addEventListener('input', (e) => {
    state.q = e.target.value;
    renderArticles();
  });
  renderArticles();

  /* ---------------- Platforms: forum presence + registrations ---------------- */
  function platformInitial(name) {
    return (name || '?').trim().charAt(0).toUpperCase();
  }
  const chevron = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>`;

  function faviconFor(url) {
    try { return 'https://www.google.com/s2/favicons?sz=64&domain=' + new URL(url).hostname; }
    catch (e) { return ''; }
  }

  function renderForums() {
    const grid = document.getElementById('forumGrid');
    if (!grid) return;
    const byPlatform = {};
    DATA.posts.forEach(p => {
      const key = p.platform || 'Другое';
      (byPlatform[key] = byPlatform[key] || []).push(p);
    });
    const order = Object.keys(byPlatform).sort((a,b) => byPlatform[b].length - byPlatform[a].length);
    grid.innerHTML = order.map(platform => {
      const posts = byPlatform[platform];
      const main = posts[0];
      const rest = posts.slice(1);
      const restItems = rest.map(p => `<a href="${p.pub}" target="_blank" rel="noopener"><span class="n">#${p.n}</span><span class="t">${p.topic}</span></a>`).join('');
      const detailsBlock = rest.length ? `
        <details>
          <summary>${chevron} Ещё ${rest.length} ${rest.length === 1 ? 'публикация' : 'публикаций'}</summary>
          <div class="post-list">${restItems}</div>
        </details>` : '';
      const favicon = faviconFor(main.pub);
      const letter = platformInitial(platform);
      const favImg = favicon
        ? `<img src="${favicon}" alt="" onerror="this.replaceWith(Object.assign(document.createElement('span'),{textContent:'${letter}'}))">`
        : letter;
      return `<div class="connect-card">
        <div class="top-row">
          <div class="favicon">${favImg}</div>
          <div>
            <h4>${platform}</h4>
            <div class="count">${posts.length} ${posts.length === 1 ? 'публикация' : 'публикаций'}</div>
          </div>
        </div>
        <a class="primary-link" href="${main.pub}" target="_blank" rel="noopener">
          <span class="t">${main.topic}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M7 17L17 7"/><path d="M8 7h9v9"/></svg>
        </a>
        ${detailsBlock}
      </div>`;
    }).join('');
  }
  renderForums();

  function renderRegs() {
    const grid = document.getElementById('regGrid');
    if (!grid) return;
    grid.innerHTML = DATA.regs.map(r => {
      let host = r.profile;
      try { host = new URL(r.profile).hostname.replace('www.',''); } catch(e){}
      return `<a class="reg-chip" href="${r.profile}" target="_blank" rel="noopener">
        <span class="dot"></span>
        ${host}
        <span class="go">${chevron}</span>
      </a>`;
    }).join('');
  }
  renderRegs();

  /* ---------------- Blogger carousel with inline video playback ---------------- */
  const PLAT_ICON = {
    yt: `<svg width="21" height="21" viewBox="0 0 24 24" fill="#FF0000"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4L15.8 12Z"/></svg>`,
    tt: `<svg width="21" height="21" viewBox="0 0 24 24" fill="none">
      <path d="M16.9 2.3h-3.4v14.4a3.1 3.1 0 1 1-2.2-3V10.1a6.5 6.5 0 1 0 5.6 6.4V9.1a8.3 8.3 0 0 0 4.9 1.6V7.4a5 5 0 0 1-4.9-5.1Z" fill="#25F4EE" transform="translate(-0.9,0.9)"/>
      <path d="M16.9 2.3h-3.4v14.4a3.1 3.1 0 1 1-2.2-3V10.1a6.5 6.5 0 1 0 5.6 6.4V9.1a8.3 8.3 0 0 0 4.9 1.6V7.4a5 5 0 0 1-4.9-5.1Z" fill="#FE2C55" transform="translate(0.9,-0.9)"/>
      <path d="M16.9 2.3h-3.4v14.4a3.1 3.1 0 1 1-2.2-3V10.1a6.5 6.5 0 1 0 5.6 6.4V9.1a8.3 8.3 0 0 0 4.9 1.6V7.4a5 5 0 0 1-4.9-5.1Z" fill="#111"/>
    </svg>`,
    ig: `<svg width="21" height="21" viewBox="0 0 24 24" fill="none">
      <defs><linearGradient id="igGrad" x1="0" y1="24" x2="24" y2="0"><stop offset="0" stop-color="#FFDD55"/><stop offset=".3" stop-color="#FF543E"/><stop offset=".6" stop-color="#C837AB"/><stop offset="1" stop-color="#5B51D8"/></linearGradient></defs>
      <rect x="2.3" y="2.3" width="19.4" height="19.4" rx="6" fill="url(#igGrad)"/>
      <circle cx="12" cy="12" r="4.6" fill="none" stroke="#fff" stroke-width="1.8"/>
      <circle cx="17.3" cy="6.7" r="1.15" fill="#fff"/>
    </svg>`,
  };
  const gradients = ['linear-gradient(160deg,#007bff,#7b62ff)','linear-gradient(160deg,#17c583,#007bff)','linear-gradient(160deg,#ff4d4f,#7b62ff)','linear-gradient(160deg,#7b62ff,#1485ff)','linear-gradient(160deg,#ffb020,#ff4d4f)'];

  function renderCarousel() {
    const track = document.getElementById('carTrack');
    const dots = document.getElementById('carDots');
    const units = document.getElementById('unitsStrip');
    if (!track) return;
    track.innerHTML = DATA.bloggers.map((b, i) => `
      <div class="blogger-card" data-idx="${i}">
        <div class="phone-frame">
          <div class="phone-screen">
            <div class="ph-poster" data-play="${i}" ${!b.poster ? `style="background:${gradients[i % gradients.length]}"` : ''}>
              ${b.poster ? `<img class="poster-img" src="${b.poster}" alt="">` : ''}
              <div class="poster-overlay"></div>
              <div class="plat-icon">${PLAT_ICON[b.icon] || ''}</div>
              <div class="reach">${b.reachLabel}</div>
              <div class="reach-lbl">просмотров</div>
              <div class="play-ring">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              </div>
            </div>
          </div>
          <img class="frame-png" src="assets/iphone-frame.png" alt="">
        </div>
        <div class="blogger-meta">
          <div class="name">${b.name}</div>
          <div class="plat">${b.platform}${b.units > 1 ? ' · ' + b.units + ' публикаций' : ''}</div>
          <a class="orig-link" href="${b.link}" target="_blank" rel="noopener">
            Открыть оригинал
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7"/><path d="M8 7h9v9"/></svg>
          </a>
        </div>
      </div>
    `).join('');
    dots.innerHTML = DATA.bloggers.map((_, i) => `<span class="${i === 0 ? 'active' : ''}"></span>`).join('');

    // Click a phone card: if a real local video is attached, open it fullscreen in the
    // enlarged phone lightbox and autoplay; otherwise fall back to the original link.
    const lightbox = document.getElementById('videoLightbox');
    const vlVideo = document.getElementById('vlVideo');
    const vlCap = document.getElementById('vlCap');
    const vlClose = document.getElementById('vlClose');
    const vlPauseIco = document.getElementById('vlPauseIco');

    function openLightbox(b) {
      vlVideo.src = b.video;
      vlCap.innerHTML = `${b.name} · ${b.reachLabel} просмотров · <a href="${b.link}" target="_blank" rel="noopener">оригинал</a>`;
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
      document.body.classList.add('lightbox-open');
      vlVideo.currentTime = 0;
      vlVideo.play().catch(() => {});
      vlPauseIco?.classList.remove('show');
    }
    // No native <video controls> here on purpose: on iOS/Android those draw their own
    // AirPlay/picture-in-picture/volume icons near the top edge of the video, which get
    // clipped by this screen's rounded-corner mask. Tap-to-pause (like a reels/stories
    // player) replaces them instead.
    vlVideo?.addEventListener('click', () => {
      if (vlVideo.paused) { vlVideo.play().catch(() => {}); vlPauseIco?.classList.remove('show'); }
      else { vlVideo.pause(); vlPauseIco?.classList.add('show'); }
    });
    function closeLightbox() {
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
      document.body.classList.remove('lightbox-open');
      vlVideo.pause();
      setTimeout(() => { vlVideo.removeAttribute('src'); vlVideo.load(); }, 300);
    }
    vlClose?.addEventListener('click', closeLightbox);
    lightbox?.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });

    track.querySelectorAll('.ph-poster').forEach(poster => {
      poster.addEventListener('click', () => {
        const idx = +poster.getAttribute('data-play');
        const b = DATA.bloggers[idx];
        if (b.video) {
          openLightbox(b);
        } else {
          window.open(b.link, '_blank', 'noopener');
        }
      });
    });

    const cards = track.querySelectorAll('.blogger-card');
    function syncDots() {
      const trackRect = track.getBoundingClientRect();
      let closest = 0, closestDist = Infinity;
      cards.forEach((c, i) => {
        const r = c.getBoundingClientRect();
        const dist = Math.abs((r.left + r.width/2) - (trackRect.left + trackRect.width/2));
        if (dist < closestDist) { closestDist = dist; closest = i; }
      });
      dots.querySelectorAll('span').forEach((d, i) => d.classList.toggle('active', i === closest));
    }
    track.addEventListener('scroll', () => requestAnimationFrame(syncDots), { passive: true });

    // Click-and-drag scrolling for desktop (mouse), native touch/trackpad scroll still works.
    // Pointer capture is only engaged once real movement is detected - capturing it on every
    // pointerdown (even a plain click with zero movement) retargets the matching pointerup/
    // mouseup/click to the track itself instead of the element under the cursor, which is
    // why taps on a phone card or "Открыть оригинал" used to do nothing.
    let isDown = false, startX = 0, startScroll = 0, moved = false, pid = null;
    track.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') return; // let native touch scrolling handle it
      if (window.innerWidth >= 900) return; // static grid on desktop, nothing to drag
      isDown = true; moved = false; pid = e.pointerId;
      startX = e.clientX; startScroll = track.scrollLeft;
    });
    track.addEventListener('pointermove', (e) => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 4) {
        moved = true;
        track.classList.add('dragging');
        try { track.setPointerCapture(pid); } catch (_) {}
      }
      if (moved) track.scrollLeft = startScroll - dx;
    });
    function endDrag(e){
      if (!isDown) return;
      isDown = false;
      track.classList.remove('dragging');
      if (moved && pid != null) { try { track.releasePointerCapture(pid); } catch (_) {} }
    }
    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointerleave', endDrag);
    track.addEventListener('click', (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); } moved = false; }, true);

    function cardStep(){
      const c = cards[0];
      if (!c) return 260;
      const style = getComputedStyle(track);
      return c.getBoundingClientRect().width + parseFloat(style.gap || 28);
    }
    document.getElementById('carPrev')?.addEventListener('click', () => {
      track.scrollBy({ left: -cardStep(), behavior: 'smooth' });
    });
    document.getElementById('carNext')?.addEventListener('click', () => {
      track.scrollBy({ left: cardStep(), behavior: 'smooth' });
    });

    const insyld = DATA.insyld;
    const pillsData = insyld ? DATA.bloggers.concat([insyld]) : DATA.bloggers;
    units.innerHTML = pillsData.map(b => `
      <div class="unit-pill">
        <span class="av">${b.name.charAt(0)}</span>
        <span>${b.name.split(' (')[0]}</span>
        <span class="ct">${b.units} ${b.units === 1 ? 'публикация' : 'публикаций'} · ${b.reach.toLocaleString('ru-RU')} охват</span>
      </div>
    `).join('');

    renderInsyldPosts();
  }

  function renderInsyldPosts() {
    const wrap = document.getElementById('insyldBlock');
    const insyld = DATA.insyld;
    if (!wrap || !insyld || !insyld.posts || !insyld.posts.length) return;
    const main = insyld.posts[0];
    const rest = insyld.posts.slice(1);
    const restItems = rest.map((p, i) => `<a href="${p.link}" target="_blank" rel="noopener"><span class="n">#${i + 2}</span><span class="t">${p.reach.toLocaleString('ru-RU')} просмотров</span></a>`).join('');
    const detailsBlock = rest.length ? `
      <details>
        <summary>${chevron} Ещё ${rest.length} публикаций</summary>
        <div class="post-list">${restItems}</div>
      </details>` : '';
    wrap.innerHTML = `
      <div class="connect-card insyld-card">
        <div class="top-row">
          <div class="favicon">${PLAT_ICON.tt || 'T'}</div>
          <div>
            <h4>${insyld.name}</h4>
            <div class="count">${insyld.platform} · ${insyld.units} публикаций · суммарно ${insyld.reach.toLocaleString('ru-RU')} просмотров</div>
          </div>
        </div>
        <a class="primary-link" href="${main.link}" target="_blank" rel="noopener">
          <span class="t">#1 · ${main.reach.toLocaleString('ru-RU')} просмотров</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M7 17L17 7"/><path d="M8 7h9v9"/></svg>
        </a>
        ${detailsBlock}
      </div>`;
  }
  renderCarousel();

  /* ---------------- Custom cursor: glow + ring that trail the pointer, ---------------- */
  /* tinted per section, plus a light sparkle trail while moving.          */
  (function cursorFX(){
    if (!window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;
    const glow = document.getElementById('cursorGlow');
    const ring = document.getElementById('cursorRing');
    if (!glow || !ring) return;
    document.documentElement.classList.add('has-cursor-fx'); // hides the native OS pointer - our ring is the only cursor now

    let mx = window.innerWidth/2, my = window.innerHeight/2;
    let gx = mx, gy = my, rx = mx, ry = my;
    let active = false, lastTrail = 0;

    const accentSections = Array.from(document.querySelectorAll('section[data-accent]'));
    let currentAccent = '#007bff';
    function hexToRgba(hex, a){
      const h = hex.replace('#','');
      const r = parseInt(h.substring(0,2),16), g = parseInt(h.substring(2,4),16), b = parseInt(h.substring(4,6),16);
      return `rgba(${r},${g},${b},${a})`;
    }
    function updateAccent(){
      const probe = window.scrollY + window.innerHeight * 0.4;
      let acc = currentAccent;
      accentSections.forEach(s => { if (s.offsetTop <= probe) acc = s.getAttribute('data-accent'); });
      if (acc !== currentAccent) {
        currentAccent = acc;
        glow.style.setProperty('--cg', hexToRgba(acc, 0.16));
        ring.style.setProperty('--cr', hexToRgba(acc, 0.6));
      }
    }
    updateAccent();
    document.addEventListener('scroll', updateAccent, { passive: true });

    function spawnTrail(x, y){
      const dot = document.createElement('div');
      dot.className = 'cursor-dot';
      const size = 3 + Math.random()*3;
      dot.style.width = size + 'px';
      dot.style.height = size + 'px';
      dot.style.left = x + 'px';
      dot.style.top = y + 'px';
      dot.style.background = hexToRgba(currentAccent, .7);
      document.body.appendChild(dot);
      let op = .6, s = 1;
      const t0 = performance.now();
      function tick(now){
        const t = (now - t0) / 700;
        if (t >= 1) { dot.remove(); return; }
        dot.style.opacity = (1 - t) * .6;
        dot.style.transform = `translate(-50%,-50%) translateY(${-18*t}px) scale(${1 - t*0.6})`;
        requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }

    window.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      if (!active) { active = true; glow.classList.add('show'); ring.classList.add('show'); }
      const now = performance.now();
      if (now - lastTrail > 55) { lastTrail = now; spawnTrail(mx, my); }
    }, { passive: true });
    window.addEventListener('mouseleave', () => { active = false; glow.classList.remove('show'); ring.classList.remove('show'); });

    document.addEventListener('mouseover', (e) => {
      const interactive = e.target.closest('a, button, .pillar-item, .stat-card, .connect-card, .reg-chip, .ph-poster, .btn, .chip, summary');
      ring.classList.toggle('big', !!interactive);
      // Fade the cursor down while it sits over a line of text so it never visually
      // covers a word or a number as the mouse trails across a paragraph.
      const overText = !interactive && e.target.closest('p, h2, h3, h4, .mini-tag, .section-sub');
      ring.classList.toggle('dim', !!overText);
      glow.classList.toggle('dim', !!overText);
    });

    function raf(){
      gx += (mx - gx) * 0.09; gy += (my - gy) * 0.09;
      rx += (mx - rx) * 0.22; ry += (my - ry) * 0.22;
      glow.style.transform = `translate(${gx}px, ${gy}px) translate(-50%,-50%)`;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`;
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  })();

})();
