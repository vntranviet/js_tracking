/**
 * @version PRIORITY_OPTIMIZED v1.0
 * Optimized for speed and proper execution priority
 */

// ================================
// PRIORITY 1: CLICK ID (CRITICAL)
// ================================

(function() {
  'use strict';
  
  // FASTEST: Skip if already exists
  if (window.CLICK_ID) return;
  
  try {
      const url = new URL(location.href);
      const existing = url.searchParams.get('click_id');
      
      if (existing) {
          window.CLICK_ID = existing;
          return;
      }
      
      // OPTIMIZED: Single date object, enhanced randomness
      const now = new Date();
      const timestamp = now.getTime();
      const date = now.getFullYear().toString().slice(-2) + 
                  (now.getMonth() + 1).toString().padStart(2, '0') + 
                  now.getDate().toString().padStart(2, '0');
      const time = now.getHours().toString().padStart(2, '0') + 
                  now.getMinutes().toString().padStart(2, '0') + 
                  now.getSeconds().toString().padStart(2, '0');
      
      // ENHANCED: Better uniqueness (8 chars vs 3)
      const random = Math.random().toString(36).substr(2, 6) + 
                    (timestamp % 1000).toString(36);
      
      const clickId = `clickid${date}-${time}${random}`;
      
      // FAST: Silent update
      url.searchParams.set('click_id', clickId);
      url.searchParams.set('utm_content', clickId);
      
      if (history.replaceState) {
          history.replaceState(null, '', url.toString());
      }
      
      window.CLICK_ID = clickId;
      
  } catch (e) {
      // ULTRA-FAST fallback
      window.CLICK_ID = 'clickid' + Date.now().toString(36) + Math.random().toString(36).substr(2, 3);
  }
})();

// ================================
// PRIORITY 2: TRACKING (ASYNC)
// ================================
(function() {
  'use strict';
  
  // DEFER: Don't block main thread
  setTimeout(function() {
      
      if (!window.TRACKING_URL) return;
      
      // CACHED: Parse params once
      var params = {};
      try {
          var search = location.search.substring(1);
          if (search) {
              search.split('&').forEach(function(pair) {
                  var parts = pair.split('=');
                  if (parts[0]) {
                      params[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1] || '');
                  }
              });
          }
      } catch (e) {
          params = {};
      }
      
      // FAST: Direct parameter extraction
      var trackingData = [];
      
      // Core tracking params
      if (params.gclid) trackingData.push('gclid=' + encodeURIComponent(params.gclid));
      if (params.gbraid) trackingData.push('gbraid=' + encodeURIComponent(params.gbraid));
      if (params.fbclid) trackingData.push('fbclid=' + encodeURIComponent(params.fbclid));
      if (params.utm_content) trackingData.push('extclid=' + encodeURIComponent(params.utm_content));
      
      // UTM params
      if (params.utm_source) trackingData.push('traffic_source=' + encodeURIComponent(params.utm_source));
      if (params.utm_medium) trackingData.push('traffic_type=' + encodeURIComponent(params.utm_medium));
      if (params.utm_campaign) trackingData.push('campaign=' + encodeURIComponent(params.utm_campaign));
      
      // Device info (cached)
      var ua = navigator.userAgent;
      var device = /(tablet|ipad)/i.test(ua) ? 'tablet' : 
                  /mobile/i.test(ua) ? 'mobile' : 'desktop';
      trackingData.push('device=' + device);
      
      // Timestamp
      trackingData.push('ts=' + Date.now());
      
      // FAST: Single pixel request
      if (trackingData.length > 0) {
          var img = new Image();
          img.style.cssText = 'position:absolute!important;width:1px!important;height:1px!important;opacity:0!important;left:-9999px!important;';
          
          // TIMEOUT: Prevent hanging
          var timeout = setTimeout(function() {
              img.src = '';
          }, 2000);
          
          img.onload = img.onerror = function() {
              clearTimeout(timeout);
              // CLEANUP: Remove after 3 seconds
              setTimeout(function() {
                  try {
                      if (img.parentNode) img.parentNode.removeChild(img);
                  } catch (e) {}
              }, 3000);
          };
          
          // SAFE: URL construction
          try {
              var separator = window.TRACKING_URL.indexOf('?') > -1 ? '&' : '?';
              img.src = window.TRACKING_URL + separator + trackingData.join('&');
              
              if (document.body) {
                  document.body.appendChild(img);
              }
          } catch (e) {
              clearTimeout(timeout);
          }
      }
      
  }, 0); // Execute on next tick
  
})();

// ================================
// PRIORITY 3: PARAMETER FORWARDING (DEFERRED)
// ================================
(function() {
  'use strict';
  
  // CACHED: Get params once
  var urlParams = new URLSearchParams(location.search);
  if (urlParams.toString() === '') return;
  
  function updateLinks() {
      // OPTIMIZED: Use more specific selector
      var links = document.querySelectorAll('a[href^="http"], a[href^="/"], a[href^="./"]');
      
      for (var i = 0; i < links.length; i++) {
          var link = links[i];
          
          try {
              // FAST: Skip already processed
              if (link.dataset.paramsAdded) continue;
              
              var url = new URL(link.href, location.origin);
              
              // FILTER: Only same domain or specific domains
              if (url.hostname === location.hostname || 
                  url.hostname.includes('ladipage') ||
                  url.hostname.includes('clickbank')) {
                  
                  // FAST: Bulk parameter addition
                  var hasChanges = false;
                  urlParams.forEach(function(value, key) {
                      if (!url.searchParams.has(key)) {
                          url.searchParams.append(key, value);
                          hasChanges = true;
                      }
                  });
                  
                  if (hasChanges) {
                      link.href = url.toString();
                  }
                  
                  // MARK: Prevent reprocessing
                  link.dataset.paramsAdded = 'true';
              }
          } catch (e) {
              // Skip invalid URLs
          }
      }
  }
  
  // DEFERRED: Don't block initial load
  if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
          setTimeout(updateLinks, 100);
      });
  } else {
      setTimeout(updateLinks, 100);
  }
  
  // THROTTLED: MutationObserver with performance optimization
  var throttleTimer;
  var observer = new MutationObserver(function(mutations) {
      // PERFORMANCE: Only check if links were added
      var hasNewLinks = false;
      for (var i = 0; i < mutations.length; i++) {
          var mutation = mutations[i];
          if (mutation.type === 'childList') {
              for (var j = 0; j < mutation.addedNodes.length; j++) {
                  var node = mutation.addedNodes[j];
                  if (node.nodeType === 1 && 
                      (node.tagName === 'A' || node.querySelector('a'))) {
                      hasNewLinks = true;
                      break;
                  }
              }
          }
          if (hasNewLinks) break;
      }
      
      if (hasNewLinks && !throttleTimer) {
          throttleTimer = setTimeout(function() {
              updateLinks();
              throttleTimer = null;
          }, 500); // Throttled to 500ms
      }
  });
  
  // START: Observe after initial load
  setTimeout(function() {
      if (document.body) {
          observer.observe(document.body, {
              childList: true,
              subtree: true
          });
      }
  }, 1000); // Start observing after 1 second
  
})();

// ================================
// PERFORMANCE MONITORING (DEBUG)
// ================================
if (typeof console !== 'undefined' && console.time) {
  console.time('TrackingSystem');
  setTimeout(function() {
      console.timeEnd('TrackingSystem');
      console.log('CLICK_ID:', window.CLICK_ID);
  }, 100);
}
