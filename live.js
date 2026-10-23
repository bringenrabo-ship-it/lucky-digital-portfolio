(function () {
  "use strict";
  var C = window.LD_CONFIG || {};
  if (!C.SUPABASE_URL || !C.SUPABASE_ANON_KEY || !window.supabase) return; // static HTML stays as the fallback
  var sb = window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY);
  var preview = /[?&]preview=1/.test(location.search);
  var FONTS = { system: '-apple-system,"Segoe UI",Inter,Roboto,Helvetica,Arial,sans-serif', serif: 'Georgia,"Times New Roman",serif', humanist: '"Trebuchet MS","Segoe UI",Helvetica,sans-serif', wide: "Verdana,Geneva,sans-serif", mono: '"Courier New",ui-monospace,monospace' };
  function h(t, a, k) { var e = document.createElement(t); for (var x in a || {}) e.setAttribute(x, a[x]); (k || []).forEach(function (c) { if (c) e.append(c); }); return e; }
  function web(u) { return /^https?:\/\/\S+$/.test(u || "") ? u : null; }
  function link(u) { return web(u) || (/^#[\w-]+$/.test(u || "") ? u : null); }
  function rows(table) {
    var q = sb.from(table).select("*").order("sort");
    if (!preview) q = q.eq("status", "published");
    return q.then(function (r) { return r.error || !r.data ? [] : r.data; }, function () { return []; });
  }
  function settings() {
    return sb.from("site_settings").select("key,value").then(function (r) { var o = {}; (r.data || []).forEach(function (x) { o[x.key] = x.value; }); return o; }, function () { return {}; });
  }
  function fmt(d) { try { return new Date(d + "T00:00:00").toLocaleDateString(undefined, { year: "numeric", month: "short" }); } catch (e) { return ""; } }
  function appearance(s) {
    var col = function (k) { return /^#[0-9a-f]{6}$/i.test(s[k] || "") ? s[k] : null; }, root = [], css = "";
    [["ap_primary", "--green"], ["ap_secondary", "--secondary"], ["ap_accent", "--accent"]].forEach(function (m) { if (col(m[0])) root.push(m[1] + ":" + s[m[0]]); });
    if (FONTS[s.ap_heading_font]) root.push("--hf:" + FONTS[s.ap_heading_font]);
    if (FONTS[s.ap_body_font]) root.push("--bf:" + FONTS[s.ap_body_font]);
    var br = { pill: "99px", rounded: "14px", square: "4px" }[s.ap_btn_style]; if (br) root.push("--btnr:" + br);
    if (/^\d+$/.test(s.ap_radius || "") && +s.ap_radius <= 40) root.push("--r:" + s.ap_radius + "px");
    if (root.length) css += ":root{" + root.join(";") + "}";
    var d = [col("ap_bg_dark") && "--bg:" + s.ap_bg_dark, col("ap_text_dark") && "--text:" + s.ap_text_dark].filter(Boolean);
    var l = [col("ap_bg_light") && "--bg:" + s.ap_bg_light, col("ap_text_light") && "--text:" + s.ap_text_light].filter(Boolean);
    if (d.length) css += ":root:not([data-theme=light]){" + d.join(";") + "}";
    if (l.length) css += "[data-theme=light]{" + l.join(";") + "}";
    if (css) document.head.append(h("style", {}, [css]));
  }
  function texts(s) {
    var hh = document.querySelector('[data-ld="hero_heading"]');
    if (hh && s.hero_heading) { hh.replaceChildren(); s.hero_heading.split("\n").forEach(function (t, i) { if (i) hh.append(h("br")); hh.append(t); }); }
    var li = document.querySelector('[data-ld="hero_intro"]'); if (li && s.hero_intro) li.textContent = s.hero_intro;
    ["primary", "secondary"].forEach(function (w) {
      var a = document.querySelector('[data-ld-cta="' + w + '"]'); if (!a) return;
      if (s["cta_" + w + "_text"]) a.textContent = s["cta_" + w + "_text"];
      if (link(s["cta_" + w + "_link"])) a.href = s["cta_" + w + "_link"];
    });
    var email = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s.email || "") ? s.email : null;
    var num = (s.whatsapp || "").replace(/\D/g, ""); if (num.length < 8 || num.length > 15) num = null;
    window.LD_WA = num || undefined;
    document.querySelectorAll('a[href^="mailto:"]').forEach(function (a) { if (!email) return; if (a.textContent.indexOf("@") > -1) a.textContent = email; a.href = "mailto:" + email; });
    document.querySelectorAll('a[href*="wa.me/"]').forEach(function (a) { if (num) a.href = a.href.replace(/wa\.me\/\d+/, "wa.me/" + num); });
    var wl = document.querySelector('.contact-info a[href*="wa.me"]'); if (wl && num) wl.textContent = "+" + num;
    var tg = document.querySelector(".footer strong + p"); if (tg && s.tagline) tg.textContent = s.tagline;
    var sn = document.getElementById("social-links"), n = 0;
    [["social_linkedin", "LinkedIn"], ["social_github", "GitHub"], ["social_instagram", "Instagram"], ["social_other", "Profile"]].forEach(function (k) {
      if (web(s[k[0]])) { sn.append(h("a", { href: s[k[0]], target: "_blank", rel: "noopener" }, [k[1]])); n++; }
    });
    if (n) sn.hidden = false;
    // About
    var ab = document.getElementById("about"), ex = document.getElementById("about-extra");
    if (s.about_bio) { ab.querySelectorAll(":scope > p").forEach(function (p) { p.remove(); }); s.about_bio.split(/\n\s*\n/).reverse().forEach(function (t) { if (t.trim()) ab.querySelector("h2").after(h("p", {}, [t.trim()])); }); }
    var who = [s.about_name, s.about_title].filter(Boolean).join(" · ");
    if (web(s.about_photo) && !/\.pdf$/i.test(s.about_photo)) ex.append(h("img", { class: "avatar", src: s.about_photo, alt: s.about_name ? "Photo of " + s.about_name : "Profile photo", loading: "lazy" }));
    if (who) ex.append(h("p", { class: "meta" }, [h("strong", {}, [who])]));
    [["about_education", "Education"], ["about_interests", "Interests"], ["about_skills", "Skills"]].forEach(function (k) { if (s[k[0]]) ex.append(h("p", { class: "meta" }, [h("strong", {}, [k[1] + ": "]), s[k[0]]])); });
  }
  function show(id, label) {
    var sec = document.getElementById(id); sec.hidden = false;
    var c = document.querySelector('#links a[href="#contact"]'); if (c && c.parentNode) c.parentNode.before(h("li", {}, [h("a", { href: "#" + id }, [label])]));
  }

  Promise.all([settings(), rows("services"), rows("projects"), rows("achievements"), rows("experience")]).then(function (res) {
    var s = res[0], services = res[1], projects = res[2], ach = res[3], exp = res[4];
    appearance(s); texts(s);
    var num = window.LD_WA || "2348031350375";
    var grid = document.querySelector("#services .cards");
    if (grid && services.length) {
      grid.replaceChildren();
      services.forEach(function (x) {
        grid.append(h("article", { class: "card glass" }, [h("h3", {}, [x.title]), h("p", {}, [x.description]), x.price ? h("p", { class: "price" }, [x.price]) : "",
          h("a", { class: "btn btn-glass", target: "_blank", rel: "noopener", href: "https://wa.me/" + num + "?text=" + encodeURIComponent("Hello Lucky Digital, I'm interested in " + x.title + ".") }, ["Enquire on WhatsApp"])]));
      });
    }
    var sec = document.getElementById("projects"), next = sec.querySelector(".upcoming");
    if (projects.length) {
      sec.querySelectorAll(".project").forEach(function (p) { p.remove(); });
      if (projects.length > 1) sec.querySelector("h2").textContent = "Projects";
      projects.forEach(function (x) {
        var host = x.url; try { host = new URL(x.url).host; } catch (e) {}
        var prev = web(x.image_url) && !/\.pdf$/i.test(x.image_url)
          ? h("div", { class: "preview" }, [h("img", { src: x.image_url, alt: x.title + " screenshot", loading: "lazy" })])
          : h("div", { class: "preview", "aria-hidden": "true" }, [h("div", { class: "bar" }, [h("i"), h("i"), h("i"), h("span", {}, [host])]), h("div", { class: "screen" }, [h("strong", {}, [x.title]), h("span", { class: "l1" }), h("span", { class: "l2" }), h("span", { class: "pill" })])]);
        sec.insertBefore(h("article", { class: "project glass" }, [prev, h("div", { class: "project-copy" }, [
          x.category || x.featured ? h("p", { class: "meta" }, [[x.featured ? "Featured" : "", x.category].filter(Boolean).join(" · ")]) : "",
          h("h3", {}, [x.title]), h("p", {}, [x.description]), web(x.url) ? h("a", { class: "btn btn-green", href: x.url, target: "_blank", rel: "noopener" }, ["View Live Project"]) : ""])]), next);
      });
    }
    if (ach.length) {
      var al = document.getElementById("ach-list");
      ach.forEach(function (x) {
        var pdf = /\.pdf$/i.test(x.image_url || "");
        al.append(h("article", { class: "card glass" }, [
          web(x.image_url) && !pdf ? h("img", { class: "thumb", src: x.image_url, alt: x.title, loading: "lazy" }) : "",
          h("h3", {}, [x.title]), h("p", { class: "meta" }, [[x.issuer, x.date ? fmt(x.date) : ""].filter(Boolean).join(" · ")]), x.description ? h("p", {}, [x.description]) : "",
          web(x.link) ? h("a", { class: "btn btn-glass", href: x.link, target: "_blank", rel: "noopener" }, ["Verify"]) : "",
          web(x.image_url) && pdf ? h("a", { class: "btn btn-glass", href: x.image_url, target: "_blank", rel: "noopener" }, ["View certificate"]) : ""]));
      });
      show("achievements", "Achievements");
    }
    if (exp.length) {
      var el = document.getElementById("exp-list");
      exp.forEach(function (x) {
        var when = x.start_date ? fmt(x.start_date) + " – " + (x.end_date ? fmt(x.end_date) : "Present") : "";
        el.append(h("article", { class: "card glass" }, [h("h3", {}, [x.role]), h("p", { class: "meta" }, [[x.organisation, x.kind, when].filter(Boolean).join(" · ")]), x.description ? h("p", {}, [x.description]) : ""]));
      });
      show("experience", "Experience");
    }
  });
})();
