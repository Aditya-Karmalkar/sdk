# Mapify OS SDK

The official JavaScript SDK for Mapify OS - embed interactive maps with place details in your web applications.

## Features

- 🗺️ **Interactive Maps** - Powered by Leaflet with multiple layer options
- 📍 **Place Details** - Click anywhere to get detailed location information
- 🔍 **Search Functionality** - Find nearby hospitals, restaurants, and more
- 🎨 **Customizable** - Multiple map themes and styling options
- 🔑 **API Key Authentication** - Secure access with your API keys
- 📱 **Responsive** - Works on desktop and mobile devices

## Quick Start

### 1. Get Your API Key

Sign up at [Mapify OS Dashboard](https://mapify-os.web.app) and generate your API key.

### 2. Include Required Dependencies

```html
<!-- Leaflet CSS -->
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

<!-- Leaflet JavaScript -->
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

<!-- Mapify OS SDK -->
<script src="https://api.mapifyos.com/v1/mapify.js"></script>
```

### 3. Create a Map Container

```html
<div id="map" style="height: 500px; width: 100%;"></div>
```

### 4. Initialize the Map

```javascript
MapifyOS.init("map", {
  apiKey: "your-api-key-here",
  center: [40.7128, -74.0060], // New York City
  zoom: 13,
  layer: "plain" // or "terrain", "satellite", "dark"
}).then(mapInstance => {
  console.log("Map initialized successfully!");
}).catch(error => {
  console.error("Failed to initialize map:", error);
});
```

## API Reference

### MapifyOS.init(containerId, options)

Initialize a new map instance.

**Parameters:**
- `containerId` (string) - DOM element ID to render the map
- `options` (object) - Configuration options
  - `apiKey` (string, required) - Your API key
  - `center` (array, optional) - Initial center [lat, lng]. Default: `[20.5937, 78.9629]`
  - `zoom` (number, optional) - Initial zoom level. Default: `5`
  - `layer` (string, optional) - Initial layer. Options: `"plain"`, `"terrain"`, `"satellite"`, `"dark"`. Default: `"plain"`
  - `enableSearch` (boolean, optional) - Enable search functionality. Default: `true`
  - `enableLayerControl` (boolean, optional) - Enable layer switching. Default: `true`

**Returns:** Promise that resolves to a map instance object.

### Map Instance Methods

```javascript
const mapInstance = await MapifyOS.init("map", { apiKey: "your-key" });

// Search for places
const results = await mapInstance.search("hospital", {
  center: [40.7128, -74.0060],
  radius: 3000 // meters
});

// Change map view
mapInstance.setView([40.7128, -74.0060], 15);

// Change map layer
mapInstance.setLayer("satellite");

// Listen to events
mapInstance.on("placeClick", (data) => {
  console.log("Place clicked:", data);
});

// Destroy the map
mapInstance.destroy();
```

### MapifyOS.getPlaceDetails(lat, lng)

Get detailed information about a specific location.

**Parameters:**
- `lat` (number) - Latitude
- `lng` (number) - Longitude

**Returns:** Promise that resolves to place details object.

```javascript
const details = await MapifyOS.getPlaceDetails(40.7128, -74.0060);
console.log(details);
// {
//   name: "Location Name",
//   address: "Full Address",
//   type: "Building Type",
//   phone: "Phone Number",
//   website: "Website URL",
//   hours: "Opening Hours",
//   coordinates: { lat: 40.7128, lng: -74.0060 }
// }
```

## Examples

### Basic Map

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script src="https://api.mapifyos.com/v1/mapify.js"></script>
</head>
<body>
  <div id="map" style="height: 500px;"></div>
  
  <script>
    MapifyOS.init("map", {
      apiKey: "your-api-key-here",
      center: [40.7128, -74.0060],
      zoom: 13
    });
  </script>
</body>
</html>
```

### Map with Search

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script src="https://api.mapifyos.com/v1/mapify.js"></script>
</head>
<body>
  <div>
    <input type="text" id="searchInput" placeholder="Search for hospitals, restaurants..." />
    <button onclick="searchPlaces()">Search</button>
  </div>
  <div id="map" style="height: 500px; margin-top: 10px;"></div>
  
  <script>
    let mapInstance;
    
    MapifyOS.init("map", {
      apiKey: "your-api-key-here",
      center: [40.7128, -74.0060],
      zoom: 13
    }).then(instance => {
      mapInstance = instance;
    });
    
    async function searchPlaces() {
      const query = document.getElementById('searchInput').value;
      if (query && mapInstance) {
        const results = await mapInstance.search(query);
        console.log(`Found ${results.length} results for "${query}"`);
      }
    }
  </script>
</body>
</html>
```

### Multiple Maps

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script src="https://api.mapifyos.com/v1/mapify.js"></script>
</head>
<body>
  <div id="map1" style="height: 300px; width: 48%; display: inline-block;"></div>
  <div id="map2" style="height: 300px; width: 48%; display: inline-block; margin-left: 2%;"></div>
  
  <script>
    // Initialize first map - New York
    MapifyOS.init("map1", {
      apiKey: "your-api-key-here",
      center: [40.7128, -74.0060],
      zoom: 12,
      layer: "plain"
    });
    
    // Initialize second map - London
    MapifyOS.init("map2", {
      apiKey: "your-api-key-here",
      center: [51.5074, -0.1278],
      zoom: 12,
      layer: "satellite"
    });
  </script>
</body>
</html>
```

### Event Handling

```javascript
MapifyOS.init("map", {
  apiKey: "your-api-key-here",
  center: [40.7128, -74.0060],
  zoom: 13
}).then(mapInstance => {
  // Listen for place clicks
  mapInstance.on("placeClick", (data) => {
    console.log("Place clicked:", data.data.name);
    console.log("Coordinates:", data.coordinates);
  });
  
  // Listen for search results
  mapInstance.on("search", (data) => {
    console.log(`Search for "${data.query}" returned ${data.results.length} results`);
  });
  
  // Listen for layer changes
  mapInstance.on("layerChange", (data) => {
    console.log("Layer changed to:", data.layer);
  });
  
  // Listen for view changes
  mapInstance.on("viewChange", (data) => {
    console.log("View changed:", data.center, data.zoom);
  });
});
```

## Map Layers

The SDK supports multiple map layers:

- **plain** - Standard OpenStreetMap tiles
- **terrain** - Topographic map with elevation data
- **satellite** - Satellite imagery from Esri
- **dark** - Dark theme map from CartoDB

```javascript
// Change layer programmatically
mapInstance.setLayer("satellite");

// Or set initial layer
MapifyOS.init("map", {
  apiKey: "your-api-key-here",
  layer: "dark"
});
```

## Search Types

Supported search types for the `search()` method:

- `hospital` - Hospitals and medical centers
- `pharmacy` - Pharmacies and drugstores
- `clinic` - Medical clinics
- `restaurant` - Restaurants and eateries
- `fuel` - Gas stations
- `bank` - Banks and ATMs
- `school` - Schools and educational institutions
- `hotel` - Hotels and accommodations
- `shop` - Shops and stores

## Error Handling

```javascript
try {
  const mapInstance = await MapifyOS.init("map", {
    apiKey: "invalid-key"
  });
} catch (error) {
  if (error.message.includes("Invalid API key")) {
    console.error("Please check your API key");
  } else {
    console.error("Map initialization failed:", error);
  }
}
```

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Rate Limits

- Free tier: 1,000 requests per month
- Each map initialization counts as 1 request
- Each search operation counts as 1 request
- Each place detail fetch counts as 1 request

## Support

- 📧 Email: support@mapifyos.com
- 📖 Documentation: https://docs.mapifyos.com
- 🐛 Issues: https://github.com/mapifyos/sdk/issues

## License

MIT License - see LICENSE file for details.
