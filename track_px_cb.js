// Tracking script - Version 2.0 (9h34-20.6.25)
(function() {
    // Cấu hình
    var CONFIG = {
        API_URL: 'https://example.com/api/track',
        TRACKING_PARAMS: ['gclid', 'gbraid', 'wbraid', 'fbclid', 'ttclid', 'ref'],
        RETRY_COUNT: 3,
        RETRY_DELAY: 2000,
        STORAGE_KEY: '_tracking_data',
        STORAGE_EXPIRY: 30 * 24 * 60 * 60 * 1000 // 30 ngày
    };

    // Các tiện ích
    var Utils = {
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
        
        isValidValue: function(value) {
            return value && typeof value === 'string' && value.trim().length > 0;
        },
        
        generateUniqueId: function() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        },
        
        getDeviceInfo: function() {
            var ua = navigator.userAgent;
            var device = /Mobile|Android|iPhone|iPad|iPod|Windows Phone/i.test(ua) ? 'mobile' : 'desktop';
            
            var browser = 'other';
            if (/Chrome/i.test(ua)) browser = 'chrome';
            else if (/Firefox/i.test(ua)) browser = 'firefox';
            else if (/Safari/i.test(ua)) browser = 'safari';
            else if (/MSIE|Trident/i.test(ua)) browser = 'ie';
            else if (/Edge/i.test(ua)) browser = 'edge';
            
            return {
                device: device,
                browser: browser,
                userAgent: ua
            };
        },
        
        storeData: function(data) {
            try {
                var storageData = {
                    data: data,
                    expiry: Date.now() + CONFIG.STORAGE_EXPIRY
                };
                localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(storageData));
                return true;
            } catch (e) {
                return false;
            }
        },
        
        retrieveData: function() {
            try {
                var storageData = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY));
                if (storageData && storageData.expiry > Date.now()) {
                    return storageData.data;
                }
                return null;
            } catch (e) {
                return null;
            }
        },
        
        calculateChecksum: function(data) {
            // Đơn giản hóa: Sử dụng tổng các mã ASCII của chuỗi JSON
            var json = JSON.stringify(data);
            var sum = 0;
            for (var i = 0; i < json.length; i++) {
                sum += json.charCodeAt(i);
            }
            return sum.toString(16);
        }
    };

    // Xử lý tracking
    var Tracker = {
        init: function() {
            // Lấy tham số từ URL
            var params = Utils.getQueryParams();
            
            // Lấy thông tin thiết bị
            var deviceInfo = Utils.getDeviceInfo();
            
            // Xác định trackingParam một cách rõ ràng
            var trackingParam;
            
            // THAY ĐỔI: Xác định trackingParam một cách rõ ràng
            if (params.gclid && Utils.isValidValue(params.gclid)) {
                trackingParam = params.gclid;
                console.log('Tracking với gclid:', trackingParam);
            } else if (params.gbraid && Utils.isValidValue(params.gbraid)) {
                trackingParam = params.gbraid;
                console.log('Tracking với gbraid:', trackingParam);
            } else if (params.wbraid && Utils.isValidValue(params.wbraid)) {
                trackingParam = params.wbraid;
                console.log('Tracking với wbraid:', trackingParam);
            } else if (params.fbclid && Utils.isValidValue(params.fbclid)) {
                trackingParam = params.fbclid;
                console.log('Tracking với fbclid:', trackingParam);
            } else if (params.ttclid && Utils.isValidValue(params.ttclid)) {
                trackingParam = params.ttclid;
                console.log('Tracking với ttclid:', trackingParam);
            } else if (params.ref && Utils.isValidValue(params.ref)) {
                trackingParam = params.ref;
                console.log('Tracking với ref:', trackingParam);
            } else {
                trackingParam = Utils.generateUniqueId();
                console.log('Không có tham số tracking, tạo ID mới:', trackingParam);
            }
            
            // Lưu trữ dữ liệu tracking
            var trackingData = {
                trackingParam: trackingParam,
                params: params,
                timestamp: Date.now(),
                deviceInfo: deviceInfo,
                url: window.location.href
            };
            
            // Lưu vào localStorage
            Utils.storeData(trackingData);
            
            // Gửi dữ liệu tracking
            this.sendTrackingData(trackingData);
            
            // Đăng ký sự kiện beforeunload để gửi dữ liệu khi người dùng rời trang
            var self = this;
            window.addEventListener('beforeunload', function() {
                self.sendBeacon(trackingData);
            });
        },
        
        sendTrackingData: function(trackingData, retryCount) {
            var self = this;
            retryCount = retryCount || 0;
            
            // Chuẩn bị dữ liệu để gửi
            var urlParams = new URLSearchParams();
            
            // Thêm các tham số cơ bản
            var offer = window.location.hostname || 'unknown';
            urlParams.append('tid', offer);
            urlParams.append('extclid', trackingData.trackingParam);
            
            // THAY ĐỔI: Gán giá trị cho aff_sub1 từ trackingParam đã xác định rõ ràng
            urlParams.append('aff_sub1', trackingData.trackingParam);
            
            // Thêm các tham số theo yêu cầu
            if (trackingData.params.gclid) urlParams.append('aff_sub2', trackingData.params.gclid);
            if (trackingData.params.gbraid) urlParams.append('aff_sub3', trackingData.params.gbraid);
            if (trackingData.params.wbraid) urlParams.append('aff_sub4', trackingData.params.wbraid);
            
            // Thêm các tham số UTM
            if (trackingData.params.utm_source) urlParams.append('utm_source', trackingData.params.utm_source);
            if (trackingData.params.utm_medium) urlParams.append('utm_medium', trackingData.params.utm_medium);
            if (trackingData.params.utm_campaign) urlParams.append('utm_campaign', trackingData.params.utm_campaign);
            if (trackingData.params.utm_term) urlParams.append('utm_term', trackingData.params.utm_term);
            if (trackingData.params.utm_content) urlParams.append('utm_content', trackingData.params.utm_content);
            
            // Thêm thông tin thiết bị
            urlParams.append('device', trackingData.deviceInfo.device);
            urlParams.append('browser', trackingData.deviceInfo.browser);
            
            // Thêm timestamp và checksum
            urlParams.append('timestamp', trackingData.timestamp);
            urlParams.append('checksum', Utils.calculateChecksum(trackingData));
            
            // Log dữ liệu để debug
            console.log('Sending tracking data:');
            console.log('aff_sub1:', urlParams.get('aff_sub1'));
            console.log('aff_sub3:', urlParams.get('aff_sub3'));
            
            // Gửi dữ liệu qua AJAX
            var xhr = new XMLHttpRequest();
            xhr.open('POST', CONFIG.API_URL, true);
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            
            xhr.onload = function() {
                if (xhr.status >= 200 && xhr.status < 300) {
                    console.log('Tracking data sent successfully');
                } else {
                    console.error('Failed to send tracking data. Status:', xhr.status);
                    
                    // Thử lại nếu chưa đạt số lần thử tối đa
                    if (retryCount < CONFIG.RETRY_COUNT) {
                        setTimeout(function() {
                            self.sendTrackingData(trackingData, retryCount + 1);
                        }, CONFIG.RETRY_DELAY);
                    }
                }
            };
            
            xhr.onerror = function() {
                console.error('Error sending tracking data');
                
                // Thử lại nếu chưa đạt số lần thử tối đa
                if (retryCount < CONFIG.RETRY_COUNT) {
                    setTimeout(function() {
                        self.sendTrackingData(trackingData, retryCount + 1);
                    }, CONFIG.RETRY_DELAY);
                }
            };
            
            xhr.send(urlParams.toString());
        },
        
        sendBeacon: function(trackingData) {
            // Sử dụng Beacon API để gửi dữ liệu khi người dùng rời trang
            if (navigator.sendBeacon) {
                var urlParams = new URLSearchParams();
                urlParams.append('tid', window.location.hostname || 'unknown');
                urlParams.append('extclid', trackingData.trackingParam);
                urlParams.append('event', 'exit');
                urlParams.append('timestamp', Date.now());
                
                navigator.sendBeacon(CONFIG.API_URL, urlParams.toString());
            }
        }
    };

    // Khởi tạo tracker khi trang đã tải xong
    if (document.readyState === 'complete') {
        Tracker.init();
    } else {
        window.addEventListener('load', function() {
            Tracker.init();
        });
    }
})();
