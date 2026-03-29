const ScriptLoader = {
    scripts: [
        { name: 'Three.js', url: 'vendor/three.min.js', check: () => typeof THREE !== 'undefined' },
        { name: 'OrbitControls', url: 'vendor/OrbitControls.js', check: () => THREE && THREE.OrbitControls },
        { name: 'GLTFLoader', url: 'vendor/GLTFLoader.js', check: () => THREE && THREE.GLTFLoader },
        { name: 'VRM Plugin', url: 'vendor/three-vrm.js', check: () => typeof THREE_VRM !== 'undefined' && THREE_VRM.VRMLoaderPlugin },
    ],
    
    load(index) {
        return new Promise((resolve, reject) => {
            if (index >= this.scripts.length) { resolve(); return; }
            const script = this.scripts[index];
            if (script.check && script.check()) {
                console.log('✅ Already loaded: ' + script.name);
                this.load(index + 1).then(resolve).catch(reject);
                return;
            }
            const el = document.createElement('script');
            el.src = script.url;
            el.onload = () => { console.log('✅ Loaded: ' + script.name); this.load(index + 1).then(resolve).catch(reject); };
            el.onerror = () => { console.error('❌ Failed: ' + script.name); this.load(index + 1).then(resolve).catch(reject); };
            document.head.appendChild(el);
        });
    },
    
    loadAll() { return this.load(0); }
};
window.ScriptLoader = ScriptLoader;
