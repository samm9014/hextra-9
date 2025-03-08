// assets/js/menu.js
document.addEventListener('DOMContentLoaded', function () {
  const menuButton = document.querySelector('.hamburger-menu');
  const mobileMenu = document.querySelector('.mobile-dropdown-menu');
  const overlay = document.querySelector('.mobile-menu-overlay');
  
  if (!menuButton || !mobileMenu || !overlay) {
    console.log("Menu elements not found:", {menuButton, mobileMenu, overlay});
    return;
  }
  
  function toggleMenu() {
    // Toggle icon animation
    const icon = menuButton.querySelector('svg');
    if (icon) icon.classList.toggle('open');
    
    // Toggle menu and overlay visibility
    mobileMenu.classList.toggle('hx-hidden');
    overlay.classList.toggle('hx-hidden');
    
    // Toggle body scroll
    document.body.classList.toggle('hx-overflow-hidden');
  }
  
  menuButton.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation(); // Prevent search script errors
    toggleMenu();
  });
  
  overlay.addEventListener('click', function() {
    toggleMenu();
  });
  
  // Close menu when clicking a link
  const menuLinks = mobileMenu.querySelectorAll('a');
  menuLinks.forEach(link => {
    link.addEventListener('click', function() {
      toggleMenu();
    });
  });
  
  // Handle clicks inside the menu to prevent closing
  mobileMenu.addEventListener('click', function(e) {
    e.stopPropagation();
  });
});