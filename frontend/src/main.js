// Main application entry point
import { fetchJourney, fetchStats } from './utils/api.js';
import { Map2D } from './components/Map2D.js';
import { Globe3D } from './components/Globe3D.js';
import { Controls } from './components/Controls.js';

class TravelApp {
    constructor() {
        this.currentView = '2d'; // '2d' or '3d'
        this.journeyData = null;
        this.locations = [];

        // Components
        this.map2D = null;
        this.globe3D = null;
        this.controls = null;

        // DOM elements
        this.view2DBtn = document.getElementById('view-2d');
        this.view3DBtn = document.getElementById('view-3d');
        this.map2DContainer = document.getElementById('map-2d');
        this.globe3DContainer = document.getElementById('globe-3d');
        this.loadingOverlay = document.getElementById('loading');
        this.sidebar = document.getElementById('location-sidebar');
        this.closeSidebarBtn = document.getElementById('close-sidebar');

        this.init();
    }

    async init() {
        try {
            // Show loading
            this.showLoading(true);

            // Fetch data
            await this.loadData();

            // Initialize components
            this.initializeComponents();

            // Setup event listeners
            this.setupEventListeners();

            // Hide loading
            this.showLoading(false);

            console.log('Travel app initialized successfully!');
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError('Failed to load journey data. Please refresh the page.');
        }
    }

    async loadData() {
        try {
            // Fetch journey data
            this.journeyData = await fetchJourney();
            this.locations = this.journeyData.locations || [];

            // Update journey info in UI
            document.getElementById('journey-title').textContent = this.journeyData.journey.title;
            document.getElementById('journey-description').textContent = this.journeyData.journey.description;

            // Fetch and display stats
            const stats = await fetchStats();
            document.getElementById('stat-locations').textContent = stats.totalLocations;
            document.getElementById('stat-countries').textContent = stats.totalCountries;

        } catch (error) {
            console.error('Error loading data:', error);
            throw error;
        }
    }

    initializeComponents() {
        // Initialize 2D Map
        this.map2D = new Map2D('map-2d');
        this.map2D
            .initialize()
            .loadLocations(this.locations)
            .setLocationClickHandler((location, index) => {
                this.showLocationDetails(location);
                this.controls.seekToLocation(index);
            });

        // Initialize 3D Globe
        this.globe3D = new Globe3D('globe-canvas');
        this.globe3D
            .initialize()
            .loadLocations(this.locations)
            .setLocationClickHandler((location, index) => {
                this.showLocationDetails(location);
                this.controls.seekToLocation(index);
            });

        // Initialize Controls
        this.controls = new Controls();
        this.controls
            .initialize(this.locations)
            .setProgressChangeHandler((index) => {
                this.onProgressChange(index);
            });

        // Set initial location
        if (this.locations.length > 0) {
            this.onProgressChange(0);
        }
    }

    setupEventListeners() {
        // View toggle buttons
        this.view2DBtn.addEventListener('click', () => {
            this.switchView('2d');
        });

        this.view3DBtn.addEventListener('click', () => {
            this.switchView('3d');
        });

        // Sidebar close button
        this.closeSidebarBtn.addEventListener('click', () => {
            this.hideSidebar();
        });

        // Window resize
        window.addEventListener('resize', () => {
            this.map2D.resize();
            this.globe3D.resize();
        });
    }

    switchView(view) {
        if (view === this.currentView) return;

        this.currentView = view;

        if (view === '2d') {
            this.view2DBtn.classList.add('active');
            this.view3DBtn.classList.remove('active');
            this.map2DContainer.classList.add('active');
            this.globe3DContainer.classList.remove('active');

            // Resize map after transition
            setTimeout(() => this.map2D.resize(), 500);
        } else {
            this.view3DBtn.classList.add('active');
            this.view2DBtn.classList.remove('active');
            this.globe3DContainer.classList.add('active');
            this.map2DContainer.classList.remove('active');

            // Resize globe after transition
            setTimeout(() => this.globe3D.resize(), 500);
        }
    }

    onProgressChange(index) {
        const location = this.locations[index];
        if (!location) return;

        // Update controls label
        this.controls.updateLocationLabel(location.name);

        // Animate both views
        this.map2D.animateToLocation(index);
        this.globe3D.animateToLocation(index);
    }

    showLocationDetails(location) {
        // Populate sidebar with location details
        document.getElementById('location-name').textContent = location.name;
        document.getElementById('location-country').textContent = location.country;
        document.getElementById('location-dates').textContent =
            `${this.formatDate(location.arrivalDate)} - ${this.formatDate(location.departureDate)}`;
        document.getElementById('location-notes').textContent = location.notes;

        // Update tags
        const tagsContainer = document.getElementById('location-tags');
        tagsContainer.innerHTML = '';
        if (location.tags && location.tags.length > 0) {
            location.tags.forEach(tag => {
                const tagElement = document.createElement('span');
                tagElement.className = 'tag';
                tagElement.textContent = tag;
                tagsContainer.appendChild(tagElement);
            });
        }

        // Update photos
        const photosContainer = document.getElementById('location-photos');
        photosContainer.innerHTML = '';
        if (location.photos && location.photos.length > 0) {
            location.photos.forEach(photo => {
                const photoItem = document.createElement('div');
                photoItem.className = 'photo-item';
                photoItem.innerHTML = `
                    <img src="/photos/${photo.filename}" alt="${photo.caption}" title="${photo.caption}">
                `;
                photosContainer.appendChild(photoItem);
            });
        } else {
            photosContainer.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.875rem;">No photos yet</p>';
        }

        // Show sidebar
        this.sidebar.classList.add('open');
    }

    hideSidebar() {
        this.sidebar.classList.remove('open');
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    showLoading(show) {
        if (show) {
            this.loadingOverlay.classList.remove('hidden');
        } else {
            setTimeout(() => {
                this.loadingOverlay.classList.add('hidden');
            }, 500);
        }
    }

    showError(message) {
        this.loadingOverlay.innerHTML = `
            <div style="text-align: center; color: var(--text-primary);">
                <p style="font-size: 1.25rem; margin-bottom: 1rem;">⚠️ Error</p>
                <p>${message}</p>
            </div>
        `;
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new TravelApp();
    });
} else {
    new TravelApp();
}
