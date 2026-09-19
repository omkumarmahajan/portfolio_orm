import * as THREE from 'three';

// ----------------------------------------------------
// 1. GAME STATE LOGIC
// ----------------------------------------------------
const TOTAL_LEVELS = 6;
let currentLevel = 0;

// Frame targets for the 2D background sequence corresponding to each level
const levelTargetFrames = [1, 48, 96, 144, 192, 239]; 
let currentFrameFloat = 1; // Used for smooth interpolation

// 3D Object target configs corresponding to each level
const level3DConfigs = [
    { ico: { x: -6, y: 1, z: -4 }, tor: { x: 6, y: -2, z: -5 } },  // Lvl 0 (Hero)
    { ico: { x: 6, y: 2, z: -6 }, tor: { x: -5, y: -1, z: -3 } },  // Lvl 1 (About)
    { ico: { x: -5, y: -2, z: -3 }, tor: { x: 5, y: 3, z: -6 } },  // Lvl 2 (Skills)
    { ico: { x: 4, y: -1, z: -5 }, tor: { x: -6, y: 2, z: -4 } },  // Lvl 3 (Projects)
    { ico: { x: -4, y: 2, z: -4 }, tor: { x: 5, y: -1, z: -3 } },  // Lvl 4 (Achievements)
    { ico: { x: -3, y: 3, z: -7 }, tor: { x: 3, y: -3, z: -7 } }   // Lvl 5 (Contact)
];

// HUD Elements
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const levelDisplay = document.getElementById('level-display');
const statusDisplay = document.getElementById('hud-status');
const levelScreens = document.querySelectorAll('.level-screen');
const animationCanvas = document.getElementById("animation-canvas"); // Also used in 2D logic below

const levelNames = ["HOME", "ABOUT ME", "MY SKILLS", "PROJECTS", "ACHIEVEMENTS", "CONTACT"];
const bgPositions = ["pos-right", "pos-left", "pos-center", "pos-right", "pos-left", "pos-center"];

const updateHUD = () => {
    // Update Screens
    levelScreens.forEach((screen, index) => {
        if (index === currentLevel) {
            screen.classList.add('active');
        } else {
            screen.classList.remove('active');
        }
    });

    // Update Text
    levelDisplay.innerText = `0${currentLevel + 1}/06`;
    statusDisplay.innerText = `NAVIGATING TO SECTION 0${currentLevel + 1}...`;
    setTimeout(() => { statusDisplay.innerText = 'READY.'; }, 800);

    // Dynamic Background Panning (Opposite of text card)
    animationCanvas.className = bgPositions[currentLevel];

    // Update Buttons with dynamic text
    if (currentLevel > 0) {
        btnPrev.innerHTML = `<i class="fa-solid fa-backward-step"></i> PREV: ${levelNames[currentLevel - 1]}`;
        btnPrev.disabled = false;
    } else {
        btnPrev.innerHTML = `<i class="fa-solid fa-backward-step"></i> PREV`;
        btnPrev.disabled = true;
    }

    if (currentLevel < TOTAL_LEVELS - 1) {
        btnNext.innerHTML = `NEXT: ${levelNames[currentLevel + 1]} <i class="fa-solid fa-forward-step"></i>`;
        btnNext.disabled = false;
    } else {
        btnNext.innerHTML = `NEXT <i class="fa-solid fa-forward-step"></i>`;
        btnNext.disabled = true;
    }
};

const triggerFlash = () => {
    const flash = document.createElement('div');
    flash.className = 'transition-flash';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 400); // Remove after animation completes
};

// Event Listeners for HUD
btnPrev.addEventListener('click', () => {
    if (currentLevel > 0) {
        triggerFlash();
        currentLevel--;
        updateHUD();
    }
});

btnNext.addEventListener('click', () => {
    if (currentLevel < TOTAL_LEVELS - 1) {
        triggerFlash();
        currentLevel++;
        updateHUD();
    }
});

// Initialize HUD
updateHUD();

// Certificate Stack Logic
let currentCert = 0;
let isAnimating = false;

const initCertStack = () => {
    const cards = document.querySelectorAll('.cert-stack .cert-card');
    if (cards.length > 0) {
        cards.forEach(c => { c.className = 'cert-card'; });
        cards[0].className = 'cert-card active';
        currentCert = 0;
    }
};
initCertStack();

window.cycleCertificates = () => {
    if(isAnimating) return;
    const cards = document.querySelectorAll('.cert-stack .cert-card');
    if(cards.length < 2) return;
    
    isAnimating = true;
    const outgoingCard = cards[currentCert];
    
    // Advance index
    currentCert = (currentCert + 1) % cards.length;
    const incomingCard = cards[currentCert];
    
    // Set outgoing so it stays visible while being covered
    outgoingCard.className = 'cert-card outgoing';
    
    // Setup incoming (start off-screen)
    incomingCard.className = 'cert-card incoming';
    
    // Force reflow
    void incomingCard.offsetWidth;
    
    // Deal the card! (flies in on top)
    incomingCard.className = 'cert-card active dealing';
    
    setTimeout(() => {
        // Reset classes after animation
        outgoingCard.className = 'cert-card';
        incomingCard.className = 'cert-card active';
        isAnimating = false;
    }, 600);
};


