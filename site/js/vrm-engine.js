
/**
 * 🎭 VRMEngine — Jena's Avatar Control System
 * 
 * Handles Three.js rendering, VRM model loading,
 * expression control, bone manipulation, poses, and animations.
 */

class VRMEngine {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.vrm = null;
        this.clock = new THREE.Clock();
        this.currentAnim = null;
        this.currentPose = 'standing';
        this.blinkTimer = 0;
        this.isReady = false;
        
        this.init();
    }

    async init() {
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.container.insertBefore(this.renderer.domElement, this.container.firstChild);

        // Camera
        this.camera = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
        this.camera.position.set(0, 1.0, 3.2);

        // Scene
        this.scene = new THREE.Scene();
        this.scene.add(new THREE.DirectionalLight(0xfff4e6, 2.5).translateX(1).translateY(2).translateZ(1.5));
        this.scene.add(new THREE.DirectionalLight(0xc4d4ff, 1.0).translateX(-1).translateY(1).translateZ(-0.5));
        this.scene.add(new THREE.DirectionalLight(0xffeedd, 1.5).translateZ(-2).translateY(1));
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.4));
        this.scene.add(new THREE.HemisphereLight(0xaaddff, 0x443322, 0.5));

        // Ground
        const ground = new THREE.Mesh(
            new THREE.CircleGeometry(2, 64),
            new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.9 })
        );
        ground.rotation.x = -Math.PI / 2;
        this.scene.add(ground);

        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // Load VRM
        await this.loadVRM();
        
        // Start animation loop
        this.animate();
    }

    resize() {
        const w = this.container.clientWidth;
        const h = this.container.clientHeight;
        this.renderer.setSize(w, h);
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
    }

    async loadVRM(url) {
        const loader = new GLTFLoader();
        loader.register((p) => new THREE.VRMLoaderPlugin(p));

        const vrmUrl = url || './avatars/vivi.vrm';
        
        return new Promise((resolve, reject) => {
            loader.load(vrmUrl, (gltf) => {
                this.vrm = gltf.userData.vrm;
                // VRMUtils.removeUnnecessaryVertices - v2 API
                // VRMUtils.combineSkeletons - v2 API
                // VRMUtils.combineMorphs - v2 API
                this.vrm.scene.traverse(o => o.frustumCulled = false);
                this.scene.add(this.vrm.scene);
                
                // Apply initial pose
                this.setPose('standing');
                this.isReady = true;
                
                document.getElementById('mic-status').textContent = 'Jena is ready!';
                resolve(this.vrm);
            }, (progress) => {
                const pct = 100 * (progress.loaded / progress.total);
                document.getElementById('mic-status').textContent = 'Loading... ' + pct.toFixed(0) + '%';
            }, reject);
        });
    }

    // === EXPRESSIONS ===
    setExpression(name, value) {
        if (this.vrm?.expressionManager) {
            this.vrm.expressionManager.setValue(name, Math.max(0, Math.min(1, value)));
        }
    }

    setExpressions(map) {
        Object.entries(map).forEach(([name, value]) => this.setExpression(name, value));
    }

    clearExpressions() {
        ['aa', 'ih', 'ou', 'ee', 'oh', 'blink', 'happy', 'angry', 'sad', 'surprised'].forEach(e => {
            this.setExpression(e, 0);
        });
    }

    // === BONES ===
    setBone(boneName, axis, radians) {
        const node = this.vrm?.humanoid?.getNormalizedBoneNode(boneName);
        if (node) node.rotation[axis] = radians;
    }

    getBone(boneName) {
        return this.vrm?.humanoid?.getNormalizedBoneNode(boneName);
    }

    // === POSES ===
    setPose(poseName) {
        this.currentPose = poseName;
        const g = (name) => this.getBone(name);

        const poses = {
            standing: () => {
                const lA = g('leftUpperArm'); if (lA) { lA.rotation.z = 0.15; lA.rotation.x = 0.05; lA.rotation.y = 0; }
                const rA = g('rightUpperArm'); if (rA) { rA.rotation.z = -0.15; rA.rotation.x = 0.05; rA.rotation.y = 0; }
                const lF = g('leftLowerArm'); if (lF) { lF.rotation.y = -0.1; lF.rotation.x = 0; }
                const rF = g('rightLowerArm'); if (rF) { rF.rotation.y = 0.1; rF.rotation.x = 0; }
                const sp = g('spine'); if (sp) { sp.rotation.x = 0.02; sp.rotation.z = 0; }
                const hp = g('hips'); if (hp) { hp.rotation.x = 0; hp.rotation.y = 0; hp.position.y = 0; }
                const lL = g('leftUpperLeg'); if (lL) lL.rotation.x = 0;
                const rL = g('rightUpperLeg'); if (rL) rL.rotation.x = 0;
            },
            sitting: () => {
                const hp = g('hips'); if (hp) { hp.rotation.x = 0.3; hp.position.y = -0.3; }
                const sp = g('spine'); if (sp) sp.rotation.x = -0.1;
                const lL = g('leftUpperLeg'); if (lL) lL.rotation.x = -1.2;
                const rL = g('rightUpperLeg'); if (rL) rL.rotation.x = -1.2;
                const lA = g('leftUpperArm'); if (lA) { lA.rotation.z = 0.3; lA.rotation.x = 0.8; }
                const rA = g('rightUpperArm'); if (rA) { rA.rotation.z = -0.3; rA.rotation.x = 0.8; }
                const lF = g('leftLowerArm'); if (lF) lF.rotation.x = -0.8;
                const rF = g('rightLowerArm'); if (rF) rF.rotation.x = -0.8;
            },
            crossedArms: () => {
                const lA = g('leftUpperArm'); if (lA) { lA.rotation.z = 0.8; lA.rotation.x = 0.5; lA.rotation.y = -0.3; }
                const rA = g('rightUpperArm'); if (rA) { rA.rotation.z = -0.8; rA.rotation.x = 0.5; rA.rotation.y = 0.3; }
                const lF = g('leftLowerArm'); if (lF) { lF.rotation.x = -1.5; lF.rotation.y = 0.5; }
                const rF = g('rightLowerArm'); if (rF) { rF.rotation.x = -1.5; rF.rotation.y = -0.5; }
            },
            handOnHip: () => {
                const lA = g('leftUpperArm'); if (lA) { lA.rotation.z = 0.2; lA.rotation.x = 0.1; lA.rotation.y = 0; }
                const rA = g('rightUpperArm'); if (rA) { rA.rotation.z = -0.5; rA.rotation.x = 0.6; }
                const rF = g('rightLowerArm'); if (rF) { rF.rotation.x = -1.0; rF.rotation.y = -0.3; }
                const hd = g('head'); if (hd) { hd.rotation.y = -0.1; hd.rotation.z = 0.05; }
                const hp = g('hips'); if (hp) hp.rotation.z = 0.03;
            },
            thinking: () => {
                const lA = g('leftUpperArm'); if (lA) { lA.rotation.z = 0.3; lA.rotation.x = 0.2; }
                const rA = g('rightUpperArm'); if (rA) { rA.rotation.z = -0.6; rA.rotation.x = 1.2; }
                const rF = g('rightLowerArm'); if (rF) rF.rotation.x = -1.5;
                const hd = g('head'); if (hd) { hd.rotation.x = 0.15; hd.rotation.y = -0.1; }
            },
            leaning: () => {
                const hp = g('hips'); if (hp) hp.rotation.x = 0.2;
                const sp = g('spine'); if (sp) { sp.rotation.x = -0.15; sp.rotation.z = 0.05; }
                const lA = g('leftUpperArm'); if (lA) { lA.rotation.z = 0.5; lA.rotation.x = 1.0; }
                const rA = g('rightUpperArm'); if (rA) { rA.rotation.z = -0.2; rA.rotation.x = 0.3; }
            },
        };

        if (poses[poseName]) poses[poseName]();
    }

    // === ANIMATIONS ===
    playAnimation(name) {
        this.currentAnim = { name, startTime: this.clock.elapsedTime };
    }

    updateAnimations(t, delta) {
        if (!this.vrm) return;

        // === IDLE LIFE ANIMATIONS ===
        const chest = this.getBone('chest');
        if (chest) chest.rotation.x = Math.sin(t * 1.2) * 0.02;

        const spine = this.getBone('spine');
        if (spine && this.currentPose !== 'sitting') {
            spine.rotation.x += Math.sin(t * 0.8) * 0.01;
            spine.rotation.z += Math.sin(t * 0.5) * 0.005;
        }

        const hips = this.getBone('hips');
        if (hips && this.currentPose !== 'sitting') {
            hips.rotation.y = Math.sin(t * 0.6) * 0.02;
            hips.rotation.z += Math.sin(t * 0.4) * 0.005;
        }

        const head = this.getBone('head');
        if (head) {
            head.rotation.y += Math.sin(t * 0.4) * 0.02;
            head.rotation.x += Math.sin(t * 0.3) * 0.01;
        }

        // Finger wiggle
        const lHand = this.getBone('leftHand');
        const rHand = this.getBone('rightHand');
        if (lHand) lHand.rotation.z = Math.sin(t * 2) * 0.03;
        if (rHand) rHand.rotation.z = -Math.sin(t * 2.1) * 0.03;

        // === BLINK ===
        this.blinkTimer += delta;
        if (this.blinkTimer > 3 + Math.random() * 2) {
            this.blinkTimer = 0;
            this.setExpression('blink', 1);
            setTimeout(() => this.setExpression('blink', 0), 150);
        }

        // === PLAYBACK ANIMATIONS ===
        if (this.currentAnim) {
            const elapsed = t - this.currentAnim.startTime;
            const a = this.currentAnim.name;

            if (a === 'dance') {
                if (hips) hips.rotation.y = Math.sin(t * 4) * 0.2;
                if (spine) spine.rotation.x = Math.sin(t * 2) * 0.05;
                const lA = this.getBone('leftUpperArm');
                const rA = this.getBone('rightUpperArm');
                if (lA) lA.rotation.z = 0.5 + Math.sin(t * 4) * 0.3;
                if (rA) rA.rotation.z = -0.5 - Math.sin(t * 4 + 1) * 0.3;
            } else if (a === 'wave') {
                const rA = this.getBone('rightUpperArm');
                if (rA) { rA.rotation.z = -1.2 + Math.sin(elapsed * 6) * 0.2; rA.rotation.x = -0.3; }
                this.setExpression('happy', 0.8);
                if (elapsed > 2) { this.currentAnim = null; this.setExpression('happy', 0); this.setPose(this.currentPose); }
            } else if (a === 'rage') {
                this.setExpression('angry', 1);
                this.setExpression('aa', 1);
                if (head) head.rotation.x = -0.15 + Math.sin(elapsed * 10) * 0.05;
                if (spine) spine.rotation.x = 0.1;
                if (elapsed > 3) { this.currentAnim = null; this.setExpression('angry', 0); this.setExpression('aa', 0); this.setPose(this.currentPose); }
            } else if (a === 'nod') {
                if (head) head.rotation.x = Math.sin(elapsed * 8) * 0.2 * Math.max(0, 1 - elapsed);
                if (elapsed > 1) { this.currentAnim = null; this.setPose(this.currentPose); }
            } else if (a === 'excited') {
                const lA = this.getBone('leftUpperArm');
                const rA = this.getBone('rightUpperArm');
                if (lA) lA.rotation.z = 0.8 + Math.sin(t * 8) * 0.2;
                if (rA) rA.rotation.z = -0.8 - Math.sin(t * 8 + 0.5) * 0.2;
                this.setExpression('happy', 1);
                this.setExpression('aa', 0.3 + Math.sin(t * 8) * 0.3);
            }
        }

        this.vrm.update(delta);
    }

    // === RENDER LOOP ===
    animate() {
        requestAnimationFrame(() => this.animate());
        const delta = this.clock.getDelta();
        const t = this.clock.elapsedTime;
        this.updateAnimations(t, delta);
        this.renderer.render(this.scene, this.camera);
    }

    // === SCREENSHOT ===
    screenshot() {
        return this.renderer.domElement.toDataURL('image/png');
    }
}

// VRMEngine exported as ES module
