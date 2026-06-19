import { initTheme } from './theme.js';
import { initAnimations } from './animations.js';
import { initForm } from './form.js';
import { initVideo } from './video.js';

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initAnimations();
  initForm();
  initVideo();

const mobileToggle = document.getElementById('mobile-toggle');
const navLinks = document.getElementById('nav-links');

function closeMobileMenu() {
  mobileToggle.classList.remove('open');
  navLinks.classList.remove('open');
  document.body.classList.remove('menu-open');
}

function openMobileMenu() {
  mobileToggle.classList.add('open');
  navLinks.classList.add('open');
  document.body.classList.add('menu-open');
}

if (mobileToggle && navLinks) {
  mobileToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.contains('open');
    isOpen ? closeMobileMenu() : openMobileMenu();
  });

  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', closeMobileMenu);
  });

  document.addEventListener('click', (e) => {
    const isOpen = navLinks.classList.contains('open');
    const clickedInsideMenu = navLinks.contains(e.target);
    const clickedToggle = mobileToggle.contains(e.target);
    if (isOpen && !clickedInsideMenu && !clickedToggle) {
      closeMobileMenu();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navLinks.classList.contains('open')) {
      closeMobileMenu();
    }
  });
}

  const sections = document.querySelectorAll('section[id]');
  
  window.addEventListener('scroll', () => {
    const scrollY = window.pageYOffset;
    
    sections.forEach(current => {
      const sectionHeight = current.offsetHeight;
      const sectionTop = current.offsetTop - 100;
      const sectionId = current.getAttribute('id');
      const navLink = document.querySelector(`.nav-links a[href*=${sectionId}]`);
      
      if(navLink) {
        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
          navLink.classList.add('active');
        } else {
          navLink.classList.remove('active');
        }
      }
    });
  });
});
