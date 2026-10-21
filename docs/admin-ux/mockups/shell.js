/* Oryza admin mockups: shared shell (sidebar, top bar, phone tab bar, command palette, toasts, item drawer/sheet).
   Static, sample data only. Open index.html. */
(function () {
  const I = {
    today: '<path d="M4 7h16M4 12h10M4 17h7"/><circle cx="18" cy="16" r="3"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    clients: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M19 14.8c1.4.9 2.3 2.6 2.5 5.2"/>',
    shoots: '<rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="12" cy="13.5" r="3.5"/><path d="M8.5 7l1.5-3h4l1.5 3"/>',
    team: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4.5 4.2-7 8-7s7 2.5 8 7"/>',
    leads: '<path d="M4 6h16v12H4z"/><path d="M4 7l8 6 8-6"/>',
    reports: '<path d="M5 20V10M12 20V4M19 20v-7"/>',
    images: '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M20.5 16l-5-5-9 8.5"/>',
    payments: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18M7 15h4"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
    bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    more: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    chevron: '<path d="M9 6l6 6-6 6"/>',
    left: '<path d="M15 6l-6 6 6 6"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  };
  const svg = (k, s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[k]}</svg>`;
  window.svg = svg;

  const page = document.body.dataset.page;
  const title = document.body.dataset.title || "";
  const groups = [
    ["Work", [["today", "Today", "today.html", 12], ["calendar", "Calendar", "calendar.html"], ["clients", "Clients", "client.html"], ["shoots", "Shoots", "#"], ["team", "Team", "#"]]],
    ["Growth", [["leads", "Leads", "leads.html", 2], ["reports", "Reports", "#"]]],
    ["Content", [["images", "Images", "#", 3]]],
    ["Business", [["payments", "Payments", "#"], ["settings", "Settings", "#"]]],
  ];
  const nav = groups.map(([g, items]) => `<div class="nav-group"><p>${g}</p><nav class="nav" aria-label="${g}">${items.map(([k, l, h, c]) => `<a href="${h}" ${k === page ? 'aria-current="page"' : ""} title="${l}"><span class="ico">${svg(k)}</span><span class="label">${l}</span>${c ? `<span class="count">${c}</span>` : ""}</a>`).join("")}</nav></div>`).join("");

  const content = document.getElementById("page");
  const app = document.createElement("div");
  app.className = "app";
  app.innerHTML = `
    <aside class="sidebar" aria-label="Admin">
      <a class="brand" href="index.html"><span class="logo"></span><span>Oryza</span></a>
      ${nav}
      <div class="foot"><button class="collapse-btn" id="collapse">« Collapse</button></div>
    </aside>
    <div class="main">
      <header class="topbar">
        <button class="search" id="open-search" aria-label="Search or jump to (Ctrl K)">${svg("search")}<span>Search clients, posts, leads…</span><span class="kbd">Ctrl K</span></button>
        <span class="spacer"></span>
        <button class="btn btn-primary btn-sm" id="quick-create">${svg("plus", 16)} New</button>
        <button class="icon-btn bell" aria-label="Notifications (3 new)" id="bell">${svg("bell")}<span class="dot"></span></button>
        <button class="icon-btn" aria-label="Account menu"><span class="avatar">JS</span></button>
      </header>
      <div class="mobile-top">
        <span class="title">${title}</span>
        <button class="icon-btn" aria-label="Search" id="m-search">${svg("search", 20)}</button>
        <button class="icon-btn bell" aria-label="Notifications (3 new)">${svg("bell", 20)}<span class="dot"></span></button>
      </div>
      <div class="content" id="content"></div>
    </div>`;
  document.body.prepend(app);
  app.querySelector("#content").appendChild(content);
  document.getElementById("collapse").onclick = () => app.classList.toggle("collapsed");

  const tabs = [["today", "Today", "today.html"], ["calendar", "Calendar", "calendar.html"], ["clients", "Clients", "client.html"], ["leads", "Leads", "leads.html"], ["more", "More", "index.html"]];
  document.body.insertAdjacentHTML(
    "beforeend",
    `<nav class="tabbar" aria-label="Main">${tabs.map(([k, l, h]) => `<a href="${h}" ${k === page ? 'aria-current="page"' : ""}><span class="ico">${svg(k === "more" ? "more" : k, 22)}</span>${l}</a>`).join("")}</nav>
     <button class="fab" aria-label="Quick add: task, note or upload from camera" id="fab">${svg("plus", 26)}</button>
     <div class="scrim" id="scrim"></div>
     <aside class="drawer" id="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title"></aside>
     <div class="palette" id="palette" role="dialog" aria-modal="true" aria-label="Command palette"><input placeholder="Jump to a client, post, lead or shoot — or type a command" aria-label="Search" id="pal-input"><ul id="pal-list"></ul></div>
     <div class="toast-host" aria-live="polite" id="toasts"></div>`,
  );

  /* ---------- toasts with undo ---------- */
  window.toast = function (msg, undo) {
    const t = document.createElement("div");
    t.className = "toast";
    t.innerHTML = `<span>${msg}</span>${undo ? '<button class="btn">Undo</button>' : ""}`;
    if (undo) t.querySelector("button").onclick = () => { undo(); t.remove(); window.toast("Undone"); };
    document.getElementById("toasts").appendChild(t);
    setTimeout(() => t.remove(), undo ? 5000 : 2500);
  };

  /* ---------- command palette ---------- */
  const entries = [
    ["Go to", "Today", "today.html", "G T"], ["Go to", "Calendar", "calendar.html", "G C"], ["Go to", "Leads", "leads.html", "G L"],
    ["Clients", "Sample Clinic", "client.html"], ["Clients", "Sample Public School", "client.html"], ["Clients", "Sample Café", "client.html"],
    ["Posts", "Meet Dr Asha Verma (Reel · Mon 16 Nov)", "#item"], ["Posts", "How to reach us and where to park (Reel · Wed 11 Nov)", "#item"],
    ["Leads", "Asha Verma · Sample Convent School", "leads.html"], ["Shoots", "Sample Clinic · Mon 16 Nov 10:00", "#"],
    ["Actions", "New client", "#", "N C"], ["Actions", "Send for approval…", "#"], ["Actions", "Add a task", "#", "N T"],
  ];
  const pal = document.getElementById("palette");
  const input = document.getElementById("pal-input");
  const list = document.getElementById("pal-list");
  let sel = 0;
  const render = () => {
    const q = input.value.toLowerCase();
    const hits = entries.filter((e) => !q || e[1].toLowerCase().includes(q) || e[0].toLowerCase().includes(q));
    sel = Math.min(sel, Math.max(0, hits.length - 1));
    let last = "";
    list.innerHTML = hits.length
      ? hits.map((e, i) => `<li>${e[0] !== last ? `<p>${(last = e[0])}</p>` : ""}<a href="${e[2]}" ${i === sel ? 'aria-selected="true"' : ""} data-i="${i}">${e[1]}${e[3] ? `<span class="kbd">${e[3]}</span>` : ""}</a></li>`).join("")
      : `<li class="empty"><h3>No matches</h3>Try a client name, a post title or “new”.</li>`;
    list.querySelectorAll("a").forEach((a) => (a.onclick = (ev) => { if (a.getAttribute("href") === "#item") { ev.preventDefault(); closePal(); window.openItem(); } }));
  };
  const openPal = () => { pal.classList.add("on"); document.getElementById("scrim").classList.add("on"); input.value = ""; sel = 0; render(); input.focus(); };
  const closePal = () => { pal.classList.remove("on"); if (!document.getElementById("drawer").classList.contains("on")) document.getElementById("scrim").classList.remove("on"); };
  input.oninput = () => { sel = 0; render(); };
  input.onkeydown = (e) => {
    const n = list.querySelectorAll("a").length;
    if (e.key === "ArrowDown") { sel = (sel + 1) % n; render(); e.preventDefault(); }
    if (e.key === "ArrowUp") { sel = (sel - 1 + n) % n; render(); e.preventDefault(); }
    if (e.key === "Enter") list.querySelector('a[aria-selected="true"]')?.click();
    if (e.key === "Escape") closePal();
  };
  document.getElementById("open-search").onclick = openPal;
  document.getElementById("m-search").onclick = openPal;
  document.getElementById("quick-create").onclick = () => { openPal(); input.value = "new"; render(); };
  document.getElementById("fab").onclick = () => window.toast("Quick add: Task · Note · Upload from camera (sheet opens here)");
  document.getElementById("bell").onclick = () => window.toast("3 new: Sample Clinic approved 2 posts · 1 change request · new lead");

  /* ---------- item drawer (desktop) / sheet (phone) ---------- */
  const drawer = document.getElementById("drawer");
  window.openItem = function () {
    drawer.innerHTML = `
      <div class="drawer-head">
        <span class="pmark" style="background:#8a3d6b">IG</span>
        <div class="grow"><p class="meta" style="margin:0">Sample Clinic · Reel · Mon 16 Nov, 8:30 pm</p><h2 id="drawer-title" style="font:650 16px/22px var(--font-ui)" class="truncate">Meet Dr Asha Verma</h2></div>
        <span class="badge b-warning">With client</span>
        <button class="icon-btn" aria-label="Close" id="drawer-close">${svg("close")}</button>
      </div>
      <div class="drawer-body stack">
        <div class="tabs" role="tablist" style="margin-bottom:8px"><button role="tab" aria-selected="true">Details</button><button role="tab" aria-selected="false">Tasks <span class="count">4/7</span></button><button role="tab" aria-selected="false">Approval</button><button role="tab" aria-selected="false">Activity</button></div>
        <label class="field"><span>Title</span><input class="input" value="Meet Dr Asha Verma"></label>
        <label class="field"><span>Hook</span><input class="input" value="Who looks after you at Sample Clinic? Meet Dr Asha."></label>
        <label class="field"><span>Caption draft <span class="muted" style="font-weight:450">· the client sees this</span></span><textarea class="textarea" rows="4">Meet Dr Asha Verma, our general physician. Book your visit — OPD timings are in our bio.</textarea><span class="hint" id="autosave">Saved a few seconds ago</span></label>
        <div class="card card-pad" style="background:var(--warning-bg);border-color:transparent"><b>Compliance (locked):</b> Medical facts from the doctor; the doctor approves before publishing.</div>
        <div><p class="meta" style="margin:0 0 6px">Files</p><div class="row wrap"><div class="skel" style="width:96px;height:96px;background:linear-gradient(135deg,#2f6b4f,#b9811a)"></div><div class="skel" style="width:96px;height:96px;background:linear-gradient(135deg,#13201c,#8f5e0a)"></div><button class="btn btn-secondary" style="width:96px;height:96px">+ Add</button></div></div>
        <div><p class="meta" style="margin:0 0 6px">Next task</p><div class="list"><div class="task today"><label class="check-hit"><input type="checkbox" class="check" aria-label="Mark Edit done"></label><div><span class="t">Edit</span><div class="meta">Due today 6:00 pm · Design team</div></div></div></div></div>
      </div>
      <div class="drawer-foot"><button class="btn btn-secondary">Open full page</button><span class="grow"></span><button class="btn btn-primary" id="send-appr">Send for approval</button></div>`;
    drawer.classList.add("on");
    document.getElementById("scrim").classList.add("on");
    drawer.querySelector("textarea").oninput = () => (document.getElementById("autosave").textContent = "Saving…");
    drawer.querySelector("textarea").onblur = () => { document.getElementById("autosave").textContent = "Saved just now"; window.toast("Caption saved"); };
    drawer.querySelector(".check").onchange = (e) => window.toast(e.target.checked ? "Edit marked done" : "Edit reopened", () => (e.target.checked = !e.target.checked));
    document.getElementById("send-appr").onclick = () => window.toast("Approval link created · copied to clipboard");
    document.getElementById("drawer-close").onclick = closeItem;
    document.getElementById("drawer-close").focus();
  };
  const closeItem = () => { drawer.classList.remove("on"); document.getElementById("scrim").classList.remove("on"); };
  document.getElementById("scrim").onclick = () => { closeItem(); closePal(); };

  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openPal(); }
    if (e.key === "Escape") { closeItem(); closePal(); }
    if (e.key === "?" && !/input|textarea/i.test(document.activeElement.tagName)) window.toast("Shortcuts: Ctrl K search · G T Today · G C Calendar · N T new task · J/K next/prev · E edit · D done");
  });
})();
