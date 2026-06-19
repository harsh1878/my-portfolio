const DESKTOP_SRC  = 'assets/videos/intro.mp4';
const MOBILE_SRC   = 'assets/videos/phn-vid.mp4';
const MOBILE_QUERY = window.matchMedia('(max-width: 768px)');

function createSourceLoader(video) {
  let loadedSrc = null;

  return function loadSource(src) {
    if (loadedSrc === src) return;
    loadedSrc = src;

    const wasPlaying = !video.paused;
    video.querySelectorAll('source').forEach(s => s.remove());

    const source = document.createElement('source');
    source.src = src;
    source.type = 'video/mp4';
    video.appendChild(source);
    video.load();

    if (wasPlaying) video.play().catch(() => {});
  };
}

export function initVideo() {
  const heroVideo = document.getElementById('hero-video');
  const heroSection = document.querySelector('.hero');
  const soundToggleBtn = document.getElementById('sound-toggle');
  const fallbackImg = document.getElementById('hero-fallback-img');
  
  if (!heroVideo) return () => {};

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const loadSource = createSourceLoader(heroVideo);

  function updateSource() {
    loadSource(MOBILE_QUERY.matches ? MOBILE_SRC : DESKTOP_SRC);
  }

  updateSource();
  MOBILE_QUERY.addEventListener('change', updateSource);

  const handleVideoError = () => {
    console.error("Video failed to load or play.");
    if (fallbackImg) fallbackImg.style.display = 'block';
    heroVideo.style.display = 'none';
    if (soundToggleBtn) soundToggleBtn.style.display = 'none';
  };

  heroVideo.addEventListener('error', handleVideoError, true);

  let userMutedState = false;

  const updateSoundToggleUI = () => {
    if (!soundToggleBtn) return;
    const iconMuted = soundToggleBtn.querySelector('.icon-muted');
    const iconUnmuted = soundToggleBtn.querySelector('.icon-unmuted');
    if (heroVideo.muted) {
      if (iconMuted) iconMuted.style.display = 'block';
      if (iconUnmuted) iconUnmuted.style.display = 'none';
    } else {
      if (iconMuted) iconMuted.style.display = 'none';
      if (iconUnmuted) iconUnmuted.style.display = 'block';
    }
  };

  const playVideo = () => {
    if (prefersReducedMotion) return;
    
    heroVideo.muted = userMutedState;
    const playPromise = heroVideo.play();
    
    if (playPromise !== undefined) {
      playPromise.then(() => {
        updateSoundToggleUI();
      }).catch(error => {
        if (!heroVideo.muted && error.name === "NotAllowedError") {
          console.warn("Unmuted autoplay prevented by browser policy. Falling back to muted autoplay.");
          heroVideo.muted = true;
          heroVideo.play().then(() => {
             updateSoundToggleUI();
          }).catch(e => {
             console.error("Muted autoplay also failed:", e);
             handleVideoError();
          });
        } else {
          console.error("Video playback failed:", error);
          handleVideoError();
        }
      });
    }
  };

  playVideo();
  updateSoundToggleUI();

  if (soundToggleBtn) {
    soundToggleBtn.addEventListener('click', () => {
      heroVideo.muted = !heroVideo.muted;
      userMutedState = heroVideo.muted;
      updateSoundToggleUI();
    });
  }

  function setSoundToggleVisible(visible) {
    if (!soundToggleBtn) return;
    soundToggleBtn.style.opacity = visible ? '1' : '0';
    soundToggleBtn.style.pointerEvents = visible ? 'auto' : 'none';
  }

  let visibilityObserver = null;

  if (heroSection && window.IntersectionObserver) {
    visibilityObserver = new IntersectionObserver(
      entries => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          playVideo();
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

  return function destroy() {
    MOBILE_QUERY.removeEventListener('change', updateSource);
    visibilityObserver?.disconnect();
    heroVideo.pause();
    heroVideo.querySelectorAll('source').forEach(s => s.remove());
    heroVideo.removeAttribute('src');
    heroVideo.load();
  };
}
