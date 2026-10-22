(function () {
  var key = document.documentElement.getAttribute("data-theme-key") || "ld-theme";
  function get() { try { return localStorage.getItem(key) || "dark"; } catch (e) { return "dark"; } }
  function apply(t) {
    document.documentElement.setAttribute("data-theme", t);
    var b = document.querySelector(".theme-btn");
    if (b) { b.textContent = t === "dark" ? "Light" : "Dark"; b.setAttribute("aria-label", "Switch to " + (t === "dark" ? "light" : "dark") + " mode"); }
  }
  apply(get());
  document.addEventListener("DOMContentLoaded", function () {
    apply(get());
    var b = document.querySelector(".theme-btn");
    if (b) b.addEventListener("click", function () {
      var t = get() === "dark" ? "light" : "dark";
      try { localStorage.setItem(key, t); } catch (e) {}
      apply(t);
    });
  });
})();
