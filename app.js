/* ============================================
   SWAPNEST PARCEL - MAIN APP JAVASCRIPT
   ============================================ */

// ============================================
// DARK / LIGHT MODE TOGGLE
// ============================================

(function initTheme() {
  const saved = localStorage.getItem('snp_theme');
  if (saved === 'dark') {
    document.body.classList.add('dark-mode');
  }
})();

document.addEventListener('DOMContentLoaded', function () {
  const themeToggle = document.getElementById('themeToggle');
  if (!themeToggle) return;

  const iconDark = themeToggle.querySelector('.theme-icon-dark');
  const iconLight = themeToggle.querySelector('.theme-icon-light');

  function updateThemeIcons() {
    const isDark = document.body.classList.contains('dark-mode');
    iconDark.classList.toggle('hidden', isDark);
    iconLight.classList.toggle('hidden', !isDark);
  }

  updateThemeIcons();

  themeToggle.addEventListener('click', function () {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('snp_theme', isDark ? 'dark' : 'light');
    updateThemeIcons();
  });
});



// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString();
}

function formatDateTime(dateString) {
  return new Date(dateString).toLocaleString();
}

function getStatusLabel(status) {
  const labels = {
    'pending': 'Pending',
    'picked-up': 'Picked Up',
    'in-transit': 'In Transit',
    'out-for-delivery': 'Out for Delivery',
    'delivered': 'Delivered',
    'on-hold': 'On Hold'
  };
  return labels[status] || status;
}

function getStatusClass(status) {
  return `badge badge-${status}`;
}

// ============================================
// NAVBAR SCROLL EFFECT
// ============================================

const navbar = document.getElementById('navbar');

window.addEventListener('scroll', function () {
  if (window.scrollY > 100) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// ============================================
// MOBILE MENU
// ============================================

const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');
const menuIcon = document.querySelector('.menu-icon');
const closeIcon = document.querySelector('.close-icon');

if (mobileMenuBtn) {
  mobileMenuBtn.addEventListener('click', function () {
    mobileMenu.classList.toggle('hidden');
    menuIcon.classList.toggle('hidden');
    closeIcon.classList.toggle('hidden');
  });
}

function closeMobileMenu() {
  mobileMenu.classList.add('hidden');
  menuIcon.classList.remove('hidden');
  closeIcon.classList.add('hidden');
}

// ============================================
// FAQ ACCORDION
// ============================================

const faqList = document.getElementById('faqList');

if (faqList) {
  faqList.addEventListener('click', function (e) {
    const question = e.target.closest('.faq-question');
    if (question) {
      const item = question.parentElement;
      const isActive = item.classList.contains('active');

      // Close all items
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));

      // Open clicked item if it wasn't active
      if (!isActive) {
        item.classList.add('active');
      }
    }
  });
}

// ============================================
// TRACKING FUNCTIONALITY
// ============================================

const trackingForm = document.getElementById('trackingForm');
const trackingInput = document.getElementById('trackingInput');
const trackingError = document.getElementById('trackingError');
const errorMessage = document.getElementById('errorMessage');
const trackingResult = document.getElementById('trackingResult');

let trackingMap = null;

if (trackingForm) {
  trackingForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const trackingCode = trackingInput.value.trim().toUpperCase();
    const submitBtn = trackingForm.querySelector('button[type="submit"]');

    // Hide previous results/errors
    trackingError.classList.add('hidden');
    trackingResult.classList.add('hidden');

    if (!trackingCode) {
      showTrackingError('Please enter a tracking code.');
      return;
    }

    // Set loading state
    const originalBtnText = submitBtn.textContent;
    submitBtn.classList.add('btn-loading');
    submitBtn.disabled = true;

    // Search for shipment from Supabase
    let shipment = null;

    try {
      shipment = await fetchShipmentByTrackingCode(trackingCode);
    } catch (error) {
      console.error('Error fetching shipment from Supabase:', error);
      showTrackingError('Error connecting to database. Please try again later.');
      // Reset loading state on error
      submitBtn.classList.remove('btn-loading');
      submitBtn.disabled = false;
      return;
    }

    if (!shipment) {
      showTrackingError('No shipment found with this tracking code. Please check and try again.');
      // Reset loading state on error
      submitBtn.classList.remove('btn-loading');
      submitBtn.disabled = false;
      return;
    }

    // Display tracking result
    displayTrackingResult(shipment);

    // Reset loading state AFTER result is displayed
    // Small timeout to ensure DOM update is visible before stopping spinner if it's too fast
    setTimeout(() => {
      submitBtn.classList.remove('btn-loading');
      submitBtn.disabled = false;
    }, 500);
  });
}

