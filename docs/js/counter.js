/**
 * Front-end for the self-hosted page-view counter (Cloudflare Worker + KV).
 *
 * Reads window.SITE_CONFIG.counter ({ enable, endpoint }), calls the Worker once
 * per page load with the current path + a stable per-browser visitor id, then
 * fills the placeholder spans:
 *   #counter_page_pv   (inside #counter_container_page_pv) — per-post views
 *   #counter_site_pv   (inside #counter_container_site_pv) — site total views
 *   #counter_site_uv                                       — site unique visitors
 *
 * On list pages (home/archive) it also batch-reads the views of every listed
 * post via the Worker's peek mode (no increment) and fills each
 *   .postItem-views-value  (inside a [data-counter-path] element).
 *
 * On any network/config error the placeholders are simply left as-is.
 */
(function () {
  var cfg = (window.SITE_CONFIG && window.SITE_CONFIG.counter) || {};
  if (!cfg.enable || !cfg.endpoint) return;
  var isLocalDebug =
    location.hostname === 'localhost' ||
    location.hostname === '127.0.0.1' ||
    location.hostname === '::1' ||
    location.hostname === '[::1]';

  function getVisitorId() {
    try {
      var key = 'blog_visitor_id';
      var id = window.localStorage.getItem(key);
      if (!id) {
        id = Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
        window.localStorage.setItem(key, id);
      }
      return id;
    } catch (e) {
      return '';
    }
  }

  function format(n) {
    var num = Number(n);
    return isNaN(num) ? n : num.toLocaleString();
  }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = format(value);
  }

  function reveal(id) {
    var el = document.getElementById(id);
    if (el) el.style.display = '';
  }

  function withParams(params) {
    return cfg.endpoint + (cfg.endpoint.indexOf('?') === -1 ? '?' : '&') + params;
  }

  // The counting key for the current article. Translation versions of one
  // article share a key (so their views are summed); other pages fall back to
  // their path.
  function getPageKey() {
    var el = document.getElementById('counter_container_page_pv');
    var key = el && el.getAttribute('data-counter-key');
    return key || location.pathname;
  }

  // Count this page view + fill the per-post and footer site counters.
  function runHit() {
    if (isLocalDebug) {
      runPagePeek();
      return;
    }

    var url = withParams(
      'path=' +
        encodeURIComponent(getPageKey()) +
        '&visitor=' +
        encodeURIComponent(getVisitorId())
    );

    fetch(url, { method: 'GET', mode: 'cors', cache: 'no-store' })
      .then(function (res) {
        return res.ok ? res.json() : null;
      })
      .then(function (data) {
        if (!data) return;
        if (data.page_pv != null) {
          setText('counter_page_pv', data.page_pv);
          reveal('counter_container_page_pv');
        }
        if (data.site_pv != null) {
          setText('counter_site_pv', data.site_pv);
          reveal('counter_container_site_pv');
        }
        if (data.site_uv != null) {
          setText('counter_site_uv', data.site_uv);
        }
      })
      .catch(function () {
        /* network error — leave placeholders untouched */
      });
  }

  function runPagePeek() {
    var container = document.getElementById('counter_container_page_pv');
    if (!container) return;

    var key = getPageKey();
    var url = withParams('peek=1&paths=' + encodeURIComponent(key));

    fetch(url, { method: 'GET', mode: 'cors', cache: 'no-store' })
      .then(function (res) {
        return res.ok ? res.json() : null;
      })
      .then(function (data) {
        if (!data || !data.counts || data.counts[key] == null) return;
        setText('counter_page_pv', data.counts[key]);
        reveal('counter_container_page_pv');
      })
      .catch(function () {
        /* network error — leave placeholders untouched */
      });
  }

  // Read (without incrementing) the views of every listed post and fill them.
  function runPeek() {
    var nodes = document.querySelectorAll('[data-counter-key]');
    if (!nodes.length) return;

    var byPath = {};
    var paths = [];
    Array.prototype.forEach.call(nodes, function (node) {
      var p = node.getAttribute('data-counter-key');
      if (!p || !node.classList.contains('postItem-views')) return;
      if (!byPath[p]) {
        byPath[p] = [];
        paths.push(p);
      }
      byPath[p].push(node);
    });
    if (!paths.length) return;

    var url = withParams('peek=1&paths=' + encodeURIComponent(paths.join(',')));

    fetch(url, { method: 'GET', mode: 'cors', cache: 'no-store' })
      .then(function (res) {
        return res.ok ? res.json() : null;
      })
      .then(function (data) {
        if (!data || !data.counts) return;
        paths.forEach(function (p) {
          if (data.counts[p] == null) return;
          byPath[p].forEach(function (node) {
            var valueEl = node.querySelector('.postItem-views-value');
            if (valueEl) valueEl.textContent = format(data.counts[p]);
            node.style.display = '';
          });
        });
      })
      .catch(function () {
        /* network error — leave placeholders untouched */
      });
  }

  function run() {
    runHit();
    runPeek();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
