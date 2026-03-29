(function() {
    'use strict';
    var el = document.querySelector('[data-entity-type]');
    if (!el) return;
    var entityType = el.dataset.entityType;
    var entityId = el.dataset.entityId;

    function sendEvent(url, payload) {
        var blob = new Blob([JSON.stringify(payload)], {type: 'application/json'});
        if (navigator.sendBeacon) {
            navigator.sendBeacon(url, blob);
        }
    }

    // Track page view after 1.5s delay
    setTimeout(function() {
        sendEvent('/api/track/pageview/', {entity_type: entityType, entity_id: entityId});
    }, 1500);

    // Track clicks
    document.addEventListener('click', function(e) {
        var btn = e.target.closest('[data-track-click]');
        if (!btn) return;
        sendEvent('/api/track/click/', {
            entity_type: entityType,
            entity_id: entityId,
            button_type: btn.dataset.trackClick
        });
    });
})();
