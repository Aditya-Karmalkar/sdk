import { ApiManager } from './apiManager.js';
import { PopupUI } from './popupUI.js';

/**
 * Map Manager - Handles Leaflet map initialization and interactions
 */
export class MapManager {
  constructor(containerId, options) {
    this.containerId = containerId;
    this.options = options;
    this.map = null;
    this.currentLayer = null;
    this.markers = [];
    this.apiManager = new ApiManager();
    this.popupUI = new PopupUI();
    this.eventListeners = new Map();

    // Map layer configurations
    this.layers = {
      plain: {
        name: 'Plain',
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '© OpenStreetMap contributors'
      },
      terrain: {
        name: 'Terrain',
        url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
        attribution: '© OpenTopoMap contributors'
      },
      satellite: {
        name: 'Satellite',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: '© Esri'
      },
      dark: {
        name: 'Dark',
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        attribution: '© CartoDB'
      }
    };
  }

  /**
   * Initialize the map
   */
  async initialize() {
    try {
      // Check if Leaflet is available
      if (typeof L === 'undefined') {
        throw new Error('Leaflet library is required. Please include Leaflet before MapifyOS SDK.');
      }

      // Create map instance
      this.map = L.map(this.containerId).setView(this.options.center, this.options.zoom);

      // Add initial layer
      this.setLayer(this.options.layer);

      // Add click handler for place details
      this.map.on('click', async (e) => {
        await this.handleMapClick(e);
      });

      // Add layer control if enabled
      if (this.options.enableLayerControl) {
        this.addLayerControl();
      }

      // Emit ready event
      this.emit('ready', { map: this.map });

    } catch (error) {
      console.error('Map initialization error:', error);
      throw error;
    }
  }

  /**
   * Handle map click events
   * @param {Object} e - Leaflet click event
   */
  async handleMapClick(e) {
    const { lat, lng } = e.latlng;

    // Show loading popup
    const loadingPopup = L.popup()
      .setLatLng([lat, lng])
      .setContent(this.popupUI.createLoadingContent())
      .openOn(this.map);

    try {
      // Get place details
      const placeData = await this.apiManager.getPlaceDetails(lat, lng);
      
      // Process and format the data
      const formattedData = this.formatPlaceData(placeData, lat, lng);
      
      // Update popup with actual content
      const content = this.popupUI.createPopupContent(formattedData);
      loadingPopup.setContent(content);

      // Emit place click event
      this.emit('placeClick', { coordinates: { lat, lng }, data: formattedData });

    } catch (error) {
      console.error('Error handling map click:', error);
      loadingPopup.setContent(this.popupUI.createErrorContent());
    }
  }

  /**
   * Format place data from API responses
   * @param {Object} placeData - Raw place data from APIs
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Object} Formatted place data
   */
  formatPlaceData(placeData, lat, lng) {
    const { nominatim, overpass } = placeData;
    const tags = overpass?.tags || {};

    return {
      name: tags.name || nominatim?.name || nominatim?.display_name?.split(',')[0] || 'Unknown Location',
      address: nominatim?.display_name || 'Address not available',
      type: this.formatCategory(tags),
      phone: tags.phone || tags['contact:phone'] || 'Not available',
      website: tags.website || tags['contact:website'] || tags.url || null,
      hours: tags.opening_hours || 'Not available',
      coordinates: { lat, lng }
    };
  }

  /**
   * Format category/type from tags
   * @param {Object} tags - OSM tags
   * @returns {string} Formatted category
   */
  formatCategory(tags) {
    if (!tags) return 'Location';
    
    const categoryMap = {
      amenity: tags.amenity,
      shop: tags.shop,
      building: tags.building,
      leisure: tags.leisure,
      tourism: tags.tourism,
      highway: tags.highway,
      office: tags.office,
      craft: tags.craft
    };

    for (const [key, value] of Object.entries(categoryMap)) {
      if (value) {
        return value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      }
    }
    return 'Location';
  }