function showTrackingError(message) {
  errorMessage.textContent = message;
  trackingError.classList.remove('hidden');
}

function displayTrackingResult(shipment) {
  const currentLocation = getCurrentShipmentLocation(shipment);
  // Use receiver address as destination if available, otherwise fall back to destination country
  const destinationDisplay = shipment.receiverAddress || shipment.destination;
  const originDisplay = shipment.shipperAddress || shipment.origin;

  trackingResult.innerHTML = `
    <!-- Map Section -->
    <div class="tracking-map-section" style="margin-bottom: 1.5rem; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #e5e7eb;">
      <div class="map-container" id="trackingMapContainer">
        <div id="trackingMap" style="height: 350px; width: 100%; z-index: 1;"></div>
      </div>
    </div>
    
    <!-- Special Instructions Notice - Yellow Alert (Only for special instructions) -->
    ${shipment.specialInstructions ? `
      <div class="special-instructions-notice" style="margin-bottom: 1.5rem; padding: 1rem 1.25rem; background: linear-gradient(135deg, #fef3c7, #fef9c3); border-radius: 12px; border: 1px solid #f59e0b; box-shadow: 0 2px 8px rgba(245, 158, 11, 0.15);">
        <div style="display: flex; align-items: flex-start; gap: 0.75rem;">
          <svg viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2" style="width: 1.5rem; height: 1.5rem; flex-shrink: 0; margin-top: 2px;">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          <div>
            <p style="font-size: 0.75rem; font-weight: 700; color: #92400e; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem;">Special Instructions</p>
            <p style="font-size: 0.9375rem; color: #78350f; line-height: 1.5; margin: 0;">${shipment.specialInstructions}</p>
          </div>
        </div>
      </div>
    ` : ''}
    
    <!-- Tracking Header with Status -->
    <div class="tracking-header-section" style="background: linear-gradient(135deg, #0A1628, #1a2f4c); border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; color: white; box-shadow: 0 4px 20px rgba(10,22,40,0.15);">
      <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 1rem;">
        <div>
          <p style="font-size: 0.75rem; color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.25rem;">Tracking Code</p>
          <p style="font-size: 1.5rem; font-family: monospace; font-weight: 700; color: #00D4FF; margin: 0; word-break: break-all; letter-spacing: 1px;">${shipment.trackingCode}</p>
        </div>
        <span class="${getStatusClass(shipment.currentStatus)}" style="font-size: 0.875rem; padding: 0.5rem 1rem; border-radius: 20px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">${getStatusLabel(shipment.currentStatus)}</span>
      </div>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.1);">
        <div>
          <p style="font-size: 0.75rem; color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem;">Origin</p>
          <p style="font-weight: 600; color: white; font-size: 1rem; margin: 0;">${originDisplay || 'N/A'}</p>
        </div>
        <div>
          <p style="font-size: 0.75rem; color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem;">Destination</p>
          <p style="font-weight: 600; color: white; font-size: 1rem; margin: 0;">${destinationDisplay || 'N/A'}</p>
        </div>
        ${currentLocation ? `
          <div>
            <p style="font-size: 0.75rem; color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem;">Current Location</p>
            <p style="font-weight: 600; color: #22c55e; font-size: 1rem; margin: 0;">📍 ${currentLocation}</p>
          </div>
        ` : ''}
      </div>
    </div>
    
    <!-- Shipment Details Section -->
    ${(shipment.shipmentType || shipment.carrier || shipment.packageInfo?.weight) ? `
    <div class="shipment-details-section" style="background: white; border-radius: 12px; border: 1px solid #e5e7eb; padding: 1.5rem; margin-bottom: 1.5rem; box-shadow: 0 4px 15px rgba(0,0,0,0.03);">
      <h3 style="font-size: 1rem; font-weight: 700; color: #0A1628; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; margin-top: 0;">
        <svg viewBox="0 0 24 24" fill="none" stroke="#00D4FF" stroke-width="2" style="width: 1.25rem; height: 1.25rem;">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
          <line x1="12" y1="22.08" x2="12" y2="12"></line>
        </svg>
        Shipment Details
      </h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; font-size: 0.9375rem; color: #4b5563;">
        ${shipment.carrier ? `<div><p style="font-size: 0.75rem; color: #9ca3af; text-transform: uppercase; margin-bottom: 0.25rem;">Carrier</p><strong style="color: #0A1628;">${shipment.carrier}</strong></div>` : ''}
        ${shipment.shipmentType ? `<div><p style="font-size: 0.75rem; color: #9ca3af; text-transform: uppercase; margin-bottom: 0.25rem;">Service Type</p><strong style="color: #0A1628;">${shipment.shipmentType}</strong></div>` : ''}
        ${shipment.packageInfo?.weight ? `<div><p style="font-size: 0.75rem; color: #9ca3af; text-transform: uppercase; margin-bottom: 0.25rem;">Weight</p><strong style="color: #0A1628;">${shipment.packageInfo.weight} kg</strong></div>` : ''}
        ${shipment.estimatedDelivery ? `<div><p style="font-size: 0.75rem; color: #9ca3af; text-transform: uppercase; margin-bottom: 0.25rem;">Est. Delivery</p><strong style="color: #0A1628;">${formatDate(shipment.estimatedDelivery)}</strong></div>` : ''}
      </div>
    </div>
    ` : ''}
    
    <!-- Timeline Section -->
    <div class="timeline-section" style="background: white; border-radius: 12px; border: 1px solid #e5e7eb; padding: 1.5rem; box-shadow: 0 4px 15px rgba(0,0,0,0.03);">
      <h3 style="font-size: 1rem; font-weight: 700; color: #0A1628; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem; margin-top: 0;">
        <svg viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" style="width: 1.25rem; height: 1.25rem;">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        Tracking History
      </h3>
      <div class="timeline scrollable-timeline" style="max-height: 400px; overflow-y: auto; padding-right: 1rem;">
        ${renderTimeline(shipment)}
      </div>
    </div>
  `;

  trackingResult.classList.remove('hidden');

  // Initialize map after DOM render
  setTimeout(() => initTrackingMap(shipment), 100);
}

