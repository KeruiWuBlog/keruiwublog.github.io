(function () {
  const STORAGE_KEY = 'yorukumo:site-language';
  const DEFAULT_LANGUAGE = 'en';

  function normalizeLanguage(language) {
    return String(language || DEFAULT_LANGUAGE).toLowerCase();
  }

  function readLanguage() {
    try {
      return normalizeLanguage(window.localStorage.getItem(STORAGE_KEY) || DEFAULT_LANGUAGE);
    } catch (error) {
      return DEFAULT_LANGUAGE;
    }
  }

  function writeLanguage(language) {
    try {
      window.localStorage.setItem(STORAGE_KEY, language);
    } catch (error) {
      // localStorage can be disabled; the in-page switch still works.
    }
  }

  function getLocalizedAttribute(element, prefix, language) {
    return (
      element.getAttribute(prefix + language) ||
      element.getAttribute(prefix + language.split('-')[0]) ||
      element.getAttribute(prefix + DEFAULT_LANGUAGE)
    );
  }

  function applyLanguage(language) {
    const activeLanguage = normalizeLanguage(language);
    document.documentElement.setAttribute('lang', activeLanguage);
    document.body.setAttribute('data-site-language', activeLanguage);

    document.querySelectorAll('[data-site-language-option]').forEach((button) => {
      const isActive = normalizeLanguage(button.dataset.siteLanguageOption) === activeLanguage;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });

    document.querySelectorAll('.localized-menu').forEach((link) => {
      const text = getLocalizedAttribute(link, 'data-menu-', activeLanguage);
      if (text) link.textContent = text;
    });

    document.querySelectorAll('.localized-post-link').forEach((link) => {
      const href = getLocalizedAttribute(link, 'data-href-', activeLanguage);
      const title = getLocalizedAttribute(link, 'data-title-', activeLanguage);
      const excerpt = getLocalizedAttribute(link, 'data-excerpt-', activeLanguage);
      const titleNode = link.querySelector('.localized-post-title');
      const excerptNode = link.querySelector('.localized-post-excerpt');

      if (href) link.setAttribute('href', href);

      if (title && titleNode) {
        titleNode.textContent = title;
        titleNode.setAttribute('title', title);
      }

      if (excerptNode && excerpt !== null) {
        excerptNode.innerHTML = excerpt || '';
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    applyLanguage(readLanguage());

    document.querySelectorAll('[data-site-language-option]').forEach((button) => {
      button.addEventListener('click', function () {
        const nextLanguage = normalizeLanguage(button.dataset.siteLanguageOption);
        writeLanguage(nextLanguage);
        applyLanguage(nextLanguage);
      });
    });

    // On a post page, choosing a translated version should also become the
    // site-wide preference so the home page follows the same language.
    document.querySelectorAll('.post-language-option[hreflang]').forEach((link) => {
      link.addEventListener('click', function () {
        writeLanguage(normalizeLanguage(link.getAttribute('hreflang')));
      });
    });
  });
})();
