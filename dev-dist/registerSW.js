if ("serviceWorker" in navigator)
  navigator.serviceWorker.register("/toilet-finder/dev-sw.js?dev-sw", {
    scope: "/toilet-finder/",
  });