  /**
   * Search for places
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Search results
   */
  async search(query, options = {}) {
    try {
      const center = options.center || this.map.getCenter();
      const radius = options.radius || 3000;

      // Determine search type from query
      const type = this.parseSearchQuery(query);

      // Use backend API for search
      const results = await this.apiManager.searchPlaces(this.options.apiKey, {
        lat: center.lat,
        lng: center.lng,
        type: type,
        radius: radius
      });

      // Clear existing search markers
      this.clearSearchMarkers();

      // Add markers for results
      results.forEach(result => {
        if (result.lat && result.lng) {
          const marker = L.marker([result.lat, result.lng])
            .addTo(this.map)
            .bindPopup(this.popupUI.createSearchResultPopup(result));
          
          this.markers.push(marker);
        }
      });

      // Fit map to show all results
      if (results.length > 0) {
        const group = new L.featureGroup(this.markers);
        this.map.fitBounds(group.getBounds().pad(0.1));
      }

      // Emit search event
      this.emit('search', { query, results });

      return results;

    } catch (error) {
      console.error('Search error:', error);
      this.emit('searchError', { query, error });
      return [];
    }
  }

  /**
   * Parse search query to determine POI type
   * @param {string} query - Search query
   * @returns {string} POI type
   */
  parseSearchQuery(query) {
    const q = query.toLowerCase();
    
    if (q.includes('hospital')) return 'hospital';
    if (q.includes('pharmacy')) return 'pharmacy';
    if (q.includes('clinic')) return 'clinic';
    if (q.includes('restaurant')) return 'restaurant';
    if (q.includes('gas') || q.includes('fuel')) return 'fuel';
    if (q.includes('bank')) return 'bank';
    if (q.includes('school')) return 'school';
    if (q.includes('hotel')) return 'hotel';
    if (q.includes('shop') || q.includes('store')) return 'shop';
    
    return 'amenity';
  }

  /**
   * Clear search markers
   */
  clearSearchMarkers() {
    this.markers.forEach(marker => {
      this.map.removeLayer(marker);
    });
    this.markers = [];
  }

  /**
   * Set map layer
   * @param {string} layerName - Layer name
   */
  setLayer(layerName) {
    if (!this.layers[layerName]) {
      console.warn(`Layer '${layerName}' not found, using 'plain'`);
      layerName = 'plain';
    }

    // Remove current layer
    if (this.currentLayer) {
      this.map.removeLayer(this.currentLayer);
    }

    // Add new layer
    const layerConfig = this.layers[layerName];
    this.currentLayer = L.tileLayer(layerConfig.url, {
      attribution: layerConfig.attribution
    }).addTo(this.map);

    // Emit layer change event
    this.emit('layerChange', { layer: layerName });
  }

  /**
   * Add layer control
   */
  addLayerControl() {
    const baseLayers = {};
    
    Object.entries(this.layers).forEach(([key, config]) => {
      baseLayers[config.name] = L.tileLayer(config.url, {
        attribution: config.attribution
      });
    });

    L.control.layers(baseLayers).addTo(this.map);
  }

  /**
   * Set map view
   * @param {Array} center - [lat, lng]
   * @param {number} zoom - Zoom level
   */
  setView(center, zoom) {
    this.map.setView(center, zoom);
    this.emit('viewChange', { center, zoom });
  }

  /**
   * Show popup at coordinates
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {string} content - Popup content HTML
   */
  showPopup(lat, lng, content) {
    L.popup()
      .setLatLng([lat, lng])
      .setContent(content)
      .openOn(this.map);
  }

  /**
   * Get Leaflet map instance
   * @returns {Object} Leaflet map
   */
  getLeafletMap() {
    return this.map;
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for '${event}':`, error);
        }
      });
    }
  }

  /**
   * Destroy map instance
   */
  destroy() {
    if (this.map) {
      this.clearSearchMarkers();
      this.map.remove();
      this.map = null;
    }
    this.eventListeners.clear();
  }
}
