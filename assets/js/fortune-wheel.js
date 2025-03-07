// assets/js/fortune-wheel.js
// PART 1: Core Setup
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
  
  // Check for touch support
  const supportsTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Performance utility
  const scheduleIdle = window.requestIdleCallback || (fn => setTimeout(fn, 1));
  // PART 2: Basic Configuration
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
  
  const SEGMENT_COUNT = CATEGORIES.length;
  const SEGMENT_ANGLE = 360 / SEGMENT_COUNT;
  
  // State management
  let isSpinning = false;
  let currentRotation = 0;
  let currentIndex = 0;
  let resizeDebounceTimer = null;
  
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

// PART 3: Initialization Functions
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
  
  // Add text labels to wheel segments with optimized color contrast
  function addSegmentLabels() {
    if (!WHEEL) return;
    
    // Remove any existing labels
    const existingLabels = WHEEL.querySelectorAll('.wheel-segment-label');
    existingLabels.forEach(el => el.remove());
    
    // Create container for all labels
    const labelsWrapper = document.createElement('div');
    labelsWrapper.className = 'wheel-segment-labels';
    labelsWrapper.style.position = 'absolute';
    labelsWrapper.style.top = '0';
    labelsWrapper.style.left = '0';
    labelsWrapper.style.width = '100%';
    labelsWrapper.style.height = '100%';
    
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
      const textColor = getContrastColor(category.color);
      const shadowColor = textColor === '#FFFFFF' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)';
      
      // Create text container with fixed starting point
      const textContainer = document.createElement('div');
      textContainer.className = 'wheel-segment-text-container';
      textContainer.style.position = 'absolute';
      textContainer.style.top = '50%';
      textContainer.style.left = '50%';
      textContainer.style.transformOrigin = '0 0';
      textContainer.style.transform = `rotate(${midAngle}deg)`;
      textContainer.style.pointerEvents = 'none';
      
      // Create label with dynamic width
      const label = document.createElement('div');
      label.className = 'wheel-segment-label';
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
      labelsWrapper.appendChild(textContainer);
    }
    
    // Add labels to the wheel
    WHEEL.appendChild(labelsWrapper);
  }
  
  // Check for device preferences
  function optimizeForDevice() {
    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
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
  

// PART 4: Responsive Handling
  // Make wheel responsive to screen size changes
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
    
    // Handle resize with debouncing
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
// PART 5: Tooltip System
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
 // PART 6: Segment Hover Areas
  // Creates interactive areas for each wheel segment 
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
    
    // Create a dedicated center area for spinning
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
    
    // Center area always triggers spin
    centerArea.addEventListener('click', spinWheel);
    wheelWrapper.appendChild(centerArea);
    
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
      });
      
      path.addEventListener('touchend', () => {
        hideTooltip();
      });
      
      svg.appendChild(path);
    }
    
    // Make sure center area is on top
    wheelWrapper.appendChild(centerArea);
  }

// PART 7: Category UI Elements
  // Create a visual category item for display without icons
  function createCategoryItem(category, isWinner = false) {
    const item = document.createElement('div');
    item.className = 'category-item';
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
      item.style.border = `2px solid ${shadeColor(category.color, 30)}`;
      // Make it stand out more
      item.style.zIndex = '5';
      // Increase font weight
      item.style.fontWeight = '700';
    }
    
    // Calculate contrasting text color
    const r = parseInt(category.color.slice(1, 3), 16);
    const g = parseInt(category.color.slice(3, 5), 16);
    const b = parseInt(category.color.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    const textColor = brightness < 128 ? 'white' : 'black';
    
    // Text label - centered and full-width
    const label = document.createElement('span');
    label.className = 'category-name';
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
    PREV_SLOT.innerHTML = '';
    CURRENT_SLOT.innerHTML = '';
    NEXT_SLOT.innerHTML = '';
    
    // Add new category items - mark the current one as winner
    PREV_SLOT.appendChild(createCategoryItem(CATEGORIES[prevIndex], false));
    CURRENT_SLOT.appendChild(createCategoryItem(CATEGORIES[centerIndex], true)); // This is the winner
    NEXT_SLOT.appendChild(createCategoryItem(CATEGORIES[nextIndex], false));
    
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
        .selection-highlight {
          transition: transform 0.3s ease;
        }
      `;
      document.head.appendChild(styleSheet);
    }
  } 
  
// PART 8: Spin Animation
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



// Spin the wheel (first half - animation setup)
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
  
  // No need to transform the labels as they should rotate WITH the wheel
  
  // Add haptic feedback if available
  if (navigator.vibrate) {
    navigator.vibrate(50);
  }
  
  // Animate the category list
  animateCategories(duration, randomSegment);
  
  // Schedule results handling
  setTimeout(() => handleSpinResult(duration, randomSegment, finalRotation), duration + 100);
}

// PART 9: Results Handling
  // Handle spin results display (second half of spin process)
  function handleSpinResult(duration, randomSegment, finalRotation) {
    const selectedCategory = CATEGORIES[randomSegment];
    
    // Calculate contrasting text color for the background
    const r = parseInt(selectedCategory.color.slice(1, 3), 16);
    const g = parseInt(selectedCategory.color.slice(3, 5), 16);
    const b = parseInt(selectedCategory.color.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    const textColor = brightness < 128 ? 'white' : 'black';
    
    // Get the result element
    const resultElement = document.getElementById('fortune-result');
    const resultContent = document.getElementById('result-content');
    
    if (resultElement && resultContent) {
      // Update content
      resultContent.innerHTML = `
        <a href="${selectedCategory.path}" 
           style="display: block; width: 100%; padding: 1rem; 
                  background-color: ${selectedCategory.color};
                  color: ${textColor}; border: none; border-radius: 0.5rem; 
                  font-weight: 700; font-size: 1.35rem; text-decoration: none; 
                  cursor: pointer; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                  text-align: center;">
          ${selectedCategory.name}
        </a>
      `;
      
      // Preserve original classes but reset inline styles
      const originalClasses = resultElement.className;
      resultElement.removeAttribute('style');
      resultElement.className = originalClasses;
      
      // Set stable positioning with CSS variables for easy adjustment
      document.documentElement.style.setProperty('--result-margin-top', '12rem');
      
      // Apply styles that work with the CSS structure
      resultElement.style.cssText = `
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
      resultElement.setAttribute('data-positioning-note', 'Margin-top can be adjusted via --result-margin-top CSS variable');
    }
    
    // Trigger confetti celebration
    createConfetti(selectedCategory);
    
    // Update state
    currentRotation = finalRotation;
    isSpinning = false;
    
    // Recreate hover areas to align with new wheel position
    requestAnimationFrame(() => {
      requestAnimationFrame(addSegmentHoverAreas);
    });
    
    // Final haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate([30, 50, 30]);
    }
  }

  
