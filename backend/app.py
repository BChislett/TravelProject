from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
from werkzeug.utils import secure_filename
import json
import os
import uuid

app = Flask(__name__, static_folder='../frontend')
CORS(app)

# Configuration
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

# Path configurations
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
PHOTOS_DIR = os.path.join(os.path.dirname(__file__), 'uploads', 'photos')
JOURNEY_FILE = os.path.join(DATA_DIR, 'journey.json')

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

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

@app.route('/api/location', methods=['POST'])
def add_location():
    """Add a new location to the journey"""
    try:
        new_location = request.json

        # Generate ID if not provided
        if 'id' not in new_location:
            new_location['id'] = f"loc-{uuid.uuid4().hex[:8]}"

        # Load existing data
        with open(JOURNEY_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # Add new location
        data['locations'].append(new_location)

        # Save updated data
        with open(JOURNEY_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

        return jsonify(new_location), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/location/<location_id>', methods=['PUT'])
def update_location(location_id):
    """Update an existing location"""
    try:
        updated_data = request.json

        # Load existing data
        with open(JOURNEY_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # Find and update location
        locations = data.get('locations', [])
        for i, loc in enumerate(locations):
            if loc['id'] == location_id:
                # Preserve ID
                updated_data['id'] = location_id
                locations[i] = updated_data

                # Save updated data
                with open(JOURNEY_FILE, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)

                return jsonify(updated_data), 200

        return jsonify({"error": "Location not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/location/<location_id>', methods=['DELETE'])
def delete_location(location_id):
    """Delete a location"""
    try:
        # Load existing data
        with open(JOURNEY_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # Find and remove location
        locations = data.get('locations', [])
        initial_length = len(locations)
        data['locations'] = [loc for loc in locations if loc['id'] != location_id]

        if len(data['locations']) == initial_length:
            return jsonify({"error": "Location not found"}), 404

        # Save updated data
        with open(JOURNEY_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

        return jsonify({"message": "Location deleted"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/photo/upload', methods=['POST'])
def upload_photo():
    """Upload a photo"""
    try:
        if 'photo' not in request.files:
            return jsonify({"error": "No photo file provided"}), 400

        file = request.files['photo']

        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400

        if file and allowed_file(file.filename):
            # Generate unique filename
            extension = file.filename.rsplit('.', 1)[1].lower()
            filename = f"{uuid.uuid4().hex}.{extension}"
            filepath = os.path.join(PHOTOS_DIR, filename)

            # Save file
            file.save(filepath)

            return jsonify({
                "filename": filename,
                "url": f"/photos/{filename}"
            }), 201
        else:
            return jsonify({"error": "Invalid file type"}), 400
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
