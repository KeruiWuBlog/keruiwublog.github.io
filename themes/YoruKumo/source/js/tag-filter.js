(function () {
  function splitTags(value) {
    return (value || '')
      .split('||')
      .map(function (name) { return name.trim(); })
      .filter(Boolean);
  }

  document.addEventListener('DOMContentLoaded', function () {
    var filter = document.querySelector('[data-tag-filter]');
    var timeline = document.querySelector('.timeline-wrapper');
    if (!filter || !timeline) return;

    var allChip = filter.querySelector('[data-tag-filter-all]');
    var tagChips = Array.prototype.slice.call(
      filter.querySelectorAll('.tag-filter-chip[data-tag]')
    );
    var toggle = filter.querySelector('[data-tag-filter-toggle]');
    var current = filter.querySelector('[data-tag-filter-current]');
    var nodes = Array.prototype.slice.call(timeline.children);

    var activeTags = [];

    function clearAnimationState(node) {
      // GSAP sets opacity/transform inline on entrance; clear it so freshly
      // revealed items are never stuck mid-animation after filtering.
      node.style.opacity = '1';
      node.style.transform = 'none';
    }

    function updateCurrentLabel() {
      if (!current) return;
      if (!activeTags.length) {
        current.textContent = allChip
          ? allChip.querySelector('.tag-filter-chip-name').textContent
          : '';
        return;
      }
      if (activeTags.length === 1) {
        current.textContent = activeTags[0];
      } else {
        current.textContent = activeTags[0] + ' +' + (activeTags.length - 1);
      }
    }

    function applyFilter(reveal) {
      if (allChip) {
        var allActive = activeTags.length === 0;
        allChip.classList.toggle('is-active', allActive);
        allChip.setAttribute('aria-pressed', String(allActive));
      }
      tagChips.forEach(function (chip) {
        var isActive = activeTags.indexOf(chip.dataset.tag) !== -1;
        chip.classList.toggle('is-active', isActive);
        chip.setAttribute('aria-pressed', String(isActive));
      });

      // Show/hide each timeline item, then hide any year node whose items
      // were all filtered out.
      var yearNode = null;
      var yearHasVisible = false;

      function finalizeYear() {
        if (!yearNode) return;
        yearNode.classList.toggle('is-filtered-out', !yearHasVisible);
        if (yearHasVisible && reveal) clearAnimationState(yearNode);
      }

      nodes.forEach(function (node) {
        if (node.classList.contains('timeline-year-node')) {
          finalizeYear();
          yearNode = node;
          yearHasVisible = false;
          return;
        }
        if (!node.classList.contains('timeline-item')) return;

        var tags = splitTags(node.dataset.tags);
        var match = !activeTags.length || activeTags.some(function (tag) {
          return tags.indexOf(tag) !== -1;
        });
        node.classList.toggle('is-filtered-out', !match);
        if (match) {
          if (reveal) clearAnimationState(node);
          yearHasVisible = true;
        }
      });
      finalizeYear();

      updateCurrentLabel();
    }

    if (allChip) {
      allChip.addEventListener('click', function () {
        if (!activeTags.length) return;
        activeTags = [];
        applyFilter(true);
      });
    }

    tagChips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var tag = chip.dataset.tag;
        var index = activeTags.indexOf(tag);
        if (index === -1) {
          activeTags.push(tag);
        } else {
          activeTags.splice(index, 1);
        }
        applyFilter(true);
      });
    });

    if (toggle) {
      toggle.addEventListener('click', function () {
        var open = filter.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', String(open));
      });
    }

    applyFilter(false);
  });
})();
