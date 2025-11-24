// 2D Map component using Leaflet
export class Map2D {
    constructor(containerId) {
        this.containerId = containerId;
        this.map = null;
        this.markers = [];
        this.polyline = null;
        this.locations = [];
        this.currentIndex = 0;
        this.animationLine = null;
    }

    initialize() {
        // Initialize Leaflet map
        this.map = L.map(this.containerId, {
            center: [35, 50], // Center between Europe and Asia
            zoom: 3,
            zoomControl: true,
            attributionControl: true
        });

        // Add tile layer (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(this.map);

        return this;
    }

    loadLocations(locations) {
        this.locations = locations;
        this.clearMap();

        if (locations.length === 0) return;

        // Create coordinates array for polyline
        const coordinates = locations.map(loc => [loc.coordinates.lat, loc.coordinates.lng]);

        // Add full route polyline (faded)
        this.polyline = L.polyline(coordinates, {
            color: '#6366f1',
            weight: 2,
            opacity: 0.3,
            smoothFactor: 1
        }).addTo(this.map);

        // Add markers for each location
        locations.forEach((location, index) => {
            const marker = L.circleMarker([location.coordinates.lat, location.coordinates.lng], {
                radius: 8,
                fillColor: index === 0 ? '#fbbf24' : '#6366f1',
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            }).addTo(this.map);

            // Add tooltip
            marker.bindTooltip(location.name, {
                permanent: false,
                direction: 'top'
            });

            // Add click event
            marker.on('click', () => {
                this.onLocationClick && this.onLocationClick(location, index);
            });

            this.markers.push(marker);
        });

        // Fit map to show all locations
        this.map.fitBounds(this.polyline.getBounds(), {
            padding: [50, 50]
        });

        return this;
    }

    clearMap() {
        // Remove existing markers
        this.markers.forEach(marker => marker.remove());
        this.markers = [];

        // Remove polylines
        if (this.polyline) {
            this.polyline.remove();
            this.polyline = null;
        }
        if (this.animationLine) {
            this.animationLine.remove();
            this.animationLine = null;
        }
    }

    animateToLocation(index) {
        if (index < 0 || index >= this.locations.length) return;

        this.currentIndex = index;
        const location = this.locations[index];

        // Update animated polyline to show progress
        const progressCoordinates = this.locations
            .slice(0, index + 1)
            .map(loc => [loc.coordinates.lat, loc.coordinates.lng]);

        if (this.animationLine) {
            this.animationLine.remove();
        }

        this.animationLine = L.polyline(progressCoordinates, {
            color: '#fbbf24',
            weight: 3,
            opacity: 1,
            smoothFactor: 1
        }).addTo(this.map);

        // Update marker colors
        this.markers.forEach((marker, i) => {
            if (i < index) {
                marker.setStyle({ fillColor: '#94a3b8' }); // visited (grey)
            } else if (i === index) {
                marker.setStyle({
                    fillColor: '#fbbf24',
                    radius: 10
                }); // current (yellow/gold)
            } else {
                marker.setStyle({
                    fillColor: '#6366f1',
                    radius: 8
                }); // future (blue)
            }
        });

        // Pan to location
        this.map.panTo([location.coordinates.lat, location.coordinates.lng], {
            animate: true,
            duration: 1
        });
    }

    highlightLocation(index) {
        this.markers.forEach((marker, i) => {
            if (i === index) {
                marker.setStyle({
                    fillColor: '#fbbf24',
                    radius: 12,
                    weight: 3
                });
                marker.openTooltip();
            }
        });
    }

    reset() {
        this.currentIndex = 0;
        if (this.animationLine) {
            this.animationLine.remove();
            this.animationLine = null;
        }

        this.markers.forEach((marker, i) => {
            marker.setStyle({
                fillColor: i === 0 ? '#fbbf24' : '#6366f1',
                radius: 8,
                weight: 2
            });
        });
    }

    setLocationClickHandler(callback) {
        this.onLocationClick = callback;
        return this;
    }

    resize() {
        if (this.map) {
            this.map.invalidateSize();
        }
    }
}
