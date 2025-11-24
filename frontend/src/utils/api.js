// API utility functions
const API_BASE_URL = 'http://localhost:5000/api';

export async function fetchJourney() {
    try {
        const response = await fetch(`${API_BASE_URL}/journey`);
        if (!response.ok) {
            throw new Error('Failed to fetch journey data');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching journey:', error);
        throw error;
    }
}

export async function fetchLocations() {
    try {
        const response = await fetch(`${API_BASE_URL}/locations`);
        if (!response.ok) {
            throw new Error('Failed to fetch locations');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching locations:', error);
        throw error;
    }
}

export async function fetchLocation(locationId) {
    try {
        const response = await fetch(`${API_BASE_URL}/location/${locationId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch location');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching location:', error);
        throw error;
    }
}

export async function fetchStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/stats`);
        if (!response.ok) {
            throw new Error('Failed to fetch stats');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching stats:', error);
        throw error;
    }
}
