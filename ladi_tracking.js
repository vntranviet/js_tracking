<script>  // chuyển tiếp * các tham số trên domain Ladipage: GCLID, GBRAID, WBRAID

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
  </script>
