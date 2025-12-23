// === MINECRAFT 3D ENGINE (LITE) ===
let mcScene, mcCam, mcRenderer, mcRaycaster, mcControls;
let mcBlocks = [], mcMeshes = [], mcRaf;
let mcMove = { f:0, b:0, l:0, r:0, j:0 }, mcVel = new THREE.Vector3();
let mcCanJump = false, mcIsMob = false, mcPitch = 0, mcYaw = 0;
let mcTouchStart = {x:0, y:0}, mcJoyData = {x:0, y:0};

const MC_GRAVITY = 30.0, MC_SPEED = 10.0, MC_JUMP = 10.0;
const MAT_GRASS = [
    new THREE.MeshBasicMaterial({color:0x3a9e3a}), // Right
    new THREE.MeshBasicMaterial({color:0x3a9e3a}), // Left
    new THREE.MeshBasicMaterial({color:0x5cb85c}), // Top (Grass)
    new THREE.MeshBasicMaterial({color:0x5e4028}), // Bottom (Dirt)
    new THREE.MeshBasicMaterial({color:0x3a9e3a}), // Front
    new THREE.MeshBasicMaterial({color:0x3a9e3a})  // Back
];
const MAT_GOLD = new THREE.MeshBasicMaterial({color:0xffd700}); // GOLD BLOCK
const GEO_BOX = new THREE.BoxGeometry(1,1,1);

function initMinecraft3D() {
    const ov = document.getElementById('mc3dOverlay');
    ov.style.display = 'block';
    
    // Detect Mobile
    mcIsMob = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 1024;
    document.getElementById('mcMobileControls').style.display = mcIsMob ? 'block' : 'none';
    document.getElementById('mcPCHint').style.display = mcIsMob ? 'none' : 'block';

    // 1. Setup Three.js
    mcScene = new THREE.Scene();
    mcScene.background = new THREE.Color(0x87CEEB); // Sky color
    mcScene.fog = new THREE.Fog(0x87CEEB, 10, 50);

    mcCam = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    mcRenderer = new THREE.WebGLRenderer({antialias: false}); // Performance boost
    mcRenderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('mc3dContainer').innerHTML = '';
    document.getElementById('mc3dContainer').appendChild(mcRenderer.domElement);

    // 2. Generate World (Flat with walls)
    mcMeshes = []; mcBlocks = [];
    generateChunk();

    // 3. Setup Player
    mcCam.position.set(5, 2, 5);
    mcRaycaster = new THREE.Raycaster();

    // 4. Controls
    setupMcControls();
    
    // 5. Start Loop
    let prevTime = performance.now();
    
    function animate() {
        if(ov.style.display === 'none') return;
        mcRaf = requestAnimationFrame(animate);
        
        const time = performance.now();
        const delta = (time - prevTime) / 1000;
        prevTime = time;

        updateMcPhysics(delta);
        mcRenderer.render(mcScene, mcCam);
    }
    animate();
}

function generateChunk() {
    // Floor 20x20
    for(let x=0; x<20; x++){
        for(let z=0; z<20; z++){
            createBlock(x, 0, z, MAT_GRASS);
            // Walls
            if(x===0 || x===19 || z===0 || z===19) {
                createBlock(x, 1, z, MAT_GRASS);
                createBlock(x, 2, z, MAT_GRASS);
            }
        }
    }
    // Hidden Gold Block (Target)
    const rx = Math.floor(Math.random() * 16) + 2;
    const rz = Math.floor(Math.random() * 16) + 2;
    createBlock(rx, 1, rz, MAT_GOLD, true); // Target!
}

function createBlock(x, y, z, mats, isTarget=false) {
    const mesh = new THREE.Mesh(GEO_BOX, mats);
    mesh.position.set(x, y, z);
    mesh.isTarget = isTarget;
    mcScene.add(mesh);
    mcMeshes.push(mesh);
    mcBlocks.push({x,y,z, type: isTarget ? 'gold' : 'grass'});
    document.getElementById('mcBlockCount').textContent = mcBlocks.length;
}

function updateMcPhysics(delta) {
    // Friction
    mcVel.x -= mcVel.x * 10.0 * delta;
    mcVel.z -= mcVel.z * 10.0 * delta;
    mcVel.y -= 9.8 * 2.0 * delta; // Gravity

    // Input direction
    const direction = new THREE.Vector3();
    if(mcIsMob) {
        direction.z = Number(mcMove.f) - Number(mcMove.b); // Joystick Y
        direction.x = Number(mcMove.r) - Number(mcMove.l); // Joystick X
    } else {
        direction.z = Number(mcMove.f) - Number(mcMove.b);
        direction.x = Number(mcMove.r) - Number(mcMove.l);
    }
    direction.normalize();

    if (mcMove.f || mcMove.b || mcMove.l || mcMove.r) {
        // Move relative to camera look
        const yCam = mcCam.rotation.y;
        const dx = Math.sin(yCam) * direction.z + Math.sin(yCam + Math.PI/2) * direction.x;
        const dz = Math.cos(yCam) * direction.z + Math.cos(yCam + Math.PI/2) * direction.x;
        
        mcVel.x -= dx * MC_SPEED * delta * 5; // Fix speed
        mcVel.z -= dz * MC_SPEED * delta * 5;
    }

    mcCam.position.x -= mcVel.x * delta;
    mcCam.position.z -= mcVel.z * delta;
    mcCam.position.y += mcVel.y * delta; // Jump logic needed real collision but simple clamp for now

    // Floor collision (Simple)
    if (mcCam.position.y < 2.5) {
        mcVel.y = 0;
        mcCam.position.y = 2.5;
        mcCanJump = true;
    }
}

