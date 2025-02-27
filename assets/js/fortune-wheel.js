// assets/js/fortune-wheel.js
// PART 1: Core Setup and State Management
document.addEventListener('DOMContentLoaded', function() {
  // Core elements
  const WHEEL = document.getElementById('fortune-wheel');
  const WHEEL_ICONS = document.querySelectorAll('.wheel-icon');
  const PREV_SLOT = document.getElementById('prev-category');
  const CURRENT_SLOT = document.getElementById('current-category');
  const NEXT_SLOT = document.getElementById('next-category');
  const RESULT_ELEMENT = document.getElementById('fortune-result');
  const CATEGORY_LINK = document.getElementById('fortune-category-link');
  
  // Bail if wheel element doesn't exist
  if (!WHEEL) return;
  
  // Core configuration
  const CATEGORIES = [
    { name: "Overlooked Objects", slug: "objects", path: "/objects/", color: "#F87171" },
    { name: "Daily Habits", slug: "habits", path: "/habits/", color: "#60A5FA" },
    { name: "Perspective Flips", slug: "perspective", path: "/perspective/", color: "#34D399" },
    { name: "Spotting Opportunities", slug: "opportunities", path: "/opportunities/", color: "#A78BFA" },
    { name: "Value Creation", slug: "value", path: "/value/", color: "#FBBF24" },
    { name: "Quiz", slug: "quiz", path: "/quiz/", color: "#F472B6" },
    { name: "Today's Fortune", slug: "todays-fortune", path: "/todays-fortune/", color: "#6EE7B7" },
    { name: "Hidden Spaces", slug: "spaces", path: "/spaces/", color: "#93C5FD" }
  ];
  
  const SEGMENT_COUNT = CATEGORIES.length;
  const SEGMENT_ANGLE = 360 / SEGMENT_COUNT;
  
  // State management
  let isSpinning = false;
  let currentRotation = 0;
  let currentIndex = 0;
  let resizeDebounceTimer = null;

  // Initialization
  function init() {
    // Enhance icon sizes
    enlargeIcons();
    
    // Create hover areas
    addSegmentHoverAreas();
    
    // Setup initial category display
    updateCategoryDisplay(0);
    
    // Add wheel click event
    WHEEL.addEventListener('click', spinWheel);
    
    // Accessibility
    WHEEL.setAttribute('tabindex', '0');
    WHEEL.setAttribute('role', 'button');
    WHEEL.setAttribute('aria-label', 'Spin the fortune wheel');
    WHEEL.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        spinWheel();
      }
    });
    
    // Setup responsive behavior
    makeResponsive();
  }
  
  // Increase icon sizes for better visibility
  function enlargeIcons() {
    WHEEL_ICONS.forEach(icon => {
      // Make containing div bigger
      icon.style.width = '32px';
      icon.style.height = '32px';
      
      // Make the colored circle bigger
      const innerDiv = icon.querySelector('div');
      if (innerDiv) {
        innerDiv.style.width = '40px';
        innerDiv.style.height = '40px';
        innerDiv.style.padding = '8px';
        
        // Make SVG bigger
        const svg = innerDiv.querySelector('svg');
        if (svg) {
          svg.style.width = '24px';
          svg.style.height = '24px';
        }
      }
    });
  }
  
  // Make wheel responsive to screen size changes - CONSOLIDATED VERSION
  function makeResponsive() {
    const wheelWrapper = WHEEL.closest('.fortune-wheel-wrapper');
    
    function updateSize() {
      // Keep the wheel a perfect square
      const containerWidth = wheelWrapper.clientWidth;
      wheelWrapper.style.height = `${containerWidth}px`;
      
      // Scale wheel icons
      const scale = containerWidth / 400; // 400px is reference size
      
      WHEEL_ICONS.forEach(icon => {
        if (!icon.getAttribute('data-original-style')) {
          icon.setAttribute('data-original-style', icon.style.cssText);
        }
        
        const originalStyle = icon.getAttribute('data-original-style');
        const topMatch = originalStyle.match(/top: (.+?)px/);
        const leftMatch = originalStyle.match(/left: (.+?)px/);
        
        if (topMatch && leftMatch) {
          const top = parseFloat(topMatch[1]) * scale;
          const left = parseFloat(leftMatch[1]) * scale;
          icon.style.top = `${top}px`;
          icon.style.left = `${left}px`;
        }
      });
      
      // Only update hover areas if not currently spinning
      if (!isSpinning) {
        addSegmentHoverAreas();
      }
    }
    
    // Consolidated event handling with debouncing
    function handleResize() {
      if (resizeDebounceTimer) clearTimeout(resizeDebounceTimer);
      resizeDebounceTimer = setTimeout(() => {
        requestAnimationFrame(updateSize);
      }, 100);
    }
    
    // Listen for all relevant resize events
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    // Initial size setup
    updateSize();
  }

  // Utility function to determine wheel segment at pointer position
  function determineActiveSegment() {
    try {
      // Get the wheel's current rotation from its transform style
      const transform = window.getComputedStyle(WHEEL).transform;
      let angle = 0;
      
      if (transform && transform !== 'none') {
        // Extract angle from transform matrix
        if (transform.includes('matrix')) {
          const matrix = new DOMMatrix(transform);
          angle = Math.atan2(matrix.b, matrix.a) * (180 / Math.PI);
        } else if (transform.includes('rotate')) {
          // Extract direct rotation value
          angle = parseFloat(transform.match(/rotate\((.+)deg\)/)[1]);
        }
      } else {
        // Fallback to tracked rotation
        angle = currentRotation;
      }
      
      // Normalize angle to positive degrees (0-360)
      angle = (angle % 360 + 360) % 360;
      
      // Calculate segment index
      // We add 180 degrees to account for pointer position at top
      const adjustedAngle = (angle + 180) % 360;
      const segmentIndex = Math.floor(adjustedAngle / SEGMENT_ANGLE);
      
      return segmentIndex;
    } catch (e) {
      console.error('Error determining active segment:', e);
      return Math.floor((currentRotation % 360) / SEGMENT_ANGLE);
    }
  }

  // Start the wheel
  init();



  // assets/js/fortune-wheel.js
  // PART 2: Hover System and Tooltips - FIXED VERSION

  // Create and add tooltip element
  const tooltip = document.createElement('div');
  tooltip.className = 'wheel-tooltip';
  tooltip.style.position = 'absolute';
  tooltip.style.padding = '8px 12px';
  tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  tooltip.style.color = 'white';
  tooltip.style.borderRadius = '4px';
  tooltip.style.fontSize = '14px';
  tooltip.style.fontWeight = 'bold';
  tooltip.style.pointerEvents = 'none';
  tooltip.style.zIndex = '100';
  tooltip.style.opacity = '0';
  tooltip.style.transition = 'opacity 0.2s ease';
  tooltip.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
  document.body.appendChild(tooltip);

  // Show tooltip with category name
  function showTooltip(event, category) {
    tooltip.textContent = category.name;
    tooltip.style.opacity = '1';
    tooltip.style.backgroundColor = category.color;
    
    // Add text shadow for better readability
    tooltip.style.textShadow = '0 1px 2px rgba(0,0,0,0.5)';
    
    // Calculate color brightness to determine text color
    const r = parseInt(category.color.slice(1, 3), 16);
    const g = parseInt(category.color.slice(3, 5), 16);
    const b = parseInt(category.color.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    // Use white text for dark backgrounds, black for light backgrounds
    tooltip.style.color = brightness < 128 ? 'white' : 'black';
    
    positionTooltip(event);
  }
  
  // Position tooltip near cursor/touch with improved placement
  function positionTooltip(event) {
    const x = event.clientX;
    const y = event.clientY;
    
    // Adjust placement based on position in viewport
    const viewportWidth = window.innerWidth;
    const tooltipWidth = tooltip.offsetWidth || 100; // Fallback width if not rendered yet
    
    // Keep tooltip on screen
    let xPos = x;
    if (x + tooltipWidth/2 > viewportWidth) {
      xPos = viewportWidth - tooltipWidth/2;
    } else if (x - tooltipWidth/2 < 0) {
      xPos = tooltipWidth/2;
    }
    
    // Position above cursor/finger with enough space
    tooltip.style.left = `${xPos}px`;
    tooltip.style.top = `${y - 40}px`;
    tooltip.style.transform = 'translateX(-50%)';
  }
  
  // Hide tooltip
  function hideTooltip() {
    tooltip.style.opacity = '0';
  }

  // FIXED HOVER SYSTEM: Uses an overlay layer that rotates with the wheel
  function addSegmentHoverAreas() {
    const wheelWrapper = WHEEL.closest('.fortune-wheel-wrapper');
    
    // Clean up any existing overlays
    const existingOverlays = wheelWrapper.querySelectorAll('.wheel-hover-overlay, .wheel-center-area');
    existingOverlays.forEach(el => el.remove());
    
    // Get wheel dimensions
    const wheelRect = wheelWrapper.getBoundingClientRect();
    const wheelSize = Math.min(wheelRect.width, wheelRect.height);
    const centerX = wheelSize / 2;
    const centerY = wheelSize / 2;
    const radius = wheelSize / 2;
    const innerRadius = radius * 0.3; // Center hole size (30% of radius)
    
    // ====== CREATE CENTER AREA WITHOUT ADDING REDUNDANT TEXT ======
    
    // Create a dedicated center area for spinning that stays fixed during wheel rotation
    const centerArea = document.createElement('div');
    centerArea.className = 'wheel-center-area';
    centerArea.style.position = 'absolute';
    centerArea.style.top = '50%';
    centerArea.style.left = '50%';
    centerArea.style.width = `${innerRadius * 2}px`;
    centerArea.style.height = `${innerRadius * 2}px`;
    centerArea.style.transform = 'translate(-50%, -50%)';
    centerArea.style.borderRadius = '50%';
    centerArea.style.cursor = 'pointer';
    centerArea.style.zIndex = '30'; // Higher z-index to stay on top
    centerArea.style.pointerEvents = 'auto';
    centerArea.style.backgroundColor = 'rgba(255,255,255,0.05)';
    
    // REMOVED: Don't add 'SPIN' text - assuming it's already in the SVG
    // The original wheel SVG already has the SPIN text
    
    // Center area always triggers spin
    centerArea.addEventListener('click', spinWheel);
    wheelWrapper.appendChild(centerArea);
    
    // ====== CREATE SVG OVERLAY FOR SEGMENTS ======
    
    // Create SVG element for precise segment shapes
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.classList.add('wheel-hover-overlay');
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.pointerEvents = 'none';
    svg.style.transform = `rotate(${currentRotation}deg)`;
    svg.style.transition = 'transform 0s';
    wheelWrapper.appendChild(svg);
    
    // Get computed wheel rotation for more accuracy
    function getWheelRotation() {
      const transform = window.getComputedStyle(WHEEL).transform;
      if (transform === 'none') return currentRotation;
      
      // Parse matrix
      try {
        if (transform.includes('matrix')) {
          const matrix = new DOMMatrix(transform);
          return Math.atan2(matrix.b, matrix.a) * (180 / Math.PI);
        }
      } catch (e) {
        return currentRotation;
      }
      
      return currentRotation;
    }
    
    // Use the wheel's actual rotation
    const actualRotation = getWheelRotation();
    svg.style.transform = `rotate(${actualRotation}deg)`;
    
    // Create segment areas with SVG paths for greater precision
    for (let i = 0; i < SEGMENT_COUNT; i++) {
      const category = CATEGORIES[i];
      
      // Calculate segment angles
      const startAngle = i * SEGMENT_ANGLE - 90; // -90 to start at top
      const endAngle = (i + 1) * SEGMENT_ANGLE - 90;
      
      // Convert to radians
      const startRad = startAngle * Math.PI / 180;
      const endRad = endAngle * Math.PI / 180;
      
      // Calculate points for arc
      const outerStartX = centerX + radius * Math.cos(startRad);
      const outerStartY = centerY + radius * Math.sin(startRad);
      
      const outerEndX = centerX + radius * Math.cos(endRad);
      const outerEndY = centerY + radius * Math.sin(endRad);
      
      const innerStartX = centerX + innerRadius * Math.cos(endRad);
      const innerStartY = centerY + innerRadius * Math.sin(endRad);
      
      const innerEndX = centerX + innerRadius * Math.cos(startRad);
      const innerEndY = centerY + innerRadius * Math.sin(startRad);
      
      // Create SVG path
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      
      // Use SVG arc command for perfect circular segments
      const largeArcFlag = (endAngle - startAngle > 180) ? 1 : 0;
      
      // Build path data
      const d = [
        `M ${outerStartX},${outerStartY}`, // Move to outer start
        `A ${radius},${radius} 0 ${largeArcFlag},1 ${outerEndX},${outerEndY}`, // Outer arc
        `L ${innerStartX},${innerStartY}`, // Line to inner point
        `A ${innerRadius},${innerRadius} 0 ${largeArcFlag},0 ${innerEndX},${innerEndY}`, // Inner arc (reverse)
        'Z' // Close path
      ].join(' ');
      
      path.setAttribute('d', d);
      path.setAttribute('fill', 'transparent');
      path.setAttribute('data-category', category.slug);
      path.setAttribute('data-index', i);
      path.style.pointerEvents = 'auto';
      path.style.cursor = 'pointer';
      
      // Add hover events
      path.addEventListener('mouseenter', e => {
        if (isSpinning) return;
        showTooltip(e, category);
      });
      
      path.addEventListener('mousemove', e => {
        if (isSpinning) return;
        positionTooltip(e);
      });
      
      path.addEventListener('mouseleave', () => {
        hideTooltip();
      });
      
      // Click handler
      path.addEventListener('click', e => {
        if (isSpinning) return;
        
        // With modifier key, navigate to category
        if (e.shiftKey || e.ctrlKey || e.metaKey) {
          window.location.href = category.path;
        } else {
          spinWheel();
        }
      });
      
      // Touch support
      path.addEventListener('touchstart', e => {
        if (isSpinning) return;
        const touch = e.touches[0];
        showTooltip(touch, category);
      });
      
      path.addEventListener('touchend', () => {
        hideTooltip();
      });
      
      svg.appendChild(path);
    }
    
    // Make sure center area is on top
    wheelWrapper.appendChild(centerArea);
  }
  
  // Create a category item for display panel
  function createCategoryItem(category) {
    const item = document.createElement('div');
    item.className = 'category-item';
    item.style.display = 'flex';
    item.style.alignItems = 'center';
    item.style.width = '100%';
    
    // Icon container
    const iconBox = document.createElement('div');
    iconBox.className = 'category-icon';
    iconBox.style.width = '32px';
    iconBox.style.height = '32px';
    iconBox.style.borderRadius = '50%';
    iconBox.style.marginRight = '12px';
    iconBox.style.flexShrink = '0';
    iconBox.style.display = 'flex';
    iconBox.style.alignItems = 'center';
    iconBox.style.justifyContent = 'center';
    iconBox.style.backgroundColor = category.color;
    
    // Get the icon from the wheel
    const wheelIcon = document.querySelector(`.wheel-icon[data-category="${category.slug}"] div`);
    if (wheelIcon) {
      const iconWrapper = document.createElement('div');
      iconWrapper.style.width = '20px';
      iconWrapper.style.height = '20px';
      iconWrapper.style.color = 'white';
      iconWrapper.innerHTML = wheelIcon.innerHTML;
      iconBox.appendChild(iconWrapper);
    }
    
    // Text label
    const label = document.createElement('span');
    label.className = 'category-name';
    label.textContent = category.name;
    label.style.whiteSpace = 'nowrap';
    label.style.overflow = 'hidden';
    label.style.textOverflow = 'ellipsis';
    
    // Assemble item
    item.appendChild(iconBox);
    item.appendChild(label);
    
    return item;
  }
  
  // Update the visible categories in the category panel
  function updateCategoryDisplay(centerIndex) {
    // Calculate indices with wrapping
    const prevIndex = (centerIndex - 1 + SEGMENT_COUNT) % SEGMENT_COUNT;
    const nextIndex = (centerIndex + 1) % SEGMENT_COUNT;
    
    // Clear slots
    PREV_SLOT.innerHTML = '';
    CURRENT_SLOT.innerHTML = '';
    NEXT_SLOT.innerHTML = '';
    
    // Add new category items
    PREV_SLOT.appendChild(createCategoryItem(CATEGORIES[prevIndex]));
    CURRENT_SLOT.appendChild(createCategoryItem(CATEGORIES[centerIndex]));
    NEXT_SLOT.appendChild(createCategoryItem(CATEGORIES[nextIndex]));
    
    // Update current index
    currentIndex = centerIndex;
  }



  // PART 3: Wheel Spinning and Animation

// Animate the categories during spin
function animateCategories(duration, finalIndex) {
  // How many segments we'll show during the animation
  const totalRotations = 3; // Minimum rotations
  const totalSegments = totalRotations * SEGMENT_COUNT;
  
  let segmentCounter = 0;
  let index = currentIndex;
  const intervalTime = duration / totalSegments;
  
  // Update categories at regular intervals
  const animation = setInterval(() => {
    index = (index + 1) % SEGMENT_COUNT;
    updateCategoryDisplay(index);
    
    segmentCounter++;
    if (segmentCounter >= totalSegments) {
      clearInterval(animation);
      // Final update to match the wheel
      updateCategoryDisplay(finalIndex);
    }
  }, intervalTime);
}

// Spin the wheel
function spinWheel() {
  if (isSpinning) return;
  isSpinning = true;
  
  // Hide tooltip during spin
  hideTooltip();
  
  // Remove hover areas during spin
  const wheelWrapper = WHEEL.closest('.fortune-wheel-wrapper');
  const hoverAreas = wheelWrapper.querySelectorAll('.wheel-hover-overlay, .wheel-center-area');
  hoverAreas.forEach(area => area.remove());
  
  // Hide any previous result
  if (RESULT_ELEMENT) {
    RESULT_ELEMENT.style.opacity = '0';
  }
  
  // Calculate spin parameters
  const minDuration = 3000;
  const extraDuration = 2000;
  const duration = minDuration + (Math.random() * extraDuration);
  
  const minRotations = 3;
  const maxRotations = 5;
  const rotations = minRotations + (Math.random() * (maxRotations - minRotations));
  
  const targetRotation = currentRotation + (rotations * 360);
  
  // Select random segment for landing
  const randomSegment = Math.floor(Math.random() * SEGMENT_COUNT);
  
  // Calculate final rotation to land on selected segment
  const segmentOffset = SEGMENT_ANGLE * randomSegment;
  const finalRotation = Math.ceil(targetRotation / 360) * 360 - segmentOffset - (SEGMENT_ANGLE / 2);
  
  // Apply wheel animation
  WHEEL.style.transition = `transform ${duration}ms cubic-bezier(0.1, 0.7, 0.1, 1)`;
  WHEEL.style.transform = `rotate(${finalRotation}deg)`;
  
  // Keep icons upright
  WHEEL_ICONS.forEach(icon => {
    icon.style.transition = `transform ${duration}ms cubic-bezier(0.1, 0.7, 0.1, 1)`;
    icon.style.transform = `translate(-50%, -50%) rotate(${-finalRotation}deg)`;
  });
  
  // Add haptic feedback if available
  if (navigator.vibrate) {
    navigator.vibrate(50);
  }
  
  // Animate the category list
  animateCategories(duration, randomSegment);
  
  // Handle completion
  setTimeout(() => {
    const selectedCategory = CATEGORIES[randomSegment];
    
    // Update result - update link and its styling
    if (CATEGORY_LINK) {
      CATEGORY_LINK.textContent = selectedCategory.name;
      CATEGORY_LINK.href = selectedCategory.path;
      CATEGORY_LINK.style.backgroundColor = selectedCategory.color;
    }
    
    // Show result element
    if (RESULT_ELEMENT) {
      RESULT_ELEMENT.style.opacity = '1';
    }
    
    // Update state
    currentRotation = finalRotation;
    isSpinning = false;
    
    // Recreate hover areas to align with new wheel position
    requestAnimationFrame(() => {
      requestAnimationFrame(addSegmentHoverAreas);
    });
    
    // DIRECT CONFETTI IMPLEMENTATION
    // This ensures we don't rely on external file loading which might be failing
    const confetti = (function() {
      console.log("Initializing direct confetti");
      
      return {
        create: function(options) {
          console.log("Creating direct confetti particles");
          
          const canvas = document.createElement('canvas');
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
          canvas.style.position = 'fixed';
          canvas.style.top = '0';
          canvas.style.left = '0';
          canvas.style.pointerEvents = 'none';
          canvas.style.zIndex = '1000';
          document.body.appendChild(canvas);
          
          const ctx = canvas.getContext('2d');
          let particles = [];
          
          // Get options with defaults
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
          for (let i = 0; i < particleCount; i++) {
            const random = (min, max) => Math.random() * (max - min) + min;
            
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
          
          // Animation function
          function animate() {
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
              requestAnimationFrame(animate);
            } else {
              // Clean up when done
              if (canvas.parentNode) {
                canvas.parentNode.removeChild(canvas);
              }
            }
          }
          
          // Start animation
          animate();
          
          // Auto-cleanup after animation completes
          setTimeout(() => {
            console.log("Cleaning up confetti");
            if (canvas.parentNode) {
              canvas.parentNode.removeChild(canvas);
              particles = [];
            }
          }, duration * 1.5);
        }
      };
    })();
    
    // Trigger confetti with the wheel position
    const wheelRect = WHEEL.getBoundingClientRect();
    const origin = {
      x: (wheelRect.left + wheelRect.width / 2) / window.innerWidth,
      y: (wheelRect.top + wheelRect.height / 2) / window.innerHeight
    };
    
    console.log("Confetti origin:", origin);
    
    // Use selected category color + some neutral colors
    const colors = [
      selectedCategory.color,  // Winning segment color (used multiple times for emphasis)
      selectedCategory.color,
      selectedCategory.color,
      selectedCategory.color,
      shadeColor(selectedCategory.color, 20),  // Lighter version
      shadeColor(selectedCategory.color, -20)  // Darker version
    ];
    
    // Helper function to create shade variations
    function shadeColor(color, percent) {
      let R = parseInt(color.substring(1,3), 16);
      let G = parseInt(color.substring(3,5), 16);
      let B = parseInt(color.substring(5,7), 16);
    
      R = parseInt(R * (100 + percent) / 100);
      G = parseInt(G * (100 + percent) / 100);
      B = parseInt(B * (100 + percent) / 100);
    
      R = (R<255)?R:255;  
      G = (G<255)?G:255;  
      B = (B<255)?B:255;  
    
      R = Math.round(R);
      G = Math.round(G);
      B = Math.round(B);
    
      const RR = ((R.toString(16).length==1)?"0"+R.toString(16):R.toString(16));
      const GG = ((G.toString(16).length==1)?"0"+G.toString(16):G.toString(16));
      const BB = ((B.toString(16).length==1)?"0"+B.toString(16):B.toString(16));
    
      return "#"+RR+GG+BB;
    }
    
   // This is where you customize the confetti
  confetti.create({
  particleCount: 120,        // Increase for more particles
  colors: colors,            // Change this array for different colors
  spread: 80,                // Higher values = wider spread
  origin: origin,            // Modify for different starting position
  duration: 2000             // Duration in milliseconds (2 seconds currently)
});
    
    // Final haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate([30, 50, 30]);
    }
    
    // Accessibility announcement - screen reader only
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'assertive');
    announcement.setAttribute('role', 'status');
    announcement.className = 'sr-only'; // Screen reader only
    announcement.style.position = 'absolute';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.padding = '0';
    announcement.style.margin = '-1px';
    announcement.style.overflow = 'hidden';
    announcement.style.clip = 'rect(0, 0, 0, 0)';
    announcement.style.whiteSpace = 'nowrap';
    announcement.style.border = '0';
    announcement.textContent = `The wheel landed on ${selectedCategory.name}`;
    document.body.appendChild(announcement);
    
    // Clean up announcement after it's read
    setTimeout(() => {
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement);
      }
    }, 3000);
    
  }, duration + 100);
}



  
  // PART 4: Finalization and Optimization

  // Helper to check if device supports touch
  const supportsTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Performance optimization: Use requestIdleCallback for non-critical tasks
  const scheduleIdle = window.requestIdleCallback || 
                        (fn => setTimeout(fn, 1));
  
  // Preload necessary resources
  function preloadResources() {
    // Preload any required images in the background if needed
    scheduleIdle(() => {
      // This runs when browser is idle, improving initial load time
    });
  }
  
  // Prevent excessive animations on low-power devices
  function optimizeForDevice() {
    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // Use simpler animations for users who prefer reduced motion
      document.documentElement.classList.add('reduced-motion');
    }
    
    // Detect low-power mode on devices that support it
    if ('connection' in navigator) {
      if (navigator.connection.saveData || 
          navigator.connection.effectiveType === 'slow-2g' || 
          navigator.connection.effectiveType === '2g') {
        // Reduce effects for data-saving or slow connections
        document.documentElement.classList.add('low-data-mode');
      }
    }
  }
  
  // Clean up resources when page unloads
  function setupCleanup() {
    window.addEventListener('beforeunload', () => {
      // Remove event listeners, clear timers
      // This helps prevent memory leaks
      tooltip.remove();
    });
  }
  
  // Initialize optimizations
  preloadResources();
  optimizeForDevice();
  setupCleanup();
  
  // Export public methods if needed for external access
  window.FortuneWheel = {
    spin: spinWheel
  };

}); // End of DOMContentLoaded event