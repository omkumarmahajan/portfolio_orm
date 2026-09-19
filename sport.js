const canvas = document.getElementById("vision-canvas");
const context = canvas.getContext("2d");

// There are 240 frames
const frameCount = 240;
const images = [];

// Initialize canvas size immediately
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Helper to pad numbers with zeros (e.g. 1 -> 000001)
const currentFrame = index => (
  `frames_24fps_small/frame_${index.toString().padStart(6, '0')}.jpg`
);

// Preload images
const preloadImages = () => {
    for (let i = 1; i <= frameCount; i++) {
        const img = new Image();
        img.src = currentFrame(i);
        images.push(img);
        
        // Draw the first frame when loaded
        if (i === 1) {
            img.onload = () => {
                drawImageProp(context, img, 0, 0, canvas.width, canvas.height);
            }
        }
    }
};
preloadImages();

// Draw Image proportionally to fill canvas (object-fit: cover equivalent)
function drawImageProp(ctx, img, x, y, w, h, offsetX, offsetY) {
    if (arguments.length === 2) {
        x = y = 0;
        w = ctx.canvas.width;
        h = ctx.canvas.height;
    }
    offsetX = typeof offsetX === "number" ? offsetX : 0.5;
    offsetY = typeof offsetY === "number" ? offsetY : 0.5;
    if (offsetX < 0) offsetX = 0;
    if (offsetY < 0) offsetY = 0;
    if (offsetX > 1) offsetX = 1;
    if (offsetY > 1) offsetY = 1;

    let iw = img.width, ih = img.height,
        r = Math.min(w / iw, h / ih),
        nw = iw * r, nh = ih * r,
        cx, cy, cw, ch, ar = 1;

    if (nw < w) ar = w / nw;
    if (Math.abs(ar - 1) < 1e-14 && nh < h) ar = h / nh;  
    nw *= ar; nh *= ar;

    cw = iw / (nw / w); ch = ih / (nh / h);
    cx = (iw - cw) * offsetX; cy = (ih - ch) * offsetY;

    if (cx < 0) cx = 0;
    if (cy < 0) cy = 0;
    if (cw > iw) cw = iw;
    if (ch > ih) ch = ih;

    ctx.drawImage(img, cx, cy, cw, ch, x, y, w, h);
}


// Optimization variables for smooth scrolling
let currentFrameIndex = -1;
let isTicking = false;

// Scroll interaction for Video Frames
window.addEventListener('scroll', () => {
    const html = document.documentElement;
    // Use window.scrollY as it is most reliable on mobile
    const scrollTop = window.scrollY || html.scrollTop || 0;
    
    // maxScrollTop based on window.innerHeight (standard viewport size)
    const maxScrollTop = html.scrollHeight - window.innerHeight;
    
    // Clamp fraction between 0 and 1 to prevent rubber-band scrolling bugs
    const scrollFraction = maxScrollTop > 0 ? Math.max(0, Math.min(1, scrollTop / maxScrollTop)) : 0;

    // Determine the corresponding frame
    const frameIndex = Math.min(
        frameCount - 1,
        Math.floor(scrollFraction * frameCount)
    );

    // Only draw if frame changed
    if (frameIndex !== currentFrameIndex) {
        currentFrameIndex = frameIndex;
        
        // Debounce with requestAnimationFrame
        if (!isTicking) {
            requestAnimationFrame(() => {
                if (images[currentFrameIndex] && images[currentFrameIndex].complete && canvas.width > 0) {
                    context.clearRect(0, 0, canvas.width, canvas.height);
                    drawImageProp(context, images[currentFrameIndex], 0, 0, canvas.width, canvas.height);
                }
                isTicking = false;
            });
            isTicking = true;
        }
    }
});

let lastWidth = window.innerWidth;
let lastHeight = window.innerHeight;

// Handle resize
window.addEventListener('resize', () => {
    // Ignore small height changes on mobile (e.g. address bar hiding/showing) to prevent canvas flickering
    if (window.innerWidth === lastWidth && Math.abs(window.innerHeight - lastHeight) < 150) {
        return;
    }
    
    lastWidth = window.innerWidth;
    lastHeight = window.innerHeight;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    if (images[currentFrameIndex] && images[currentFrameIndex].complete) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        drawImageProp(context, images[currentFrameIndex], 0, 0, canvas.width, canvas.height);
    }
});

// Intersection Observer for Dynamic Scroll Reveals
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.2 // Trigger when 20% of the element is visible
};

const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('show');
        } else {
            entry.target.classList.remove('show'); 
        }
    });
}, observerOptions);

const hiddenElements = document.querySelectorAll('.hidden, .hidden-stagger');
hiddenElements.forEach((el) => observer.observe(el));

// ----------------------------------------------------
// 4. DYNAMIC INTERACTIVE EFFECTS
// ----------------------------------------------------

// A. Interactive Ping Pong Cursor Trail
const cursorContainer = document.getElementById('cursor-trail-container');
if (cursorContainer) {
    let lastX = 0, lastY = 0;
    document.addEventListener('mousemove', (e) => {
        // Only create dot if moved a bit to save performance
        if (Math.abs(e.clientX - lastX) > 5 || Math.abs(e.clientY - lastY) > 5) {
            const dot = document.createElement('div');
            dot.classList.add('cursor-trail-dot');
            dot.style.left = e.clientX + 'px';
            dot.style.top = e.clientY + 'px';
            cursorContainer.appendChild(dot);
            
            // Cleanup after animation
            setTimeout(() => {
                if(dot.parentNode) dot.parentNode.removeChild(dot);
            }, 500);

            lastX = e.clientX;
            lastY = e.clientY;
        }
    });
}

// B. Floating Background Particles
const particlesContainer = document.getElementById('particles-container');
if (particlesContainer) {
    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        const size = Math.random() * 4 + 1;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        particle.style.left = Math.random() * 100 + 'vw';
        particle.style.animationDuration = (Math.random() * 5 + 5) + 's';
        particle.style.animationDelay = Math.random() * 5 + 's';
        particlesContainer.appendChild(particle);
    }
}

// C. 3D Hover Tilt Effect
const cards3d = document.querySelectorAll('.card-3d');
cards3d.forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left; // x position within the element.
        const y = e.clientY - rect.top;  // y position within the element.
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = ((y - centerY) / centerY) * -10; // Max rotation 10deg
        const rotateY = ((x - centerX) / centerX) * 10;
        
        card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'rotateX(0) rotateY(0)';
    });
});

// D. Animated Progress Bars on Scroll
const progressBars = document.querySelectorAll('.progress-bar .fill');
const statObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const bar = entry.target;
            const targetWidth = bar.getAttribute('data-width');
            bar.style.width = targetWidth + '%';
            
            // Animate counter text
            const label = bar.closest('.req-card').querySelector('.counter-val');
            if (label) {
                let current = 0;
                const target = parseInt(targetWidth);
                const step = target / 30; // 30 frames
                const updateCounter = () => {
                    current += step;
                    if (current >= target) {
                        label.innerText = target + '%';
                    } else {
                        label.innerText = Math.floor(current) + '%';
                        requestAnimationFrame(updateCounter);
                    }
                };
                requestAnimationFrame(updateCounter);
            }
            obs.unobserve(bar);
        }
    });
}, { threshold: 0.5 });

progressBars.forEach(bar => statObserver.observe(bar));

