// Animation Controls component
export class Controls {
    constructor() {
        this.isPlaying = false;
        this.currentIndex = 0;
        this.totalLocations = 0;
        this.speed = 1;
        this.animationInterval = null;
        this.baseDelay = 2000; // 2 seconds per location at 1x speed

        // DOM elements
        this.playBtn = document.getElementById('play-btn');
        this.playIcon = document.getElementById('play-icon');
        this.pauseIcon = document.getElementById('pause-icon');
        this.progressSlider = document.getElementById('progress-slider');
        this.currentLocationLabel = document.getElementById('current-location');
        this.progressCounter = document.getElementById('progress-counter');
        this.speedSelect = document.getElementById('speed-select');

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Play/Pause button
        this.playBtn.addEventListener('click', () => {
            this.togglePlayPause();
        });

        // Progress slider
        this.progressSlider.addEventListener('input', (e) => {
            const index = parseInt(e.target.value);
            this.seekToLocation(index);
        });

        // Speed selector
        this.speedSelect.addEventListener('change', (e) => {
            this.speed = parseFloat(e.target.value);
            if (this.isPlaying) {
                this.stop();
                this.play();
            }
        });
    }

    initialize(locations) {
        this.totalLocations = locations.length;
        this.progressSlider.max = locations.length - 1;
        this.updateUI();
    }

    togglePlayPause() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    play() {
        this.isPlaying = true;
        this.playIcon.style.display = 'none';
        this.pauseIcon.style.display = 'block';

        const delay = this.baseDelay / this.speed;

        this.animationInterval = setInterval(() => {
            if (this.currentIndex < this.totalLocations - 1) {
                this.currentIndex++;
                this.updateUI();
                this.onProgressChange && this.onProgressChange(this.currentIndex);
            } else {
                this.pause();
                // Optionally reset after completion
                // setTimeout(() => this.reset(), 1000);
            }
        }, delay);
    }

    pause() {
        this.isPlaying = false;
        this.playIcon.style.display = 'block';
        this.pauseIcon.style.display = 'none';

        if (this.animationInterval) {
            clearInterval(this.animationInterval);
            this.animationInterval = null;
        }
    }

    stop() {
        this.pause();
        this.reset();
    }

    reset() {
        this.currentIndex = 0;
        this.updateUI();
        this.onProgressChange && this.onProgressChange(this.currentIndex);
    }

    seekToLocation(index) {
        if (index >= 0 && index < this.totalLocations) {
            this.currentIndex = index;
            this.updateUI();
            this.onProgressChange && this.onProgressChange(this.currentIndex);
        }
    }

    updateUI() {
        // Update slider
        this.progressSlider.value = this.currentIndex;

        // Update counter
        this.progressCounter.textContent = `${this.currentIndex + 1} / ${this.totalLocations}`;
    }

    updateLocationLabel(locationName) {
        this.currentLocationLabel.textContent = locationName;
    }

    setProgressChangeHandler(callback) {
        this.onProgressChange = callback;
        return this;
    }
}
