// js/video.js

const DESKTOP_SRC  = 'assets/videos/intro.mp4';
const MOBILE_SRC   = 'assets/videos/phn-vid.mp4';
const MOBILE_QUERY = window.matchMedia('(max-width: 768px)');
const FADE_MS      = 380;

/**
 * Smoothly fades a video's volume to a target level using an
 * ease-out cubic curve via requestAnimationFrame.
 * Properly handles the `.muted` property so browsers don't
 * block unmuted playback as a policy violation.
 *
 * @param {HTMLVideoElement} video
 * @param {number} targetVolume — 0 (mute) or 1 (unmute)
 * @param {number} durationMs
 * @returns {Promise<void>} resolves when the fade is complete
 */
function fadeVolume(video, targetVolume, durationMs = FADE_MS) {
  return new Promise(resolve => {
    // When fading in, always start from silence so there's no pop.
    // When fading out, start from the video's current volume.
    const startVolume = targetVolume > 0 ? 0 : (video.volume || 1);
    const start = performance.now();

    if (targetVolume > 0) {
      video.volume = 0;
      video.muted  = false; // Must unmute before volume can be heard
    }

    function tick(now) {
      const t     = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - t, 3); // Ease-out cubic
      video.volume = startVolume + (targetVolume - startVolume) * eased;

      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        if (targetVolume === 0) video.muted = true;
        resolve();
      }
    }

    requestAnimationFrame(tick);
  });
}

/**
 * Returns a function that swaps the video's <source> only when
 * the src actually changes — avoids a needless reload/seek-reset
 * if matchMedia fires but the breakpoint hasn't actually crossed.
 *
 * @param {HTMLVideoElement} video
 * @returns {function(string): void}
 */
function createSourceLoader(video) {
  let loadedSrc = null;

  return function loadSource(src) {
    if (loadedSrc === src) return;
    loadedSrc = src;

    const wasPlaying = !video.paused;

    video.querySelectorAll('source').forEach(s => s.remove());

    const source  = document.createElement('source');
    source.src    = src;
    source.type   = 'video/mp4';
    video.appendChild(source);
    video.load();

    if (wasPlaying) video.play().catch(() => {});
  };
}

/**
 * Initialises the hero video: adaptive source loading, playback,
 * sound toggle with volume fade, visibility-based pause/resume,
 * and reduced-motion support.
 *
 * @returns {function(): void} destroy — call to clean up listeners
 *   and abort pending network requests (useful in SPAs).
 */
export function initVideo() {
  const heroVideo      = document.querySelector('.hero-video');
  const heroSection    = document.querySelector('.hero');
  const soundToggleBtn = document.getElementById('sound-toggle');

  if (!heroVideo) return () => {};

  const prefersReducedMotion =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Adaptive source ────────────────────────────────────────────────
  const loadSource = createSourceLoader(heroVideo);

  function updateSource() {
    loadSource(MOBILE_QUERY.matches ? MOBILE_SRC : DESKTOP_SRC);
  }

  updateSource();
  MOBILE_QUERY.addEventListener('change', updateSource);

  // ── Playback ───────────────────────────────────────────────────────
  // Always start muted so autoplay isn't blocked by browser policy.
  heroVideo.muted  = true;
  heroVideo.volume = 0;

  if (!prefersReducedMotion) {
    heroVideo.play().catch(e => console.warn('Video autoplay blocked:', e));
  }

  // ── Sound toggle ───────────────────────────────────────────────────
  if (soundToggleBtn) {
    const iconMuted   = soundToggleBtn.querySelector('.icon-muted');
    const iconUnmuted = soundToggleBtn.querySelector('.icon-unmuted');
    let isFading = false;

    /** Sync all icon/ARIA/data state to a single source of truth. */
    function syncSoundUI(muted) {
      if (iconMuted)   iconMuted.style.display   = muted ? 'block' : 'none';
      if (iconUnmuted) iconUnmuted.style.display = muted ? 'none'  : 'block';
      // ARIA label for screen readers
      soundToggleBtn.setAttribute('aria-label', muted ? 'Unmute video' : 'Mute video');
      // data attribute lets CSS style the button based on state (e.g. glowing ring)
      soundToggleBtn.dataset.muted = String(muted);
    }

    syncSoundUI(true);

    soundToggleBtn.addEventListener('click', async () => {
      if (isFading) return; // Debounce rapid clicks during a fade
      isFading = true;

      const willMute = !heroVideo.muted;
      syncSoundUI(willMute);
      await fadeVolume(heroVideo, willMute ? 0 : 1);

      isFading = false;
    });
  }

  // ── Visibility observer ────────────────────────────────────────────
  // Pause the video (and hide the sound toggle) when the hero is
  // fully scrolled off-screen to free up CPU/GPU/battery.
  function setSoundToggleVisible(visible) {
    if (!soundToggleBtn) return;
    soundToggleBtn.style.opacity       = visible ? '1' : '0';
    soundToggleBtn.style.pointerEvents = visible ? 'auto' : 'none';
  }

  let visibilityObserver = null;

  if (heroSection && window.IntersectionObserver) {
    visibilityObserver = new IntersectionObserver(
      entries => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          if (!prefersReducedMotion) heroVideo.play().catch(() => {});
          setSoundToggleVisible(true);
        } else {
          heroVideo.pause();
          setSoundToggleVisible(false);
        }
      },
      { threshold: 0.1 }
    );

    visibilityObserver.observe(heroSection);
  }

  // ── Cleanup ────────────────────────────────────────────────────────
  return function destroy() {
    MOBILE_QUERY.removeEventListener('change', updateSource);
    visibilityObserver?.disconnect();
    heroVideo.pause();
    heroVideo.querySelectorAll('source').forEach(s => s.remove());
    heroVideo.removeAttribute('src');
    heroVideo.load(); // Abort any in-flight network requests
  };
}