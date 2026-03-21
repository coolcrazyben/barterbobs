// assets/global.js — BarterBobs theme JS foundation
// ES module — loaded via <script type="module" defer> in theme.liquid
// No external dependencies. No build step. Served from Shopify CDN.

// ─── Pub / Sub ──────────────────────────────────────────────────────────────
// Cross-component messaging via native CustomEvent on document.
// No global state objects. Components dispatch; other components listen.

/**
 * Dispatch a named event on document with optional detail payload.
 * @param {string} eventName
 * @param {object} [data]
 */
const publish = (eventName, data = {}) => {
  document.dispatchEvent(
    new CustomEvent(eventName, { bubbles: false, cancelable: false, detail: data })
  );
};

/**
 * Subscribe to a named event on document.
 * @param {string} eventName
 * @param {function} handler
 * @returns {function} Unsubscribe function — call in onSectionUnload to clean up
 */
const subscribe = (eventName, handler) => {
  document.addEventListener(eventName, handler);
  return () => document.removeEventListener(eventName, handler);
};

// ─── Focus Trap ─────────────────────────────────────────────────────────────
// Used by nav drawer (Plan 01-03) and cart drawer (Phase 3).

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Trap keyboard focus within a container element.
 * Returns a cleanup function that removes the keydown listener.
 *
 * @param {HTMLElement} container - Element to trap focus within
 * @param {HTMLElement} [elementToFocus] - Element to focus on activation (defaults to first focusable)
 * @returns {function} Cleanup function
 */
const trapFocus = (container, elementToFocus) => {
  const focusable = Array.from(container.querySelectorAll(FOCUSABLE_SELECTORS));
  if (!focusable.length) return () => {};

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  const handleKeydown = (event) => {
    if (event.key !== 'Tab') return;
    if (event.shiftKey) {
      if (document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  };

  container.addEventListener('keydown', handleKeydown);
  (elementToFocus || first).focus();

  return () => container.removeEventListener('keydown', handleKeydown);
};

// ─── ShopifySection Base Class ───────────────────────────────────────────────
// All interactive section web components extend ShopifySection.
// Provides Theme Editor section lifecycle management automatically.
// Subclasses override onSectionLoad() and onSectionUnload() only.

class ShopifySection extends HTMLElement {
  constructor() {
    super();
    // Bind so we can remove the exact same function reference later
    this._onSectionLoadHandler = this._onSectionLoadHandler.bind(this);
    this._onSectionUnloadHandler = this._onSectionUnloadHandler.bind(this);
  }

  connectedCallback() {
    document.addEventListener('shopify:section:load', this._onSectionLoadHandler);
    document.addEventListener('shopify:section:unload', this._onSectionUnloadHandler);
    // Run initialization on first connect
    this.onSectionLoad();
  }

  disconnectedCallback() {
    document.removeEventListener('shopify:section:load', this._onSectionLoadHandler);
    document.removeEventListener('shopify:section:unload', this._onSectionUnloadHandler);
    this.onSectionUnload();
  }

  _onSectionLoadHandler(event) {
    // Only respond if THIS element is inside the section that just loaded
    if (event.target.contains(this)) this.onSectionLoad();
  }

  _onSectionUnloadHandler(event) {
    // Only respond if THIS element is inside the section that just unloaded
    if (event.target.contains(this)) this.onSectionUnload();
  }

  /**
   * Called on first connect and whenever the Theme Editor reloads this section.
   * Override in subclasses to initialize event listeners and query DOM.
   */
  onSectionLoad() {}

  /**
   * Called when the Theme Editor unloads (removes) this section.
   * Override in subclasses to clean up document/window listeners only.
   * Listeners attached to elements within `this` are garbage-collected automatically.
   */
  onSectionUnload() {}
}

// ─── CartCountBubble ─────────────────────────────────────────────────────────
// Listens for cart:updated events and refreshes the item count badge.
// Used in: sections/header.liquid
// Phase 1 scope: badge count only. Cart drawer (Phase 3) dispatches cart:updated.

class CartCountBubble extends ShopifySection {
  onSectionLoad() {
    this.countEl = this.querySelector('[data-cart-count]');
    // Subscribe and store unsubscribe function for cleanup
    this._unsubCart = subscribe('cart:updated', (event) => {
      this.updateCount(event.detail.itemCount);
    });
    // Fetch current count on load so badge reflects server state
    this.fetchCartCount();
  }

  onSectionUnload() {
    if (this._unsubCart) this._unsubCart();
  }

  async fetchCartCount() {
    try {
      const response = await fetch('/cart.js', {
        headers: { 'Content-Type': 'application/json' },
      });
      const cart = await response.json();
      this.updateCount(cart.item_count);
    } catch {
      // Silent fail — badge stays at last known value
    }
  }

  updateCount(count) {
    if (!this.countEl) return;
    this.countEl.textContent = count;
    this.countEl.hidden = count === 0;
    this.countEl.setAttribute('aria-label', `${count} items in cart`);
  }
}

customElements.define('cart-count-bubble', CartCountBubble);

// ─── Exports (for use by section-specific JS modules) ─────────────────────
// Section JS files loaded in their own <script type="module"> tags can import
// these from global.js using dynamic import() if needed, but the primary
// pattern is for section components to extend ShopifySection directly.
// These are attached to window for cross-module access without import chains.
window.BarterBobs = window.BarterBobs || {};
window.BarterBobs.publish = publish;
window.BarterBobs.subscribe = subscribe;
window.BarterBobs.trapFocus = trapFocus;
window.BarterBobs.ShopifySection = ShopifySection;
