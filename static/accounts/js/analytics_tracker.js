(function() {
    'use strict';
    var el = document.querySelector('[data-entity-type]');
    if (!el) return;
    var entityType = el.dataset.entityType;
    var entityId = el.dataset.entityId;

    // Track page view after 1.5s delay
    setTimeout(function() {
        var data = JSON.stringify({entity_type: entityType, entity_id: entityId});
        if (navigator.sendBeacon) {
            navigator.sendBeacon('/api/track/pageview/', data);
        }
    }, 1500);

    // Track clicks
    document.addEventListener('click', function(e) {
        var btn = e.target.closest('[data-track-click]');
        if (!btn) return;
        var data = JSON.stringify({
            entity_type: entityType,
            entity_id: entityId,
            button_type: btn.dataset.trackClick
        });
        if (navigator.sendBeacon) {
            navigator.sendBeacon('/api/track/click/', data);
        }
    });
})();
