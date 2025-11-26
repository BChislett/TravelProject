// Admin interface for managing travel locations
const API_BASE_URL = 'http://localhost:5000/api';

class AdminApp {
    constructor() {
        this.uploadedPhotos = [];
        this.autocompleteTimeout = null;
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadLocations();
    }

    setupEventListeners() {
        // Form submission
        document.getElementById('location-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        // Location autocomplete
        const nameInput = document.getElementById('name');
        const autocompleteDropdown = document.getElementById('autocomplete-dropdown');

        nameInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();

            // Clear previous timeout
            if (this.autocompleteTimeout) {
                clearTimeout(this.autocompleteTimeout);
            }

            if (query.length < 3) {
                autocompleteDropdown.classList.remove('show');
                return;
            }

            // Debounce API calls
            this.autocompleteTimeout = setTimeout(() => {
                this.searchLocation(query);
            }, 300);
        });

        // Hide dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.autocomplete-container')) {
                autocompleteDropdown.classList.remove('show');
            }
        });

        // Photo upload area
        const uploadArea = document.getElementById('photo-upload-area');
        const photoInput = document.getElementById('photo-input');

        uploadArea.addEventListener('click', () => photoInput.click());

        photoInput.addEventListener('change', (e) => {
            this.handlePhotoSelect(e.target.files);
        });

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            this.handlePhotoSelect(e.dataTransfer.files);
        });
    }

    async handlePhotoSelect(files) {
        for (const file of files) {
            if (file.type.startsWith('image/')) {
                await this.uploadPhoto(file);
            }
        }
    }

    async uploadPhoto(file) {
        const formData = new FormData();
        formData.append('photo', file);

        try {
            const response = await fetch(`${API_BASE_URL}/photo/upload`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('Upload failed');

            const data = await response.json();
            this.uploadedPhotos.push({
                filename: data.filename,
                caption: file.name,
                timestamp: new Date().toISOString()
            });

            this.renderPhotoPreview();
        } catch (error) {
            this.showError('Failed to upload photo: ' + error.message);
        }
    }

    renderPhotoPreview() {
        const preview = document.getElementById('photo-preview');
        preview.innerHTML = this.uploadedPhotos.map((photo, index) => `
            <div class="photo-preview-item">
                <img src="/photos/${photo.filename}" alt="${photo.caption}">
                <button class="photo-remove" onclick="adminApp.removePhoto(${index})">&times;</button>
            </div>
        `).join('');
    }

    removePhoto(index) {
        this.uploadedPhotos.splice(index, 1);
        this.renderPhotoPreview();
    }

    async handleSubmit() {
        const formData = new FormData(document.getElementById('location-form'));

        // Build location object
        const location = {
            name: formData.get('name'),
            country: formData.get('country'),
            coordinates: {
                lat: parseFloat(formData.get('lat')),
                lng: parseFloat(formData.get('lng'))
            },
            arrivalDate: formData.get('arrivalDate'),
            departureDate: formData.get('departureDate'),
            notes: formData.get('notes') || '',
            transportToNext: formData.get('transportToNext'),
            tags: formData.get('tags') ? formData.get('tags').split(',').map(t => t.trim()) : [],
            photos: this.uploadedPhotos
        };

        try {
            const response = await fetch(`${API_BASE_URL}/location`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(location)
            });

            if (!response.ok) throw new Error('Failed to add location');

            this.showSuccess('Location added successfully!');
            document.getElementById('location-form').reset();
            this.uploadedPhotos = [];
            this.renderPhotoPreview();
            await this.loadLocations();

        } catch (error) {
            this.showError('Failed to add location: ' + error.message);
        }
    }

    async loadLocations() {
        try {
            const response = await fetch(`${API_BASE_URL}/locations`);
            if (!response.ok) throw new Error('Failed to load locations');

            const locations = await response.json();
            this.renderLocationsList(locations);

        } catch (error) {
            this.showError('Failed to load locations: ' + error.message);
        }
    }

    renderLocationsList(locations) {
        const container = document.getElementById('locations-list-container');

        if (locations.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary);">No locations yet. Add your first location above!</p>';
            return;
        }

        container.innerHTML = locations.map(loc => `
            <div class="location-item">
                <div class="location-info">
                    <h3>${loc.name}, ${loc.country}</h3>
                    <p>${loc.arrivalDate} to ${loc.departureDate}</p>
                    <p>${loc.notes ? loc.notes.substring(0, 100) + '...' : 'No notes'}</p>
                </div>
                <div class="location-actions">
                    <button class="btn btn-danger" onclick="adminApp.deleteLocation('${loc.id}')">Delete</button>
                </div>
            </div>
        `).join('');
    }

    async deleteLocation(locationId) {
        if (!confirm('Are you sure you want to delete this location?')) return;

        try {
            const response = await fetch(`${API_BASE_URL}/location/${locationId}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Failed to delete location');

            this.showSuccess('Location deleted successfully!');
            await this.loadLocations();

        } catch (error) {
            this.showError('Failed to delete location: ' + error.message);
        }
    }

    async searchLocation(query) {
        try {
            // Use Nominatim (OpenStreetMap) geocoding API
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`,
                {
                    headers: {
                        'User-Agent': 'TravelJourneyApp/1.0'
                    }
                }
            );

            if (!response.ok) throw new Error('Geocoding failed');

            const results = await response.json();
            this.displayAutocompleteResults(results);

        } catch (error) {
            console.error('Autocomplete error:', error);
        }
    }

    displayAutocompleteResults(results) {
        const dropdown = document.getElementById('autocomplete-dropdown');

        if (results.length === 0) {
            dropdown.innerHTML = '<div class="autocomplete-item">No locations found</div>';
            dropdown.classList.add('show');
            return;
        }

        dropdown.innerHTML = results.map(result => {
            const displayName = result.display_name;
            const country = result.address?.country || 'Unknown';
            const city = result.address?.city || result.address?.town || result.address?.village || result.name;

            return `
                <div class="autocomplete-item" data-result='${JSON.stringify({
                    name: city,
                    country: country,
                    lat: result.lat,
                    lng: result.lon,
                    display: displayName
                })}'>
                    <div class="location-name">${city}</div>
                    <div class="location-details">${displayName}</div>
                </div>
            `;
        }).join('');

        // Add click handlers
        dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
            item.addEventListener('click', () => {
                const data = JSON.parse(item.dataset.result);
                this.selectLocation(data);
            });
        });

        dropdown.classList.add('show');
    }

    selectLocation(data) {
        // Fill in the form fields
        document.getElementById('name').value = data.name;
        document.getElementById('country').value = data.country;
        document.getElementById('lat').value = parseFloat(data.lat).toFixed(6);
        document.getElementById('lng').value = parseFloat(data.lng).toFixed(6);

        // Hide dropdown
        document.getElementById('autocomplete-dropdown').classList.remove('show');
    }

    showSuccess(message) {
        const el = document.getElementById('success-message');
        el.textContent = message;
        el.classList.add('show');
        setTimeout(() => el.classList.remove('show'), 3000);
    }

    showError(message) {
        const el = document.getElementById('error-message');
        el.textContent = message;
        el.classList.add('show');
        setTimeout(() => el.classList.remove('show'), 5000);
    }
}

// Initialize admin app
const adminApp = new AdminApp();
