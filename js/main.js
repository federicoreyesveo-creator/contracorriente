/* Contracorriente · interacción y movimiento */
(function () {
  'use strict';

  /* ---------------------------------------------------------------------
     CONFIGURACIÓN DEL CLIENTE
     Pon aquí el número con código de país, sin + ni espacios: 5215512345678
     --------------------------------------------------------------------- */
  const CONFIG = {
    whatsapp: '',
    mensaje: 'Hola Contracorriente, quiero reservar una mesa.'
  };

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  const { gsap, ScrollTrigger, SplitText, Lenis } = window;
  const hasGsap = !!(gsap && ScrollTrigger);
  const motion = hasGsap && !calm;
  if (hasGsap) gsap.registerPlugin(...[ScrollTrigger, SplitText].filter(Boolean));

  /* ---------------------------------------------------------------------
     Datos: enlaces
     --------------------------------------------------------------------- */
  const waUrl = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(CONFIG.mensaje)}`;
  $$('[data-wa]').forEach(a => { a.href = waUrl; });
  $('#year').textContent = new Date().getFullYear();


  /* ---------------------------------------------------------------------
     Scroll suave
     --------------------------------------------------------------------- */
  let lenis = null;
  if (motion && Lenis) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const stopScroll = () => { lenis ? lenis.stop() : document.documentElement.style.setProperty('overflow', 'hidden'); };
  const startScroll = () => { lenis ? lenis.start() : document.documentElement.style.removeProperty('overflow'); };

  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = $(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      closeMobile();
      if (lenis) lenis.scrollTo(target, { offset: target.id === 'inicio' ? 0 : -8, duration: 1.4 });
      else target.scrollIntoView({ behavior: calm ? 'auto' : 'smooth' });
      header.classList.remove('is-hidden');
      history.pushState(null, '', a.getAttribute('href'));
    });
  });

  /* ---------------------------------------------------------------------
     Header: se esconde al bajar, vuelve al subir, y marca la sección
     --------------------------------------------------------------------- */
  const header = $('#header');

  const heroEl = $('#inicio');
  const paintHeader = () => header.classList.toggle('is-solid', scrollY > heroEl.offsetHeight - 90);
  addEventListener('scroll', paintHeader, { passive: true });
  addEventListener('resize', paintHeader);
  paintHeader();

  const navLinks = $$('.navlink');
  function setActive(id) {
    navLinks.forEach(l => {
      const on = l.dataset.nav === id;
      l.classList.toggle('is-active', on);
      if (on) l.setAttribute('aria-current', 'true'); else l.removeAttribute('aria-current');
    });
  }
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => {
      es.forEach(e => { if (e.isIntersecting) setActive(e.target.dataset.section); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('[data-section]').forEach(s => io.observe(s));
  }

  /* Menú móvil */
  const burger = $('#burger');
  const mobileNav = $('#mobileNav');
  let menuOpen = false;
  function closeMobile() {
    if (!menuOpen) return;
    menuOpen = false;
    mobileNav.classList.remove('is-open');
    header.classList.remove('is-menu');
    mobileNav.inert = true;
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Abrir menú');
    startScroll();
  }
  burger.addEventListener('click', () => {
    if (menuOpen) { closeMobile(); return; }
    menuOpen = true;
    mobileNav.classList.add('is-open');
    header.classList.add('is-menu');
    mobileNav.inert = false;
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Cerrar menú');
    stopScroll();
  });
  addEventListener('keydown', e => { if (e.key === 'Escape') closeMobile(); });

  /* ---------------------------------------------------------------------
     Pestañas de la carta y plato giratorio
     --------------------------------------------------------------------- */
  const tabs = $$('.tab');
  const tabsInk = $('#tabsInk');
  const plate = $('#cartaPlate');
  const plateImgs = plate ? $$('img', plate) : [];
  const plateCaption = $('#cartaCaption');
  let plateSlug = 'contracorriente-6';

  function moveInk(tab, instant) {
    const props = { x: tab.offsetLeft, y: tab.offsetTop, width: tab.offsetWidth, height: tab.offsetHeight };
    if (hasGsap && motion && !instant) gsap.to(tabsInk, { ...props, duration: .6, ease: 'expo.out' });
    else if (hasGsap) gsap.set(tabsInk, props);
    else { tabsInk.style.width = props.width + 'px'; tabsInk.style.height = props.height + 'px'; tabsInk.style.transform = `translate(${props.x}px,${props.y}px)`; }
  }

  function setPlate(slug, caption) {
    if (!slug || slug === plateSlug || !plateImgs.length) return;
    plateSlug = slug;
    const [a, b] = plateImgs[0].classList.contains('is-on') ? plateImgs : [plateImgs[1], plateImgs[0]];
    b.src = `img/${slug}-plato.webp`;
    b.alt = caption || '';
    b.removeAttribute('aria-hidden');
    a.setAttribute('aria-hidden', 'true');
    plate.dataset.zoom = `img/${slug}.webp`;
    plate.dataset.caption = caption || '';
    plateCaption.textContent = caption || '';
    a.classList.remove('is-on');
    b.classList.add('is-on');
    a.style.zIndex = 1; b.style.zIndex = 2;
    if (motion) {
      gsap.killTweensOf(b);
      gsap.fromTo(b, { clipPath: 'circle(0% at 50% 50%)', scale: 1.12 },
        { clipPath: 'circle(71% at 50% 50%)', scale: 1, duration: .85, ease: 'expo.out' });
    } else {
      b.style.clipPath = 'circle(71% at 50% 50%)';
    }
  }

  function selectTab(tab, focus) {
    tabs.forEach(t => {
      const on = t === tab;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      $('#' + t.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tab.focus();
    tab.scrollIntoView({ block: 'nearest', inline: 'center', behavior: calm ? 'auto' : 'smooth' });
    moveInk(tab);
    const panel = $('#' + tab.getAttribute('aria-controls'));
    setPlate(panel.dataset.plate, panel.dataset.caption);
    if (motion) {
      gsap.fromTo($$('.dish', panel), { autoAlpha: 0, y: 22 },
        { autoAlpha: 1, y: 0, duration: .6, stagger: .05, ease: 'power3.out', clearProps: 'all', onComplete: () => ScrollTrigger.refresh() });
    }
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => selectTab(t));
    t.addEventListener('keydown', e => {
      const move = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (move) { e.preventDefault(); selectTab(tabs[(i + move + tabs.length) % tabs.length], true); }
      if (e.key === 'Home') { e.preventDefault(); selectTab(tabs[0], true); }
      if (e.key === 'End') { e.preventDefault(); selectTab(tabs[tabs.length - 1], true); }
    });
  });
  $$('.dish[data-plate]').forEach(d => {
    const show = () => setPlate(d.dataset.plate, d.dataset.caption);
    d.addEventListener('pointerenter', show);
    d.addEventListener('focusin', show);
  });

  /* ---------------------------------------------------------------------
     Lightbox: toda imagen se abre y se cierra al tocarla
     --------------------------------------------------------------------- */
  const lb = $('#lightbox');
  const lbImg = $('#lbImg');
  const lbStage = $('#lbStage');
  const lbCaption = $('#lbCaption');
  let lbList = [];
  let lbIndex = 0;
  let lbOrigin = null;
  let lbBusy = false;

  const lbItems = () => {
    const seen = new Set();
    return $$('[data-zoom]').filter(el => {
      if (seen.has(el.dataset.zoom)) return false;
      seen.add(el.dataset.zoom);
      return true;
    }).map(el => ({ src: el.dataset.zoom, caption: el.dataset.caption || '', alt: el.dataset.caption || 'Platillo de Contracorriente' }));
  };

  function paintLb(i) {
    lbIndex = (i + lbList.length) % lbList.length;
    const item = lbList[lbIndex];
    lbImg.src = item.src;
    lbImg.alt = item.alt;
    lbCaption.textContent = item.caption;
    const next = new Image(); next.src = lbList[(lbIndex + 1) % lbList.length].src;
  }

  function rectDelta(from, to) {
    return {
      x: from.left + from.width / 2 - (to.left + to.width / 2),
      y: from.top + from.height / 2 - (to.top + to.height / 2),
      scale: Math.max(from.width / to.width, from.height / to.height)
    };
  }

  async function openLb(trigger) {
    if (lb.open || lbBusy) return;
    lbList = lbItems();
    lbIndex = Math.max(0, lbList.findIndex(it => it.src === trigger.dataset.zoom));
    lbOrigin = trigger;
    paintLb(lbIndex);
    lb.showModal();
    stopScroll();
    requestAnimationFrame(() => lb.classList.add('is-visible'));
    try { await lbImg.decode(); } catch (e) { /* la imagen igual se muestra */ }
    if (motion) {
      lbBusy = true;
      const d = rectDelta(trigger.getBoundingClientRect(), lbImg.getBoundingClientRect());
      gsap.fromTo(lbImg, { ...d, opacity: .6 }, { x: 0, y: 0, scale: 1, opacity: 1, duration: .7, ease: 'expo.out', onComplete: () => { lbBusy = false; } });
      gsap.fromTo([lbCaption, ...$$('.lb-btn', lb)], { opacity: 0 }, { opacity: 1, duration: .4, delay: .2 });
    }
  }

  function closeLb() {
    if (!lb.open) return;
    const finish = () => {
      lb.close();
      lb.classList.remove('is-visible');
      if (hasGsap) gsap.set(lbImg, { clearProps: 'all' });
      startScroll();
      if (lbOrigin && lbOrigin.isConnected) lbOrigin.focus({ preventScroll: true });
    };
    if (!motion) { finish(); return; }
    gsap.killTweensOf(lbImg);
    lb.classList.remove('is-visible');
    const sameImage = lbOrigin && lbOrigin.dataset.zoom === lbList[lbIndex].src;
    const r = lbOrigin ? lbOrigin.getBoundingClientRect() : null;
    const onScreen = r && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
    lbBusy = false;
    if (sameImage && onScreen) {
      gsap.to(lbImg, { ...rectDelta(r, lbImg.getBoundingClientRect()), opacity: .2, duration: .38, ease: 'power3.inOut', onComplete: finish });
    } else {
      gsap.to(lbImg, { scale: .92, opacity: 0, duration: .25, ease: 'power2.in', onComplete: finish });
    }
  }

  function stepLb(dir) {
    if (!lb.open) return;
    if (!motion) { paintLb(lbIndex + dir); return; }
    gsap.killTweensOf(lbImg);
    gsap.to(lbImg, {
      x: -60 * dir, opacity: 0, duration: .18, ease: 'power2.in',
      onComplete: () => {
        paintLb(lbIndex + dir);
        gsap.fromTo(lbImg, { x: 60 * dir, opacity: 0, scale: 1, y: 0 }, { x: 0, opacity: 1, duration: .45, ease: 'expo.out' });
      }
    });
  }

  document.addEventListener('click', e => {
    const trigger = e.target.closest('[data-zoom]');
    if (trigger) { e.preventDefault(); e.stopPropagation(); openLb(trigger); }
  });
  lb.addEventListener('cancel', e => { e.preventDefault(); closeLb(); }); // Esc con animación
  lbStage.addEventListener('click', closeLb); // tocar la foto o el fondo la cierra
  $('#lbClose').addEventListener('click', closeLb);
  $('#lbPrev').addEventListener('click', () => stepLb(-1));
  $('#lbNext').addEventListener('click', () => stepLb(1));
  addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') stepLb(1);
    if (e.key === 'ArrowLeft') stepLb(-1);
  });
  let touchX = null;
  lb.addEventListener('touchstart', e => { touchX = e.changedTouches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    touchX = null;
    if (Math.abs(dx) > 50) { e.preventDefault(); stepLb(dx < 0 ? 1 : -1); }
  });

  /* Copiar dirección */
  const copyBtn = $('#copyAddress');
  copyBtn.addEventListener('click', async () => {
    const label = $('[data-copy-label]', copyBtn);
    let ok = false;
    try { await navigator.clipboard.writeText(copyBtn.dataset.copy); ok = true; } catch (e) { ok = false; }
    label.textContent = ok ? '¡Copiada!' : 'No se pudo copiar';
    if (motion) gsap.fromTo(label, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: .4, ease: 'expo.out' });
    setTimeout(() => { label.textContent = 'Copiar dirección'; }, 2200);
  });

  /* WhatsApp: muestra su etiqueta unos segundos, una vez al pasar el hero */
  const waFloat = $('#waFloat');
  function flashWa() {
    waFloat.classList.add('is-open');
    setTimeout(() => waFloat.classList.remove('is-open'), 3200);
  }

  /* ---------------------------------------------------------------------
     Opiniones: slideshow automático. Se pausa fuera de pantalla, al pasar
     el cursor, con foco de teclado y con su botón de pausa.
     --------------------------------------------------------------------- */
  const reviews = $('#reviews');
  if (reviews) {
    const slides = $$('.review', reviews);
    const dots = $$('.rev-dot');
    const fills = dots.map(d => $('span', d));
    const toggle = $('#revToggle');
    const DURACION = 4;
    let cur = 0, bar = null, split = null;
    let userPaused = false, hoverPaused = false, inView = false;
    const shouldRun = () => motion && !userPaused && !hoverPaused && inView;
    const sync = () => { if (bar) { if (shouldRun()) bar.play(); else bar.pause(); } };

    function runBar() {
      if (!motion) return;
      if (bar) bar.kill();
      gsap.set(fills, { scaleX: 0 });
      bar = gsap.to(fills[cur], { scaleX: 1, duration: DURACION, ease: 'none', paused: !shouldRun(), onComplete: () => go(cur + 1, 1) });
    }

    function go(i, dir) {
      const prev = slides[cur];
      cur = (i + slides.length) % slides.length;
      const next = slides[cur];
      dots.forEach((d, n) => { if (n === cur) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); });
      slides.forEach(s => s.classList.toggle('is-on', s === next));
      if (motion) {
        if (split) { split.revert(); split = null; }
        gsap.killTweensOf(slides);
        slides.forEach(s => { if (s !== prev && s !== next) gsap.set(s, { autoAlpha: 0, y: 0 }); });
        if (prev !== next) gsap.to(prev, { autoAlpha: 0, y: -22 * dir, duration: .22, ease: 'power2.in' });
        gsap.set(next, { autoAlpha: 1, y: 0 });
        const quote = $('.review__quote', next);
        const who = $('.review__who', next);
        gsap.killTweensOf(who);
        if (SplitText) {
          split = SplitText.create(quote, { type: 'words' });
          const own = split;
          gsap.from(own.words, {
            yPercent: 45, autoAlpha: 0, duration: .55, stagger: .012, delay: .16, ease: 'power3.out',
            onComplete: () => { own.revert(); if (split === own) split = null; }
          });
        }
        gsap.fromTo(who, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: .45, delay: .3, ease: 'power3.out' });
      }
      runBar();
    }

    dots.forEach((d, n) => d.addEventListener('click', () => { if (n !== cur) go(n, n > cur ? 1 : -1); }));

    if (motion) {
      toggle.hidden = false;
      toggle.setAttribute('aria-pressed', 'false');
      toggle.addEventListener('click', () => {
        userPaused = !userPaused;
        toggle.setAttribute('aria-pressed', userPaused);
        toggle.setAttribute('aria-label', userPaused ? 'Reanudar opiniones' : 'Pausar opiniones');
        reviews.setAttribute('aria-live', userPaused ? 'polite' : 'off');
        sync();
      });
      const box = reviews.closest('.opiniones__inner');
      box.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { hoverPaused = true; sync(); } });
      box.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') { hoverPaused = false; sync(); } });
      box.addEventListener('focusin', () => { hoverPaused = true; sync(); });
      box.addEventListener('focusout', () => { hoverPaused = false; sync(); });
      new IntersectionObserver(es => { inView = es[0].isIntersecting; sync(); }, { threshold: .3 }).observe(reviews);
      runBar();
    } else {
      reviews.setAttribute('aria-live', 'polite');
    }

    // Deslizar con el dedo también cambia de opinión
    let tx = null, ty = null;
    reviews.addEventListener('touchstart', e => { tx = e.changedTouches[0].clientX; ty = e.changedTouches[0].clientY; }, { passive: true });
    reviews.addEventListener('touchend', e => {
      if (tx === null) return;
      const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
      tx = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(cur + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
    }, { passive: true });
  }

  /* Tira infinita: marquesina y galería */
  /* ---------------------------------------------------------------------
     Galería: corredor 3D. Dos rieles de fotos viajan desde el fondo hacia
     quien mira. La perspectiva hace todo: al crecer z, la foto se agranda
     y a la vez se abre hacia el borde. Tamaño aparente geométrico (cada foto
     es un factor constante más grande que la de atrás), rieles que se abren
     fuerte al principio (fan) y nacimiento cruzado del eje para que el
     centro nunca quede vacío. Basado en image-stream-hero de ruixen.ui.
     --------------------------------------------------------------------- */
  const corredor = $('#corredor');
  if (corredor) {
    const vista = $('.corredor__vista', corredor);
    const mundo = $('.corredor__mundo', corredor);
    // Las 10 fotos del HTML quedan como fuente (ocultas, pero el lightbox las
    // recorre todas); en los rieles van pocas tarjetas que van cambiando de foto.
    const fuente = $$('.cc', mundo);
    const caja = document.createElement('div');
    caja.hidden = true;
    fuente.forEach(el => caja.appendChild(el));
    corredor.appendChild(caja);
    const N = fuente.length;

    // Menos fotos y más grandes: nacen ya visibles y llegan enormes al borde
    const forma = () => innerWidth < 700
      ? { cards: 5, speed: 17, perspective: 30, cardWidth: 46, cardHeight: 56, birthHeight: 14, exitHeight: 96, railBirth: -8, railExit: 44, fan: 2.6, turnBirth: 4, turnExit: 22, stops: 24, radius: 1.4 }
      : { cards: 6, speed: 20, perspective: 30, cardWidth: 24, cardHeight: 30, birthHeight: 9, exitHeight: 62, railBirth: -8, railExit: 40, fan: 2.8, turnBirth: 5, turnExit: 26, stops: 24, radius: .7 };

    const pintar = (el, k) => {
      const src = fuente[((k % N) + N) % N];
      el.dataset.zoom = src.dataset.zoom;
      el.dataset.caption = src.dataset.caption;
      el.setAttribute('aria-label', src.getAttribute('aria-label'));
      const a = $('img', src), b = $('img', el);
      b.src = a.getAttribute('src'); b.alt = a.alt;
    };
    const tarjeta = (dir, i) => {
      const el = fuente[0].cloneNode(true);
      el.dataset.k = dir > 0 ? i : i + Math.floor(N / 2); // el izquierdo va desfasado
      if (dir < 0) { el.tabIndex = -1; el.setAttribute('aria-hidden', 'true'); }
      $('img', el).loading = 'eager';
      pintar(el, +el.dataset.k);
      mundo.appendChild(el);
      return el;
    };
    let rieles = [];
    const css = document.createElement('style');
    document.head.appendChild(css);

    const pose = (u, dir, f) => {
      const scale = (f.birthHeight / f.cardHeight) * Math.pow(f.exitHeight / f.birthHeight, u);
      const z = f.perspective * (1 - 1 / scale);
      const rail = f.railExit - (f.railExit - f.railBirth) * Math.pow(1 - u, f.fan);
      const turn = f.turnBirth + (f.turnExit - f.turnBirth) * u;
      return `translate3d(${(dir * rail).toFixed(2)}cqw,0,${z.toFixed(2)}cqw) rotateY(${(-dir * turn).toFixed(2)}deg)`;
    };
    const keys = (dir, name, f) => {
      let s = '';
      for (let k = 0; k <= f.stops; k++) {
        const u = k / f.stops;
        // Nace con un fundido corto, porque ahora aparece ya grande
        const o = Math.min(1, u / .12);
        s += `${(u * 100).toFixed(2)}%{transform:${pose(u, dir, f)};opacity:${o.toFixed(3)}}`;
      }
      return `@keyframes ${name}{${s}}`;
    };

    let ultima = '';
    const armar = () => {
      const f = forma();
      const firma = JSON.stringify(f);
      if (firma === ultima) return;
      ultima = firma;
      const eje = 50; // altura del punto de fuga, % del alto
      vista.style.perspective = `${f.perspective}cqw`;
      vista.style.perspectiveOrigin = `50% ${eje}%`;
      css.textContent = keys(1, 'cc-der', f) + keys(-1, 'cc-izq', f);
      rieles.forEach(([cards]) => cards.forEach(el => el.remove()));
      rieles = [[1, 'cc-der'], [-1, 'cc-izq']].map(([dir, name]) =>
        [Array.from({ length: f.cards }, (_, i) => tarjeta(dir, i)), dir, name]);
      rieles.forEach(([cards, dir, name]) => {
        cards.forEach((el, i) => {
          Object.assign(el.style, {
            top: `${eje}%`, width: `${f.cardWidth}cqw`, height: `${f.cardHeight}cqw`,
            marginLeft: `${-f.cardWidth / 2}cqw`, marginTop: `${-f.cardHeight / 2}cqw`,
            borderRadius: `${f.radius}cqw`
          });
          if (calm) {
            el.style.transform = pose((i + .5) / f.cards, dir, f);
          } else {
            // Retraso negativo: el pasillo ya está lleno desde el primer cuadro
            el.style.animation = `${name} ${f.speed}s linear ${-(i * f.speed) / f.cards}s infinite`;
            // Cada vuelta, la tarjeta renace con la foto siguiente que le toca
            el.addEventListener('animationiteration', () => {
              el.dataset.k = +el.dataset.k + f.cards;
              pintar(el, +el.dataset.k);
            });
          }
        });
      });
    };
    armar();
    addEventListener('resize', armar);
    // Fuera de pantalla no gasta: se pausa
    new IntersectionObserver(([e]) => corredor.classList.toggle('is-off', !e.isIntersecting)).observe(corredor);
  }

  class Strip {
    constructor(root) {
      this.root = root;
      this.track = $('.strip__track', root);
      this.speed = parseFloat(root.dataset.speed);
      this.useVelocity = root.hasAttribute('data-velocity');
      this.x = 0;
      this.boost = 0;
      this.paused = 0;
      this.pauseTarget = 1;
      this.base = Array.from(this.track.children);
      this.fill();
      if (root.hasAttribute('data-hover-pause')) {
        root.addEventListener('pointerover', e => { if (e.pointerType === 'mouse' && e.target.closest('.shot')) this.pauseTarget = 0; });
        root.addEventListener('pointerout', e => { if (e.pointerType === 'mouse' && !root.contains(e.relatedTarget)) this.pauseTarget = 1; });
        root.addEventListener('focusin', () => { this.pauseTarget = 0; });
        root.addEventListener('focusout', () => { this.pauseTarget = 1; });
      }
      this.paused = 1;
    }
    fill() {
      // Duplica el contenido hasta cubrir el doble del viewport. Los clones no entran al teclado.
      const baseW = () => this.base.reduce((acc, el) => acc + el.getBoundingClientRect().width + (parseFloat(getComputedStyle(this.track).columnGap) || 0), 0);
      this.loopW = baseW();
      const copies = Math.max(2, Math.ceil((innerWidth * 2) / Math.max(this.loopW, 1)));
      while (this.track.children.length > this.base.length) this.track.lastChild.remove();
      for (let n = 1; n < copies; n++) {
        this.base.forEach(el => {
          const c = el.cloneNode(true);
          c.setAttribute('aria-hidden', 'true');
          if (c.matches('button')) c.tabIndex = -1;
          this.track.appendChild(c);
        });
      }
    }
    tick(dt, velocity) {
      this.paused += (this.pauseTarget - this.paused) * Math.min(1, dt * 5);
      if (this.useVelocity) this.boost += (Math.min(Math.abs(velocity) * 0.09, 340) - this.boost) * Math.min(1, dt * 4);
      const dir = Math.sign(this.speed);
      this.x += (this.speed * this.paused + dir * this.boost) * dt;
      const w = this.loopW || 1;
      // Velocidad negativa = hacia la izquierda; x siempre queda entre -w y 0
      this.x = ((this.x % w) + w) % w - w;
      this.track.style.transform = `translate3d(${this.x}px,0,0)`;
    }
  }

  /* ---------------------------------------------------------------------
     Sin GSAP o con movimiento reducido: todo visible, sin coreografía
     --------------------------------------------------------------------- */
  const loader = $('#loader');
  if (!motion) {
    if (loader) loader.remove();
    document.body.classList.remove('is-loading');
    tabs.length && (tabsInk.style.width = tabs[0].offsetWidth + 'px');
    plateImgs.forEach(i => { i.style.clipPath = 'circle(71% at 50% 50%)'; });
    return;
  }

  /* ---------------------------------------------------------------------
     Movimiento
     --------------------------------------------------------------------- */
  document.body.classList.add('is-loading');
  if (lenis) lenis.stop();

  const strips = $$('[data-strip]').map(s => new Strip(s));
  let scrollVel = 0;
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: self => { scrollVel = self.getVelocity(); } });
  gsap.ticker.add((time, delta) => {
    const dt = Math.min(delta, 50) / 1000;
    scrollVel *= 0.92;
    strips.forEach(s => s.tick(dt, scrollVel));
  });

  function refreshStrips() { strips.forEach(s => s.fill()); }
  let resizeT;
  addEventListener('resize', () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => {
      refreshStrips();
      const sel = tabs.find(t => t.getAttribute('aria-selected') === 'true');
      if (sel) moveInk(sel, true);
    }, 150);
  });

  /* Estados iniciales del hero (se revelan al terminar el loader) */
  const heroPlates = $$('.plate');
  gsap.set(heroPlates, { autoAlpha: 0, scale: .55, rotate: -70 });
  gsap.set('#heroLede, #heroCta > *', { autoAlpha: 0, y: 24 });
  gsap.set('.pez', { autoAlpha: 0 });
  gsap.set(header, { yPercent: -160 });
  gsap.set(waFloat, { scale: 0, rotate: -90 });

  let heroSplit = null;
  function heroIn() {
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.to(header, { yPercent: 0, duration: 1.1, clearProps: 'transform' }, .15);
    if (heroSplit) tl.to(heroSplit.lines, { yPercent: 0, rotate: 0, autoAlpha: 1, duration: 1.25, stagger: .11, onComplete: () => heroSplit.revert() }, 0);
    tl.to(heroPlates, { autoAlpha: 1, scale: 1, rotate: 0, duration: 1.5, stagger: { each: .14, from: 'start' } }, .1)
      .to('#heroLede, #heroCta > *', { autoAlpha: 1, y: 0, duration: .9, stagger: .08, ease: 'power3.out' }, .55)
      .to('.pez', { autoAlpha: 1, duration: 1.2, stagger: .07, ease: 'power2.out' }, .6)
      .to(waFloat, { scale: 1, rotate: 0, duration: .8, ease: 'back.out(1.6)', clearProps: 'transform,scale,rotate', onComplete: flashWa }, 1.1);
    return tl;
  }

  /* Loader: logo + imágenes pasando rápido + inundación con el color de fondo */
  const loaderImgs = [1, 7, 5, 8, 3, 10, 6, 2, 4, 9].map(n => `contracorriente-${n}`);

  function runLoader() {
    return new Promise(resolve => {
      const frame = $('#loaderFrame');
      const count = $('#loaderFish');
      const fishFill = $('#loaderFishFill');
      const fillTo = v => { fishFill.style.clipPath = `inset(0 ${(100 - v * 100).toFixed(1)}% 0 0)`; };
      const visited = (() => { try { return sessionStorage.getItem('cc-visto') === '1'; } catch (e) { return false; } })();
      const minTime = visited ? 900 : 2200;
      const start = performance.now();
      let loaded = 0;
      const imgs = loaderImgs.map(slug => {
        const i = new Image();
        i.alt = '';
        i.decoding = 'async';
        const done = () => { loaded++; };
        i.src = `img/${slug}-plato.webp`;
        // Solo entra a la rotación cuando ya está decodificada: así nunca parpadea vacío
        i.decode().then(() => { i.dataset.ready = '1'; }).catch(() => {}).finally(done);
        frame.appendChild(i);
        return i;
      });

      gsap.from(frame, { scale: .6, duration: 1, ease: 'expo.out' });

      // La última imagen es el logo: se deja lista desde el principio para que no parpadee
      const logo = new Image();
      logo.alt = '';
      logo.src = 'img/logo.svg';
      logo.decode().catch(() => {});
      frame.appendChild(logo);

      // Las fotos pasan rápido, y se frenan un poco justo antes de terminar
      let idx = 0;
      let lastSwap = 0;
      let lastTick = start;
      let shown = 0;
      let finished = false;
      const tick = () => {
        if (finished) return;
        const now = performance.now();
        const elapsed = now - start;
        const real = (loaded + (document.readyState === 'complete' ? 1 : 0)) / (imgs.length + 1);
        const timeP = Math.min(1, elapsed / minTime);
        const target = Math.min(real, timeP);
        // Suavizado por tiempo real, para que no dependa de cuántos ticks entren
        shown += (target - shown) * Math.min(1, (now - lastTick) / 180);
        lastTick = now;
        if (target >= 1 && shown > .995) shown = 1;
        fillTo(shown * .88); // el último tramo se llena con el final de la animación
        const gap = shown > .86 ? 170 : 85;
        if (now - lastSwap > gap) {
          let tries = 0, nextIdx = idx;
          do { nextIdx = (nextIdx + 1) % imgs.length; tries++; } while (!imgs[nextIdx].dataset.ready && tries < imgs.length);
          if (imgs[nextIdx].dataset.ready) {
            imgs[idx].classList.remove('is-on');
            imgs[nextIdx].classList.add('is-on');
            idx = nextIdx;
          }
          lastSwap = now;
        }
        if (shown >= 1 || elapsed > 7000) { finished = true; clearInterval(driver); finish(); }
      };
      // setInterval y no rAF: el loader termina aunque la pestaña esté en segundo plano
      const driver = setInterval(tick, 30);

      function finish() {
        try { sessionStorage.setItem('cc-visto', '1'); } catch (e) { /* sin almacenamiento */ }
        const fill = { v: .88 };
        // Escala suficiente para que el círculo cubra toda la pantalla, y de más
        const zoom = (Math.hypot(innerWidth, innerHeight) / frame.offsetWidth) * 3;
        gsap.timeline({
          onComplete: () => {
            loader.remove();
            document.body.classList.remove('is-loading');
            if (lenis) lenis.start();
            ScrollTrigger.refresh();
            resolve();
          }
        })
          // El pez se completa justo cuando aparece el logo
          .to(fill, { v: 1, duration: .55, ease: 'power2.inOut', onUpdate: () => fillTo(fill.v) }, 0)
          .add(() => { imgs.forEach(i => i.classList.remove('is-on')); logo.classList.add('is-on'); }, .55)
          .fromTo(logo, { scale: .86 }, { scale: 1, duration: .5, ease: 'expo.out' }, .55)
          .to(count, { autoAlpha: 0, y: 12, duration: .3 }, 1.05)
          .to(frame, { scale: zoom, duration: 1, ease: 'power4.in' }, 1.05)
          .to(loader, { autoAlpha: 0, duration: .32, ease: 'none' }, 1.73)
          .add(heroIn, 1.6);
      }
    });
  }

  /* Texto: parallax y revelado ligado al scroll */
  function setupScrollMotion() {
    // Títulos: cada palabra sube y se aclara mientras scrolleas
    $$('[data-split]').forEach(el => {
      if (!SplitText) return;
      SplitText.create(el, {
        type: 'words', autoSplit: true,
        onSplit: self => gsap.fromTo(self.words,
          { yPercent: 55, rotate: 4, autoAlpha: 0 },
          { yPercent: 0, rotate: 0, autoAlpha: 1, ease: 'none', stagger: .1, scrollTrigger: { trigger: el, start: 'top 92%', end: 'top 52%', scrub: .7 } })
      });
    });

    // Textos secundarios: fade con posición, también con scroll
    $$('[data-fade]').forEach(el => {
      gsap.fromTo(el, { autoAlpha: .0, y: 28 }, {
        autoAlpha: 1, y: 0, ease: 'power1.inOut',
        scrollTrigger: { trigger: el, start: 'top 94%', end: 'top 70%', scrub: .6 }
      });
    });

    // Parallax general de bloques de texto
    $$('[data-par]').forEach(el => {
      const v = parseFloat(el.dataset.par);
      const isHero = !!el.closest('.hero');
      gsap.fromTo(el, { y: isHero ? 0 : v }, {
        y: isHero ? v * 2.2 : -v, ease: 'none',
        scrollTrigger: { trigger: isHero ? '.hero' : el, start: isHero ? 'top top' : 'top bottom', end: 'bottom top', scrub: true }
      });
    });

    // Filas de la carta: leve entrada escalonada
    ScrollTrigger.batch('.panel:not([hidden]) .dish', {
      start: 'top 92%', once: true,
      onEnter: b => gsap.fromTo(b, { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: .9, ease: 'power3.out', stagger: .06, clearProps: 'all' })
    });

    // Imágenes: leve fade con ease-in-out en posición
    gsap.fromTo('#corredor', { autoAlpha: 0, y: 70 }, {
      autoAlpha: 1, y: 0, duration: 1.3, ease: 'power2.inOut',
      scrollTrigger: { trigger: '#corredor', start: 'top 92%', once: true }
    });
    if (plate) {
      gsap.fromTo(plate, { autoAlpha: 0, y: 70 }, {
        autoAlpha: 1, y: 0, duration: 1.4, ease: 'power2.inOut',
        scrollTrigger: { trigger: plate, start: 'top 90%', once: true }
      });
    }
    gsap.fromTo('#mapFrame', { autoAlpha: 0, y: 70, rotate: 2.5 }, {
      autoAlpha: 1, y: 0, rotate: 0, duration: 1.3, ease: 'power2.inOut', clearProps: 'transform',
      scrollTrigger: { trigger: '#mapFrame', start: 'top 92%', once: true }
    });

    // Platos del hero: profundidad, rotación con el scroll y con el cursor
    $$('.plate').forEach(p => {
      const d = parseFloat(p.dataset.depth);
      gsap.to(p, {
        y: -110 * d, rotate: 16 * d, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .5 }
      });
      if (finePointer) {
        const img = $('img', p);
        const qx = gsap.quickTo(img, 'x', { duration: .9, ease: 'power3.out' });
        const qy = gsap.quickTo(img, 'y', { duration: .9, ease: 'power3.out' });
        addEventListener('pointermove', e => {
          qx((e.clientX / innerWidth - .5) * -9 * d);
          qy((e.clientY / innerHeight - .5) * -9 * d);
        }, { passive: true });
      }
    });

    // Cardumen del hero: cada pez nada a contracorriente, a su propia velocidad,
    // mientras haces scroll; además ondula apenas para sentirse vivo.
    $$('.pez').forEach((pez, i) => {
      gsap.to(pez, {
        x: parseFloat(pez.dataset.x), y: parseFloat(pez.dataset.y), ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .4 + (i % 3) * .3 }
      });
      gsap.to($('svg', pez), {
        rotate: i % 2 ? -5 : 5, y: i % 2 ? 7 : -7, duration: 1.5 + (i % 4) * .35,
        ease: 'sine.inOut', yoyo: true, repeat: -1, delay: i * .13
      });
    });

    // Pez de progreso: sube cuando bajas
    const fish = $('#currentFish');
    if (fish && fish.getBoundingClientRect().width) {
      gsap.to(fish, {
        y: () => -($('#current').offsetHeight - fish.getBoundingClientRect().height), ease: 'none',
        scrollTrigger: { start: 0, end: 'max', scrub: .4, invalidateOnRefresh: true }
      });
    }

    // Logo del footer: sube y gira apenas al llegar
    gsap.fromTo('#footerMark img', { autoAlpha: 0, y: 50, rotate: -30 }, {
      autoAlpha: 1, y: 0, rotate: 0, ease: 'power2.inOut', duration: 1.2,
      scrollTrigger: { trigger: '#footerMark', start: 'top 95%', once: true }
    });
    gsap.fromTo('.footer__cols > *', { autoAlpha: 0, y: 26 }, {
      autoAlpha: 1, y: 0, duration: .9, stagger: .07, ease: 'power3.out',
      scrollTrigger: { trigger: '.footer__cols', start: 'top 92%', once: true }
    });

    // WhatsApp: recuerda su etiqueta al llegar a la carta
    ScrollTrigger.create({ trigger: '#carta', start: 'top 60%', once: true, onEnter: flashWa });
  }

  /* Botones magnéticos */
  if (finePointer) {
    $$('.magnet').forEach(el => {
      const qx = gsap.quickTo(el, 'x', { duration: .6, ease: 'power3.out' });
      const qy = gsap.quickTo(el, 'y', { duration: .6, ease: 'power3.out' });
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        qx((e.clientX - r.left - r.width / 2) * .22);
        qy((e.clientY - r.top - r.height / 2) * .3);
      });
      el.addEventListener('pointerleave', () => { qx(0); qy(0); });
    });
  }

  /* Arranque */
  const fontsReady = document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 2500))]) : Promise.resolve();

  fontsReady.then(() => {
    refreshStrips();
    moveInk(tabs[0], true);
    if (SplitText) {
      heroSplit = SplitText.create('#heroTitle', { type: 'lines', linesClass: 'ln' });
      gsap.set(heroSplit.lines, { yPercent: 45, rotate: 2.5, autoAlpha: 0 });
    }
    setupScrollMotion();
    if (location.hash && location.hash !== '#inicio') {
      const t = $(location.hash);
      if (t) setTimeout(() => (lenis ? lenis.scrollTo(t, { immediate: true, force: true }) : t.scrollIntoView()), 50);
    }
    runLoader();
  });
})();
