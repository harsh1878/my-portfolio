// js/form.js
export function initForm() {
  const contactForm = document.getElementById('contact-form');
  const submitBtn = document.getElementById('submit-btn');
  const formMessage = document.getElementById('form-message');

  if (!contactForm) return;

  // ─── REPLACE THIS with your deployed Google Apps Script /exec URL ───────────
  const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw2fwfgKaBZX2NYUVouVwXZ39oGgLqzLTS1_-vTVIg3BbE3awwTwjZJuITVpdVK_AI/exec';
  // ─────────────────────────────────────────────────────────────────────────────

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // ── 1. Read & trim field values ──────────────────────────────────────────
    const name    = document.getElementById('name').value.trim();
    const email   = document.getElementById('email').value.trim();
    const subject = document.getElementById('subject').value.trim();
    const message = document.getElementById('message').value.trim();

    // ── 2. Client-side validation ────────────────────────────────────────────
    if (!name || !email || !subject || !message) {
      showMessage('error', 'Please fill in all fields.');
      return;
    }

    if (!isValidEmail(email)) {
      showMessage('error', 'Please enter a valid email address.');
      return;
    }

    // ── 3. Lock the button while submitting ──────────────────────────────────
    const originalBtnText = submitBtn.innerText;
    submitBtn.innerText   = 'Sending…';
    submitBtn.disabled    = true;
    hideMessage();

    // ── 4. Decide: mock mode (no URL set) or real submission ─────────────────
    const isMock = !GOOGLE_APPS_SCRIPT_URL ||
                   GOOGLE_APPS_SCRIPT_URL.includes('YOUR_SCRIPT_ID');

    try {
      if (isMock) {
        // ── Mock path: useful while developing locally ──────────────────────
        console.warn('Google Apps Script URL not set – running in mock mode.');
        await delay(1500);
        showMessage('success', 'Thank you! Your message has been sent successfully.');
        contactForm.reset();

      } else {
        // ── Real path ───────────────────────────────────────────────────────
        //
        // WHY URLSearchParams instead of FormData?
        //   With mode:'no-cors' the browser blocks multipart/form-data payloads
        //   from reaching Google Apps Script, so e.parameter.* would be empty.
        //   URL-encoded bodies (application/x-www-form-urlencoded) pass through
        //   correctly and are read by e.parameter just the same.
        //
        const params = new URLSearchParams({ name, email, subject, message });

        await fetch(GOOGLE_APPS_SCRIPT_URL, {
          method : 'POST',
          body   : params.toString(),
          mode   : 'no-cors',          // avoids CORS pre-flight; response is opaque
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });

        // mode:'no-cors' always returns an opaque response (status 0), so we
        // cannot read the JSON back — we optimistically treat reaching this
        // line without a thrown error as success.
        showMessage('success', 'Thank you! Your message has been sent successfully.');
        contactForm.reset();
      }

    } catch (error) {
      console.error('Form submission error:', error);
      showMessage('error', 'Oops! Something went wrong. Please try again later.');

    } finally {
      submitBtn.innerText = originalBtnText;
      submitBtn.disabled  = false;
    }
  });

  // ── Helpers ────────────────────────────────────────────────────────────────

  /**
   * Show a status message below the submit button.
   * @param {'success'|'error'} type
   * @param {string} text
   */
  function showMessage(type, text) {
    formMessage.textContent  = text;
    formMessage.className    = `form-message ${type}`;
    formMessage.style.display = 'block';

    // Auto-hide after 5 s
    setTimeout(hideMessage, 5000);
  }

  function hideMessage() {
    formMessage.style.display = 'none';
    formMessage.className     = 'form-message';
    formMessage.textContent   = '';
  }

  /** Minimal RFC-5322–style e-mail check. */
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /** Promise-based setTimeout wrapper. */
  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}