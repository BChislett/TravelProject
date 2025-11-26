// 3D Globe component using Three.js and three-globe
export class Globe3D {
    constructor(canvasId) {
        this.canvasId = canvasId;
        this.canvas = document.getElementById(canvasId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.globe = null;
        this.locations = [];
        this.currentIndex = 0;
        this.animationFrameId = null;
        this.controls = null;
    }

    initialize() {
        console.log('Globe3D initialize called');
        console.log('THREE available:', typeof THREE !== 'undefined');
        console.log('ThreeGlobe available:', typeof ThreeGlobe !== 'undefined');

        if (typeof THREE === 'undefined') {
            throw new Error('THREE.js is not loaded');
        }

        if (typeof ThreeGlobe === 'undefined') {
            throw new Error('ThreeGlobe is not loaded');
        }

        const container = this.canvas.parentElement;
        const width = container.clientWidth;
        const height = container.clientHeight;

        console.log('Container dimensions:', width, height);

        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0f172a);

        // Create camera
        this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
        this.camera.position.z = 300;

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        // Create globe using ThreeGlobe
        console.log('Creating ThreeGlobe instance...');
        this.globe = new ThreeGlobe()
            .globeImageUrl('https://unpkg.com/three-globe@2.30.0/example/img/earth-blue-marble.jpg')
            .bumpImageUrl('https://unpkg.com/three-globe@2.30.0/example/img/earth-topology.png')
            .showAtmosphere(true)
            .atmosphereColor('#6366f1')
            .atmosphereAltitude(0.15);

        this.scene.add(this.globe);

        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);

        // Add simple rotation on mouse drag
        this.setupMouseControls();

        // Start render loop
        this.animate();

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());

        return this;
    }

    setupMouseControls() {
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };
        this.rotation = { x: 0, y: 0 };
        this.autoRotate = true;
        this.isAnimating = false;

        // Mouse drag to rotate
        this.canvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            this.autoRotate = false; // Disable auto-rotate when user interacts
            previousMousePosition = { x: e.clientX, y: e.clientY };
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const deltaX = e.clientX - previousMousePosition.x;
                const deltaY = e.clientY - previousMousePosition.y;

                this.rotation.y += deltaX * 0.005;
                this.rotation.x += deltaY * 0.005;

                // Clamp x rotation to prevent flipping
                this.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.rotation.x));

                this.globe.rotation.y = this.rotation.y;
                this.globe.rotation.x = this.rotation.x;

                previousMousePosition = { x: e.clientX, y: e.clientY };
            }
        });

        this.canvas.addEventListener('mouseup', () => {
            isDragging = false;
        });

        this.canvas.addEventListener('mouseleave', () => {
            isDragging = false;
        });

        // Mouse wheel to zoom
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomSpeed = 0.1;
            const delta = e.deltaY > 0 ? 1 : -1;
            const newZ = this.camera.position.z + (delta * zoomSpeed * this.camera.position.z);

            // Clamp zoom between 150 and 600
            this.camera.position.z = Math.max(150, Math.min(600, newZ));
        }, { passive: false });
    }

    // Method to pause/resume auto-rotation
    pauseAutoRotation() {
        this.isAnimating = true;
    }

    resumeAutoRotation() {
        this.isAnimating = false;
    }

    loadLocations(locations) {
        this.locations = locations;

        if (locations.length === 0) return;

        // Prepare points data for markers
        const pointsData = locations.map((loc, index) => ({
            lat: loc.coordinates.lat,
            lng: loc.coordinates.lng,
            size: 0.5,
            color: index === 0 ? '#fbbf24' : '#6366f1',
            label: loc.name,
            location: loc,
            index: index
        }));

        // Add points to globe
        this.globe
            .pointsData(pointsData)
            .pointAltitude(0.01)
            .pointColor(d => d.color)
            .pointRadius(d => d.size);

        // Prepare arcs data for routes
        const arcsData = [];
        for (let i = 0; i < locations.length - 1; i++) {
            arcsData.push({
                startLat: locations[i].coordinates.lat,
                startLng: locations[i].coordinates.lng,
                endLat: locations[i + 1].coordinates.lat,
                endLng: locations[i + 1].coordinates.lng,
                color: [['#6366f1', '#8b5cf6']]
            });
        }

        // Add arcs to globe (initially with low opacity)
        this.globe
            .arcsData(arcsData)
            .arcColor(d => d.color)
            .arcDashLength(0.4)
            .arcDashGap(0.2)
            .arcDashAnimateTime(2000)
            .arcStroke(0.5)
            .arcAltitude(0.1)
            .arcDashInitialGap(() => Math.random());

        return this;
    }

    animateToLocation(index) {
        if (index < 0 || index >= this.locations.length) return;

        this.currentIndex = index;
        const location = this.locations[index];

        // Update points to show progress
        const pointsData = this.locations.map((loc, i) => ({
            lat: loc.coordinates.lat,
            lng: loc.coordinates.lng,
            size: i === index ? 0.8 : i < index ? 0.4 : 0.5,
            color: i < index ? '#94a3b8' : i === index ? '#fbbf24' : '#6366f1',
            label: loc.name,
            location: loc,
            index: i
        }));

        this.globe.pointsData(pointsData);

        // Rotate globe to show current location
        const lat = location.coordinates.lat;
        const lng = location.coordinates.lng;

        // Convert lat/lng to rotation
        const targetRotation = {
            x: (lat * Math.PI) / 180,
            y: -(lng * Math.PI) / 180
        };

        // Smooth rotation animation
        this.animateRotation(targetRotation);
    }

    animateRotation(targetRotation) {
        const duration = 1500; // 1.5 seconds for smoother animation
        const startTime = Date.now();
        const startRotation = {
            x: this.globe.rotation.x,
            y: this.globe.rotation.y
        };

        this.pauseAutoRotation(); // Pause auto-rotation during animation

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (ease-in-out cubic for smoother feel)
            const eased = progress < 0.5
                ? 4 * progress * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;

            this.globe.rotation.x = startRotation.x + (targetRotation.x - startRotation.x) * eased;
            this.globe.rotation.y = startRotation.y + (targetRotation.y - startRotation.y) * eased;

            // Update rotation state
            this.rotation.x = this.globe.rotation.x;
            this.rotation.y = this.globe.rotation.y;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.resumeAutoRotation(); // Resume auto-rotation after animation
            }
        };

        animate();
    }

    animate() {
        this.animationFrameId = requestAnimationFrame(() => this.animate());
        this.renderer.render(this.scene, this.camera);
    }

    reset() {
        this.currentIndex = 0;
        if (this.locations.length > 0) {
            this.animateToLocation(0);
        }
    }

    setLocationClickHandler(callback) {
        this.onLocationClick = callback;
        return this;
    }

    onWindowResize() {
        const container = this.canvas.parentElement;
        const width = container.clientWidth;
        const height = container.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    resize() {
        this.onWindowResize();
    }

    dispose() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        if (this.renderer) {
            this.renderer.dispose();
        }
    }
}