function mcAction(type) { // 'break' or 'place'
    mcRaycaster.setFromCamera(new THREE.Vector2(0,0), mcCam);
    const intersects = mcRaycaster.intersectObjects(mcMeshes);

    if (intersects.length > 0) {
        const hit = intersects[0];
        if(hit.distance > 4) return; // Reach distance

        if (type === 'break') {
            if(hit.object.isTarget) {
                winMinecraft3D();
                return;
            }
            mcScene.remove(hit.object);
            mcMeshes = mcMeshes.filter(m => m !== hit.object);
        } else {
            // Place block
            const p = hit.point.add(hit.face.normal.multiplyScalar(0.5)).floor().addScalar(0.5);
            createBlock(p.x, p.y, p.z, MAT_GRASS);
        }
    }
}

function setupMcControls() {
    // PC Keys
    document.addEventListener('keydown', (e) => {
        switch(e.code) {
            case 'KeyW': mcMove.f = 1; break;
            case 'KeyS': mcMove.b = 1; break;
            case 'KeyA': mcMove.l = 1; break;
            case 'KeyD': mcMove.r = 1; break;
            case 'Space': if(mcCanJump){ mcVel.y = MC_JUMP; mcCanJump=false; } break;
            case 'Escape': closeMinecraft3D(); break;
        }
    });
    document.addEventListener('keyup', (e) => {
        switch(e.code) {
            case 'KeyW': mcMove.f = 0; break;
            case 'KeyS': mcMove.b = 0; break;
            case 'KeyA': mcMove.l = 0; break;
            case 'KeyD': mcMove.r = 0; break;
        }
    });
    // PC Mouse Look
    document.addEventListener('mousedown', () => {
        if(!mcIsMob && document.pointerLockElement !== document.body) document.body.requestPointerLock();
        else if(!mcIsMob) mcAction('break'); // Left click break
    });
    document.addEventListener('contextmenu', (e) => { e.preventDefault(); if(!mcIsMob) mcAction('place'); }); // Right click place
    document.addEventListener('mousemove', (e) => {
        if (document.pointerLockElement === document.body) {
            mcCam.rotation.y -= e.movementX * 0.002;
            mcCam.rotation.x -= e.movementY * 0.002;
            mcCam.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, mcCam.rotation.x));
        }
    });

    // Mobile Joystick & Touch
    if(mcIsMob) {
        const joy = document.getElementById('mcJoyMove');
        const stick = document.getElementById('mcJoyStick');
        let jStart = {x:0, y:0};

        joy.addEventListener('touchstart', (e) => {
            e.preventDefault();
            jStart.x = e.touches[0].clientX;
            jStart.y = e.touches[0].clientY;
        });
        joy.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const dx = e.touches[0].clientX - jStart.x;
            const dy = e.touches[0].clientY - jStart.y;
            // Clamp stick
            const dist = Math.min(30, Math.hypot(dx, dy));
            const angle = Math.atan2(dy, dx);
            const sx = Math.cos(angle) * dist;
            const sy = Math.sin(angle) * dist;
            stick.style.transform = `translate(${sx}px, ${sy}px)`;
            
            // Map to movement
            mcMove.r = dx > 10 ? 1 : 0;
            mcMove.l = dx < -10 ? 1 : 0;
            mcMove.b = dy > 10 ? 1 : 0;
            mcMove.f = dy < -10 ? 1 : 0;
        });
        joy.addEventListener('touchend', (e) => {
            e.preventDefault();
            stick.style.transform = `translate(0px, 0px)`;
            mcMove = {f:0, b:0, l:0, r:0};
        });

        // Swipe to Look (Right side of screen)
        document.getElementById('mc3dContainer').addEventListener('touchstart', (e) => {
            if(e.touches[0].clientX > window.innerWidth/2) {
                mcTouchStart.x = e.touches[0].clientX;
                mcTouchStart.y = e.touches[0].clientY;
            }
        });
        document.getElementById('mc3dContainer').addEventListener('touchmove', (e) => {
            if(e.touches[0].clientX > window.innerWidth/2) {
                const dx = e.touches[0].clientX - mcTouchStart.x;
                const dy = e.touches[0].clientY - mcTouchStart.y;
                mcCam.rotation.y -= dx * 0.005;
                mcCam.rotation.x -= dy * 0.005;
                mcTouchStart.x = e.touches[0].clientX;
                mcTouchStart.y = e.touches[0].clientY;
            }
        });

        document.getElementById('mcBtnBreak').onclick = () => mcAction('break');
        document.getElementById('mcBtnPlace').onclick = () => mcAction('place');
    }
}

function winMinecraft3D() {
    alert("ТИ ЗНАЙШОВ ЗОЛОТИЙ БЛОК! \nБонус +5000 авто-секунд отримано!");
    autoRate += 5000; // Global var from script.js
    updateStats(); // Global function
    saveGame();
    closeMinecraft3D();
}

function closeMinecraft3D() {
    document.getElementById('mc3dOverlay').style.display = 'none';
    if(document.pointerLockElement) document.exitPointerLock();
    cancelAnimationFrame(mcRaf);
}
