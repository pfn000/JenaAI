/**
 * 🔧 ScriptLoader — Loads CDN scripts with error handling and guaranteed order
 */
const ScriptLoader = {
    scripts: [
        { name: 'Three.js', url: 'https://cdn.jsdelivr.net/npm/three@0.140.0/build/three.min.js', check: () => typeof THREE !== 'undefined' },
        { name: 'OrbitControls', url: 'https://cdn.jsdelivr.net/npm/three@0.140.0/examples/js/controls/OrbitControls.js', check: () => THREE && THREE.OrbitControls },
        { name: 'GLTFLoader', url: 'https://cdn.jsdelivr.net/npm/three@0.140.0/examples/js/loaders/GLTFLoader.js', check: () => THREE && THREE.GLTFLoader },
        { name: 'VRM Plugin', url: 'https://cdn.jsdelivr.net/npm/@pixiv/three-vrm@2/lib/three-vrm.js', check: () => THREE && THREE.VRMLoaderPlugin },
    ],
    
    load(index) {
        return new Promise((resolve, reject) => {
            if (index >= this.scripts.length) { resolve(); return; }
            
            const script = this.scripts[index];
            if (window.LoadingManager) LoadingManager.setStatus('Loading ' + script.name + '...');
            
            // Check if already loaded
            if (script.check && script.check()) {
                if (window.LoadingManager) LoadingManager.stepComplete(index);
                this.load(index + 1).then(resolve).catch(reject);
                return;
            }
            
            const el = document.createElement('script');
            el.src = script.url;
            el.crossOrigin = 'anonymous';
            
            el.onload = () => {
                console.log('✅ Loaded: ' + script.name);
                if (window.LoadingManager) LoadingManager.stepComplete(index);
                // Load next script
                this.load(index + 1).then(resolve).catch(reject);
            };
            
            el.onerror = (err) => {
                console.error('❌ Failed to load: ' + script.name, script.url, err);
                if (window.LoadingManager) LoadingManager.stepError(index, 'Failed to load from CDN');
                // Try to continue anyway
                this.load(index + 1).then(resolve).catch(reject);
            };
            
            document.head.appendChild(el);
        });
    },
    
    loadAll() {
        return this.load(0);
    }
};

window.ScriptLoader = ScriptLoader;