// PART 10: Confetti and Finalization
  // Create confetti celebration effect with dual explosions
  function createConfetti(selectedCategory) {
    // Shorter duration
    const duration = 1500; // Reduced from 2000ms
    
    // Get the positions for both explosions
    const wheelRect = WHEEL.getBoundingClientRect();
    
    // Second explosion will come from the result button after delay
    setTimeout(() => {
      // Find button position for second explosion
      if (RESULT_ELEMENT) {
        const resultRect = RESULT_ELEMENT.getBoundingClientRect();
        launchConfetti(selectedCategory, {
          x: (resultRect.left + resultRect.width / 2) / window.innerWidth,
          y: (resultRect.top + resultRect.height / 2) / window.innerHeight
        }, duration, 80); // Same duration, slightly larger spread
      }
    }, 300); // Delay second explosion by 300ms
    
    // First explosion from wheel center
    launchConfetti(selectedCategory, {
      x: (wheelRect.left + wheelRect.width / 2) / window.innerWidth,
      y: (wheelRect.top + wheelRect.height / 2) / window.innerHeight
    }, duration, 70);
  }
  
  // Helper function to launch confetti from a specific origin
  function launchConfetti(selectedCategory, origin, duration, spread) {
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
    
    // Configuration
    const particleCount = 80; // Fewer particles per explosion
    const gravity = 1;
    
    // Use selected category color + variations
    const colors = [
      selectedCategory.color,
      selectedCategory.color,
      shadeColor(selectedCategory.color, 20),  // Lighter version
      shadeColor(selectedCategory.color, -20), // Darker version
      '#FFFFFF' // Add some white particles for contrast
    ];
    
    // Create particles
    const startX = origin.x * window.innerWidth;
    const startY = origin.y * window.innerHeight;
    
    for (let i = 0; i < particleCount; i++) {
      const random = (min, max) => Math.random() * (max - min) + min;
      
      const color = colors[Math.floor(random(0, colors.length))];
      const size = random(6, 10); // Slightly smaller particles
      const angle = random(0, Math.PI * 2);
      const velocity = random(3, 6); // Slightly slower velocity
      
      particles.push({
        x: startX,
        y: startY,
        size,
        color,
        vx: Math.cos(angle) * velocity * (spread / 50),
        vy: Math.sin(angle) * velocity * (spread / 50),
        gravity,
        alpha: 1,
        lifetime: random(duration * 0.7, duration * 1.1),
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
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
        particles = [];
      }
    }, duration * 1.3); // Clean up a bit earlier
  }
  
  // Clean up resources when page unloads
  function setupCleanup() {
    window.addEventListener('beforeunload', () => {
      if (tooltip && tooltip.parentNode) {
        tooltip.parentNode.removeChild(tooltip);
      }
    });
  }
  
  // Export public methods for external access
  window.FortuneWheel = {
    spin: spinWheel
  };
  
  // Start the wheel
  init();
  setupCleanup();
}); // End of DOMContentLoaded event   