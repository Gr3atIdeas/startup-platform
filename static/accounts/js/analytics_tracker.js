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

    // ── Page view (1.5s delay) ──
    setTimeout(function() {
        sendEvent('/api/track/pageview/', {entity_type: entityType, entity_id: entityId});
    }, 1500);

    // ── Click tracking ──
    document.addEventListener('click', function(e) {
        var btn = e.target.closest('[data-track-click]');
        if (!btn) return;
        sendEvent('/api/track/click/', {
            entity_type: entityType,
            entity_id: entityId,
            button_type: btn.dataset.trackClick
        });
    });

    // ── Engagement: time on page + scroll depth ──
    var elapsedSeconds = 0;
    var maxScrollPercent = 0;
    var timerActive = true;
    var engagementSent = false;

    // Time counter (only when tab is visible)
    var timer = setInterval(function() {
        if (timerActive) elapsedSeconds++;
    }, 1000);

    document.addEventListener('visibilitychange', function() {
        timerActive = !document.hidden;
        if (document.hidden) sendEngagement();
    });

    // Scroll depth (throttled)
    var scrollTick = false;
    window.addEventListener('scroll', function() {
        if (scrollTick) return;
        scrollTick = true;
        requestAnimationFrame(function() {
            var docHeight = document.documentElement.scrollHeight - window.innerHeight;
            if (docHeight > 0) {
                var pct = Math.round(window.scrollY / docHeight * 100);
                if (pct > maxScrollPercent) maxScrollPercent = pct;
            }
            scrollTick = false;
        });
    });

    function sendEngagement() {
        if (engagementSent || elapsedSeconds < 3) return;
        engagementSent = true;
        sendEvent('/api/track/engagement/', {
            entity_type: entityType,
            entity_id: entityId,
            time_on_page: elapsedSeconds,
            scroll_depth: maxScrollPercent
        });
    }

    window.addEventListener('beforeunload', function() {
        clearInterval(timer);
        sendEngagement();
    });
})();
