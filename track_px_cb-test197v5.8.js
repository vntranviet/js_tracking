/**
 * @version COMPLETE_OPTIMIZED v1.0 - ALL PARAMETERS PRESERVED
 * Tối ưu tốc độ + priority nhưng giữ nguyên tất cả tính năng
 */

// ================================
// PRIORITY 1: CLICK ID GENERATOR (UNCHANGED - PERFECT)
// ================================
(function() {
  if (window.CLICK_ID) return;
  
  try {
      const url = new URL(location.href);
      const existing = url.searchParams.get('click_id');
      
      if (existing) {
          window.CLICK_ID = existing;
          return;
      }
      
      const now = new Date();
      const date = now.getFullYear().toString().slice(-2) + 
                  (now.getMonth() + 1).toString().padStart(2, '0') + 
                  now.getDate().toString().padStart(2, '0');
      const time = now.getHours().toString().padStart(2, '0') + 
                  now.getMinutes().toString().padStart(2, '0') + 
                  now.getSeconds().toString().padStart(2, '0');
      const random = Math.random().toString(36).substr(2, 3);
      
      const clickId = `clickid${date}-${time}${random}`;
      
      url.searchParams.set('click_id', clickId);
      url.searchParams.set('utm_content', clickId);
      
      if (history.replaceState) {
          history.replaceState(null, '', url.toString());
      }
      
      window.CLICK_ID = clickId;
      
  } catch (e) {
      window.CLICK_ID = 'clickid' + Date.now().toString(36);
  }
})();

