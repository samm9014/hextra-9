// assets/js/fortune-wheel.js - Optimized with 20 specialized parts
document.addEventListener('DOMContentLoaded', function() {
  /**
   * PART 1: Core Elements
   * Main DOM elements used throughout the code
   */
  // Core elements - cached for better performance
  const WHEEL = document.getElementById('fortune-wheel');
  const WHEEL_ICONS = document.querySelectorAll('.hx-wheel-icon');
  const PREV_SLOT = document.getElementById('prev-category');
  const CURRENT_SLOT = document.getElementById('current-category');
  const NEXT_SLOT = document.getElementById('next-category');
  const RESULT_ELEMENT = document.getElementById('fortune-result');
  const RESULT_CONTENT = document.getElementById('result-content');
  const WHEEL_LABELS = document.getElementById('wheel-segment-labels');
  
  // Bail if wheel element doesn't exist
  if (!WHEEL) return;
  
  /**
   * PART 2: Feature Detection
   * Detect device capabilities
   */
  // Check for touch support
  const supportsTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const hasReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  /**
   * PART 3: Configuration
   * Category definitions and basic settings
   */
  // Category definitions
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
  
  // Precompute text colors for better performance
  CATEGORIES.forEach(category => {
    const r = parseInt(category.color.slice(1, 3), 16);
    const g = parseInt(category.color.slice(3, 5), 16);
    const b = parseInt(category.color.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    // Store on the category object
    category.textColor = brightness < 128 ? 'white' : 'black';
    category.lightColor = shadeColor(category.color, 20);
    category.darkColor = shadeColor(category.color, -20);
  });
  
  const SEGMENT_COUNT = CATEGORIES.length;
  const SEGMENT_ANGLE = 360 / SEGMENT_COUNT;
  
  /**
   * PART 4: State Management
   * Track current state
   */
  // State management
  let isSpinning = false;
  let currentRotation = 0;
  let currentIndex = 0;
  let resizeDebounceTimer = null;
  let confettiCanvases = []; // Track active confetti canvases
  let wheelWrapper = null; // Store for reuse
  let isFirstSpin = true; // Add this flag
  
  /**
   * PART 5: Color Utilities
   * Functions for color manipulation
   */
  // Utility function for color manipulation
  function shadeColor(color, percent) {
    let R = parseInt(color.substring(1,3), 16);
    let G = parseInt(color.substring(3,5), 16);
    let B = parseInt(color.substring(5,7), 16);

    R = parseInt(R * (100 + percent) / 100);
    G = parseInt(G * (100 + percent) / 100);
    B = parseInt(B * (100 + percent) / 100);

    R = (R<255) ? R : 255;  
    G = (G<255) ? G : 255;  
    B = (B<255) ? B : 255;  

    R = Math.round(R);
    G = Math.round(G);
    B = Math.round(B);

    const RR = ((R.toString(16).length==1) ? "0"+R.toString(16) : R.toString(16));
    const GG = ((G.toString(16).length==1) ? "0"+G.toString(16) : G.toString(16));
    const BB = ((B.toString(16).length==1) ? "0"+B.toString(16) : B.toString(16));

    return "#"+RR+GG+BB;
  }
  
  // Determine optimal text color based on background color
  function getContrastColor(hexColor) {
    // Remove hash if present
    hexColor = hexColor.replace('#', '');
    
    // Parse RGB values
    const r = parseInt(hexColor.substr(0, 2), 16);
    const g = parseInt(hexColor.substr(2, 2), 16);
    const b = parseInt(hexColor.substr(4, 2), 16);
    
    // Calculate luminance - gives more weight to colors humans perceive as brighter
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return black for bright backgrounds, white for dark backgrounds
    return luminance > 0.6 ? '#000000' : '#FFFFFF';
  }

/**
 * PART 6: Initialization
 * Primary initialization functions
 */
// Primary initialization
function init() {
  // Add segment labels with optimized contrast
  addSegmentLabels();
  
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
  
  // Apply device optimizations
  optimizeForDevice();
  
  // Initialize wheel for proper first spin
  // This forces an initial transformation state so the first transition works properly
  WHEEL.style.transition = 'none';
  WHEEL.style.transform = 'rotate(0deg)';
  // Force browser to acknowledge the above style
  void WHEEL.offsetWidth;
}
  
  /**
   * PART 7: Device Optimization
   * Optimize for different devices
   */
  // Check for device preferences
  function optimizeForDevice() {
    // Check for reduced motion preference
    if (hasReducedMotion) {
      document.documentElement.classList.add('reduced-motion');
    }
    
    // Detect low-power mode on devices that support it
    if ('connection' in navigator) {
      if (navigator.connection.saveData || 
          navigator.connection.effectiveType === 'slow-2g' || 
          navigator.connection.effectiveType === '2g') {
        document.documentElement.classList.add('low-data-mode');
      }
    }
  }
  
  /**
   * PART 8: Segment Labels
   * Add text labels to wheel segments
   */
  // Add text labels to wheel segments with optimized color contrast
  function addSegmentLabels() {
    if (!WHEEL_LABELS) return;
    
    // Clear existing labels
    WHEEL_LABELS.innerHTML = '';
    
    // Use document fragment for better performance
    const fragment = document.createDocumentFragment();
    
    // Wheel dimensions
    const centerRadius = 50;  // Inner circle radius
    const startOffset = 15;   // Distance from center circle to start text
    
    // Add a label for each category
    for (let i = 0; i < CATEGORIES.length; i++) {
      const category = CATEGORIES[i];
      
      // Calculate angle (centered in segment)
      const segmentAngle = 360 / CATEGORIES.length;
      const midAngle = (i * segmentAngle) + (segmentAngle / 2) - 90; // -90 to start at top
      
      // Determine optimal text color for this segment's background
      const textColor = category.textColor;
      const shadowColor = textColor === 'white' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)';
      
      // Create text container with fixed starting point
      const textContainer = document.createElement('div');
      textContainer.className = 'hx-wheel-segment-text-container';
      textContainer.style.position = 'absolute';
      textContainer.style.top = '50%';
      textContainer.style.left = '50%';
      textContainer.style.transformOrigin = '0 0';
      textContainer.style.transform = `rotate(${midAngle}deg)`;
      textContainer.style.pointerEvents = 'none';
      
      // Create label with dynamic width
      const label = document.createElement('div');
      label.className = 'hx-wheel-segment-label';
      label.textContent = category.name;
      label.style.position = 'absolute';
      label.style.left = `${centerRadius + startOffset}px`; // Start just outside center circle
      label.style.transform = 'translateY(-50%)'; // Center vertically
      label.style.width = 'auto';
      label.style.maxWidth = '110px'; // Limit width to prevent extending too far
      label.style.color = textColor;
      label.style.fontWeight = 'bold';
      label.style.fontSize = '13px'; // Slightly smaller for better fit
      label.style.textShadow = `0 1px 2px ${shadowColor}`;
      label.style.whiteSpace = 'nowrap';
      
      // Add to container
      textContainer.appendChild(label);
      fragment.appendChild(textContainer);
    }
    
    // Add all labels at once (better performance)
    WHEEL_LABELS.appendChild(fragment);
  }
  
// Make wheel responsive to screen size changes
function makeResponsive() {
  if (!wheelWrapper) return;
  
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
  
  // Handle resize with debouncing for better performance
  function handleResize() {
    if (resizeDebounceTimer) clearTimeout(resizeDebounceTimer);
    resizeDebounceTimer = setTimeout(() => {
      requestAnimationFrame(updateSize);
    }, 100);
  }
  
  // Listen for relevant resize events
  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', handleResize);
  
  // Initial size setup
  updateSize();
}

/**
 * PART 9: Responsive Handling
 * Make wheel responsive to screen size changes
 */
// Track device orientation
let isLandscape = window.innerWidth > window.innerHeight;

// Make wheel responsive to screen size changes
function makeResponsive() {
  if (!wheelWrapper) return;
  
  function updateSize() {
    // Check orientation change
    const newIsLandscape = window.innerWidth > window.innerHeight;
    if (newIsLandscape !== isLandscape) {
      isLandscape = newIsLandscape;
      // Force recalculation after orientation change
      setTimeout(() => {
        addSegmentLabels();
        addSegmentHoverAreas();
      }, 300);
    }
    
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
    
    // Adjust for small screens
    const isMobile = window.innerWidth < 640;
    const isVerySmall = window.innerWidth < 350;
    
    if (isMobile) {
      // Use smaller font size for wheel labels on mobile
      document.querySelectorAll('.hx-wheel-segment-label').forEach(label => {
        label.style.fontSize = isVerySmall ? '10px' : '11px';
        label.style.maxWidth = isVerySmall ? '70px' : '90px';
      });
      
      // Adjust category box height for small screens
      if (isVerySmall) {
        const categoryBox = document.querySelector('.hx-category-box');
        const slotsContainer = document.querySelector('.hx-category-slots');
        
        if (categoryBox && slotsContainer) {
          categoryBox.style.height = '120px';
          
          document.querySelectorAll('.hx-category-slot').forEach(slot => {
            slot.style.height = '40px';
          });
          
          // Adjust selection highlight
          const highlight = document.querySelector('.hx-selection-highlight');
          if (highlight) {
            highlight.style.height = '40px';
            highlight.style.top = '40px';
          }
        }
      }
      
      // Adjust result margin for small screens
      const screenHeight = window.innerHeight;
      const resultSpacing = screenHeight < 600 ? '6rem' : '8rem';
      document.documentElement.style.setProperty('--result-margin-top', resultSpacing);
    } else {
      // Reset to default for larger screens
      document.documentElement.style.setProperty('--result-margin-top', '12rem');
      
      // Reset font sizes for larger screens
      document.querySelectorAll('.hx-wheel-segment-label').forEach(label => {
        label.style.fontSize = '13px';
        label.style.maxWidth = '110px';
      });
    }
    
    // Only update hover areas if not currently spinning
    if (!isSpinning) {
      addSegmentHoverAreas();
    }
  }
  
  // Handle resize with debouncing for better performance
  function handleResize() {
    if (resizeDebounceTimer) clearTimeout(resizeDebounceTimer);
    resizeDebounceTimer = setTimeout(() => {
      requestAnimationFrame(updateSize);
    }, 100);
  }
  
  // Listen for relevant resize events
  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', handleResize);
  
  // Initial size setup
  updateSize();
}
  
  /**
   * PART 10: Active Segment Detection
   * Determine which segment is active
   */
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
  
/**
 * PART 11: Tooltip System
 * Create and manage tooltips
 */
// Initialize tooltip
let tooltip;

function setupTooltip() {
  // Create tooltip element
  tooltip = document.createElement('div');
  tooltip.className = 'hx-wheel-tooltip';
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
}

// Show tooltip with category name
function showTooltip(event, category) {
  if (!tooltip) return;
  
  tooltip.textContent = category.name;
  tooltip.style.opacity = '1';
  tooltip.style.backgroundColor = category.color;
  
  // Add text shadow for better readability
  tooltip.style.textShadow = '0 1px 2px rgba(0,0,0,0.5)';
  
  // Use precomputed text color
  tooltip.style.color = category.textColor;
  
  positionTooltip(event);
}

// Position tooltip near cursor/touch with improved mobile support
function positionTooltip(event) {
  if (!tooltip) return;
  
  const x = event.clientX;
  const y = event.clientY;
  
  // Check if we're on a small screen
  const isMobile = window.innerWidth < 640;
  
  // Adjust placement based on position in viewport
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const tooltipWidth = tooltip.offsetWidth || 100; // Fallback width if not rendered yet
  const tooltipHeight = tooltip.offsetHeight || 40; // Fallback height
  
  // Keep tooltip on screen
  let xPos = x;
  let yPos = y - 40; // Default position above cursor
  
  // Horizontal positioning
  if (x + tooltipWidth/2 > viewportWidth) {
    xPos = viewportWidth - tooltipWidth/2;
  } else if (x - tooltipWidth/2 < 0) {
    xPos = tooltipWidth/2;
  }
  
  // Vertical positioning - ensure tooltip stays visible on small screens
  if (isMobile) {
    // On mobile, position at top or bottom of screen depending on cursor position
    if (y < viewportHeight / 2) {
      // Cursor in top half - place tooltip below
      yPos = y + 30;
    } else {
      // Cursor in bottom half - place tooltip above
      yPos = y - (tooltipHeight + 10);
    }
    
    // Make sure it's not offscreen
    if (yPos < 10) yPos = 10;
    if (yPos > viewportHeight - tooltipHeight - 10) yPos = viewportHeight - tooltipHeight - 10;
  } else {
    // On desktop, make sure tooltip isn't cut off at top of screen
    if (yPos < 10) {
      yPos = y + 30; // Show below cursor instead
    }
  }
  
  tooltip.style.left = `${xPos}px`;
  tooltip.style.top = `${yPos}px`;
  tooltip.style.transform = 'translateX(-50%)';
}

// Hide tooltip
function hideTooltip() {
  if (!tooltip) return;
  tooltip.style.opacity = '0';
}
  
  /**
   * PART 12: Segment Hover Areas
   * Creates interactive areas for each wheel segment
   */
  // Creates interactive areas for each wheel segment 
  function addSegmentHoverAreas() {
    if (!wheelWrapper) wheelWrapper = WHEEL.closest('.hx-fortune-wheel-wrapper');
    if (!wheelWrapper) return;
    
    // Clean up any existing overlays
    const existingOverlays = wheelWrapper.querySelectorAll('.hx-wheel-hover-overlay, .hx-wheel-center-area');
    existingOverlays.forEach(el => el.remove());
    
    // Get wheel dimensions
    const wheelRect = wheelWrapper.getBoundingClientRect();
    const wheelSize = Math.min(wheelRect.width, wheelRect.height);
    const centerX = wheelSize / 2;
    const centerY = wheelSize / 2;
    const radius = wheelSize / 2;
    const innerRadius = radius * 0.3; // Center hole size (30% of radius)
    
    // Create a dedicated center area for spinning
    const centerArea = document.createElement('div');
    centerArea.className = 'hx-wheel-center-area';
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
    
    // Center area always triggers spin
    centerArea.addEventListener('click', spinWheel);
    wheelWrapper.appendChild(centerArea);
    
    // Create SVG element for precise segment shapes
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.classList.add('hx-wheel-hover-overlay');
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
    const fragment = document.createDocumentFragment();
    
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
        `A ${innerRadius},${innerRadius} 0 ${largeArcFlag},0 ${innerEndX},${innerEndY}`, // Inner arc
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
      }, { passive: true }); // Add passive for better performance
      
      path.addEventListener('touchend', () => {
        hideTooltip();
      }, { passive: true }); // Add passive for better performance
      
      fragment.appendChild(path);
    }
    
    svg.appendChild(fragment);
    
    // Make sure center area is on top
    wheelWrapper.appendChild(centerArea);
  }
  
  /**
   * PART 13: Category Display
   * Creates and updates category display
   */
  // Create a visual category item for display
  function createCategoryItem(category, isWinner = false) {
    const item = document.createElement('div');
    item.className = 'hx-category-item';
    item.style.display = 'flex';
    item.style.alignItems = 'center';
    item.style.width = '100%';
    item.style.backgroundColor = category.color;
    item.style.padding = '4px 12px';
    item.style.borderRadius = '4px';
    item.style.transition = 'all 0.3s ease';
    
    // Add winner styling if applicable
    if (isWinner) {
      // Add the pop animation
      item.style.animation = 'winnerPop 1.5s infinite, winnerGlow 2s infinite alternate';
      // Add a slightly brighter border
      item.style.border = `2px solid ${category.lightColor}`;
      // Make it stand out more
      item.style.zIndex = '5';
      // Increase font weight
      item.style.fontWeight = '700';
    }
    
    // Use precomputed text color
    const textColor = category.textColor;
    
    // Text label - centered and full-width
    const label = document.createElement('span');
    label.className = 'hx-category-name';
    label.textContent = category.name;
    label.style.whiteSpace = 'nowrap';
    label.style.overflow = 'hidden';
    label.style.textOverflow = 'ellipsis';
    label.style.color = textColor;
    label.style.fontWeight = isWinner ? '700' : '600';
    label.style.textAlign = 'center';
    label.style.width = '100%';
    
    // Add a star icon for the winner
    if (isWinner) {
      // Add a simple star character
      const star = document.createElement('span');
      star.textContent = '★';
      star.style.marginRight = '8px';
      star.style.fontSize = '16px';
      star.style.color = textColor;
      item.insertBefore(star, item.firstChild);
      
      // Add a star at the end too
      const endStar = document.createElement('span');
      endStar.textContent = '★';
      endStar.style.marginLeft = '8px';
      endStar.style.fontSize = '16px';
      endStar.style.color = textColor;
      item.appendChild(endStar);
    }
    
    // Assemble item
    item.appendChild(label);
    
    return item;
  }
  
  // Update the visible categories in the panel
  function updateCategoryDisplay(centerIndex) {
    // Calculate indices with wrapping
    const prevIndex = (centerIndex - 1 + SEGMENT_COUNT) % SEGMENT_COUNT;
    const nextIndex = (centerIndex + 1) % SEGMENT_COUNT;
    
    // Clear slots
    if (PREV_SLOT) PREV_SLOT.innerHTML = '';
    if (CURRENT_SLOT) CURRENT_SLOT.innerHTML = '';
    if (NEXT_SLOT) NEXT_SLOT.innerHTML = '';
    
    // Create all items at once with document fragment for better performance
    if (PREV_SLOT) {
      const fragment = document.createDocumentFragment();
      fragment.appendChild(createCategoryItem(CATEGORIES[prevIndex], false));
      PREV_SLOT.appendChild(fragment);
    }
    
    if (CURRENT_SLOT) {
      const fragment = document.createDocumentFragment();
      fragment.appendChild(createCategoryItem(CATEGORIES[centerIndex], true));
      CURRENT_SLOT.appendChild(fragment);
    }
    
    if (NEXT_SLOT) {
      const fragment = document.createDocumentFragment();
      fragment.appendChild(createCategoryItem(CATEGORIES[nextIndex], false));
      NEXT_SLOT.appendChild(fragment);
    }
    
    // Update current index
    currentIndex = centerIndex;
    
    // Add winner animations if they don't exist
    if (!document.getElementById('winner-animations')) {
      const styleSheet = document.createElement('style');
      styleSheet.id = 'winner-animations';
      styleSheet.textContent = `
        @keyframes winnerPop {
          0% { transform: scale(1); }
          50% { transform: scale(1.08); }
          100% { transform: scale(1); }
        }
        
        @keyframes winnerGlow {
          0% { box-shadow: 0 0 5px rgba(255, 255, 255, 0.5); }
          100% { box-shadow: 0 0 15px rgba(255, 255, 255, 0.8); }
        }
        
        /* Make sure selection highlight matches the animation */
        .hx-selection-highlight {
          transition: transform 0.3s ease;
        }
      `;
      document.head.appendChild(styleSheet);
    }
  } 
  
  /**
   * PART 14: Category Animation
   * Animates the categories during spin
   */
  // Animate the categories during spin using requestAnimationFrame (better performance)
  function animateCategories(duration, finalIndex) {
    const startTime = performance.now();
    const totalRotations = 3; // Minimum rotations
    const totalSegments = totalRotations * SEGMENT_COUNT;
    const segmentDuration = duration / totalSegments;
    
    let lastUpdateTime = 0;
    let index = currentIndex;
    
    function updateAnimation(timestamp) {
      // If we've exceeded the duration, finish with final index
      if (timestamp - startTime >= duration) {
        updateCategoryDisplay(finalIndex);
        return;
      }
      
      // Only update at appropriate intervals (like setInterval but better)
      if (timestamp - lastUpdateTime > segmentDuration) {
        lastUpdateTime = timestamp;
        index = (index + 1) % SEGMENT_COUNT;
        updateCategoryDisplay(index);
      }
      
      // Continue animation
      requestAnimationFrame(updateAnimation);
    }
    
    // Start the animation loop
    requestAnimationFrame(updateAnimation);
  }

  /**
   * PART 15: Spin Animation
   * Handles the wheel spinning behavior
   */
  // Spin the wheel
