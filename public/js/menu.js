document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const header = document.querySelector('.site-header');
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Toggle menu when clicking the hamburger button
    if (menuToggle) {
      menuToggle.addEventListener('click', function(e) {
        // Prevent this click from immediately closing the menu
        e.stopPropagation();
        
        header.classList.toggle('menu-open');
        document.body.classList.toggle('menu-open');
        
        // Toggle aria-expanded for accessibility
        const isOpen = header.classList.contains('menu-open');
        menuToggle.setAttribute('aria-expanded', isOpen);
      });
    }
    
    // Close menu when clicking on a nav link (but don't prevent navigation)
    navLinks.forEach(link => {
      link.addEventListener('click', function() {
        // Just close the menu - don't prevent default behavior
        header.classList.remove('menu-open');
        document.body.classList.remove('menu-open');
        if (menuToggle) {
          menuToggle.setAttribute('aria-expanded', 'false');
        }
        // The browser will handle the actual navigation
      });
    });
    
    // Close menu when clicking outside of the nav menu
    document.addEventListener('click', function(e) {
      if (
        header.classList.contains('menu-open') && 
        !e.target.closest('.main-nav') && 
        !e.target.closest('.mobile-menu-toggle')
      ) {
        header.classList.remove('menu-open');
        document.body.classList.remove('menu-open');
        if (menuToggle) {
          menuToggle.setAttribute('aria-expanded', 'false');
        }
      }
    });
    
    // Prevent clicks inside the mobile nav from closing it
    const mainNav = document.querySelector('.main-nav');
    if (mainNav) {
      mainNav.addEventListener('click', function(e) {
        // Only stop propagation if we're not clicking a link
        if (!e.target.closest('.nav-link')) {
          e.stopPropagation();
        }
      });
    }
  });