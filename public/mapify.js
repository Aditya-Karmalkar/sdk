var MapifyOS = (function () {
  'use strict';

  /**
   * API Manager - Handles API key verification and external API calls
   */
  class ApiManager {
    constructor() {
      // Firebase Functions URL for mapifyos project
      this.baseUrl = 'https://us-central1-mapifyos.cloudfunctions.net';
    }

    /**
     * Verify API key with backend
     * @param {string} apiKey - API key to verify
     * @returns {Promise<boolean>} True if valid, false otherwise
     */
    async verifyApiKey(apiKey) {
      try {
        const response = await fetch(`${this.baseUrl}/verify?key=${apiKey}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          return false;
        }

        const data = await response.json();
        return data.valid === true;

      } catch (error) {
        console.error('API key verification failed:', error);
        return false;
      }
    }

    /**
     * Search for places using the backend API
     * @param {string} apiKey - API key
     * @param {Object} params - Search parameters
     * @returns {Promise<Array>} Search results
     */
    async searchPlaces(apiKey, params) {
      try {
        const { lat, lng, type = 'hospital', radius = 3000 } = params;
        
        const url = new URL(`${this.baseUrl}/search`);
        url.searchParams.append('lat', lat);
        url.searchParams.append('lon', lng);
        url.searchParams.append('type', type);
        url.searchParams.append('radius', radius);

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'X-API-Key': apiKey,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Search API error: ${response.status}`);
        }

        const data = await response.json();
        return data.results || [];

      } catch (error) {
        console.error('Search API error:', error);
        return [];
      }
    }

    /**
     * Get place details from Nominatim and Overpass APIs
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

        return {
          nominatim: nominatimData,
          overpass: overpassData.elements?.[0] || null
        };

      } catch (error) {
        console.error('Error fetching place details:', error);
        return {
          nominatim: null,
          overpass: null
        };
      }
    }
  }

  /**
   * Popup UI - Handles popup content creation and styling
   */
  class PopupUI {
    constructor() {
      this.defaultStyles = `
      .mapify-popup {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        padding: 16px;
        min-width: 250px;
        max-width: 320px;
      }
      .mapify-popup h3 {
        margin: 0 0 8px 0;
        font-size: 18px;
        font-weight: 600;
        color: #1f2937;
        line-height: 1.3;
      }
      .mapify-popup .category {
        display: inline-block;
        background: #dbeafe;
        color: #1e40af;
        font-size: 12px;
        font-weight: 500;
        padding: 4px 8px;
        border-radius: 12px;
        margin-bottom: 12px;
      }
      .mapify-popup .address {
        color: #6b7280;
        font-size: 14px;
        line-height: 1.4;
        margin-bottom: 12px;
      }
      .mapify-popup .contact-info {
        margin-bottom: 12px;
      }
      .mapify-popup .contact-item {
        display: flex;
        align-items: center;
        margin-bottom: 6px;
        font-size: 14px;
      }
      .mapify-popup .contact-icon {
        width: 16px;
        height: 16px;
        margin-right: 8px;
        color: #6b7280;
      }
      .mapify-popup .contact-link {
        color: #2563eb;
        text-decoration: none;
      }
      .mapify-popup .contact-link:hover {
        text-decoration: underline;
      }
      .mapify-popup .copy-button {
        width: 100%;
        background: #f3f4f6;
        border: none;
        color: #374151;
        font-size: 14px;
        font-weight: 500;
        padding: 10px 12px;
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.2s;
        margin-top: 12px;
        border-top: 1px solid #e5e7eb;
        padding-top: 12px;
      }
      .mapify-popup .copy-button:hover {
        background: #e5e7eb;
      }
      .mapify-popup .copy-button.copied {
        background: #dcfce7;
        color: #166534;
      }
      .mapify-popup .copy-icon {
        width: 16px;
        height: 16px;
        margin-right: 6px;
      }
      .mapify-loading {
        display: flex;
        align-items: center;
        padding: 16px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .mapify-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid #e5e7eb;
        border-top: 2px solid #2563eb;
        border-radius: 50%;
        animation: mapify-spin 1s linear infinite;
        margin-right: 8px;
      }
      @keyframes mapify-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .mapify-error {
        padding: 16px;
        color: #dc2626;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        text-align: center;
      }
    `;
      
      this.injectStyles();
    }

    /**
     * Inject CSS styles into the document
     */
    injectStyles() {
      if (!document.getElementById('mapify-popup-styles')) {
        const style = document.createElement('style');
        style.id = 'mapify-popup-styles';
        style.textContent = this.defaultStyles;
        document.head.appendChild(style);
      }
    }

    /**
     * Create popup content for place details
     * @param {Object} data - Place data
     * @returns {string} HTML content
     */
    createPopupContent(data) {
      const {
        name = 'Unknown Location',
        address = 'Address not available',
        type = 'Location',
        phone,
        website,
        hours
      } = data;

      // Build copyable address
      const copyableAddress = address.replace(/'/g, "\\'");

      let content = `
      <div class="mapify-popup">
        <h3>${this.escapeHtml(name)}</h3>
        ${type !== 'Location' ? `<div class="category">${this.escapeHtml(type)}</div>` : ''}
        <div class="address">${this.escapeHtml(address)}</div>
        <div class="contact-info">
    `;

      // Add phone if available
      if (phone && phone !== 'Not available') {
        content += `
        <div class="contact-item">
          <svg class="contact-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
          </svg>
          <a href="tel:${phone}" class="contact-link">${this.escapeHtml(phone)}</a>
        </div>
      `;
      }

      // Add website if available
      if (website) {
        const displayUrl = website.replace(/^https?:\/\//, '').replace(/\/$/, '');
        content += `
        <div class="contact-item">
          <svg class="contact-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"></path>
          </svg>
          <a href="${website}" target="_blank" class="contact-link">${this.escapeHtml(displayUrl)}</a>
        </div>
      `;
      }

      // Add hours if available
      if (hours && hours !== 'Not available') {
        content += `
        <div class="contact-item">
          <svg class="contact-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span>${this.escapeHtml(hours)}</span>
        </div>
      `;
      }

      content += `
        </div>
        <button class="copy-button" onclick="this.copyAddress('${copyableAddress}', this)">
          <svg class="copy-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
          </svg>
          Copy Address
        </button>
      </div>
    `;

      return content;
    }

    /**
     * Create popup content for search results
     * @param {Object} result - Search result data
     * @returns {string} HTML content
     */
    createSearchResultPopup(result) {
      return this.createPopupContent({
        name: result.name,
        address: result.address || 'Address not available',
        type: result.type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        phone: result.phone,
        website: result.website,
        hours: result.opening_hours
      });
    }

    /**
     * Create loading popup content
     * @returns {string} HTML content
     */
    createLoadingContent() {
      return `
      <div class="mapify-loading">
        <div class="mapify-spinner"></div>
        <span>Loading place information...</span>
      </div>
    `;
    }

    /**
     * Create error popup content
     * @returns {string} HTML content
     */
    createErrorContent() {
      return `
      <div class="mapify-error">
        <p>Unable to load place information</p>
      </div>
    `;
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
      if (typeof text !== 'string') return '';
      
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  }

  // Add global copy function for popup buttons
  if (typeof window !== 'undefined') {
    window.copyAddress = function(address, button) {
      navigator.clipboard.writeText(address).then(() => {
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        button.classList.add('copied');
        
        setTimeout(() => {
          button.textContent = originalText;
          button.classList.remove('copied');
        }, 2000);
      }).catch(err => {
        console.error('Failed to copy address:', err);
      });
    };
  }

  /**
   * Map Manager - Handles Leaflet map initialization and interactions
   */
  class MapManager {
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

  return mapifyOS;

})();
