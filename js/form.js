export function initForm() {
  const contactForm = document.getElementById('contact-form');
  const submitBtn = document.getElementById('submit-btn');
  const formMessage = document.getElementById('form-message');

  if (!contactForm) return;
  const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw2fwfgKaBZX2NYUVouVwXZ39oGgLqzLTS1_-vTVIg3BbE3awwTwjZJuITVpdVK_AI/exec';

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name    = document.getElementById('name').value.trim();
    const email   = document.getElementById('email').value.trim();
    const subject = document.getElementById('subject').value.trim();
    const message = document.getElementById('message').value.trim();

    if (!name || !email || !subject || !message) {
      showMessage('error', 'Please fill in all fields.');
      return;
    }

    if (!isValidEmail(email)) {
      showMessage('error', 'Please enter a valid email address.');
      return;
    }

    const originalBtnText = submitBtn.innerText;
    submitBtn.innerText   = 'Sending…';
    submitBtn.disabled    = true;
    hideMessage();

    const isMock = !GOOGLE_APPS_SCRIPT_URL ||
                   GOOGLE_APPS_SCRIPT_URL.includes('YOUR_SCRIPT_ID');

    try {
      if (isMock) {
        console.warn('Google Apps Script URL not set – running in mock mode.');
        await delay(1500);
        showMessage('success', 'Thank you! Your message has been sent successfully.');
        contactForm.reset();

      } else {
        const params = new URLSearchParams({ name, email, subject, message });

        await fetch(GOOGLE_APPS_SCRIPT_URL, {
          method : 'POST',
          body   : params.toString(),
          mode   : 'no-cors',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });
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

  function showMessage(type, text) {
    formMessage.textContent  = text;
    formMessage.className    = `form-message ${type}`;
    formMessage.style.display = 'block';

    setTimeout(hideMessage, 5000);
  }

  function hideMessage() {
    formMessage.style.display = 'none';
    formMessage.className     = 'form-message';
    formMessage.textContent   = '';
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
  
  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
