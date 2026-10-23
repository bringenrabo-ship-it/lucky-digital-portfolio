(function () {
  "use strict";
  var C = window.LD_CONFIG || {}, app = document.getElementById("app"), msgEl = document.getElementById("msg");
  function $(s) { return document.querySelector(s); }
  function h(t, a, k) { var e = document.createElement(t); for (var x in a || {}) e.setAttribute(x, a[x]); (k || []).forEach(function (c) { e.append(c); }); return e; }
  var timer; function msg(t, bad) { msgEl.textContent = t || ""; msgEl.className = bad ? "bad" : "ok"; clearTimeout(timer); if (t && !bad) timer = setTimeout(function () { msgEl.textContent = ""; }, 4000); }
  function btn(label, fn, off, cls) { var b = h("button", { type: "button", class: "btn " + (cls || "btn-glass") }, [label]); b.disabled = !!off; b.addEventListener("click", fn); return b; }
  if (!C.SUPABASE_URL || !C.SUPABASE_ANON_KEY) { msg("Fill in SUPABASE_URL and SUPABASE_ANON_KEY in config.js.", 1); app.replaceChildren(); return; }
  var sb = window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY);
  var tab = "overview", rows = [], BUCKET = "media", user = null;
  var FONTS = [["system", "System default"], ["serif", "Georgia (serif)"], ["humanist", "Trebuchet"], ["wide", "Verdana"], ["mono", "Courier (monospace)"]];
  var AD = { ap_primary: "#2dff7a", ap_secondary: "#5078ff", ap_accent: "#2dff7a", ap_bg_dark: "#070908", ap_text_dark: "#f3f5f4", ap_bg_light: "#f4f7f5", ap_text_light: "#101512", ap_heading_font: "system", ap_body_font: "system", ap_btn_style: "pill", ap_radius: "24" };
  var V = {
    url: [function (v) { return /^https?:\/\/\S+$/.test(v); }, "Enter a full URL starting with https://"],
    link: [function (v) { return /^(#[\w-]+|https?:\/\/\S+)$/.test(v); }, "Use a full https:// URL or a section like #contact"],
    email: [function (v) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v); }, "Enter a valid email address"],
    color: [function (v) { return /^#[0-9a-fA-F]{6}$/.test(v); }, "Colour must look like #1a2b3c"],
    num: [function (v) { return /^\d+$/.test(v) && +v <= 40; }, "Enter a number from 0 to 40"]
  };
  // field: [name, label, type, max, required, options]
  var COL = {
    projects: { label: "Projects", key: "title", f: [["title", "Title", "i", 80, 1], ["category", "Category", "i", 60], ["description", "Description", "a", 400], ["url", "Project link", "url", 300, 1], ["image_url", "Project image", "file", 300], ["featured", "Featured project", "check"]] },
    achievements: { label: "Achievements", key: "title", f: [["title", "Award or certificate title", "i", 120, 1], ["issuer", "Issuing organisation", "i", 120], ["description", "Description", "a", 600], ["date", "Date", "date"], ["link", "Verification link", "url", 300], ["image_url", "Certificate image or PDF", "file", 300]] },
    experience: { label: "Experience", key: "role", f: [["role", "Role", "i", 120, 1], ["organisation", "Organisation", "i", 120], ["kind", "Type", "sel", 0, 1, [["Leadership"], ["Volunteer"], ["Professional"]]], ["start_date", "Start date", "date"], ["end_date", "End date (empty = present)", "date"], ["description", "Roles and responsibilities", "a", 800]] },
    services: { label: "Skills and services", key: "title", f: [["title", "Title", "i", 80, 1], ["description", "Description", "a", 300], ["price", "Price label", "i", 40]] }
  };
  var SET = {
    homepage: { label: "Homepage", f: [["hero_heading", "Hero heading (new line = line break)", "a", 120], ["hero_intro", "Introduction", "a", 300], ["cta_primary_text", "Main button text", "i", 40], ["cta_primary_link", "Main button link", "link", 300], ["cta_secondary_text", "Second button text", "i", 40], ["cta_secondary_link", "Second button link", "link", 300]] },
    about: { label: "About me", f: [["about_name", "Full name", "i", 80], ["about_title", "Professional title", "i", 80], ["about_bio", "Biography (blank line = new paragraph)", "a", 1500], ["about_education", "Education", "a", 400], ["about_interests", "Areas of interest", "i", 200], ["about_skills", "Skills (comma separated)", "i", 200], ["about_photo", "Profile photograph", "file", 300]] },
    social: { label: "Social links", f: [["social_linkedin", "LinkedIn", "url", 300], ["social_github", "GitHub", "url", 300], ["social_instagram", "Instagram", "url", 300], ["social_other", "Other profile", "url", 300]] },
    settings: { label: "Settings", f: [["email", "Contact email", "email", 120], ["whatsapp", "WhatsApp number (digits with country code)", "i", 20], ["tagline", "Footer tagline", "i", 120]] }
  };
  var NAV = [["overview", "Overview"], ["homepage", "Homepage"], ["about", "About me"], ["appearance", "Appearance"], ["projects", "Projects"], ["achievements", "Achievements"], ["experience", "Experience"], ["services", "Skills & services"], ["social", "Social links"], ["settings", "Settings"]];

  function mk(d, val) {
    var n = d[0], t = d[2], el, get;
    if (t === "check") { el = h("input", { type: "checkbox", name: n }); el.checked = !!val; get = function () { return el.checked; }; return { wrap: h("label", { class: "row" }, [el, d[1]]), get: get }; }
    if (t === "sel") { el = h("select", { name: n }, d[5].map(function (o) { return h("option", { value: o[0] }, [o[1] || o[0]]); })); el.value = val || d[5][0][0]; }
    else if (t === "a") { el = h("textarea", { name: n, rows: 4, maxlength: d[3] }); el.value = val || ""; }
    else if (t === "color") { el = h("input", { name: n, type: "color" }); el.value = /^#[0-9a-f]{6}$/i.test(val) ? val : AD[n]; }
    else { el = h("input", { name: n, maxlength: d[3] || 200, type: t === "date" ? "date" : t === "email" ? "email" : "text" }); el.value = val || ""; }
    get = function () { return el.value.trim(); };
    var wrap = h("label", {}, [d[1], el]);
    if (t === "file") {
      var st = h("small", { class: "note" }, ["Paste an https:// link or upload a JPG, PNG, WebP, GIF or PDF (max 5 MB)."]), f = h("input", { type: "file", accept: "image/jpeg,image/png,image/webp,image/gif,application/pdf" });
      f.addEventListener("change", function () {
        var file = f.files[0]; if (!file) return;
        if (["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"].indexOf(file.type) < 0) { st.textContent = "Unsupported file type."; return; }
        if (file.size > 5 * 1048576) { st.textContent = "File is larger than 5 MB."; return; }
        st.textContent = "Uploading…";
        var path = n + "/" + Date.now() + "-" + file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").slice(-60);
        sb.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false }).then(function (r) {
          if (r.error) { st.textContent = "Upload failed: " + r.error.message + " (did you run supabase-update.sql?)"; return; }
          el.value = sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl; st.textContent = "Uploaded. Save changes to keep it.";
        });
      });
      wrap.append(f, st);
    }
    return { wrap: wrap, get: get, el: el };
  }
  function check(fields, vals) {
    for (var i = 0; i < fields.length; i++) {
      var d = fields[i], v = vals[d[0]], t = d[2] === "file" ? "url" : d[2];
      if (d[4] && !v) return d[1] + " is required.";
      if (v && V[t] && !V[t][0](String(v))) return d[1] + ": " + V[t][1] + ".";
    }
  }

  function boot() {
    sb.auth.getUser().then(function (r) {
      if (!r.data || !r.data.user) return login();
      user = r.data.user;
      sb.from("admins").select("user_id").eq("user_id", user.id).maybeSingle().then(function (a) {
        if (a.data) shell(); else { msg("This account is signed in but is not an administrator.", 1); app.replaceChildren(btn("Sign out", out)); }
      });
    });
  }
  function out() { sb.auth.signOut().then(function () { msg(""); login(); }); }
  function login() {
    var f = h("form", { class: "glass card", novalidate: "" }, [h("h2", {}, ["Sign in"]),
      h("label", {}, ["Email", h("input", { name: "e", type: "email", autocomplete: "username", required: "" })]),
      h("label", {}, ["Password", h("input", { name: "p", type: "password", autocomplete: "current-password", required: "" })]),
      h("button", { class: "btn btn-green", type: "submit" }, ["Sign in"])]);
    f.addEventListener("submit", function (ev) {
      ev.preventDefault(); if (!f.e.value.trim() || !f.p.value) return msg("Enter your email and password.", 1);
      var b = f.querySelector("button"); b.disabled = true; b.textContent = "Signing in…";
      sb.auth.signInWithPassword({ email: f.e.value.trim(), password: f.p.value }).then(function (r) {
        b.disabled = false; b.textContent = "Sign in";
        if (r.error) msg("Sign-in failed: " + r.error.message, 1); else { msg(""); boot(); }
      });
    });
    app.replaceChildren(f);
  }
  function shell() {
    var nav = h("nav", { class: "adm-tabs", "aria-label": "Admin sections" }), v = h("div", { id: "view" }, [h("p", { class: "note" }, ["Loading…"])]);
    NAV.forEach(function (n) { nav.append(btn(n[1], function () { tab = n[0]; msg(""); shell(); }, 0, n[0] === tab ? "btn-green" : "btn-glass")); });
    nav.append(h("a", { class: "btn btn-glass", href: "index.html?preview=1", target: "_blank", rel: "noopener" }, ["Preview with drafts"]), btn("Sign out", out));
    app.replaceChildren(nav, v);
    if (tab === "overview") overview(); else if (tab === "appearance") appearance(); else if (COL[tab]) list(); else setView();
  }
  function overview() {
    var v = $("#view"), keys = ["projects", "achievements", "experience", "services"], g = h("div", { class: "grid" });
    Promise.all(keys.map(function (k) { return Promise.all([sb.from(k).select("id", { count: "exact", head: true }), sb.from(k).select("id", { count: "exact", head: true }).eq("status", "published")]); })).then(function (rs) {
      rs.forEach(function (r, i) { g.append(h("div", { class: "card glass" }, [h("h3", {}, [COL[keys[i]].label]), h("p", { class: "price" }, [String(r[0].count || 0) + " total"]), h("p", {}, [String(r[1].count || 0) + " published"])])); });
      v.replaceChildren(h("p", { class: "note" }, ["Signed in as " + (user.email || "administrator") + "."]), g);
    });
  }
  function list() {
    var cfg = COL[tab], v = $("#view");
    sb.from(tab).select("*").order("sort").then(function (r) {
      if (r.error) return msg(r.error.message, 1);
      rows = r.data; var ul = h("ul", { class: "adm-list" });
      rows.forEach(function (x, i) {
        var pub = x.status === "published";
        ul.append(h("li", { class: "glass" }, [h("div", {}, [h("strong", {}, [x[cfg.key]]), h("span", { class: "badge" }, [x.status]), x.featured ? h("span", { class: "badge" }, ["featured"]) : ""]),
          h("div", { class: "adm-acts" }, [btn("Edit", function () { form(x); }), btn("↑", function () { swap(i, i - 1); }, i === 0), btn("↓", function () { swap(i, i + 1); }, i === rows.length - 1),
            btn(pub ? "Unpublish" : "Publish", function () { save(x.id, { status: pub ? "unpublished" : "published" }, pub ? "Unpublished" : "Published"); }),
            btn("Delete", function () { if (confirm('Delete "' + x[cfg.key] + '" permanently? This cannot be undone.')) remove(x.id); })])]));
      });
      v.replaceChildren(h("h2", {}, [cfg.label]), btn("Add new", function () { form({}); }, 0, "btn-green"), rows.length ? ul : h("p", { class: "note" }, ["Nothing here yet. Choose Add new to create the first item."]));
    });
  }
  function form(x) {
    var cfg = COL[tab], f = h("form", { class: "glass card", novalidate: "" }), g = {};
    cfg.f.forEach(function (d) { g[d[0]] = mk(d, x[d[0]]); f.append(g[d[0]].wrap); });
    var sel = h("select", { name: "status" }, ["draft", "published", "unpublished"].map(function (s) { return h("option", { value: s }, [s]); })); sel.value = x.status || "draft";
    var sv = h("button", { class: "btn btn-green", type: "submit" }, ["Save changes"]);
    f.append(h("label", {}, ["Status", sel]), h("div", { class: "actions" }, [sv, btn("Cancel", list)]));
    f.addEventListener("submit", function (ev) {
      ev.preventDefault(); var d = {};
      cfg.f.forEach(function (c) { var val = g[c[0]].get(); d[c[0]] = c[2] === "date" && !val ? null : val; });
      var e = check(cfg.f, d); if (e) return msg(e, 1);
      d.status = sel.value; sv.disabled = true; sv.textContent = "Saving…";
      var done = function (r) { sv.disabled = false; sv.textContent = "Save changes"; r.error ? msg(r.error.message, 1) : (msg("Saved"), list()); };
      if (x.id) sb.from(tab).update(d).eq("id", x.id).then(done);
      else { d.sort = rows.reduce(function (m, r) { return Math.max(m, r.sort); }, 0) + 1; sb.from(tab).insert(d).then(done); }
    });
    $("#view").replaceChildren(h("h2", {}, [x.id ? "Edit" : "Add"]), f);
  }
  function save(id, patch, ok) { sb.from(tab).update(patch).eq("id", id).then(function (r) { r.error ? msg(r.error.message, 1) : (msg(ok), list()); }); }
  function remove(id) { sb.from(tab).delete().eq("id", id).then(function (r) { r.error ? msg(r.error.message, 1) : (msg("Deleted"), list()); }); }
  function swap(i, j) {
    var a = rows[i], b = rows[j], s = a.sort === b.sort ? b.sort + 1 : b.sort;
    Promise.all([sb.from(tab).update({ sort: s }).eq("id", a.id), sb.from(tab).update({ sort: a.sort }).eq("id", b.id)]).then(list);
  }
  function load() { return sb.from("site_settings").select("*").then(function (r) { var o = {}; (r.data || []).forEach(function (x) { o[x.key] = x.value; }); return o; }); }
  function persist(vals, btnEl) {
    btnEl.disabled = true; btnEl.textContent = "Saving…";
    var rowsOut = Object.keys(vals).map(function (k) { return { key: k, value: String(vals[k]) }; });
    return sb.from("site_settings").upsert(rowsOut).then(function (r) { btnEl.disabled = false; btnEl.textContent = "Save changes"; r.error ? msg(r.error.message, 1) : msg("Saved. Changes are live on the public site."); });
  }
  function setView() {
    var cfg = SET[tab];
    load().then(function (o) {
      var f = h("form", { class: "glass card", novalidate: "" }), g = {};
      cfg.f.forEach(function (d) { g[d[0]] = mk(d, o[d[0]]); f.append(g[d[0]].wrap); });
      var sv = h("button", { class: "btn btn-green", type: "submit" }, ["Save changes"]); f.append(sv);
      f.addEventListener("submit", function (ev) {
        ev.preventDefault(); var d = {};
        cfg.f.forEach(function (c) { d[c[0]] = g[c[0]].get(); if (c[0] === "whatsapp") d[c[0]] = d[c[0]].replace(/\D/g, ""); });
        var e = check(cfg.f, d); if (e) return msg(e, 1);
        if (d.whatsapp && (d.whatsapp.length < 8 || d.whatsapp.length > 15)) return msg("WhatsApp number must be 8–15 digits including country code.", 1);
        persist(d, sv);
      });
      $("#view").replaceChildren(h("h2", {}, [cfg.label]), f);
    });
  }
  function appearance() {
    var C2 = [["ap_primary", "Primary brand colour"], ["ap_secondary", "Secondary brand colour"], ["ap_accent", "Accent colour"], ["ap_bg_dark", "Dark theme background"], ["ap_text_dark", "Dark theme text"], ["ap_bg_light", "Light theme background"], ["ap_text_light", "Light theme text"]];
    load().then(function (o) {
      var f = h("form", { class: "glass card", novalidate: "" }), g = {}, pv = h("div", { class: "pv" }, [h("strong", {}, ["Preview heading"]), h("p", {}, ["Body text sample."]), h("span", { class: "pvb" }, ["Button"])]);
      var all = C2.map(function (c) { return [c[0], c[1], "color"]; }).concat([["ap_heading_font", "Heading font", "sel", 0, 0, FONTS], ["ap_body_font", "Body font", "sel", 0, 0, FONTS], ["ap_btn_style", "Button appearance", "sel", 0, 0, [["pill", "Pill"], ["rounded", "Rounded"], ["square", "Square"]]], ["ap_radius", "Card corner radius (0–40 px)", "num", 3]]);
      all.forEach(function (d) { g[d[0]] = mk(d, o[d[0]] || AD[d[0]]); f.append(g[d[0]].wrap); });
      function paint() {
        var s = pv.style, dark = document.documentElement.getAttribute("data-theme") !== "light";
        s.background = g[dark ? "ap_bg_dark" : "ap_bg_light"].get(); s.color = g[dark ? "ap_text_dark" : "ap_text_light"].get();
        s.borderRadius = (/^\d+$/.test(g.ap_radius.get()) ? Math.min(+g.ap_radius.get(), 40) : 24) + "px";
        var b = pv.querySelector(".pvb"); b.style.background = g.ap_primary.get(); b.style.borderRadius = { pill: "99px", rounded: "12px", square: "4px" }[g.ap_btn_style.get()];
        pv.querySelector("strong").style.color = g.ap_accent.get(); pv.style.borderLeft = "6px solid " + g.ap_secondary.get();
      }
      f.addEventListener("input", paint); f.addEventListener("change", paint); paint();
      var sv = h("button", { class: "btn btn-green", type: "submit" }, ["Save changes"]);
      f.append(pv, h("div", { class: "actions" }, [sv, btn("Reset to defaults", function () {
        if (!confirm("Reset all appearance settings to the defaults?")) return;
        sb.from("site_settings").delete().like("key", "ap\\_%").then(function (r) { r.error ? msg(r.error.message, 1) : (msg("Reset to defaults."), appearance()); });
      })]));
      f.addEventListener("submit", function (ev) {
        ev.preventDefault(); var d = {}; all.forEach(function (c) { d[c[0]] = g[c[0]].get(); });
        var e = check(all, d); if (e) return msg(e, 1); persist(d, sv);
      });
      $("#view").replaceChildren(h("h2", {}, ["Appearance"]), h("p", { class: "note" }, ["Fonts are limited to safe system fonts so the site never depends on an outside font service."]), f);
    });
  }
  sb.auth.onAuthStateChange(function (ev) { if (ev === "SIGNED_OUT") login(); });
  boot();
})();