// ================================
// PRIORITY 2: TRACKING PIXEL SYSTEM (OPTIMIZED BUT COMPLETE)
// ================================
(function TrackingInit(window, document) {
  'use strict';

  // OPTIMIZATION: Execute on next tick to avoid blocking
  setTimeout(function() {
      
      var CONFIG = {
          TRACKING_URL: window.TRACKING_URL || '',
          TRACKING_PARAMS: ['gclid', 'gbraid', 'wbraid', 'fbclid', 'ttclid'],
          UTM_PARAMS: {
              'utm_source': 'traffic_source',
              'utm_medium': 'traffic_type', 
              'utm_campaign': 'campaign',
              'utm_term': 'creative',
              'utm_content': 'ad'
          },
          RETRY_INTERVAL: 30 * 60 * 1000,
          DATA_RETENTION: 7 * 24 * 60 * 60 * 1000,
          MAX_RETRIES: 2,
          PIXEL_TIMEOUT: 3000,
          RETRY_DELAY: 1000
      };

      var Utils = {
          isValidValue: function(value) {
              return value && typeof value === 'string' && value.trim().length > 0;
          },

          validateGclid: function(value) {
              if (!Utils.isValidValue(value)) return false;
              return /^[a-zA-Z0-9_-]{10,}$/.test(value.trim());
          },

          validateGbraid: function(value) {
              if (!Utils.isValidValue(value)) return false;
              return /^[a-zA-Z0-9_-]{15,}$/.test(value.trim());
          },

          validateWbraid: function(value) {
              if (!Utils.isValidValue(value)) return false;
              return /^[a-zA-Z0-9_-]{15,}$/.test(value.trim());
          },

          // OPTIMIZED: Cached parameter parsing
          getQueryParams: function() {
              if (Utils._cachedParams) return Utils._cachedParams;
              
              try {
                  var params = {};
                  var query = window.location.search.substring(1);
                  var pairs = query.split('&');
                  for (var i = 0; i < pairs.length; i++) {
                      var pair = pairs[i].split('=');
                      if (pair[0]) {
                          params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
                      }
                  }
                  Utils._cachedParams = params;
                  return params;
              } catch (e) {
                  return {};
              }
          },

          getFirstValidParam: function(params, paramList) {
              for (var i = 0; i < paramList.length; i++) {
                  var value = params[paramList[i]];
                  if (Utils.isValidValue(value)) return value;
              }
              return '';
          },

          sanitizeString: function(str) {
              if (!str) return '';
              return str
                  .toLowerCase()
                  .replace(/[^a-z0-9_]+/g, '_')
                  .replace(/^_+|_+$/g, '')
                  .replace(/_{2,}/g, '_');
          },

          generateUniqueId: function() {
              return 'px_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
          },

          getDeviceType: function() {
              var ua = navigator.userAgent;
              if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
                  return 'tablet';
              }
              if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
                  return 'mobile';
              }
              return 'desktop';
          },

          getBrowser: function() {
              var ua = navigator.userAgent;
              if (ua.indexOf('Chrome') > -1) return 'chrome';
              if (ua.indexOf('Firefox') > -1) return 'firefox';
              if (ua.indexOf('Safari') > -1) return 'safari';
              if (ua.indexOf('MSIE') > -1 || ua.indexOf('Trident') > -1) return 'ie';
              if (ua.indexOf('Edge') > -1) return 'edge';
              return 'other';
          },

          hashData: function(data) {
              var hash = 0;
              if (data.length === 0) return hash;
              for (var i = 0; i < data.length; i++) {
                  var char = data.charCodeAt(i);
                  hash = ((hash << 5) - hash) + char;
                  hash = hash & hash;
              }
              return hash.toString(36);
          },

          // OPTIMIZED: Better storage with fallbacks
          storeTrackingData: function(data) {
              try {
                  var stored = JSON.parse(localStorage.getItem('tracking_data') || '[]');
                  stored.push({
                      data: data,
                      timestamp: Date.now(),
                      sent: false,
                      retryCount: 0,
                      id: Utils.generateUniqueId()
                  });
                  
                  var now = Date.now();
                  stored = stored.filter(function(item) {
                      return now - item.timestamp < CONFIG.DATA_RETENTION;
                  }).slice(-50);
                  
                  localStorage.setItem('tracking_data', JSON.stringify(stored));
              } catch (e) {
                  // FALLBACK: Use sessionStorage
                  try {
                      var stored = JSON.parse(sessionStorage.getItem('tracking_data') || '[]');
                      stored.push({
                          data: data,
                          timestamp: Date.now(),
                          sent: false,
                          retryCount: 0,
                          id: Utils.generateUniqueId()
                      });
                      sessionStorage.setItem('tracking_data', JSON.stringify(stored.slice(-10)));
                  } catch (e2) {
                      // Continue silently
                  }
              }
          },

          sendStoredData: function() {
              try {
                  var stored = JSON.parse(localStorage.getItem('tracking_data') || '[]');
                  var updated = [];
                  
                  for (var i = 0; i < stored.length; i++) {
                      var item = stored[i];
                      
                      var shouldRetry = !item.sent && item.retryCount < CONFIG.MAX_RETRIES;
                      var canRetry = Date.now() - item.timestamp > CONFIG.RETRY_INTERVAL;
                      
                      if (shouldRetry && (item.retryCount === 0 || canRetry)) {
                          Utils.sendImagePixel(window.TRACKING_URL, item.data + '&retry=' + item.retryCount, function(success) {
                              if (success) {
                                  item.sent = true;
                                  item.sentTime = Date.now();
                              } else {
                                  item.retryCount++;
                                  item.lastRetry = Date.now();
                              }
                          });
                          
                          item.retryCount++;
                          item.lastRetry = Date.now();
                      }
                      
                      if (Date.now() - item.timestamp < CONFIG.DATA_RETENTION) {
                          updated.push(item);
                      }
                  }
                  
                  localStorage.setItem('tracking_data', JSON.stringify(updated));
              } catch (e) {
                  // Continue silently
              }
          },

          // ENHANCED: Safer and faster image pixel
          sendImagePixel: function(url, data, callback) {
              if (!url || typeof url !== 'string' || url.length === 0) {
                  if (callback) callback(false);
                  return;
              }

              var img = new Image();
              var completed = false;
              var timeout;
              
              img.style.cssText = 'position:absolute!important;width:1px!important;height:1px!important;opacity:0!important;visibility:hidden!important;pointer-events:none!important;left:-9999px!important;top:-9999px!important;z-index:-1!important;';
              img.alt = '';
              img.setAttribute('aria-hidden', 'true');
              
              timeout = setTimeout(function() {
                  if (!completed) {
                      completed = true;
                      if (callback) callback(false);
                  }
              }, CONFIG.PIXEL_TIMEOUT);
              
              img.onload = function() {
                  if (!completed) {
                      completed = true;
                      clearTimeout(timeout);
                      if (callback) callback(true);
                  }
              };
              
              img.onerror = function() {
                  if (!completed) {
                      completed = true;
                      clearTimeout(timeout);
                      if (callback) callback(false);
                  }
              };
              
              try {
                  var separator = url.indexOf('?') > -1 ? '&' : '?';
                  img.src = url + separator + data;
              } catch (e) {
                  if (callback) callback(false);
                  return;
              }
              
              try {
                  if (document.body) {
                      document.body.appendChild(img);
                      setTimeout(function() {
                          try {
                              if (img.parentNode) {
                                  img.parentNode.removeChild(img);
                              }
                          } catch (e) {}
                      }, 5000);
                  }
              } catch (e) {
                  // Continue even if DOM fails
              }
          },

          sendTrackingPixel: function(url, data, isRetry) {
              Utils.sendImagePixel(url, data, function(success) {
                  if (success) {
                      if (!isRetry) {
                          Utils.markDataAsSent(data);
                      }
                  } else if (!isRetry) {
                      setTimeout(function() {
                          Utils.sendTrackingPixel(url, data, true);
                      }, CONFIG.RETRY_DELAY);
                  }
              });
          },

          markDataAsSent: function(dataString) {
              try {
                  var stored = JSON.parse(localStorage.getItem('tracking_data') || '[]');
                  for (var i = 0; i < stored.length; i++) {
                      if (stored[i].data === dataString) {
                          stored[i].sent = true;
                          stored[i].sentTime = Date.now();
                          break;
                      }
                  }
                  localStorage.setItem('tracking_data', JSON.stringify(stored));
              } catch (e) {
                  // Continue silently
              }
          }
      };

      // MAIN TRACKING FUNCTION - COMPLETE WITH ALL PARAMETERS
      window.createPixel = function() {
          if (!window.TRACKING_URL) return;

          var params = Utils.getQueryParams();
          
          var gclidValue = '';
          var gbraidValue = '';
          var wbraidValue = '';
          
          if (params.gclid && Utils.validateGclid(params.gclid)) {
              gclidValue = params.gclid.trim();
          }
          
          if (params.gbraid && Utils.validateGbraid(params.gbraid)) {
              gbraidValue = params.gbraid.trim();
          }
          
          if (params.wbraid && Utils.validateWbraid(params.wbraid)) {
              wbraidValue = params.wbraid.trim();
          }
          
          var trackingParam = '';
          if (gclidValue) {
              trackingParam = gclidValue;
          } else if (gbraidValue) {
              trackingParam = gbraidValue;
          } else if (wbraidValue) {
              trackingParam = wbraidValue;
          } else {
              trackingParam = Utils.getFirstValidParam(params, ['fbclid', 'ttclid']);
          }
          
          var utmParams = {};
          for (var utmKey in CONFIG.UTM_PARAMS) {
              if (CONFIG.UTM_PARAMS.hasOwnProperty(utmKey)) {
                  var value = params[utmKey];
                  var mappedKey = CONFIG.UTM_PARAMS[utmKey];
                  if (Utils.isValidValue(value)) {
                      utmParams[mappedKey] = Utils.sanitizeString(value);
                  }
              }
          }

          var offerParts = [
              utmParams.traffic_source,
              utmParams.traffic_type,
              utmParams.campaign,
              utmParams.creative
          ].filter(function(part) {
              return Utils.isValidValue(part);
          });

          var offer = offerParts.length > 0 ? Utils.sanitizeString(offerParts.join('_')) : "";

          var urlParams = new URLSearchParams();
          
          urlParams.append('extclid', params.utm_content || trackingParam);
          urlParams.append('aff_sub1', trackingParam);
          
          if (gclidValue) urlParams.append('aff_sub2', gclidValue);
          if (gbraidValue) urlParams.append('aff_sub3', gbraidValue);
          if (wbraidValue) urlParams.append('aff_sub4', wbraidValue);
          if (params.fbclid) urlParams.append('fbclid', params.fbclid);
          
          for (var key in utmParams) {
              if (utmParams[key]) {
                  urlParams.append(key, utmParams[key]);
              }
          }

          if (offer) {
              urlParams.append('offer', offer);
          }

          urlParams.append('device', Utils.getDeviceType());
          urlParams.append('browser', Utils.getBrowser());
          urlParams.append('screen', window.screen.width + 'x' + window.screen.height);
          urlParams.append('referrer', document.referrer || '');
          urlParams.append('page', window.location.pathname);
          
          var timestamp = Date.now();
          urlParams.append('ts', timestamp);
          
          var dataString = trackingParam + offer + timestamp;
          urlParams.append('checksum', Utils.hashData(dataString));

          var urlString = urlParams.toString();

          Utils.storeTrackingData(urlString);
          Utils.sendTrackingPixel(window.TRACKING_URL, urlString, false);
      };

      // Initialize tracking
      if (!window.trackingCallback) {
          window.createPixel();
      }

      // Event listeners for retry mechanism
      window.addEventListener('online', Utils.sendStoredData);
      document.addEventListener('visibilitychange', function() {
          if (document.visibilityState === 'visible') {
              Utils.sendStoredData();
          }
      });

      // Send stored data when page loads
      if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', Utils.sendStoredData);
      } else {
          Utils.sendStoredData();
      }
      
  }, 0); // OPTIMIZATION: Execute on next tick

})(window, document);