// ----------------------------------------------------
// 2. 2D IMAGE SEQUENCE LOGIC
// ----------------------------------------------------
const context = animationCanvas.getContext("2d");
const frameCount = 240;
const images = [];

const preloadImages = () => {
    for (let i = 1; i <= frameCount; i++) {
        const img = new Image();
        img.src = `video_frames_small/frame_${i.toString().padStart(6, '0')}.jpg`;
        images.push(img);
        if (i === 1) {
            img.onload = () => {
                animationCanvas.width = img.width;
                animationCanvas.height = img.height;
                context.drawImage(img, 0, 0);
            };
        }
    }
};
preloadImages();


// ----------------------------------------------------
// 3. 3D WEBGL OVERLAY LOGIC
// ----------------------------------------------------
const webglCanvas = document.getElementById("webgl-canvas");
const renderer = new THREE.WebGLRenderer({ canvas: webglCanvas, alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.z = 8;

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(ambientLight);
const goldLight = new THREE.DirectionalLight(0xf5c518, 5); 
goldLight.position.set(-1, 1, 2);
scene.add(goldLight);

const redLight = new THREE.DirectionalLight(0xff0044, 2); // Cyberpunk accent
redLight.position.set(2, -1, 0);
scene.add(redLight);

// Create 3D Objects
const particles = [];
const materialGold = new THREE.MeshStandardMaterial({ color: 0xf5c518, metalness: 0.8, roughness: 0.2, wireframe: true });
const materialDark = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.1, wireframe: true });

const geoIco = new THREE.IcosahedronGeometry(1.5, 0);
const meshIco = new THREE.Mesh(geoIco, materialGold);
scene.add(meshIco);

const geoTorus = new THREE.TorusGeometry(1.2, 0.4, 16, 100);
const meshTorus = new THREE.Mesh(geoTorus, materialDark);
scene.add(meshTorus);

// Particles
for (let i = 0; i < 40; i++) {
    const geo = new THREE.BoxGeometry(0.05, 0.05, 0.05);
    const mat = new THREE.MeshBasicMaterial({ color: Math.random() > 0.5 ? 0xf5c518 : 0xffffff });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set( (Math.random()-0.5)*15, (Math.random()-0.5)*15, (Math.random()-0.5)*10 - 2 );
    scene.add(mesh);
    particles.push(mesh);
}

// Window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});


// ----------------------------------------------------
// 4. ANIMATION & LERP LOOP
// ----------------------------------------------------
const clock = new THREE.Clock();

const tick = () => {
    const elapsedTime = clock.getElapsedTime();
    
    // --- LERP 2D Frames ---
    const targetFrame = levelTargetFrames[currentLevel];
    currentFrameFloat += (targetFrame - currentFrameFloat) * 0.05; // Smooth interpolation
    const frameIndex = Math.min(frameCount - 1, Math.max(0, Math.floor(currentFrameFloat) - 1));
    
    if (images[frameIndex] && images[frameIndex].complete && animationCanvas.width > 0) {
        context.clearRect(0, 0, animationCanvas.width, animationCanvas.height);
        context.drawImage(images[frameIndex], 0, 0);
    }
    
    // --- LERP 3D Objects ---
    const target3D = level3DConfigs[currentLevel];
    
    // Icosahedron
    meshIco.position.x += (target3D.ico.x - meshIco.position.x) * 0.05;
    meshIco.position.y += (target3D.ico.y - meshIco.position.y) * 0.05;
    meshIco.position.z += (target3D.ico.z - meshIco.position.z) * 0.05;
    meshIco.rotation.y = elapsedTime * 0.5;
    meshIco.rotation.x = elapsedTime * 0.2;
    
    // Torus
    meshTorus.position.x += (target3D.tor.x - meshTorus.position.x) * 0.05;
    meshTorus.position.y += (target3D.tor.y - meshTorus.position.y) * 0.05;
    meshTorus.position.z += (target3D.tor.z - meshTorus.position.z) * 0.05;
    meshTorus.rotation.x = elapsedTime * 0.3;
    meshTorus.rotation.y = elapsedTime * 0.4;

    // Particles slowly drift
    particles.forEach((p, idx) => {
        p.position.y += Math.sin(elapsedTime + idx) * 0.01;
        p.rotation.x += 0.01;
    });

    renderer.render(scene, camera);
    window.requestAnimationFrame(tick);
};

tick();
