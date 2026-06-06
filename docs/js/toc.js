(function () {
  function getHashId(link) {
    var href = link.getAttribute('href') || '';
    if (href.charAt(0) !== '#') return '';

    try {
      return decodeURIComponent(href.slice(1));
    } catch (error) {
      return href.slice(1);
    }
  }

  function initPostToc() {
    var tocLinks = Array.from(document.querySelectorAll('.post-toc-link'));
    if (!tocLinks.length) return;

    var headings = tocLinks
      .map(function (link) {
        var id = getHashId(link);
        return id ? document.getElementById(id) : null;
      })
      .filter(Boolean);

    if (!headings.length) return;

    var ticking = false;

    function setActive(id) {
      tocLinks.forEach(function (link) {
        link.classList.toggle('is-active', getHashId(link) === id);
      });
    }

    function updateActive() {
      ticking = false;

      var active = headings[0];
      var offset = 96;

      headings.forEach(function (heading) {
        if (heading.getBoundingClientRect().top <= offset) {
          active = heading;
        }
      });

      setActive(active.id);
    }

    function requestUpdate() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateActive);
    }

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    updateActive();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPostToc);
  } else {
    initPostToc();
  }
})();