// ================================
// PRIORITY 3: PARAMETER FORWARDING (OPTIMIZED)
// ================================
// OPTIMIZATION: Defer to avoid blocking
setTimeout(function() {
  
  function getAllURLParameters() {
      const params = new URLSearchParams(window.location.search);
      return params;
  }

  // OPTIMIZED: Throttled parameter forwarding
  function appendParametersToAllLinks() {
      const params = getAllURLParameters();
      
      if (params.toString() === '') {
          return;
      }
      
      const links = document.querySelectorAll('a[href]');
      
      links.forEach(link => {
          try {
              // OPTIMIZATION: Skip already processed
              if (link.dataset.paramsProcessed) return;
              
              if (!link.href || 
                  link.href.startsWith('#') || 
                  link.href.startsWith('javascript:') ||
                  link.href.startsWith('mailto:') ||
                  link.href.startsWith('tel:')) {
                  return;
              }
              
              const url = new URL(link.href);
              
              if (url.hostname === window.location.hostname || 
                  url.hostname.includes('ladipage') ||
                  url.hostname.includes('clickbank')) {
                  
                  var hasChanges = false;
                  params.forEach((value, key) => {
                      if (!url.searchParams.has(key)) {
                          url.searchParams.append(key, value);
                          hasChanges = true;
                      }
                  });
                  
                  if (hasChanges) {
                      link.href = url.toString();
                  }
                  
                  // MARK: Prevent reprocessing
                  link.dataset.paramsProcessed = 'true';
              }
          } catch (e) {
              // Skip invalid URLs
          }
      });
  }

  if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', appendParametersToAllLinks);
  } else {
      appendParametersToAllLinks();
  }

  // OPTIMIZED: Throttled MutationObserver
  var throttleTimer;
  var observer = new MutationObserver(function(mutations) {
      var shouldUpdate = false;
      mutations.forEach(function(mutation) {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
              for (var i = 0; i < mutation.addedNodes.length; i++) {
                  var node = mutation.addedNodes[i];
                  if (node.nodeType === 1 && (node.tagName === 'A' || node.querySelector('a'))) {
                      shouldUpdate = true;
                      break;
                  }
              }
          }
      });
      
      if (shouldUpdate && !throttleTimer) {
          throttleTimer = setTimeout(function() {
              appendParametersToAllLinks();
              throttleTimer = null;
          }, 500); // OPTIMIZATION: Throttled to 500ms
      }
  });

  // OPTIMIZATION: Start observing after initial load
  setTimeout(function() {
      if (document.body) {
          observer.observe(document.body, {
              childList: true,
              subtree: true
          });
      }
  }, 1000);
  
}, 100); // OPTIMIZATION: Defer parameter forwarding
