(function() {
    'use strict';
    if (!window.IntersectionObserver || !navigator.sendBeacon) return;

    var cardConfig = {
        'startup-card':    {type: 'startup',    idAttr: 'data-startup-id'},
        'franchise-card':  {type: 'franchise',  idAttr: 'data-franchise-id'},
        'agency-card':     {type: 'agency',     idAttr: 'data-agency-id'},
        'specialist-card': {type: 'specialist', idAttr: 'data-specialist-id'}
    };

    var tracked = {};
    var pendingBatch = [];
    var flushTimer = null;

    function flushBatch() {
        if (pendingBatch.length === 0) return;
        var items = pendingBatch.splice(0);
        var blob = new Blob([JSON.stringify({items: items})], {type: 'application/json'});
        navigator.sendBeacon('/api/track/impression/', blob);
    }

    var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (!entry.isIntersecting) return;
            var card = entry.target;
            var et = card.dataset.impType;
            var eid = card.dataset.impId;
            if (!et || !eid) return;
            var key = et + ':' + eid;
            if (tracked[key]) return;
            tracked[key] = true;
            pendingBatch.push({entity_type: et, entity_id: parseInt(eid)});
            clearTimeout(flushTimer);
            flushTimer = setTimeout(flushBatch, 500);
        });
    }, {threshold: 0.5});

    Object.keys(cardConfig).forEach(function(cls) {
        var cfg = cardConfig[cls];
        document.querySelectorAll('.' + cls).forEach(function(card) {
            var eid = card.getAttribute(cfg.idAttr);
            if (!eid) return;
            card.dataset.impType = cfg.type;
            card.dataset.impId = eid;
            observer.observe(card);
        });
    });

    window.addEventListener('beforeunload', flushBatch);
})();