function spinWheel() {
  if (isSpinning) return;
  isSpinning = true;
  
  // Hide tooltip during spin
  hideTooltip();
  
  // Remove hover areas during spin
  if (wheelWrapper) {
    const hoverAreas = wheelWrapper.querySelectorAll('.hx-wheel-hover-overlay, .hx-wheel-center-area');
    hoverAreas.forEach(area => area.remove());
  }
  
  // Hide any previous result
  if (RESULT_ELEMENT) {
    RESULT_ELEMENT.style.opacity = '0';
  }
  
  // Calculate spin parameters
  const minDuration = hasReducedMotion ? 1000 : 3000;
  const extraDuration = hasReducedMotion ? 500 : 2000;
  const duration = minDuration + (Math.random() * extraDuration);
  
  const minRotations = hasReducedMotion ? 1 : 3;
  const maxRotations = hasReducedMotion ? 2 : 5;
  const rotations = minRotations + (Math.random() * (maxRotations - minRotations));
  
  const targetRotation = currentRotation + (rotations * 360);
  
  // Select random segment for landing
  const randomSegment = Math.floor(Math.random() * SEGMENT_COUNT);
  
  // Calculate final rotation to land on selected segment
  const segmentOffset = SEGMENT_ANGLE * randomSegment;
  const finalRotation = Math.ceil(targetRotation / 360) * 360 - segmentOffset - (SEGMENT_ANGLE / 2);
  
  // Reset the transition first
  WHEEL.style.transition = 'none';
  // Force browser to acknowledge the above style
  void WHEEL.offsetWidth;
  // Now apply the animation transition
  WHEEL.style.transition = `transform ${duration}ms cubic-bezier(0.1, 0.7, 0.1, 1)`;
  WHEEL.style.transform = `rotate(${finalRotation}deg)`;
  
  // Add haptic feedback if available
  if (navigator.vibrate) {
    navigator.vibrate(50);
  }
  
  // Animate the category list
  animateCategories(duration, randomSegment);
  
  // Schedule results handling
  setTimeout(() => handleSpinResult(duration, randomSegment, finalRotation), duration + 100);
}
  
  /**
   * PART 16: Results Handling
   * Processes and displays the spin result
   */
  // Handle spin results display
  function handleSpinResult(duration, randomSegment, finalRotation) {
    const selectedCategory = CATEGORIES[randomSegment];
    
    // Display result content - preserve the original implementation exactly
    if (RESULT_ELEMENT && RESULT_CONTENT) {
      // Update content
      RESULT_CONTENT.innerHTML = `
        <a href="${selectedCategory.path}" 
           style="display: block; width: 100%; padding: 1rem; 
                  background-color: ${selectedCategory.color};
                  color: ${selectedCategory.textColor}; border: none; border-radius: 0.5rem; 
                  font-weight: 700; font-size: 1.35rem; text-decoration: none; 
                  cursor: pointer; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                  text-align: center;">
          ${selectedCategory.name}
        </a>
      `;
      
      // Preserve original classes but reset inline styles
      const originalClasses = RESULT_ELEMENT.className;
      RESULT_ELEMENT.removeAttribute('style');
      RESULT_ELEMENT.className = originalClasses;
      //  Results Handling
      const screenHeight = window.innerHeight;
      const resultSpacing = screenHeight < 600 ? '6rem' : '12rem';
      document.documentElement.style.setProperty('--result-margin-top', resultSpacing);
      
      // Set stable positioning with CSS variables for easy adjustment
      document.documentElement.style.setProperty('--result-margin-top', '12rem');
      
      // Apply styles that work with the CSS structure
      RESULT_ELEMENT.style.cssText = `
        display: block;
        width: 100%;
        max-width: 400px;
        margin-top: var(--result-margin-top, 12rem);
        margin-left: auto;
        margin-right: auto;
        padding: 0;
        background-color: transparent;
        border: none;
        box-shadow: none;
        opacity: 1;
        position: relative;
        z-index: 1;
      `;
      
      // Add a tooltip data attribute to help future developers
      RESULT_ELEMENT.setAttribute('data-positioning-note', 'Margin-top can be adjusted via --result-margin-top CSS variable');
    }
    
    // Trigger confetti celebration
    createConfetti(selectedCategory);
    
    // Update state
    currentRotation = finalRotation;
    isSpinning = false;
    
    // Recreate hover areas to align with new wheel position
    requestAnimationFrame(() => {
      addSegmentHoverAreas();
    });
    
    // Final haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate([30, 50, 30]);
    }
    
  }
  
  /**
   * PART 17: Confetti Effect
   * Creates celebration effect
   */
  // Create confetti celebration effect with dual explosions
  function createConfetti(selectedCategory) {
    // Skip if reduced motion
    if (hasReducedMotion) return;
    
    // Duration
    const duration = 1500;
    
    // Get wheel position for first explosion
    const wheelRect = WHEEL.getBoundingClientRect();
    const wheelCenter = {
      x: (wheelRect.left + wheelRect.width / 2) / window.innerWidth,
      y: (wheelRect.top + wheelRect.height / 2) / window.innerHeight
    };
    
    // First explosion from wheel center
    launchConfetti(selectedCategory, wheelCenter, duration, 70);
    
    // Second explosion from result after delay
    setTimeout(() => {
      if (RESULT_ELEMENT) {
        const resultRect = RESULT_ELEMENT.getBoundingClientRect();
        const resultCenter = {
          x: (resultRect.left + resultRect.width / 2) / window.innerWidth,
          y: (resultRect.top + resultRect.height / 2) / window.innerHeight
        };
        
        launchConfetti(selectedCategory, resultCenter, duration, 80);
      }
    }, 300);
  }
  
