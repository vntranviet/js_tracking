/**
 * @version V10h.250720
 */


(function() {
if (window.CLICKID) return;

function safeSessionGet(key) {
  try {
    return sessionStorage.getItem(key);
  } catch(e) {
    return null;
  }
}

function safeSessionSet(key, value) {
  try {
    sessionStorage.setItem(key, value);
    return true;
  } catch(e) {
    return false;
  }
}

function safeSessionRemove(key) {
  try {
    sessionStorage.removeItem(key);
  } catch(e) {}
}

function safeJSONParse(str) {
  if (!str) return null;
  try {
    return JSON.parse(str);
  } catch(e) {
    return null;
  }
}

function safeJSONStringify(obj) {
  try {
    return JSON.stringify(obj);
  } catch(e) {
    return null;
  }
}

try {
  const url = new URL(location.href);
  let clickId = url.searchParams.get('clickid');
  
  // Priority 1: URL clickid
  if (clickId) {
    window.CLICKID = clickId;
    safeSessionSet('tracking_clickid', clickId); /
    return;
  }
  
  // Priority 2: SessionStorage
  const storedClickId = safeSessionGet('tracking_clickid'); 
  if (storedClickId) {
    window.CLICKID = storedClickId;
    // 🔄 KEEP: Add to URL for tracking (as requested)
    url.searchParams.set('clickid', storedClickId);
    url.searchParams.set('utm_content', storedClickId);
    history.replaceState?.(null, '', url);
    return;
  }
  
  // Priority 3: Generate new clickid
  const params = url.searchParams;
  const ref = document.referrer;
  
  // Traffic detection (unchanged)
  const source = 
    (params.get('utm_source') === 'tbl' || params.get('tblci') || params.get('utm_campaign')?.includes('taboola')) ? 'tbl' :
    (params.get('gclid') || params.get('utm_source')?.match(/^(ga|gad|google)/) || params.get('utm_medium') === 'cpc') ? 'ga' :
    (params.get('utm_source')?.match(/^(ytb|yt|youtube)/) || ref.includes('youtube.com')) ? 'ytb' :
    (params.get('fbclid') || params.get('utm_source')?.includes('facebook')) ? 'fb' :
    (params.get('ttclid') || params.get('utm_source')?.includes('tiktok')) ? 'tt' :
    (params.get('msclkid') || params.get('utm_source') === 'bing') ? 'bing' :
    (params.get('utm_medium') === 'email' || params.get('utm_source')?.includes('email') || params.get('utm_source') === 'mail') ? 'mail' :
    'dr';
  
  // Generate clickid (unchanged logic)
  const now = new Date();
  const date = now.getFullYear().toString().slice(-2) + 
              String(now.getMonth() + 1).padStart(2, '0') + 
              String(now.getDate()).padStart(2, '0');
  const time = String(now.getHours()).padStart(2, '0') + 
              String(now.getMinutes()).padStart(2, '0') + 
              String(now.getSeconds()).padStart(2, '0');
  const random = Math.random().toString(36).substr(2, 5);
  
  clickId = `clickid${date}-${time}${source}-${random}`;
  
  // Save (same functionality)
  window.CLICKID = clickId;
  safeSessionSet('tracking_clickid', clickId); // ✅ TRANSPARENT naming
  
  // 🔄 KEEP: Update URL (as requested)
  url.searchParams.set('clickid', clickId);
  url.searchParams.set('utm_content', clickId);
  history.replaceState?.(null, '', url);
  
  // Traffic info (unchanged)
  const trafficInfo = {
    clickId: clickId,
    source: source,
    timestamp: now.toISOString(),
    referrer: ref || 'direct',
    userAgent: navigator.userAgent,
    originalUrl: location.href,
    isFirstVisit: true
  };
  
  window.TRAFFIC_INFO = trafficInfo;
  const trafficInfoStr = safeJSONStringify(trafficInfo);
  if (trafficInfoStr) {
    safeSessionSet('tracking_traffic_info', trafficInfoStr); 
  }
  
} catch (e) {
  const fallbackId = 'clickid' + Date.now().toString(36);
  window.CLICKID = fallbackId;
  safeSessionSet('tracking_clickid', fallbackId);
}
})();

// Helper functions (unchanged)
window.getTrafficInfo = function() {
const storedInfo = safeSessionGet('tracking_traffic_info'); 
const parsedInfo = safeJSONParse(storedInfo);

return {
  clickId: window.CLICKID,
  trafficInfo: parsedInfo || window.TRAFFIC_INFO,
  currentUrl: location.href,
  sessionTime: new Date().toISOString(),
  isNewPage: !window.TRAFFIC_INFO && !!parsedInfo
};
};

window.clearTrafficSession = function() {
safeSessionRemove('tracking_clickid');
safeSessionRemove('tracking_traffic_info');
delete window.CLICKID;
delete window.TRAFFIC_INFO;
};

function safeSessionGet(key) {
try {
  return sessionStorage.getItem(key);
} catch(e) {
  return null;
}
}

function safeJSONParse(str) {
if (!str) return null;
try {
  return JSON.parse(str);
} catch(e) {
  return null;
}
}

