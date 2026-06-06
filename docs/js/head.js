// 页面标题切换功能
(function () {
  // 这些变量会在 head.ejs 中通过 window 对象注入
  document.addEventListener('DOMContentLoaded', function () {
    const activeTitle = window.SITE_CONFIG.activeTitle;
    const inactiveTitle = window.SITE_CONFIG.inactiveTitle;

    document.addEventListener('visibilitychange', function () {
      document.title = document.hidden ? inactiveTitle : activeTitle;
    });
  });

  var storageKey = 'yorukumo-theme';

  function normalizeTheme(theme) {
    return theme === 'light' ? 'light' : 'dark';
  }

  function getSavedTheme() {
    try {
      var savedTheme = localStorage.getItem(storageKey);
      return savedTheme ? normalizeTheme(savedTheme) : 'light';
    } catch (error) {
      return 'light';
    }
  }

  function applyTheme(theme) {
    var nextTheme = normalizeTheme(theme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    updateThemeToggle(nextTheme);
  }

  function saveTheme(theme) {
    try {
      localStorage.setItem(storageKey, theme);
    } catch (error) {}
  }

  function updateThemeToggle(theme) {
    var toggle = document.querySelector('.theme-toggle');
    if (!toggle) return;

    var isDark = theme === 'dark';
    toggle.setAttribute('aria-pressed', String(isDark));
    toggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    toggle.setAttribute('title', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  }

  applyTheme(getSavedTheme());

  document.addEventListener('DOMContentLoaded', function () {
    var toggle = document.querySelector('.theme-toggle');
    if (!toggle) return;

    updateThemeToggle(getSavedTheme());
    toggle.addEventListener('click', function () {
      var currentTheme = normalizeTheme(document.documentElement.getAttribute('data-theme'));
      var nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
      saveTheme(nextTheme);
      applyTheme(nextTheme);
    });
  });
})();