/**
 * PART 18: Confetti Animation
 * Manages confetti particles
 */
// Helper function to launch confetti from a specific origin
function launchConfetti(selectedCategory, origin, duration, spread) {
  // Reduce particles on mobile devices
  const isMobile = window.innerWidth < 640;
  const isLowPowerDevice = hasReducedMotion || 
                           ('connection' in navigator && 
                            (navigator.connection.saveData || 
                             navigator.connection.effectiveType === 'slow-2g' || 
                             navigator.connection.effectiveType === '2g'));
  
  // Skip full confetti on very low-power devices
  if (isLowPowerDevice) {
    // Create a simple flash effect instead
    createSimpleFlashEffect(selectedCategory, origin);
    return;
  }
  
  // Create canvas for confetti
  const canvas = document.createElement('canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '1000';
  document.body.appendChild(canvas);
  
  // Keep track of the canvas for cleanup
  confettiCanvases.push(canvas);
  
  const ctx = canvas.getContext('2d');
  let particles = [];
  let animationId = null;
  
  // Configuration - reduce count on mobile
  const particleCount = isMobile ? 40 : 80;
  const gravity = 1;
  
  // Use selected category color + variations
  const colors = [
    selectedCategory.color,
    selectedCategory.lightColor,
    selectedCategory.darkColor,
    '#FFFFFF' // Add some white particles for contrast
  ];
  
  // Create particles
  const startX = origin.x * window.innerWidth;
  const startY = origin.y * window.innerHeight;
  
  // Use object pool pattern for particles (more efficient)
  const particlePool = [];
  for (let i = 0; i < particleCount; i++) {
    particlePool.push({
      x: 0, y: 0, size: 0, color: '', vx: 0, vy: 0,
      gravity: 0, alpha: 0, lifetime: 0, birth: 0
    });
  }
  
  // Initialize particles
  for (let i = 0; i < particleCount; i++) {
    const random = (min, max) => Math.random() * (max - min) + min;
    
    const particle = particlePool[i];
    particle.x = startX;
    particle.y = startY;
    particle.size = random(isMobile ? 4 : 6, isMobile ? 8 : 10); // Smaller on mobile
    particle.color = colors[Math.floor(random(0, colors.length))];
    particle.vx = Math.cos(random(0, Math.PI * 2)) * random(3, 6) * (spread / 50);
    particle.vy = Math.sin(random(0, Math.PI * 2)) * random(3, 6) * (spread / 50);
    particle.gravity = gravity;
    particle.alpha = 1;
    particle.lifetime = random(duration * 0.7, duration * 1.1);
    particle.birth = performance.now();
    
    particles.push(particle);
  }
  
  // Animation function using requestAnimationFrame
  function animate(timestamp) {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw particles
    let remaining = 0;
    const now = timestamp;
    
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      
      // Calculate age and fade
      const age = now - p.birth;
      p.alpha = 1 - (age / p.lifetime);
      
      // Skip if expired
      if (p.alpha <= 0) continue;
      
      // Update position with gravity
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity * 0.1;
      
      // Draw particle
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
      
      remaining++;
    }
    
    // Continue animation if particles remain
    if (remaining > 0) {
      animationId = requestAnimationFrame(animate);
    } else {
      // Clean up when done
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
        // Remove from tracking array
        const index = confettiCanvases.indexOf(canvas);
        if (index > -1) confettiCanvases.splice(index, 1);
      }
    }
  }
  
  // Start animation
  animationId = requestAnimationFrame(animate);
  
  // Auto-cleanup as a safety (in case animation stops)
  setTimeout(() => {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    
    if (canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
      // Remove from tracking array
      const index = confettiCanvases.indexOf(canvas);
      if (index > -1) confettiCanvases.splice(index, 1);
    }
  }, duration * 1.3);
}

