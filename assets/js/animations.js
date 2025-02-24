// assets/js/animations.js
// animations.js - Handles intersection observer functionality for smooth animations
document.addEventListener('DOMContentLoaded', () => {
  // Select all elements that should animate on scroll
  const animatedElements = document.querySelectorAll('.animate-on-scroll');
  
  // Create an intersection observer to detect when elements enter viewport
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
      }
    });
  }, {
    threshold: 0.1,  // Trigger when 10% of element is visible
    rootMargin: '50px'  // Small margin to trigger slightly before element enters viewport
  });

  // Start observing all animated elements
  animatedElements.forEach(element => observer.observe(element));
});