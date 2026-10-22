(function () {
  "use strict";
  var C = window.LD_CONFIG || {};
  if (!C.SUPABASE_URL || !C.SUPABASE_ANON_KEY || !window.supabase) return; // static HTML stays as the fallback
  var sb = window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY);
  var preview = /[?&]preview=1/.test(location.search);
  function h(t, a, k) { var e = document.createElement(t); for (var x in a || {}) e.setAttribute(x, a[x]); (k || []).forEach(function (c) { e.append(c); }); return e; }
  function rows(table) {
    var q = sb.from(table).select("*").order("sort");
    if (!preview) q = q.eq("status", "published");
    return q.then(function (r) { return r.error || !r.data ? [] : r.data; }, function () { return []; });
  }
  function settings() {
    return sb.from("site_settings").select("key,value").then(function (r) {
      var o = {}; (r.data || []).forEach(function (x) { o[x.key] = x.value; }); return o;
    }, function () { return {}; });
  }
  function wa(title) { return "Hello Lucky Digital, I'm interested in " + title + "."; }

  Promise.all([settings(), rows("services"), rows("projects")]).then(function (res) {
    var s = res[0], services = res[1], projects = res[2];

    var email = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s.email || "") ? s.email : null;
    var num = (s.whatsapp || "").replace(/\D/g, ""); if (num.length < 8 || num.length > 15) num = null;
    window.LD_WA = num || undefined;
    document.querySelectorAll('a[href^="mailto:"]').forEach(function (a) {
      if (!email) return;
      if (a.textContent.indexOf("@") > -1) a.textContent = email;
      a.href = "mailto:" + email;
    });
    document.querySelectorAll('a[href*="wa.me/"]').forEach(function (a) {
      if (num) a.href = a.href.replace(/wa\.me\/\d+/, "wa.me/" + num);
    });
    var wl = document.querySelector('.contact-info a[href*="wa.me"]');
    if (wl && num) wl.textContent = "+" + num;
    var tg = document.querySelector(".footer strong + p");
    if (tg && s.tagline) tg.textContent = s.tagline;

    var grid = document.querySelector("#services .cards");
    if (grid && services.length) {
      grid.replaceChildren();
      services.forEach(function (x) {
        grid.append(h("article", { class: "card glass" }, [
          h("h3", {}, [x.title]), h("p", {}, [x.description]),
          x.price ? h("p", { class: "price" }, [x.price]) : "",
          h("a", { class: "btn btn-glass", target: "_blank", rel: "noopener", href: "https://wa.me/" + (num || "2348031350375") + "?text=" + encodeURIComponent(wa(x.title)) }, ["Enquire on WhatsApp"])
        ]));
      });
    }
    var sec = document.getElementById("projects"), next = sec && sec.querySelector(".upcoming");
    if (sec && projects.length) {
      sec.querySelectorAll(".project").forEach(function (p) { p.remove(); });
      projects.forEach(function (x) {
        var host = x.url; try { host = new URL(x.url).host; } catch (e) {}
        var art = h("article", { class: "project glass" }, [
          h("div", { class: "preview", "aria-hidden": "true" }, [
            h("div", { class: "bar" }, [h("i"), h("i"), h("i"), h("span", {}, [host])]),
            h("div", { class: "screen" }, [h("strong", {}, [x.title]), h("span", { class: "l1" }), h("span", { class: "l2" }), h("span", { class: "pill" })])]),
          h("div", { class: "project-copy" }, [h("h3", {}, [x.title]), h("p", {}, [x.description]),
            h("a", { class: "btn btn-green", href: x.url, target: "_blank", rel: "noopener" }, ["View Live Project"])])]);
        sec.insertBefore(art, next);
      });
    }
  });
})();
