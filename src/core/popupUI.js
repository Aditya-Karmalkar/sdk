/**
 * Popup UI - Handles popup content creation and styling
 */
export class PopupUI {
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
