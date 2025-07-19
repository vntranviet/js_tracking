/**
 * @version ANTI_ADBLOCK v1.0 - Stealth Mode
 * Optimized to avoid ad blocker detection
 */

// ================================
// CLICK ID - SAFE (No changes needed)
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
// STEALTH TRACKING SYSTEM
// ================================
(function(w, d) {
  'use strict';

  // OBFUSCATED VARIABLES
  var cfg = {
      url: w['TR' + 'ACK' + 'ING_' + 'URL'] || w.TRACKING_URL || '',
      params: ['gclid', 'gbraid', 'wbraid', 'fbclid', 'ttclid'],
      utm: {
          'utm_source': 'source',
          'utm_medium': 'medium', 
          'utm_campaign': 'camp',
          'utm_term': 'term',
          'utm_content': 'content'
      },
      retry: 30 * 60 * 1000,
      retention: 7 * 24 * 60 * 60 * 1000,
      maxRetries: 2,
      timeout: 3000,
      delay: 1000
  };

  // OBFUSCATED STORAGE KEY
  var storageKey = ['da', 'ta_', 'st', 'ore'].join('');
  
  var utils = {
      isValid: function(v) {
          return v && typeof v === 'string' && v.trim().length > 0;
      },

      checkGclid: function(v) {
          if (!utils.isValid(v)) return false;
          return /^[a-zA-Z0-9_-]{10,}$/.test(v.trim());
      },

      checkGbraid: function(v) {
          if (!utils.isValid(v)) return false;
          return /^[a-zA-Z0-9_-]{15,}$/.test(v.trim());
      },

      getParams: function() {
          try {
              var p = {};
              var q = w.location.search.substring(1);
              var pairs = q.split('&');
              for (var i = 0; i < pairs.length; i++) {
                  var pair = pairs[i].split('=');
                  if (pair[0]) {
                      p[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
                  }
              }
              return p;
          } catch (e) {
              return {};
          }
      },

      getFirst: function(params, list) {
          for (var i = 0; i < list.length; i++) {
              var v = params[list[i]];
              if (utils.isValid(v)) return v;
          }
          return '';
      },

      clean: function(str) {
          if (!str) return '';
          return str.toLowerCase()
              .replace(/[^a-z0-9_]+/g, '_')
              .replace(/^_+|_+$/g, '')
              .replace(/_{2,}/g, '_');
      },

      genId: function() {
          return 'id_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
      },

      getDevice: function() {
          var ua = navigator.userAgent;
          if (/(tablet|ipad)/i.test(ua)) return 'tablet';
          if (/mobile/i.test(ua)) return 'mobile';
          return 'desktop';
      },

      getBrowser: function() {
          var ua = navigator.userAgent;
          if (ua.indexOf('Chrome') > -1) return 'chrome';
          if (ua.indexOf('Firefox') > -1) return 'firefox';
          if (ua.indexOf('Safari') > -1) return 'safari';
          return 'other';
      },

      hash: function(data) {
          var hash = 0;
          if (data.length === 0) return hash;
          for (var i = 0; i < data.length; i++) {
              var char = data.charCodeAt(i);
              hash = ((hash << 5) - hash) + char;
              hash = hash & hash;
          }
          return hash.toString(36);
      },

      // STEALTH STORAGE
      store: function(data) {
          try {
              var stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
              stored.push({
                  d: data,
                  t: Date.now(),
                  s: false,
                  r: 0,
                  id: utils.genId()
              });
              
              var now = Date.now();
              stored = stored.filter(function(item) {
                  return now - item.t < cfg.retention;
              }).slice(-20); // Reduced storage
              
              localStorage.setItem(storageKey, JSON.stringify(stored));
          } catch (e) {
              // Silent fail
          }
      },

      // STEALTH SENDING - Multiple methods
      send: function(url, data, callback) {
          if (!url) {
              if (callback) callback(false);
              return;
          }

          // METHOD 1: Fetch (Modern, less detectable)
          if (w.fetch) {
              try {
                  var fullUrl = url + (url.indexOf('?') > -1 ? '&' : '?') + data;
                  fetch(fullUrl, {
                      method: 'GET',
                      mode: 'no-cors',
                      cache: 'no-cache',
                      credentials: 'omit'
                  }).then(function() {
                      if (callback) callback(true);
                  }).catch(function() {
                      // Fallback to image
                      utils.sendImg(url, data, callback);
                  });
                  return;
              } catch (e) {
                  // Fall through to image method
              }
          }

          // METHOD 2: Image fallback
          utils.sendImg(url, data, callback);
      },

      // STEALTH IMAGE METHOD
      sendImg: function(url, data, callback) {
          var img = new Image();
          var done = false;
          var timer;
          
          // LESS SUSPICIOUS STYLING
          img.style.cssText = 'position:fixed;width:0;height:0;opacity:0;pointer-events:none;';
          img.alt = '';
          
          timer = setTimeout(function() {
              if (!done) {
                  done = true;
                  if (callback) callback(false);
              }
          }, cfg.timeout);
          
          img.onload = img.onerror = function() {
              if (!done) {
                  done = true;
                  clearTimeout(timer);
                  if (callback) callback(true);
              }
          };
          
          try {
              var sep = url.indexOf('?') > -1 ? '&' : '?';
              img.src = url + sep + data;
              
              // STEALTH APPEND
              if (d.body) {
                  d.body.appendChild(img);
                  setTimeout(function() {
                      try {
                          if (img.parentNode) img.parentNode.removeChild(img);
                      } catch (e) {}
                  }, 2000); // Faster cleanup
              }
          } catch (e) {
              if (callback) callback(false);
          }
      }
  };

  // MAIN FUNCTION - OBFUSCATED
  w.initAnalytics = function() {
      if (!cfg.url) return;

      // RANDOM DELAY to avoid pattern detection
      setTimeout(function() {
          var params = utils.getParams();
          
          var gclid = '';
          var gbraid = '';
          var wbraid = '';
          
          if (params.gclid && utils.checkGclid(params.gclid)) {
              gclid = params.gclid.trim();
          }
          
          if (params.gbraid && utils.checkGbraid(params.gbraid)) {
              gbraid = params.gbraid.trim();
          }
          
          if (params.wbraid && utils.checkGbraid(params.wbraid)) {
              wbraid = params.wbraid.trim();
          }
          
          var mainParam = gclid || gbraid || wbraid || 
                         utils.getFirst(params, ['fbclid', 'ttclid']);
          
          // OBFUSCATED PARAMETER NAMES
          var urlParams = new URLSearchParams();
          
          urlParams.append('ref', params.utm_content || mainParam);
          urlParams.append('s1', mainParam);
          
          if (gclid) urlParams.append('s2', gclid);
          if (gbraid) urlParams.append('s3', gbraid);
          if (wbraid) urlParams.append('s4', wbraid);
          if (params.fbclid) urlParams.append('fb', params.fbclid);
          
          // UTM with different names
          for (var key in cfg.utm) {
              var value = params[key];
              if (utils.isValid(value)) {
                  urlParams.append(cfg.utm[key], utils.clean(value));
              }
          }

          urlParams.append('dev', utils.getDevice());
          urlParams.append('br', utils.getBrowser());
          urlParams.append('sc', w.screen.width + 'x' + w.screen.height);
          urlParams.append('pg', w.location.pathname);
          
          var ts = Date.now();
          urlParams.append('t', ts);
          urlParams.append('h', utils.hash(mainParam + ts));

          var dataStr = urlParams.toString();
          utils.store(dataStr);
          utils.send(cfg.url, dataStr);
          
      }, Math.random() * 2000 + 500); // Random 0.5-2.5s delay
  };

  // AUTO INIT with different name
  if (!w.analyticsCallback) {
      w.initAnalytics();
  }

})(window, document);

// ================================
// PARAMETER FORWARDING - STEALTH MODE
// ================================
setTimeout(function() {
  
  function getUrlParams() {
      return new URLSearchParams(window.location.search);
  }

  function updateLinks() {
      var params = getUrlParams();
      if (params.toString() === '') return;
      
      var links = document.querySelectorAll('a[href]');
      
      for (var i = 0; i < links.length; i++) {
          var link = links[i];
          
          try {
              if (link.dataset.processed) continue;
              
              if (!link.href || 
                  link.href.startsWith('#') || 
                  link.href.startsWith('javascript:') ||
                  link.href.startsWith('mailto:') ||
                  link.href.startsWith('tel:')) {
                  continue;
              }
              
              var url = new URL(link.href);
              
              if (url.hostname === window.location.hostname || 
                  url.hostname.includes('ladipage') ||
                  url.hostname.includes('clickbank')) {
                  
                  var changed = false;
                  params.forEach(function(value, key) {
                      if (!url.searchParams.has(key)) {
                          url.searchParams.append(key, value);
                          changed = true;
                      }
                  });
                  
                  if (changed) {
                      link.href = url.toString();
                  }
                  
                  link.dataset.processed = 'true';
              }
          } catch (e) {
              // Skip
          }
      }
  }

  // DELAYED EXECUTION
  if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
          setTimeout(updateLinks, Math.random() * 500 + 200);
      });
  } else {
      setTimeout(updateLinks, Math.random() * 500 + 200);
  }

  // THROTTLED OBSERVER
  var throttle;
  var observer = new MutationObserver(function(mutations) {
      var hasLinks = false;
      for (var i = 0; i < mutations.length; i++) {
          var mutation = mutations[i];
          if (mutation.type === 'childList') {
              for (var j = 0; j < mutation.addedNodes.length; j++) {
                  var node = mutation.addedNodes[j];
                  if (node.nodeType === 1 && 
                      (node.tagName === 'A' || node.querySelector('a'))) {
                      hasLinks = true;
                      break;
                  }
              }
          }
          if (hasLinks) break;
      }
      
      if (hasLinks && !throttle) {
          throttle = setTimeout(function() {
              updateLinks();
              throttle = null;
          }, Math.random() * 1000 + 500); // Random delay
      }
  });

  setTimeout(function() {
      if (document.body) {
          observer.observe(document.body, {
              childList: true,
              subtree: true
          });
      }
  }, Math.random() * 2000 + 1000); // Random start delay
  
}, Math.random() * 1000 + 500);
