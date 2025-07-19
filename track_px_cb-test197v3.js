/**
 * @version test 19725v2
 */
/** ramdom utm_content=clickidyymmdd-hhmmssabc */

(function(){const url=new URL(location.href);const utm=url.searchParams.get('utm_content');const createCid=()=>{const n=new Date();const t=n.getFullYear().toString().slice(-2)+(n.getMonth()+1).toString().padStart(2,'0')+n.getDate().toString().padStart(2,'0');const h=n.getHours().toString().padStart(2,'0')+n.getMinutes().toString().padStart(2,'0')+n.getSeconds().toString().padStart(2,'0');return`clickid${t}-${h}${Math.random().toString(36).substr(2,3)}`};let cid=url.searchParams.get('click_id')||createCid();if(utm!==cid){url.searchParams.set('click_id',cid);url.searchParams.set('utm_content',cid);location.href=url.toString()}window.CLICK_ID=cid})();

/**  @Tracking Pixel 19725v2 */
     
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
        DATA_RETENTION: 7 * 24 * 60 * 60 * 1000
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
                var stored = JSON.parse(localStorage.getItem('tracking_data') || '[]');
                stored.push({
                    data: data,
                    timestamp: Date.now(),
                    sent: false
                });
                localStorage.setItem('tracking_data', JSON.stringify(stored));
            } catch (e) {}
        },

        sendStoredData: function() {
            try {
                var stored = JSON.parse(localStorage.getItem('tracking_data') || '[]');
                var updated = [];
                
                for (var i = 0; i < stored.length; i++) {
                    var item = stored[i];
                    
                    var shouldRetry = !item.sent || 
                                     (item.retryCount < 3 && 
                                      Date.now() - item.retryTime > CONFIG.RETRY_INTERVAL);
                    
                    if (shouldRetry) {
                        var img = new Image();
                        img.src = window.TRACKING_URL + '?' + item.data + '&retry=' + (item.retryCount || 0);
                        
                        item.sent = true;
                        item.retryTime = Date.now();
                        item.retryCount = (item.retryCount || 0) + 1;
                    }
                    
                    if (Date.now() - item.timestamp < CONFIG.DATA_RETENTION) {
                        updated.push(item);
                    }
                }
                
                localStorage.setItem('tracking_data', JSON.stringify(updated));
            } catch (e) {}
        },

        useBeaconIfAvailable: function(url, data) {
            if (navigator.sendBeacon) {
                var formData = new FormData();
                var params = new URLSearchParams(data);
                params.forEach(function(value, key) {
                    formData.append(key, value);
                });
                
                return navigator.sendBeacon(url, formData);
            }
            return false;
        }
    };

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
        
        urlParams.append('extclid', trackingParam);
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
        var fullUrl = window.TRACKING_URL + '?' + urlString;

        Utils.storeTrackingData(urlString);

        var beaconSent = Utils.useBeaconIfAvailable(window.TRACKING_URL, urlString);
        
        if (!beaconSent) {
            var img = new Image();
            img.style.cssText = 'position:absolute;width:1px;height:1px;opacity:0;visibility:hidden;pointer-events:none';
            img.alt = '';
            img.onload = function() {
                try {
                    var stored = JSON.parse(localStorage.getItem('tracking_data') || '[]');
                    for (var i = 0; i < stored.length; i++) {
                        if (stored[i].data === urlString) {
                            stored[i].sent = true;
                            stored[i].sentTime = Date.now();
                        }
                    }
                    localStorage.setItem('tracking_data', JSON.stringify(stored));
                } catch (e) {}
            };
            img.src = fullUrl;

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', function() {
                    document.body && document.body.appendChild(img);
                });
            } else {
                document.body && document.body.appendChild(img);
            }
        }
    };

    if (!window.trackingCallback) {
        window.createPixel();
    }

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

    window.addEventListener('beforeunload', function() {
        Utils.useBeaconIfAvailable(window.TRACKING_URL, new URLSearchParams({
            tid: 'exit',
            extclid: Utils.generateUniqueId(),
            page: window.location.pathname,
            ts: Date.now()
        }).toString());
    });

})(window, document);


// chuyển tiếp * các tham số trên domain Ladipage: GCLID, GBRAID, WBRAID

function getAllURLParameters() {
    const params = new URLSearchParams(window.location.search);
    return params;
}

function appendParametersToAllLinks() {
    const params = getAllURLParameters();
    
    if (params.toString() === '') {
        return;
    }
    
    const links = document.querySelectorAll('a');
    
    links.forEach(link => {
        if (!link.href || link.href.startsWith('#') || link.href.startsWith('javascript:')) {
            return;
        }
        
        const url = new URL(link.href);
        
        params.forEach((value, key) => {
            if (!url.searchParams.has(key)) {
                url.searchParams.append(key, value);
            }
        });
        
        link.href = url.toString();
    });
}
document.addEventListener('DOMContentLoaded', appendParametersToAllLinks);
