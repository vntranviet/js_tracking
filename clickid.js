/**
 * @version 1.0.0
 * Mã tạo ClickID và truyền UTM Content
 */

(function() {
  // Các hàm tiện ích cho sessionStorage
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

  // Tạo hoặc lấy ClickID
  function initClickID() {
    try {
      const url = new URL(location.href);
      let clickId = url.searchParams.get('clickid');
      
      // Nếu đã có clickid trong URL, sử dụng nó
      if (clickId) {
        window.CLICKID = clickId;
        safeSessionSet('tracking_clickid', clickId); 
        return;
      }
      
      // Kiểm tra xem đã lưu clickid trong session chưa
      const storedClickId = safeSessionGet('tracking_clickid'); 
      if (storedClickId) {
        window.CLICKID = storedClickId;
        url.searchParams.set('clickid', storedClickId);
        url.searchParams.set('utm_content', storedClickId);
        history.replaceState?.(null, '', url);
        return;
      }
      
      // Xác định nguồn traffic
      const params = url.searchParams;
      const ref = document.referrer;
      
      const source = 
        (params.get('utm_source') === 'tbl' || params.get('tblci') || params.get('utm_campaign')?.includes('taboola')) ? 'tbl' :
        (params.get('gclid') || params.get('utm_source')?.match(/^(ga|gad|google)/) || params.get('utm_medium') === 'cpc') ? 'ga' :
        (params.get('utm_source')?.match(/^(ytb|yt|youtube)/) || ref.includes('youtube.com')) ? 'ytb' :
        (params.get('fbclid') || params.get('utm_source')?.includes('facebook')) ? 'fb' :
        (params.get('ttclid') || params.get('utm_source')?.includes('tiktok')) ? 'tt' :
        (params.get('msclkid') || params.get('utm_source') === 'bing') ? 'bing' :
        (params.get('utm_medium') === 'email' || params.get('utm_source')?.includes('email') || params.get('utm_source') === 'mail') ? 'mail' :
        'dr';
      
      // Tạo clickid mới
      const now = new Date();
      const date = now.getFullYear().toString().slice(-2) + 
                  String(now.getMonth() + 1).padStart(2, '0') + 
                  String(now.getDate()).padStart(2, '0');
      const time = String(now.getHours()).padStart(2, '0') + 
                  String(now.getMinutes()).padStart(2, '0') + 
                  String(now.getSeconds()).padStart(2, '0');
      const random = Math.random().toString(36).substr(2, 5);
      
      clickId = `clickid${date}-${time}${source}-${random}`;
      
      window.CLICKID = clickId;
      safeSessionSet('tracking_clickid', clickId);
      
      // Cập nhật URL với clickid mới
      url.searchParams.set('clickid', clickId);
      url.searchParams.set('utm_content', clickId);
      history.replaceState?.(null, '', url);
      
    } catch (e) {
      // Xử lý lỗi - tạo clickid dự phòng
      const fallbackId = 'clickid' + Date.now().toString(36);
      window.CLICKID = fallbackId;
      safeSessionSet('tracking_clickid', fallbackId);
    }
  }

  // Hàm thêm tham số vào tất cả các liên kết
  function appendParametersToAllLinks() {
    // Lấy tất cả tham số URL hiện tại
    const params = new URLSearchParams(window.location.search);
    
    // Nếu không có tham số, không cần thực hiện
    if (params.toString() === '') {
      return;
    }
    
    // Lấy tất cả các liên kết trên trang
    const links = document.querySelectorAll('a[href]');
    
    links.forEach(link => {
      try {
        // Bỏ qua các liên kết đặc biệt
        if (!link.href || 
            link.href.startsWith('#') || 
            link.href.startsWith('javascript:') ||
            link.href.startsWith('mailto:') ||
            link.href.startsWith('tel:')) {
            return;
        }
        
        const url = new URL(link.href);
        
        // Chỉ thêm tham số vào các liên kết nội bộ hoặc liên kết đến các trang cụ thể
        if (url.hostname === window.location.hostname || 
            url.hostname.includes('ladipage') ||
            url.hostname.includes('clickbank')) {
            
            // Thêm tất cả các tham số URL hiện tại vào liên kết
            params.forEach((value, key) => {
                if (!url.searchParams.has(key)) {
                    url.searchParams.append(key, value);
                }
            });
            
            link.href = url.toString();
        }
      } catch (e) {}
    });
  }

  // Khởi tạo ClickID khi trang tải
  initClickID();

  // Thêm tham số vào các liên kết khi DOM đã sẵn sàng
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(appendParametersToAllLinks, 200);
    });
  } else {
    setTimeout(appendParametersToAllLinks, 100);
  }

  // Theo dõi các thay đổi DOM để cập nhật liên kết mới
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

  // Bắt đầu theo dõi thay đổi DOM
  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
})();