function getCurrentShipmentLocation(shipment) {
  if (!shipment.routeHistory || shipment.routeHistory.length === 0) {
    return shipment.origin;
  }
  return shipment.routeHistory[shipment.routeHistory.length - 1].location;
}

function renderTimeline(shipment) {
  if (!shipment.routeHistory || shipment.routeHistory.length === 0) {
    return `
      <div class="timeline-item">
        <div class="timeline-dot active"></div>
        <div class="timeline-content">
          <h4>${getStatusLabel('pending')}</h4>
          <p class="location">${shipment.origin}</p>
          <p class="description">Shipment created and ready for processing</p>
          <p class="time"><span>${formatDateTime(shipment.createdAt)}</span></p>
        </div>
      </div>
    `;
  }

  // Reverse to show most recent first
  const reversed = [...shipment.routeHistory].reverse();

  return reversed.map((point, index) => {
    const isCurrent = index === 0;
    return `
    <div class="timeline-item">
      <div class="timeline-marker ${isCurrent ? 'current' : 'past'}">
        ${isCurrent ? `
          <div style="background: #00D4FF; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 0 4px rgba(0, 212, 255, 0.2);">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" style="width: 18px; height: 18px;">
               <rect x="1" y="3" width="15" height="13"></rect>
               <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
               <circle cx="5.5" cy="18.5" r="2.5"></circle>
               <circle cx="18.5" cy="18.5" r="2.5"></circle>
            </svg>
          </div>
        ` : `
          <!-- No dot for past items -->
        `}
      </div>
      <div class="timeline-content">
        <h4>${getStatusLabel(point.status)}</h4>
        <p class="location">${point.location}</p>
        <p class="description">${point.description}</p>
        <p class="time"><span>${formatDateTime(point.timestamp)}</span></p>
      </div>
    </div>
  `}).join('');
}

