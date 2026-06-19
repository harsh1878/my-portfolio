export function initTheme() {

  const systemPrefersLight = window.matchMedia('(prefers-color-scheme: light)');
  const savedTheme         = localStorage.getItem('theme');

  let currentTheme = savedTheme
    ? savedTheme
    : systemPrefersLight.matches ? 'light' : 'dark';

  applyTheme(currentTheme, false);

  injectStyle(`
    /* Smooth cross-fade for all colour tokens */
    :root {
      --theme-transition-duration: 0.45s;
    }
    html.theme-transitioning,
    html.theme-transitioning *,
    html.theme-transitioning *::before,
    html.theme-transitioning *::after {
      transition:
        background-color var(--theme-transition-duration) ease,
        color            var(--theme-transition-duration) ease,
        border-color     var(--theme-transition-duration) ease,
        box-shadow       var(--theme-transition-duration) ease,
        fill             var(--theme-transition-duration) ease,
        stroke           var(--theme-transition-duration) ease !important;
    }

    /* Ripple overlay */
    #theme-ripple {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 99997;
      border-radius: 50%;
      transform: scale(0);
      opacity: 0;
    }
    #theme-ripple.expanding {
      animation: rippleExpand 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    }
    @keyframes rippleExpand {
      0%   { transform: scale(0);   opacity: 0.18; }
      60%  { opacity: 0.10; }
      100% { transform: scale(4);   opacity: 0; }
    }

    /* Toggle button icon morph */
    #theme-toggle {
      position: relative;
      overflow: hidden;
      cursor: pointer;
    }
    #theme-toggle .icon-sun,
    #theme-toggle .icon-moon {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1),
                  opacity   0.4s ease;
    }
    #theme-toggle .icon-sun  { transform: rotate(0deg)   scale(1); opacity: 1; }
    #theme-toggle .icon-moon { transform: rotate(-90deg) scale(0); opacity: 0; }

    html[data-theme="light"] #theme-toggle .icon-sun  {
      transform: rotate(90deg) scale(0); opacity: 0;
    }
    html[data-theme="light"] #theme-toggle .icon-moon {
      transform: rotate(0deg)  scale(1); opacity: 1;
    }

    /* Spin on click */
    #theme-toggle.spinning {
      animation: btnSpin 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    @keyframes btnSpin {
      0%   { transform: rotate(0deg)   scale(1); }
      40%  { transform: rotate(200deg) scale(0.85); }
      100% { transform: rotate(360deg) scale(1); }
    }

    /* Tooltip */
    #theme-toggle::after {
      content: attr(data-tooltip);
      position: absolute;
      bottom: calc(100% + 8px);
      left: 50%;
      transform: translateX(-50%) translateY(4px);
      background: var(--tooltip-bg, rgba(0,0,0,0.75));
      color: #fff;
      font-size: 0.7rem;
      white-space: nowrap;
      padding: 3px 8px;
      border-radius: 4px;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s ease, transform 0.2s ease;
    }
    #theme-toggle:hover::after {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  `, 'theme-styles');

  const btn = document.getElementById('theme-toggle');
  if (btn) {
    if (!btn.querySelector('.icon-sun')) {
      btn.innerHTML = `
        <span class="icon-sun" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1"  x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22"  x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1"  y1="12" x2="3"  y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
        </span>
        <span class="icon-moon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        </span>
        <span class="sr-only">Toggle theme</span>
      `;
    }
    updateButtonTooltip(btn, currentTheme);
  }

  const ripple = document.createElement('div');
  ripple.id = 'theme-ripple';
  document.body.appendChild(ripple);

  if (btn) {
    btn.addEventListener('click', (e) => {
      const next = currentTheme === 'dark' ? 'light' : 'dark';

      const rect = btn.getBoundingClientRect();
      const cx   = rect.left + rect.width  / 2;
      const cy   = rect.top  + rect.height / 2;
      ripple.style.left     = `${cx}px`;
      ripple.style.top      = `${cy}px`;
      ripple.style.width    = `${Math.max(window.innerWidth, window.innerHeight) * 0.5}px`;
      ripple.style.height   = ripple.style.width;
      ripple.style.marginLeft = `-${parseFloat(ripple.style.width) / 2}px`;
      ripple.style.marginTop  = `-${parseFloat(ripple.style.height) / 2}px`;
      ripple.style.background = next === 'light' ? '#ffffff' : '#0a0a0f';

      ripple.classList.remove('expanding');
      void ripple.offsetWidth;
      ripple.classList.add('expanding');

      btn.classList.remove('spinning');
      void btn.offsetWidth;
      btn.classList.add('spinning');
      btn.addEventListener('animationend', () => btn.classList.remove('spinning'), { once: true });

      applyTheme(next, true);
      currentTheme = next;
      localStorage.setItem('theme', next);
      updateButtonTooltip(btn, next);
    });
  }

  systemPrefersLight.addEventListener('change', (e) => {
    if (localStorage.getItem('theme')) return;
    const next = e.matches ? 'light' : 'dark';
    applyTheme(next, true);
    currentTheme = next;
    if (btn) updateButtonTooltip(btn, next);
  });

  function applyTheme(theme, animate) {
    if (animate) {
      document.documentElement.classList.add('theme-transitioning');
      setTimeout(() => {
        document.documentElement.classList.remove('theme-transitioning');
      }, 500);
    }

    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }

    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.content = theme === 'light' ? '#ffffff' : '#0a0a0f';
    }
  }

  function updateButtonTooltip(btn, currentTheme) {
    const label = currentTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
    btn.setAttribute('aria-label',    label);
    btn.setAttribute('data-tooltip',  label);
  }

  function injectStyle(css, id) {
    if (document.getElementById(id)) return;
    const tag = document.createElement('style');
    tag.id = id;
    tag.textContent = css;
    document.head.appendChild(tag);
  }
}
