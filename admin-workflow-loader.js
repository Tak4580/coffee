(function () {
  function load() {
    const script = document.createElement('script');
    script.src = './admin-fixes.js?v=20260614-live-preview';
    document.head.appendChild(script);
  }
  document.readyState === 'complete' ? load() : window.addEventListener('load', load);
})();