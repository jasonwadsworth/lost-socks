# Design Document: Lost Sock Intro Animation

## Overview

The Lost Sock intro animation is a standalone web component that creates an emotional, engaging entry experience for visitors. The design uses a single HTML file with embedded CSS and vanilla JavaScript to orchestrate a 5-7 second animation sequence featuring a cartoon sock character that enters from a random direction, lands center-screen, and displays a looping crying animation while the title fades in.

The implementation prioritizes simplicity, using CSS keyframe animations for all visual motion and minimal JavaScript only for random direction selection and animation triggering.

## Architecture

### High-Level Structure

```
index.html
├── SVG Graphics (inline)
│   ├── Sock Character SVG
│   └── Tear Drop SVG (template)
├── CSS Styles & Animations
│   ├── Layout & Positioning
│   ├── Entry Animations (4 directions)
│   ├── Crying Animation (loop)
│   └── Title Fade-in
└── JavaScript Logic
    ├── Random Direction Selection
    ├── Animation Class Application
    └── Tear Drop Generation
```

### Technology Stack

- HTML5 for structure
- CSS3 with keyframe animations
- Vanilla JavaScript (ES6+)
- Inline SVG graphics

### Animation Timeline

```
0s ────────────────────────────────────────────────> 6s
│                                                      │
├─ Page Load (blank)
│
├─ 0-1.8s: Sock enters from random edge → center
│          (fast, energetic motion with rotation)
│
├─ 1.8s: Sock lands at center with small bounce
│
├─ 1.8-6s: Crying animation loops
│          (body shake + tears + sad expression)
│
└─ 3.5-6s: Title "Lost Sock" fades in
         (appears above sock)
```

## Components and Interfaces

### 1. HTML Structure

```html
<div id="animation-container">
  <h1 id="title">Lost Sock</h1>
  <div id="sock-wrapper">
    <svg id="sock-character"><!-- Sock SVG --></svg>
    <div id="tears-container"><!-- Tear drops generated here --></div>
  </div>
</div>
```

**Container**: Full viewport, centered content, light background
**Title**: Hidden initially, positioned above sock
**Sock Wrapper**: Positioned absolutely, starts off-screen
**Tears Container**: Holds dynamically generated tear SVGs

### 2. SVG Graphics Design

