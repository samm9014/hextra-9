// assets/js/mini-confetti.js
const miniConfetti = (function() {
  let canvas = null;
  let ctx = null;
  let particles = [];
  let animationFrame = null;
  
  function random(min, max) {
    return Math.random() * (max - min) + min;
  }
  
  function createParticles(options) {
    console.log("Creating confetti particles");
    
    const {
      particleCount = 100,
      colors = ['#F87171', '#60A5FA', '#34D399', '#A78BFA', '#FBBF24'],
      spread = 70,
      origin = { x: 0.5, y: 0.5 },
      gravity = 1,
      duration = 2000
    } = options || {};
    
    // Convert normalized coordinates to pixels
    const startX = origin.x * window.innerWidth;
    const startY = origin.y * window.innerHeight;
    
    // Create particles
    particles = [];
    for (let i = 0; i < particleCount; i++) {
      const color = colors[Math.floor(random(0, colors.length))];
      const size = random(8, 12); // Larger particles
      const angle = random(0, Math.PI * 2);
      const velocity = random(3, 7); // Faster velocity
      
      particles.push({
        x: startX,
        y: startY,
        size,
        color,
        vx: Math.cos(angle) * velocity * (spread / 50),
        vy: Math.sin(angle) * velocity * (spread / 50),
        gravity,
        alpha: 1,
        lifetime: random(duration * 0.8, duration * 1.2),
        birth: Date.now()
      });
    }
    
    // Start animation
    if (!animationFrame) {
      animate();
    }
    
    // Auto-cleanup after animation completes
    setTimeout(() => {
      console.log("Cleaning up confetti");
      if (canvas && canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
        canvas = null;
        ctx = null;
        particles = [];
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
    }, duration * 1.5);
  }
  
  function animate() {
    if (!canvas) {
      // Create canvas on first animation
      canvas = document.createElement('canvas');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      canvas.style.position = 'fixed';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '1000';
      document.body.appendChild(canvas);
      ctx = canvas.getContext('2d');
      console.log("Canvas created for confetti");
    }
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw particles
    const now = Date.now();
    particles = particles.filter(p => {
      // Calculate age and fade
      const age = now - p.birth;
      p.alpha = 1 - (age / p.lifetime);
      
      // Remove expired particles
      if (p.alpha <= 0) return false;
      
      // Update position with gravity
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity * 0.1;
      
      // Draw particle
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
      
      return true;
    });
    
    // Continue animation if particles exist
    if (particles.length > 0) {
      animationFrame = requestAnimationFrame(animate);
    } else {
      animationFrame = null;
    }
  }
  
  // Return public API
  return {
    create: createParticles
  };
})();

// Export for use
if (typeof module !== 'undefined') {
  module.exports = miniConfetti;
} else {
  window.miniConfetti = miniConfetti;
  console.log("miniConfetti initialized and available globally");
}