// Simple flash effect for low-power devices
function createSimpleFlashEffect(category, origin) {
  const flash = document.createElement('div');
  flash.style.position = 'fixed';
  flash.style.left = `${origin.x * 100}%`;
  flash.style.top = `${origin.y * 100}%`;
  flash.style.width = '100px';
  flash.style.height = '100px';
  flash.style.borderRadius = '50%';
  flash.style.backgroundColor = category.color;
  flash.style.transform = 'translate(-50%, -50%) scale(0)';
  flash.style.opacity = '0.7';
  flash.style.pointerEvents = 'none';
  flash.style.zIndex = '999';
  flash.style.transition = 'transform 0.5s ease-out, opacity 0.5s ease-out';
  document.body.appendChild(flash);
  
  // Animate the flash
  setTimeout(() => {
    flash.style.transform = 'translate(-50%, -50%) scale(3)';
    flash.style.opacity = '0';
  }, 10);
  
  // Remove after animation
  setTimeout(() => {
    if (flash.parentNode) flash.parentNode.removeChild(flash);
  }, 500);
}
  
  /**
   * PART 19: Cleanup & Maintenance
   * Resource management and cleanup
   */
  // Clean up resources when page unloads
  function setupCleanup() {
    window.addEventListener('beforeunload', () => {
      // Clean up tooltip
      if (tooltip && tooltip.parentNode) {
        tooltip.parentNode.removeChild(tooltip);
      }
      
      // Clean up any active confetti canvases
      confettiCanvases.forEach(canvas => {
        if (canvas.parentNode) {
          canvas.parentNode.removeChild(canvas);
        }
      });
    });
  }
  
  /**
   * PART 20: Public API & Initialization
   * Public interface and initialization
   */
  // Export public methods for external access
  window.FortuneWheel = {
    spin: spinWheel
  };
  
  // Start the wheel
  init();
  setupCleanup();
}); // End of DOMContentLoaded event