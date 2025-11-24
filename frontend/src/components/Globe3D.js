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
        const container = this.canvas.parentElement;
        const width = container.clientWidth;
        const height = container.clientHeight;

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
        let rotation = { x: 0, y: 0 };

        this.canvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            previousMousePosition = { x: e.clientX, y: e.clientY };
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const deltaX = e.clientX - previousMousePosition.x;
                const deltaY = e.clientY - previousMousePosition.y;

                rotation.y += deltaX * 0.005;
                rotation.x += deltaY * 0.005;

                this.globe.rotation.y = rotation.y;
                this.globe.rotation.x = rotation.x;

                previousMousePosition = { x: e.clientX, y: e.clientY };
            }
        });

        this.canvas.addEventListener('mouseup', () => {
            isDragging = false;
        });

        this.canvas.addEventListener('mouseleave', () => {
            isDragging = false;
        });

        // Auto-rotate slowly
        setInterval(() => {
            if (!isDragging) {
                rotation.y += 0.001;
                this.globe.rotation.y = rotation.y;
            }
        }, 16);
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
            .pointColor('color')
            .pointRadius('size')
            .pointLabel('label')
            .onPointClick((point) => {
                this.onLocationClick && this.onLocationClick(point.location, point.index);
            });

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
            .arcColor('color')
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
        const duration = 1000; // 1 second
        const startTime = Date.now();
        const startRotation = {
            x: this.globe.rotation.x,
            y: this.globe.rotation.y
        };

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (ease-in-out)
            const eased = progress < 0.5
                ? 2 * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;

            this.globe.rotation.x = startRotation.x + (targetRotation.x - startRotation.x) * eased;
            this.globe.rotation.y = startRotation.y + (targetRotation.y - startRotation.y) * eased;

            if (progress < 1) {
                requestAnimationFrame(animate);
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
