import { MapManager } from './core/mapManager.js';
import { ApiManager } from './core/apiManager.js';
import { PopupUI } from './core/popupUI.js';

/**
 * Mapify OS SDK - Main entry point
 * Provides developers with easy-to-use map embedding functionality
 */
class MapifyOS {
  constructor() {
    this.apiManager = new ApiManager();
    this.popupUI = new PopupUI();
    this.instances = new Map(); // Track multiple map instances
  }

  /**
   * Initialize a new map instance
   * @param {string} containerId - DOM element ID to render the map
   * @param {Object} options - Configuration options
   * @param {string} options.apiKey - Developer's API key
   * @param {Array} options.center - Initial map center [lat, lng]
   * @param {number} options.zoom - Initial zoom level
   * @param {string} options.layer - Initial map layer ('plain', 'terrain', 'satellite', 'dark')
   * @param {boolean} options.enableSearch - Enable search functionality
   * @param {boolean} options.enableLayerControl - Enable layer switching
   * @returns {Promise<Object>} Map instance object
   */
  async init(containerId, options = {}) {
    try {
      // Validate required parameters
      if (!containerId) {
        throw new Error('Container ID is required');
      }
      
      if (!options.apiKey) {
        throw new Error('API key is required');
      }

      // Check if container exists
      const container = document.getElementById(containerId);
      if (!container) {
        throw new Error(`Container with ID '${containerId}' not found`);
      }

      // Verify API key
      const isValid = await this.apiManager.verifyApiKey(options.apiKey);
      if (!isValid) {
        throw new Error('Invalid or inactive API key');
      }

      // Create map manager instance
      const mapManager = new MapManager(containerId, {
        center: options.center || [20.5937, 78.9629], // Default to India
        zoom: options.zoom || 5,
        layer: options.layer || 'plain',
        enableSearch: options.enableSearch !== false,
        enableLayerControl: options.enableLayerControl !== false,
        apiKey: options.apiKey
      });

      // Initialize the map
      await mapManager.initialize();

      // Store instance for later reference
      this.instances.set(containerId, mapManager);

      // Return public API for this map instance
      return {
        map: mapManager.getLeafletMap(),
        search: (query, options) => this.search(containerId, query, options),
        setView: (center, zoom) => mapManager.setView(center, zoom),
        setLayer: (layerName) => mapManager.setLayer(layerName),
        destroy: () => this.destroy(containerId),
        on: (event, callback) => mapManager.on(event, callback),
        off: (event, callback) => mapManager.off(event, callback)
      };

    } catch (error) {
      console.error('MapifyOS initialization error:', error);
      throw error;
    }
  }

  /**
   * Search for places near a location
   * @param {string} containerId - Map container ID
   * @param {string} query - Search query (e.g., 'hospital', 'restaurant')
   * @param {Object} options - Search options
   * @param {Array} options.center - Search center [lat, lng]
   * @param {number} options.radius - Search radius in meters
   * @returns {Promise<Array>} Search results
   */
  async search(containerId, query, options = {}) {
    const mapInstance = this.instances.get(containerId);
    if (!mapInstance) {
      throw new Error(`Map instance '${containerId}' not found`);
    }

    return await mapInstance.search(query, options);
  }

  /**
   * Get place details for specific coordinates
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Promise<Object>} Place details
   */
  async getPlaceDetails(lat, lng) {
    try {
      // Get basic address info from Nominatim
      const nominatimResponse = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const nominatimData = await nominatimResponse.json();

      // Get detailed tags from Overpass API
      const overpassQuery = `
        [out:json][timeout:10];
        (
          way(around:30,${lat},${lng})[~"^(amenity|shop|office|building)$"~".*"];
          node(around:30,${lat},${lng})[~"^(amenity|shop|office|building)$"~".*"];
          relation(around:30,${lat},${lng})[~"^(amenity|shop|office|building)$"~".*"];
        );
        out tags center;
      `;

      const overpassResponse = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `data=${encodeURIComponent(overpassQuery)}`
      });
      const overpassData = await overpassResponse.json();

      // Find the most relevant element
      const relevantElement = overpassData.elements?.[0];
      const tags = relevantElement?.tags || {};

      return {
        name: tags.name || nominatimData.name || nominatimData.display_name?.split(',')[0] || 'Unnamed Location',
        address: nominatimData.display_name || 'Address not available',
        type: tags.amenity || tags.shop || tags.office || tags.building || 'Building',
        phone: tags.phone || tags['contact:phone'] || 'Not available',
        website: tags.website || tags['contact:website'] || tags.url || null,
        hours: tags.opening_hours || 'Not available',
        coordinates: { lat, lng }
      };

    } catch (error) {
      console.error('Error fetching place details:', error);
      return {
        name: 'Unknown Location',
        address: 'Address not available',
        type: 'Location',
        phone: 'Not available',
        website: null,
        hours: 'Not available',
        coordinates: { lat, lng }
      };
    }
  }

  /**
   * Show popup with place information
   * @param {string} containerId - Map container ID
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {Object} data - Place data
   */
  showPopup(containerId, lat, lng, data) {
    const mapInstance = this.instances.get(containerId);
    if (!mapInstance) {
      throw new Error(`Map instance '${containerId}' not found`);
    }

    const content = this.popupUI.createPopupContent(data);
    mapInstance.showPopup(lat, lng, content);
  }

  /**
   * Destroy a map instance
   * @param {string} containerId - Map container ID
   */
  destroy(containerId) {
    const mapInstance = this.instances.get(containerId);
    if (mapInstance) {
      mapInstance.destroy();
      this.instances.delete(containerId);
    }
  }

  /**
   * Get version information
   * @returns {string} SDK version
   */
  getVersion() {
    return '1.0.0';
  }

  /**
   * Get all active map instances
   * @returns {Array} Array of container IDs
   */
  getInstances() {
    return Array.from(this.instances.keys());
  }
}

// Create global instance
const mapifyOS = new MapifyOS();

// Export for different module systems
if (typeof window !== 'undefined') {
  window.MapifyOS = mapifyOS;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = mapifyOS;
}

export default mapifyOS;
