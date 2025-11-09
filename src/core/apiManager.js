/**
 * API Manager - Handles API key verification and external API calls
 */
export class ApiManager {
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
