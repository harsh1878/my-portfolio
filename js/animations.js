// js/animations.js

export function initAnimations() {

  // ─── 1. REDUCED MOTION GATE ───────────────────────────────────────────────
  // Respect the user's OS-level "reduce motion" preference everywhere.
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


  // ─── 2. SCROLL PROGRESS BAR ───────────────────────────────────────────────
  // Thin line at the very top of the viewport that fills as the user scrolls.
  const progressBar = document.createElement('div');
  progressBar.id = 'scroll-progress';
  Object.assign(progressBar.style, {
    position:   'fixed',
    top:        '0',
    left:       '0',
    height:     '3px',
    width:      '0%',
    background: 'var(--accent, #6c63ff)',
    zIndex:     '9999',
    transition: 'width 0.1s linear',
    pointerEvents: 'none',
  });
  document.body.prepend(progressBar);


  // ─── 3. MAGNETIC CURSOR ───────────────────────────────────────────────────
  // A custom cursor dot that slightly lags behind the mouse and snaps ("sticks")
  // to buttons / links on hover — a hallmark of premium portfolio sites.
  let cursor, cursorRing;

  if (!prefersReducedMotion && window.matchMedia('(pointer: fine)').matches) {
    cursor = document.createElement('div');
    cursor.id = 'cursor-dot';
    Object.assign(cursor.style, {
      position:      'fixed',
      width:         '8px',
      height:        '8px',
      borderRadius:  '50%',
      background:    'var(--accent, #6c63ff)',
      pointerEvents: 'none',
      zIndex:        '99999',
      transform:     'translate(-50%, -50%)',
      transition:    'transform 0.15s ease, width 0.3s ease, height 0.3s ease, opacity 0.3s ease',
      willChange:    'transform',
    });

    cursorRing = document.createElement('div');
    cursorRing.id = 'cursor-ring';
    Object.assign(cursorRing.style, {
      position:      'fixed',
      width:         '36px',
      height:        '36px',
      borderRadius:  '50%',
      border:        '1.5px solid var(--accent, #6c63ff)',
      pointerEvents: 'none',
      zIndex:        '99998',
      transform:     'translate(-50%, -50%)',
      transition:    'transform 0.35s cubic-bezier(0.23,1,0.32,1), width 0.3s ease, height 0.3s ease, opacity 0.3s ease',
      opacity:       '0.6',
      willChange:    'transform',
    });

    document.body.append(cursor, cursorRing);

    let mx = 0, my = 0;
    window.addEventListener('mousemove', (e) => {
      mx = e.clientX;
      my = e.clientY;
      cursor.style.left = `${mx}px`;
      cursor.style.top  = `${my}px`;
      cursorRing.style.left = `${mx}px`;
      cursorRing.style.top  = `${my}px`;
    });

    // Magnetic snap: enlarge ring + shrink dot on interactive elements
    const magnetTargets = 'a, button, [data-magnetic], input, textarea, label';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(magnetTargets)) {
        cursor.style.transform     = 'translate(-50%, -50%) scale(0.3)';
        cursorRing.style.width     = '56px';
        cursorRing.style.height    = '56px';
        cursorRing.style.opacity   = '1';
      }
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(magnetTargets)) {
        cursor.style.transform     = 'translate(-50%, -50%) scale(1)';
        cursorRing.style.width     = '36px';
        cursorRing.style.height    = '36px';
        cursorRing.style.opacity   = '0.6';
      }
    });

    // Hide while mouse is outside the window
    document.addEventListener('mouseleave', () => {
      cursor.style.opacity = cursorRing.style.opacity = '0';
    });
    document.addEventListener('mouseenter', () => {
      cursor.style.opacity = '1';
      cursorRing.style.opacity = '0.6';
    });
  }


  // ─── 4. STAGGERED REVEAL WITH CUSTOM EASING ──────────────────────────────
  // Each .reveal* element slides + fades in. Siblings inside the same parent
  // get a cascading delay so they arrive one after another.

  const revealObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      const el = entry.target;

      // Stagger siblings: count position among observed siblings
      const siblings = [...(el.parentElement?.children || [])].filter(
        c => c.classList.contains('reveal') ||
             c.classList.contains('reveal-left') ||
             c.classList.contains('reveal-right') ||
             c.classList.contains('reveal-scale') ||
             c.classList.contains('reveal-blur')
      );
      const index = siblings.indexOf(el);
      el.style.transitionDelay = prefersReducedMotion ? '0ms' : `${index * 80}ms`;

      el.classList.add('active');
      obs.unobserve(el);
    });
  }, {
    root:       null,
    rootMargin: '-5% 0px -5% 0px',
    threshold:  0.12,
  });

  document.querySelectorAll(
    '.reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-blur'
  ).forEach(el => revealObserver.observe(el));


  // ─── 5. SPLIT-TEXT HERO HEADLINE ─────────────────────────────────────────
  // Wraps each word in a <span> and animates them in with a cinematic stagger.
  // Targets any element with [data-split] or .hero-title.

  if (!prefersReducedMotion) {
    document.querySelectorAll('[data-split], .hero-title').forEach(el => {
      const words = el.innerText.trim().split(/\s+/);
      el.innerHTML = words.map((w, i) =>
        `<span class="split-word" style="
          display:inline-block;
          overflow:hidden;
          vertical-align:bottom;
        "><span style="
          display:inline-block;
          transform:translateY(110%);
          opacity:0;
          transition: transform 0.7s cubic-bezier(0.16,1,0.3,1) ${i * 60}ms,
                      opacity  0.7s ease ${i * 60}ms;
        ">${w}</span></span>${i < words.length - 1 ? ' ' : ''}`
      ).join('');

      // Trigger on next paint so CSS picks up the initial state
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.querySelectorAll('.split-word span').forEach(span => {
            span.style.transform = 'translateY(0)';
            span.style.opacity   = '1';
          });
        });
      });
    });
  }


  // ─── 6. HEADER SCROLL + HIDE-ON-SCROLL-DOWN ──────────────────────────────
  // Header shrinks after 50 px and hides when scrolling down fast,
  // reappears immediately when the user scrolls back up.

  const header = document.querySelector('.header');
  let lastScrollY   = 0;
  let ticking       = false;

  function onScroll() {
    const scrollY = window.scrollY;

    // Scroll progress bar
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.width = docH > 0 ? `${(scrollY / docH) * 100}%` : '0%';

    // Header state
    if (header) {
      header.classList.toggle('scrolled', scrollY > 50);

      // Hide on scroll-down (> 80 px from top), show on scroll-up
      if (scrollY > 80) {
        if (scrollY > lastScrollY + 4) {
          header.classList.add('header--hidden');
        } else if (scrollY < lastScrollY - 4) {
          header.classList.remove('header--hidden');
        }
      } else {
        header.classList.remove('header--hidden');
      }
    }

    // Parallax hero video
    const heroSection = document.querySelector('.hero');
    if (heroSection && scrollY < heroSection.offsetHeight * 1.2) {
      const heroVideo = document.querySelector('.hero-video');
      if (heroVideo && !prefersReducedMotion) {
        heroVideo.style.transform = `translateY(${scrollY * 0.35}px)`;
      }
    }

    lastScrollY = scrollY;
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(onScroll);
      ticking = true;
    }
  }, { passive: true });

  // Inject the CSS rule for header hide transition once
  injectStyle(`
    .header {
      transition: transform 0.4s cubic-bezier(0.16,1,0.3,1),
                  background 0.3s ease,
                  box-shadow 0.3s ease;
    }
    .header--hidden {
      transform: translateY(-110%);
    }
  `, 'header-scroll-style');


  // ─── 7. SMOOTH SCROLL WITH MOMENTUM ─────────────────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const targetEl = document.querySelector(targetId);
      if (!targetEl) return;

      e.preventDefault();
      const headerHeight  = header?.offsetHeight ?? 0;
      const targetPosition = targetEl.getBoundingClientRect().top + window.scrollY - headerHeight - 16;

      window.scrollTo({ top: targetPosition, behavior: 'smooth' });
    });
  });


  // ─── 8. COUNTER ANIMATION WITH EASING ────────────────────────────────────
  // easeOutExpo curve makes the number accelerate then decelerate naturally.

  function easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  const statsObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      entry.target.querySelectorAll('.stat-number').forEach(counter => {
        const target   = +counter.getAttribute('data-target');
        const duration = prefersReducedMotion ? 0 : 2200;
        const start    = performance.now();

        function tick(now) {
          const elapsed  = now - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased    = easeOutExpo(progress);
          counter.innerText = Math.round(eased * target).toLocaleString();
          if (progress < 1) requestAnimationFrame(tick);
        }

        requestAnimationFrame(tick);
      });

      obs.unobserve(entry.target);
    });
  }, { threshold: 0.5 });

  const statsContainer = document.querySelector('.stats-container');
  if (statsContainer) statsObserver.observe(statsContainer);


  // ─── 9. TILT CARDS ───────────────────────────────────────────────────────
  // 3-D perspective tilt on .card--tilt elements — subtle, not gimmicky.

  if (!prefersReducedMotion && window.matchMedia('(pointer: fine)').matches) {
    document.querySelectorAll('.card--tilt, .glass-card').forEach(card => {
      card.style.transition = 'transform 0.1s ease, box-shadow 0.3s ease';
      card.style.willChange = 'transform';

      card.addEventListener('mousemove', (e) => {
        const rect   = card.getBoundingClientRect();
        const cx     = rect.left + rect.width  / 2;
        const cy     = rect.top  + rect.height / 2;
        const dx     = (e.clientX - cx) / (rect.width  / 2);
        const dy     = (e.clientY - cy) / (rect.height / 2);
        const rotX   = dy * -6;   // max ±6 deg
        const rotY   = dx *  6;
        card.style.transform = `perspective(700px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.02)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transition = 'transform 0.6s cubic-bezier(0.23,1,0.32,1), box-shadow 0.3s ease';
        card.style.transform  = 'perspective(700px) rotateX(0deg) rotateY(0deg) scale(1)';
      });
    });
  }


  // ─── 10. SECTION ACTIVE NAV HIGHLIGHT ────────────────────────────────────
  // Marks the matching nav link as .active as the user scrolls past each section.

  const sections  = document.querySelectorAll('section[id]');
  const navLinks  = document.querySelectorAll('.nav a[href^="#"]');

  if (sections.length && navLinks.length) {
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks.forEach(link => {
            link.classList.toggle(
              'active',
              link.getAttribute('href') === `#${entry.target.id}`
            );
          });
        }
      });
    }, {
      rootMargin: '-40% 0px -55% 0px',
      threshold:  0,
    });

    sections.forEach(s => navObserver.observe(s));
  }


  // ─── UTILITY ─────────────────────────────────────────────────────────────

  /** Inject a <style> tag once, keyed by id so re-runs are idempotent. */
  function injectStyle(css, id) {
    if (document.getElementById(id)) return;
    const tag = document.createElement('style');
    tag.id = id;
    tag.textContent = css;
    document.head.appendChild(tag);
  }
}