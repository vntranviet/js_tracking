(function TrackingInit(window, document) {
    'use strict';

    var CONFIG = {
        TRACKING_URL: window.TRACKING_URL || '',
        TRACKING_PARAMS: ['gclid', 'gbraid', 'wbraid', 'fbclid', 'ttclid', 'ref'],
        UTM_PARAMS: {
            'utm_source': 'traffic_source',
            'utm_medium': 'traffic_type',
            'utm_campaign': 'campaign',
            'utm_term': 'creative',
            'utm_content': 'ad'
        },
        RETRY_INTERVAL: 30 * 60 * 1000, // 30 phút
        DATA_RETENTION: 7 * 24 * 60 * 60 * 1000 // 7 ngày
    };

    var Utils = {
        isValidValue: function(value) {
            return value && typeof value === 'string' && value.trim().length > 0;
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
            } catch (e) {
                console.error('Failed to store tracking data:', e);
            }
        },

        sendStoredData: function() {
            try {
                var stored = JSON.parse(localStorage.getItem('tracking_data') || '[]');
                var updated = [];
                
                for (var i = 0; i < stored.length; i++) {
                    var item = stored[i];
                    
                    // Chỉ thử lại nếu chưa gửi hoặc đã quá thời gian retry
                    var shouldRetry = !item.sent || 
                                     (item.retryCount < 3 && 
                                      Date.now() - item.retryTime > CONFIG.RETRY_INTERVAL);
                    
                    if (shouldRetry) {
                        // Tạo và gửi pixel
                        var img = new Image();
                        img.src = window.TRACKING_URL + '?' + item.data + '&retry=' + (item.retryCount || 0);
                        
                        item.sent = true;
                        item.retryTime = Date.now();
                        item.retryCount = (item.retryCount || 0) + 1;
                    }
                    
                    // Giữ lại dữ liệu trong thời gian quy định
                    if (Date.now() - item.timestamp < CONFIG.DATA_RETENTION) {
                        updated.push(item);
                    }
                }
                
                localStorage.setItem('tracking_data', JSON.stringify(updated));
            } catch (e) {
                console.error('Failed to send stored tracking data:', e);
            }
        },

        useBeaconIfAvailable: function(url, data) {
            if (navigator.sendBeacon) {
                // Tạo FormData để gửi dữ liệu
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
        // Kiểm tra xem TRACKING_URL đã được set chưa
        if (!window.TRACKING_URL) {
            console.error('TRACKING_URL is not set');
            return;
        }

        var params = Utils.getQueryParams();
        var trackingParam = Utils.getFirstValidParam(params, CONFIG.TRACKING_PARAMS) || Utils.generateUniqueId();
        
        // UTM Parameters
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

        // Create offer string
        var offerParts = [
            utmParams.traffic_source,
            utmParams.traffic_type,
            utmParams.campaign,
            utmParams.creative,
            utmParams.ad
        ].filter(function(part) {
            return Utils.isValidValue(part);
        });

        var offer = offerParts.length > 0 ? Utils.sanitizeString(offerParts.join('_')) : Utils.generateUniqueId();

        // Build final URL parameters
        var urlParams = new URLSearchParams();
        
        // Always add these parameters
        urlParams.append('tid', offer);
        urlParams.append('extclid', trackingParam);
        urlParams.append('aff_sub1', trackingParam);
        
        // Thêm các tham số theo yêu cầu
        if (params.gclid) urlParams.append('aff_sub2', params.gclid);
        if (params.gbraid) urlParams.append('aff_sub3', params.gbraid);
        if (params.wbraid) urlParams.append('aff_sub4', params.wbraid);
        if (params.fbclid) urlParams.append('fbclid', params.fbclid);
        
        // Add UTM parameters
        for (var key in utmParams) {
            if (utmParams[key]) {
                urlParams.append(key, utmParams[key]);
            }
        }

        // Add offer if exists
        if (offer) {
            urlParams.append('offer', offer);
        }

        // Thêm thông tin thiết bị và trình duyệt
        urlParams.append('device', Utils.getDeviceType());
        urlParams.append('browser', Utils.getBrowser());
        urlParams.append('screen', window.screen.width + 'x' + window.screen.height);
        urlParams.append('referrer', document.referrer || '');
        urlParams.append('page', window.location.pathname);
        
        // Add timestamp
        var timestamp = Date.now();
        urlParams.append('ts', timestamp);
        
        // Thêm checksum để xác minh tính toàn vẹn dữ liệu
        var dataString = trackingParam + offer + timestamp;
        urlParams.append('checksum', Utils.hashData(dataString));

        var urlString = urlParams.toString();
        var fullUrl = window.TRACKING_URL + '?' + urlString;

        // Lưu trữ dữ liệu tracking
        Utils.storeTrackingData(urlString);

        // Thử sử dụng Beacon API trước (tốt hơn cho trường hợp người dùng rời trang)
        var beaconSent = Utils.useBeaconIfAvailable(window.TRACKING_URL, urlString);
        
        // Nếu không thể sử dụng Beacon, dùng Image
        if (!beaconSent) {
            // Tạo và gửi pixel
            var img = new Image();
            img.style.cssText = 'position:absolute;width:1px;height:1px;opacity:0;visibility:hidden;pointer-events:none';
            img.alt = '';
            img.onload = function() {
                // Đánh dấu dữ liệu đã gửi thành công
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
            img.onerror = function() {
                console.warn('Tracking pixel failed to load');
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

    // Auto-initialize if not using callback
    if (!window.trackingCallback) {
        window.createPixel();
    }

    // Thử gửi lại dữ liệu đã lưu trữ
    window.addEventListener('online', Utils.sendStoredData);
    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'visible') {
            Utils.sendStoredData();
        }
    });

    // Thử gửi lại khi trang được tải lại
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', Utils.sendStoredData);
    } else {
        Utils.sendStoredData();
    }

    // Thêm sự kiện beforeunload để đảm bảo dữ liệu được gửi khi người dùng rời trang
    window.addEventListener('beforeunload', function() {
        Utils.useBeaconIfAvailable(window.TRACKING_URL, new URLSearchParams({
            tid: 'exit',
            extclid: Utils.generateUniqueId(),
            page: window.location.pathname,
            ts: Date.now()
        }).toString());
    });

})(window, document);