/** COMPLIANT TRACKING PIXEL */
(function TrackingInit(window, document) {
'use strict';

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
  // All validation functions unchanged
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

  getQueryParams: function() {
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

  storeTrackingData: function(data) {
      try {
          var storageKey = 'tracking_data_queue'; 
          var stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
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
          
          localStorage.setItem(storageKey, JSON.stringify(stored));
      } catch (e) {
          // Continue silently
      }
  },

  sendStoredData: function() {
      try {
          var storageKey = 'tracking_data_queue'; 
          var stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
          var updated = [];
          
          for (var i = 0; i < stored.length; i++) {
              var item = stored[i];
              
              var shouldRetry = !item.sent && item.retryCount < CONFIG.MAX_RETRIES;
              var canRetry = Date.now() - item.timestamp > CONFIG.RETRY_INTERVAL;
              
              if (shouldRetry && (item.retryCount === 0 || canRetry)) {
                  Utils.sendRequest(window.TRACKING_URL, item.data + '&retry=' + item.retryCount, function(success) {
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
          
          localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (e) {
          // Continue silently
      }
  },


  sendRequest: function(url, data, callback) {
      if (!url || typeof url !== 'string' || url.length === 0) {
          if (callback) callback(false);
          return;
      }

      var completed = false;
      var timeout = setTimeout(function() {
          if (!completed) {
              completed = true;
              if (callback) callback(false);
          }
      }, CONFIG.PIXEL_TIMEOUT);

      // Try fetch first with standard mode
      if (typeof fetch !== 'undefined') {
          try {
              var separator = url.indexOf('?') > -1 ? '&' : '?';
              var fullUrl = url + separator + data;
              

              fetch(fullUrl, {
                  method: 'GET',
                  mode: 'cors', 
                  cache: 'no-cache'
              }).then(function() {
                  if (!completed) {
                      completed = true;
                      clearTimeout(timeout);
                      if (callback) callback(true);
                  }
              }).catch(function() {
                  // Fallback to image pixel
                  if (!completed) {
                      Utils.sendImagePixel(url, data, callback, completed, timeout);
                  }
              });
              return;
          } catch (e) {
              // Continue to fallback
          }
      }

      // Fallback to standard image pixel
      Utils.sendImagePixel(url, data, callback, completed, timeout);
  },


  sendImagePixel: function(url, data, callback, completed, timeout) {
      if (completed) return;

      try {
          var separator = url.indexOf('?') > -1 ? '&' : '?';
          var fullUrl = url + separator + data;
          

          var img = new Image();
          img.onload = img.onerror = function() {
              if (!completed) {
                  completed = true;
                  clearTimeout(timeout);
                  if (callback) callback(true);
              }
          };
          

          img.style.cssText = 'width:1px;height:1px;position:absolute;left:-9999px;top:-9999px;';
          img.alt = 'Tracking Pixel'; 
          img.src = fullUrl;
          
          // Add to DOM for transparency
          if (document.body) {
              document.body.appendChild(img);
              
              // Cleanup after 10 seconds
              setTimeout(function() {
                  try {
                      if (img.parentNode) {
                          img.parentNode.removeChild(img);
                      }
                  } catch (e) {}
              }, 10000);
          }
          
      } catch (e) {
          if (!completed) {
              completed = true;
              clearTimeout(timeout);
              if (callback) callback(false);
          }
      }
  },

  sendTrackingPixel: function(url, data, isRetry) {
      Utils.sendRequest(url, data, function(success) {
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
          var storageKey = 'tracking_data_queue'; 
          var stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
          for (var i = 0; i < stored.length; i++) {
              if (stored[i].data === dataString) {
                  stored[i].sent = true;
                  stored[i].sentTime = Date.now();
                  break;
              }
          }
          localStorage.setItem(storageKey, JSON.stringify(stored));
      } catch (e) {
          // Continue silently
      }
  }
};

// MAIN TRACKING FUNCTION (Logic unchanged)
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


setTimeout(function() {
  if (!window.trackingCallback) {
      window.createPixel();
  }
}, 100);

// Event listeners (unchanged)
window.addEventListener('online', Utils.sendStoredData);
document.addEventListener('visibilitychange', function() {
  if (document.visibilityState === 'visible') {
      Utils.sendStoredData();
  }
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', Utils.sendStoredData);
} else {
  Utils.sendStoredData();
}

})(window, document);

// PARAMETER FORWARDING (Logic unchanged)
function getAllURLParameters() {
  const params = new URLSearchParams(window.location.search);
  return params;
}

function appendParametersToAllLinks() {
  const params = getAllURLParameters();

  if (params.toString() === '') {
      return;
  }

  const links = document.querySelectorAll('a[href]');

  links.forEach(link => {
      try {
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
              
              params.forEach((value, key) => {
                  if (!url.searchParams.has(key)) {
                      url.searchParams.append(key, value);
                  }
              });
              
              link.href = url.toString();
          }
      } catch (e) {
          // Skip invalid URLs
      }
  });
}


if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
      setTimeout(appendParametersToAllLinks, 200);
  });
} else {
  setTimeout(appendParametersToAllLinks, 100);
}


var observerTimeout;
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

  if (shouldUpdate && !observerTimeout) {
      observerTimeout = setTimeout(function() {
          appendParametersToAllLinks();
          observerTimeout = null;
      }, 300); 
  }
});

if (document.body) {
  observer.observe(document.body, {
      childList: true,
      subtree: true
  });
}