#### Sock Character SVG
- Pink sock with cartoon character design (inspired by reference images)
- Large folded cuff at top (lighter pink, creates "hat" effect)
- Expressive cartoon face with large eyes, eyebrows, and mouth
- Horizontal stripes on foot portion (lighter pink bands)
- White glove-like hands extending from sides
- Rounded toe at bottom
- Size: ~200-250px height
- Pink color scheme: main body (#FF9EB5), cuff/stripes (#FFD4E0), outline (#B85C7A)

```svg
<svg viewBox="0 0 120 180" xmlns="http://www.w3.org/2000/svg">
  <!-- Folded cuff top (lighter pink, doubled over look) -->
  <path d="M30,15 Q30,5 40,5 L80,5 Q90,5 90,15 L90,35 Q90,40 85,40 L35,40 Q30,40 30,35 Z" 
        fill="#FFD4E0" stroke="#B85C7A" stroke-width="2.5"/>
  <path d="M32,25 L88,25 L88,38 Q88,42 84,42 L36,42 Q32,42 32,38 Z" 
        fill="#FFC0D0" stroke="#B85C7A" stroke-width="2"/>
  
  <!-- Main sock body -->
  <path d="M35,40 L85,40 L85,120 Q85,135 75,145 L45,145 Q35,135 35,120 Z" 
        fill="#FF9EB5" stroke="#B85C7A" stroke-width="2.5"/>
  
  <!-- Horizontal stripes on foot -->
  <line x1="35" y1="95" x2="85" y2="95" stroke="#FFD4E0" stroke-width="4"/>
  <line x1="35" y1="105" x2="85" y2="105" stroke="#FFD4E0" stroke-width="3"/>
  <line x1="35" y1="113" x2="85" y2="113" stroke="#FFD4E0" stroke-width="3"/>
  
  <!-- Sad eyebrows (angled down) -->
  <path d="M42,60 L48,58" stroke="#6B8E9E" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M78,60 L72,58" stroke="#6B8E9E" stroke-width="2.5" stroke-linecap="round"/>
  
  <!-- Large cartoon eyes (sad expression) -->
  <ellipse cx="45" cy="68" rx="8" ry="10" fill="white" stroke="#333" stroke-width="2"/>
  <ellipse cx="75" cy="68" rx="8" ry="10" fill="white" stroke="#333" stroke-width="2"/>
  <circle cx="45" cy="70" r="4" fill="#333"/>
  <circle cx="75" cy="70" r="4" fill="#333"/>
  
  <!-- Sad mouth (open, worried) -->
  <ellipse cx="60" cy="88" rx="8" ry="10" fill="#E85A7B" stroke="#333" stroke-width="2"/>
  <path d="M52,85 Q60,82 68,85" stroke="#333" stroke-width="2" fill="none"/>
  
  <!-- White glove hands (sad/worried pose) -->
  <ellipse cx="20" cy="75" rx="12" ry="15" fill="white" stroke="#999" stroke-width="2"/>
  <ellipse cx="100" cy="75" rx="12" ry="15" fill="white" stroke="#999" stroke-width="2"/>
  
  <!-- Shadow at bottom -->
  <ellipse cx="60" cy="150" rx="35" ry="8" fill="#999" opacity="0.3"/>
</svg>
```

#### Tear Drop SVG
- Simple teardrop shape
- Semi-transparent blue
- Size: ~10-15px
- Multiple instances generated dynamically

```svg
<svg viewBox="0 0 10 15" xmlns="http://www.w3.org/2000/svg">
  <path d="M5,0 Q7,5 7,10 Q7,13 5,15 Q3,13 3,10 Q3,5 5,0 Z" 
        fill="#4A90E2" opacity="0.6"/>
</svg>
```

### 3. CSS Animation Keyframes

#### Entry Animations (4 variants)

**From Top:**
```css
@keyframes enter-from-top {
  0% { transform: translate(-50%, -150vh) rotate(-20deg); }
  70% { transform: translate(-50%, -50%) rotate(8deg); }
  85% { transform: translate(-50%, -45%) rotate(-3deg); }
  100% { transform: translate(-50%, -50%) rotate(0deg); }
}
```

**From Bottom:**
```css
@keyframes enter-from-bottom {
  0% { transform: translate(-50%, 150vh) rotate(20deg); }
  70% { transform: translate(-50%, -50%) rotate(-8deg); }
  85% { transform: translate(-50%, -45%) rotate(3deg); }
  100% { transform: translate(-50%, -50%) rotate(0deg); }
}
```

**From Left:**
```css
@keyframes enter-from-left {
  0% { transform: translate(-150vw, -50%) rotate(-100deg); }
  70% { transform: translate(-50%, -50%) rotate(10deg); }
  85% { transform: translate(-50%, -45%) rotate(-3deg); }
  100% { transform: translate(-50%, -50%) rotate(0deg); }
}
```

**From Right:**
```css
@keyframes enter-from-right {
  0% { transform: translate(150vw, -50%) rotate(100deg); }
  70% { transform: translate(-50%, -50%) rotate(-10deg); }
  85% { transform: translate(-50%, -45%) rotate(3deg); }
  100% { transform: translate(-50%, -50%) rotate(0deg); }
}
```

**Timing**: 1.8s duration, cubic-bezier(0.34, 1.56, 0.64, 1) for bouncy landing effect

#### Crying Animation (looping)

**Body Shake:**
```css
@keyframes cry-shake {
  0%, 100% { transform: translate(-50%, -50%) rotate(0deg); }
  25% { transform: translate(-52%, -50%) rotate(-2deg); }
  75% { transform: translate(-48%, -50%) rotate(2deg); }
}
```

**Timing**: 0.8s duration, infinite loop, starts at 1.8s

**Tear Fall:**
```css
@keyframes tear-fall {
  0% { 
    transform: translateY(0) scale(1);
    opacity: 0.6;
  }
  100% { 
    transform: translateY(100px) scale(0.5);
    opacity: 0;
  }
}
```

**Timing**: 1.5s duration, infinite loop, staggered start times for multiple tears

#### Title Fade-in

```css
@keyframes title-fade-in {
  0% { opacity: 0; transform: translateY(-20px); }
  100% { opacity: 1; transform: translateY(0); }
}
```

**Timing**: 1.5s duration, starts at 3.5s, ease-in easing

### 4. JavaScript Logic

#### Random Direction Selection

```javascript
const directions = ['top', 'bottom', 'left', 'right'];
const randomDirection = directions[Math.floor(Math.random() * 4)];
```

#### Animation Orchestration

```javascript
// On page load
document.addEventListener('DOMContentLoaded', () => {
  const sockWrapper = document.getElementById('sock-wrapper');
  const title = document.getElementById('title');
  
  // 1. Select random direction
  const direction = getRandomDirection();
  
  // 2. Apply entry animation class
  sockWrapper.classList.add(`enter-${direction}`);
  
  // 3. After entry completes (1.8s), start crying
  setTimeout(() => {
    sockWrapper.classList.remove(`enter-${direction}`);
    sockWrapper.classList.add('crying');
    generateTears();
  }, 1800);
  
  // 4. Start title fade-in (3.5s)
  setTimeout(() => {
    title.classList.add('fade-in');
  }, 3500);
});
```

#### Tear Generation

```javascript
function generateTears() {
  const tearsContainer = document.getElementById('tears-container');
  const tearCount = 5;
  
  for (let i = 0; i < tearCount; i++) {
    const tear = createTearElement();
    tear.style.animationDelay = `${i * 0.3}s`;
    tear.style.left = `${45 + Math.random() * 10}%`;
    tearsContainer.appendChild(tear);
  }
}
```

## Data Models

No complex data models required. Simple state management:

```javascript
const animationState = {
  direction: null,        // 'top' | 'bottom' | 'left' | 'right'
  phase: 'initial',       // 'initial' | 'entering' | 'crying' | 'complete'
  startTime: null         // timestamp
};
```

## Error Handling

### Browser Compatibility
- Graceful degradation for older browsers
- Feature detection for CSS animations
- Fallback: static sock at center with title visible

```javascript
if (!CSS.supports('animation', 'test')) {
  // Show static version
  document.getElementById('sock-wrapper').classList.add('static-fallback');
  document.getElementById('title').style.opacity = '1';
}
```

### Performance Considerations
- Use `transform` and `opacity` for animations (GPU-accelerated)
- Limit tear drop count to 5 to avoid performance issues
- Use `will-change` hint for animated elements

```css
#sock-wrapper {
  will-change: transform;
}
```

## Testing Strategy

### Visual Testing
1. Verify sock enters from all 4 directions correctly
2. Confirm landing position is centered across different viewport sizes
3. Validate crying animation loops smoothly
4. Check title fade-in timing and visibility
5. Test on multiple screen sizes (mobile, tablet, desktop)

### Timing Validation
1. Measure total animation duration (should be 5-7s)
2. Verify entry animation completes in ~2.5s
3. Confirm crying starts immediately after landing
4. Check title appears between 4-7s mark

### Browser Testing
1. Test on Chrome, Firefox, Safari, Edge
2. Verify mobile browser compatibility
3. Test fallback behavior on older browsers

### Performance Testing
1. Monitor frame rate during animation (target: 60fps)
2. Check CPU usage remains reasonable
3. Verify no memory leaks from tear generation

## Design Decisions and Rationales

### Single HTML File Approach
**Decision**: Package everything in one HTML file with inline CSS and JavaScript.
**Rationale**: Simplifies deployment, ensures all assets load together, reduces HTTP requests, makes it truly standalone.

### CSS Keyframes Over JavaScript Animation
**Decision**: Use CSS keyframes for all visual motion.
**Rationale**: Better performance (GPU-accelerated), smoother animations, less JavaScript complexity, easier to maintain and adjust timing.

### Four Discrete Entry Directions
**Decision**: Limit to exactly 4 entry points (not diagonal or arbitrary angles).
**Rationale**: Simpler implementation, predictable behavior, easier to create polished animations for each direction, meets requirements.

### Tear Drop Generation via JavaScript
**Decision**: Dynamically create tear elements rather than pre-defining them in HTML.
**Rationale**: Allows for randomization, keeps HTML cleaner, enables easy adjustment of tear count, provides staggered animation timing.

### 1.8s Entry Duration
**Decision**: Allocate 1.8 seconds for the entry animation.
**Rationale**: Creates a snappy, energetic entrance that feels quick and dynamic, leaves 3.2-4.2s for crying and title (meeting 5-7s total requirement), maintains viewer engagement without dragging.

### Pink Cartoon Character Design
**Decision**: Use bright pink color scheme with cartoon character features (large eyes, folded cuff "hat", white glove hands).
**Rationale**: Matches the reference design aesthetic, creates strong "cute but tragic" contrast, highly expressive character that viewers can emotionally connect with, memorable and distinctive visual style.