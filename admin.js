(function () {
  "use strict";
  var C = window.LD_CONFIG || {}, app = document.getElementById("app"), msgEl = document.getElementById("msg");
  function $(s) { return document.querySelector(s); }
  function h(t, a, k) { var e = document.createElement(t); for (var x in a || {}) e.setAttribute(x, a[x]); (k || []).forEach(function (c) { e.append(c); }); return e; }
  function msg(t, bad) { msgEl.textContent = t || ""; msgEl.className = bad ? "bad" : "ok"; }
  function btn(label, fn, off, cls) { var b = h("button", { type: "button", class: "btn " + (cls || "btn-glass") }, [label]); b.disabled = !!off; b.addEventListener("click", fn); return b; }
  if (!C.SUPABASE_URL || !C.SUPABASE_ANON_KEY) { msg("Fill in SUPABASE_URL and SUPABASE_ANON_KEY in config.js first.", 1); return; }
  var sb = window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY);
  var tab = "services", rows = [];
  var T = {
    services: [["title", "Title", "input", 80], ["description", "Description", "textarea", 300], ["price", "Price label", "input", 40]],
    projects: [["title", "Title", "input", 80], ["description", "Description", "textarea", 400], ["url", "Live URL (https://…)", "input", 300]]
  };

  function boot() {
    sb.auth.getSession().then(function (r) {
      if (!r.data.session) return login();
      sb.from("admins").select("user_id").maybeSingle().then(function (a) {
        if (a.data) shell(); else { app.replaceChildren(h("p", {}, ["This account is not an administrator."]), btn("Sign out", out)); }
      });
    });
  }
  function out() { sb.auth.signOut().then(function () { msg(""); login(); }); }
  function login() {
    var f = h("form", { class: "glass card", novalidate: "" }, [
      h("label", {}, ["Email", h("input", { name: "e", type: "email", autocomplete: "username", required: "" })]),
      h("label", {}, ["Password", h("input", { name: "p", type: "password", autocomplete: "current-password", required: "" })]),
      h("button", { class: "btn btn-green", type: "submit" }, ["Sign in"])]);
    f.addEventListener("submit", function (ev) {
      ev.preventDefault();
      sb.auth.signInWithPassword({ email: f.e.value.trim(), password: f.p.value }).then(function (r) {
        if (r.error) msg("Sign-in failed: " + r.error.message, 1); else { msg(""); boot(); }
      });
    });
    app.replaceChildren(f);
  }
  function shell() {
    var tabs = h("div", { class: "adm-tabs" }), v = h("div", { id: "view" });
    ["services", "projects", "settings"].forEach(function (t) {
      var b = btn(t[0].toUpperCase() + t.slice(1), function () { tab = t; shell(); }, 0, t === tab ? "btn-green" : "btn-glass"); tabs.append(b);
    });
    tabs.append(h("a", { class: "btn btn-glass", href: "index.html?preview=1", target: "_blank", rel: "noopener" }, ["Preview (with drafts)"]), btn("Sign out", out));
    app.replaceChildren(tabs, v);
    tab === "settings" ? settingsView() : listView();
  }
  function listView() {
    var v = $("#view");
    sb.from(tab).select("*").order("sort").then(function (r) {
      if (r.error) return msg(r.error.message, 1);
      rows = r.data; var ul = h("ul", { class: "adm-list" });
      rows.forEach(function (x, i) {
        var pub = x.status === "published";
        ul.append(h("li", { class: "glass" }, [
          h("div", {}, [h("strong", {}, [x.title]), h("span", { class: "badge" }, [x.status])]),
          h("div", { class: "adm-acts" }, [
            btn("Edit", function () { form(x); }),
            btn("↑", function () { swap(i, i - 1); }, i === 0), btn("↓", function () { swap(i, i + 1); }, i === rows.length - 1),
            btn(pub ? "Unpublish" : "Publish", function () { save(x.id, { status: pub ? "unpublished" : "published" }, pub ? "Unpublished" : "Published"); }),
            btn("Delete", function () { if (confirm('Delete "' + x.title + '" permanently? This cannot be undone.')) remove(x.id); })])]));
      });
      v.replaceChildren(btn("Add new", function () { form({}); }, 0, "btn-green"), rows.length ? ul : h("p", { class: "note" }, ["Nothing here yet. Add your first item."]));
    });
  }
  function form(x) {
    var f = h("form", { class: "glass card", novalidate: "" });
    T[tab].forEach(function (d) {
      var i = h(d[2], { name: d[0], maxlength: d[3] }); i.value = x[d[0]] || ""; if (d[2] === "textarea") i.rows = 4;
      f.append(h("label", {}, [d[1], i]));
    });
    var sel = h("select", { name: "status" }, ["draft", "published", "unpublished"].map(function (s) { return h("option", { value: s }, [s]); }));
    sel.value = x.status || "draft"; f.append(h("label", {}, ["Status", sel]), h("div", { class: "actions" }, [h("button", { class: "btn btn-green", type: "submit" }, ["Save changes"]), btn("Cancel", listView)]));
    f.addEventListener("submit", function (ev) {
      ev.preventDefault(); var d = {};
      T[tab].forEach(function (c) { d[c[0]] = f.elements[c[0]].value.trim(); }); d.status = sel.value;
      if (!d.title) return msg("Title is required.", 1);
      if (tab === "projects" && !/^https?:\/\/\S+$/.test(d.url)) return msg("Enter a full URL starting with https://", 1);
      if (x.id) return save(x.id, d, "Saved");
      d.sort = rows.reduce(function (m, r) { return Math.max(m, r.sort); }, 0) + 1;
      sb.from(tab).insert(d).then(function (r) { r.error ? msg(r.error.message, 1) : (msg("Saved"), listView()); });
    });
    $("#view").replaceChildren(f);
  }
  function save(id, patch, ok) { sb.from(tab).update(patch).eq("id", id).then(function (r) { r.error ? msg(r.error.message, 1) : (msg(ok), listView()); }); }
  function remove(id) { sb.from(tab).delete().eq("id", id).then(function (r) { r.error ? msg(r.error.message, 1) : (msg("Deleted"), listView()); }); }
  function swap(i, j) {
    var a = rows[i], b = rows[j], s = a.sort === b.sort ? b.sort + 1 : b.sort;
    Promise.all([sb.from(tab).update({ sort: s }).eq("id", a.id), sb.from(tab).update({ sort: a.sort }).eq("id", b.id)]).then(listView);
  }
  function settingsView() {
    var K = [["email", "Contact email"], ["whatsapp", "WhatsApp number (digits with country code)"], ["tagline", "Footer tagline"]];
    sb.from("site_settings").select("*").then(function (r) {
      var o = {}; (r.data || []).forEach(function (x) { o[x.key] = x.value; });
      var f = h("form", { class: "glass card", novalidate: "" });
      K.forEach(function (k) { var i = h("input", { name: k[0], maxlength: 200 }); i.value = o[k[0]] || ""; f.append(h("label", {}, [k[1], i])); });
      f.append(h("button", { class: "btn btn-green", type: "submit" }, ["Save changes"]));
      f.addEventListener("submit", function (ev) {
        ev.preventDefault();
        var e = f.email.value.trim(), w = f.whatsapp.value.replace(/\D/g, "");
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return msg("Enter a valid email address.", 1);
        if (w.length < 8 || w.length > 15) return msg("WhatsApp number must be 8–15 digits, including country code.", 1);
        sb.from("site_settings").upsert([{ key: "email", value: e }, { key: "whatsapp", value: w }, { key: "tagline", value: f.tagline.value.trim() }]).then(function (r) { r.error ? msg(r.error.message, 1) : msg("Saved"); });
      });
      $("#view").replaceChildren(f);
    });
  }
  boot();
})();