function initTrackingMap(shipment) {
  const mapContainer = document.getElementById('trackingMap');
  if (!mapContainer || typeof L === 'undefined') return;

  // Clean up existing map
  if (trackingMap) {
    trackingMap.remove();
    trackingMap = null;
  }

  // Create map
  trackingMap = L.map('trackingMap').setView([20, 0], 2);

  // Add tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(trackingMap);

  // Collect points with coordinates
  const points = [];

  if (shipment.routeHistory && shipment.routeHistory.length > 0) {
    shipment.routeHistory.forEach((point, index) => {
      if (point.coordinates) {
        points.push([point.coordinates.lat, point.coordinates.lng]);

        const isLast = index === shipment.routeHistory.length - 1;
        const isFirst = index === 0;

        // Determine marker color
        // Marker Logic
        let markerHtml;
        let className = 'custom-marker';
        const iconSize = isLast ? [40, 40] : [16, 16];
        const iconAnchor = isLast ? [20, 20] : [8, 8];

        if (isLast) {
          // Current Location - Truck Icon (Green)
          markerHtml = `
            <div style="
              width: 40px; 
              height: 40px; 
              background: #22c55e; 
              border-radius: 50%; 
              border: 3px solid white;
              box-shadow: 0 4px 10px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0;
              padding: 0;
            ">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" style="width: 20px; height: 20px;">
                <rect x="1" y="3" width="15" height="13"></rect>
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                <circle cx="5.5" cy="18.5" r="2.5"></circle>
                <circle cx="18.5" cy="18.5" r="2.5"></circle>
              </svg>
            </div>
          `;
        } else {
          // Past Checkpoint - No Dot (Empty inner div or hidden)
          markerHtml = `
            <div style="
              width: 16px; 
              height: 16px; 
              display: none;
            "></div>
          `;
        }

        const markerIcon = L.divIcon({
          className: 'custom-map-marker', // Use custom class to reset defaults
          html: markerHtml,
          iconSize: iconSize,
          iconAnchor: iconAnchor
        });

        L.marker([point.coordinates.lat, point.coordinates.lng], { icon: markerIcon })
          .addTo(trackingMap)
          .bindPopup(`
            <div style="font-family: -apple-system, sans-serif;">
              <strong>${point.location}</strong><br>
              <span style="color: #6b7280; font-size: 0.875rem;">${getStatusLabel(point.status)}</span><br>
              <span style="color: #9ca3af; font-size: 0.75rem;">${formatDateTime(point.timestamp)}</span>
            </div>
          `);
      }
    });
  }

  // Draw route line
  if (points.length > 1) {
    L.polyline(points, {
      color: '#00D4FF',
      weight: 3,
      opacity: 0.7,
      dashArray: '10, 10'
    }).addTo(trackingMap);
  }

  // Fit bounds
  if (points.length > 0) {
    const bounds = L.latLngBounds(points);
    trackingMap.fitBounds(bounds, { padding: [50, 50] });
  }
}

// ============================================
// HERO ANIMATION
// The hero section now uses pure CSS animations
// for the truck scene (no JavaScript required)
// ============================================

// ============================================
// SMOOTH SCROLL FOR ANCHOR LINKS
// ============================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// ============================================
// CONTACT FORM HANDLING
// ============================================

const contactForm = document.getElementById('contactForm');

if (contactForm) {
  contactForm.addEventListener('submit', function (e) {
    e.preventDefault();

    // Simulate sending message
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;

    setTimeout(() => {
      // Clear form
      contactForm.reset();

      // Show success feedback
      submitBtn.textContent = 'Message Sent!';
      submitBtn.style.backgroundColor = '#22c55e'; // Green color

      // Revert button after 3 seconds
      setTimeout(() => {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        submitBtn.style.backgroundColor = ''; // Reset color
      }, 3000);

      alert('Thank you for your message! We will get back to you shortly.');
    }, 1500);
  });
}
