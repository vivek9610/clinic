// nav.js — Shared mobile navbar toggle & dropdown logic
document.addEventListener('DOMContentLoaded', () => {
  const toggle   = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  if (toggle && navLinks) {
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = navLinks.classList.toggle('open');
      toggle.classList.toggle('open', isOpen);
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      document.body.classList.toggle('nav-open', isOpen);
    });

    // Close nav when clicking any actual link (mobile navigation)
    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        // Desktop dropdown toggle should not close the menu
        if (window.innerWidth > 900 && a.classList.contains('dropdown-toggle')) {
          return;
        }
        navLinks.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('nav-open');
      });
    });

    // Close drawer when clicking outside
    document.addEventListener('click', (e) => {
      if (navLinks.classList.contains('open') && !navLinks.contains(e.target) && !toggle.contains(e.target)) {
        navLinks.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('nav-open');
      }
    });

    // Close drawer on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navLinks.classList.contains('open')) {
        navLinks.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('nav-open');
      }
    });
  }

  // Handle desktop dropdown click/touch
  const dropdownToggles = document.querySelectorAll('.nav-dropdown .dropdown-toggle');
  dropdownToggles.forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (window.innerWidth > 900) {
        e.preventDefault();
        const parent = btn.closest('.nav-dropdown');
        if (parent) {
          parent.classList.toggle('active');
        }
      }
    });
  });

  // Close desktop dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-dropdown')) {
      document.querySelectorAll('.nav-dropdown.active').forEach(d => d.classList.remove('active'));
    }
  });
});
