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
  `new_frames/frame_${index.toString().padStart(6, '0')}.jpg`
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


// Scroll interaction for Video Frames
window.addEventListener('scroll', () => {
    // Calculate scroll progress robustly for mobile
    const html = document.documentElement;
    const scrollTop = html.scrollTop || document.body.scrollTop || 0;
    const maxScrollTop = html.scrollHeight - html.clientHeight;
    
    // Clamp fraction between 0 and 1 to prevent rubber-band scrolling bugs
    const scrollFraction = maxScrollTop > 0 ? Math.max(0, Math.min(1, scrollTop / maxScrollTop)) : 0;

    // Determine the corresponding frame
    const frameIndex = Math.min(
        frameCount - 1,
        Math.floor(scrollFraction * frameCount)
    );

    // Request animation frame for smooth drawing
    requestAnimationFrame(() => {
        if (images[frameIndex] && images[frameIndex].complete && canvas.width > 0) {
            context.clearRect(0, 0, canvas.width, canvas.height);
            drawImageProp(context, images[frameIndex], 0, 0, canvas.width, canvas.height);
        }
    });
});

// Handle resize
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const html = document.documentElement;
    const scrollTop = html.scrollTop || document.body.scrollTop || 0;
    const maxScrollTop = html.scrollHeight - html.clientHeight;
    const scrollFraction = maxScrollTop > 0 ? Math.max(0, Math.min(1, scrollTop / maxScrollTop)) : 0;
    const frameIndex = Math.min(frameCount - 1, Math.floor(scrollFraction * frameCount));
    
    if (images[frameIndex] && images[frameIndex].complete) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        drawImageProp(context, images[frameIndex], 0, 0, canvas.width, canvas.height);
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
