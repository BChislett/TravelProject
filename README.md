# TravelProject

A beautiful web application for visualizing your travel journeys across the world with interactive 2D maps and 3D globe views.

## Features

- **Dual Visualization Modes**
  - 2D animated map with Leaflet.js
  - 3D interactive globe with Three.js
- **Journey Animation**
  - Play/pause controls with adjustable speed
  - Progress scrubber to jump to any location
  - Smooth animations and transitions
- **Location Details**
  - Click any marker to view notes, photos, and dates
  - Tags for categorizing locations
  - Photo gallery support
- **Modern Design**
  - Clean, dark-mode interface
  - Responsive layout
  - Smooth animations

## Project Structure

```
TravelProject/
├── backend/
│   ├── app.py              # Flask application
│   ├── requirements.txt    # Python dependencies
│   ├── data/
│   │   └── journey.json   # Your travel data
│   └── uploads/
│       └── photos/        # Travel photos
├── frontend/
│   ├── index.html         # Main HTML file
│   └── src/
│       ├── main.js        # Main application logic
│       ├── components/    # Map, Globe, Controls
│       ├── utils/         # API utilities
│       └── styles/        # CSS styling
└── journey-template.json  # Template for your data
```

## Setup Instructions

### 1. Install Python Dependencies

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Prepare Your Journey Data

Edit `backend/data/journey.json` with your travel information:
- Update journey title and description
- Add your locations with coordinates
- Add personal notes for each location
- (Optional) Add photos to `backend/uploads/photos/`

Use `journey-template.json` as a reference for the data structure.

### 3. Run the Application

```bash
# From the backend directory (with venv activated)
python app.py
```

The server will start at `http://localhost:5000`

### 4. Open in Browser

Navigate to `http://localhost:5000` in your web browser to see your journey!

## Usage

### Navigation
- **2D/3D Toggle**: Switch between map and globe views
- **Play/Pause**: Animate through your journey
- **Speed Control**: Adjust animation speed (0.5x - 4x)
- **Progress Slider**: Jump to any location
- **Click Markers**: View detailed information

### Adding Your Data

1. **Find Coordinates**: Use [LatLong.net](https://www.latlong.net/) to get coordinates
2. **Edit journey.json**: Update with your locations
3. **Add Photos**: Place photos in `backend/uploads/photos/`
4. **Refresh**: Reload the page to see changes

### Sample Data Structure

```json
{
  "id": "loc-001",
  "name": "Paris",
  "country": "France",
  "coordinates": {
    "lat": 48.8566,
    "lng": 2.3522
  },
  "arrivalDate": "2024-03-08",
  "departureDate": "2024-03-14",
  "notes": "Your memories here...",
  "photos": [],
  "transportToNext": "train",
  "tags": ["city", "culture", "food"]
}
```

## Technology Stack

### Backend
- **Flask**: Python web framework
- **Flask-CORS**: Cross-origin resource sharing
- **Pillow**: Image processing

### Frontend
- **Leaflet.js**: 2D interactive maps
- **Three.js**: 3D graphics
- **three-globe**: Globe visualization
- **Vanilla JavaScript**: No framework dependencies

## API Endpoints

- `GET /api/journey` - Get complete journey data
- `GET /api/locations` - Get all locations
- `GET /api/location/<id>` - Get specific location
- `GET /api/stats` - Get journey statistics
- `GET /photos/<filename>` - Serve photo files

## Customization

### Styling
Edit `frontend/src/styles/main.css` to customize colors, fonts, and layout.

### Map Provider
Currently using OpenStreetMap. You can switch to Mapbox or other providers by editing `Map2D.js`.

### Globe Textures
The 3D globe uses NASA Blue Marble textures. You can customize textures in `Globe3D.js`.

## Future Enhancements

- Photo upload interface
- Export journey as video or PDF
- Multiple journey support
- Weather data integration
- Budget tracking
- Social sharing

## Troubleshooting

**Port already in use**: Change port in `app.py` (line: `app.run(port=5000)`)

**CORS errors**: Ensure Flask-CORS is installed and configured

**Globe not loading**: Check internet connection (loads textures from CDN)

**Photos not showing**: Verify photo paths in journey.json match files in uploads/photos/

## License

Free to use for personal projects

## Credits

Created with Claude Code as a testing ground for travel visualization
