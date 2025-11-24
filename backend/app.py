from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import json
import os

app = Flask(__name__, static_folder='../frontend')
CORS(app)

# Path configurations
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
PHOTOS_DIR = os.path.join(os.path.dirname(__file__), 'uploads', 'photos')
JOURNEY_FILE = os.path.join(DATA_DIR, 'journey.json')

@app.route('/')
def index():
    """Serve the main frontend page"""
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/journey', methods=['GET'])
def get_journey():
    """Get all journey data"""
    try:
        if os.path.exists(JOURNEY_FILE):
            with open(JOURNEY_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
            return jsonify(data), 200
        else:
            return jsonify({"error": "Journey data not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/locations', methods=['GET'])
def get_locations():
    """Get all locations"""
    try:
        if os.path.exists(JOURNEY_FILE):
            with open(JOURNEY_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
            return jsonify(data.get('locations', [])), 200
        else:
            return jsonify([]), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/location/<location_id>', methods=['GET'])
def get_location(location_id):
    """Get a specific location by ID"""
    try:
        if os.path.exists(JOURNEY_FILE):
            with open(JOURNEY_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
            locations = data.get('locations', [])
            location = next((loc for loc in locations if loc['id'] == location_id), None)
            if location:
                return jsonify(location), 200
            else:
                return jsonify({"error": "Location not found"}), 404
        else:
            return jsonify({"error": "Journey data not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/photos/<path:filename>')
def serve_photo(filename):
    """Serve photo files"""
    return send_from_directory(PHOTOS_DIR, filename)

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get journey statistics"""
    try:
        if os.path.exists(JOURNEY_FILE):
            with open(JOURNEY_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
            locations = data.get('locations', [])

            countries = set(loc.get('country') for loc in locations)
            total_photos = sum(len(loc.get('photos', [])) for loc in locations)

            stats = {
                "totalLocations": len(locations),
                "totalCountries": len(countries),
                "totalPhotos": total_photos,
                "countries": list(countries)
            }
            return jsonify(stats), 200
        else:
            return jsonify({"error": "Journey data not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# This catch-all route must be last to avoid interfering with API routes
@app.route('/<path:path>')
def serve_static_catchall(path):
    """Serve static files from frontend folder (catch-all)"""
    try:
        return send_from_directory(app.static_folder, path)
    except:
        return jsonify({"error": "File not found"}), 404

if __name__ == '__main__':
    # Ensure data and upload directories exist
    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(PHOTOS_DIR, exist_ok=True)

    # Run the app
    app.run(debug=True, host='0.0.0.0', port=5000)
