// dsh-serena-lens — browser half.
// A lens into Serena: toolbar button toggles a panel embedding the Serena web
// dashboard (tool-call stream, executions, stats) from BOTH machines — m4 and
// m5 tabs — so the agent's code-level "thinking" is one click from the chat.
//
// House rules honored:
//  - No DOM mutation inside React's tree: button + panel are position:fixed
//    overlays (file-mentions crash class avoided).
//  - iOS: bottom-sheet layout on narrow viewports; desktop side panel else.
//  - Clean SVG icons only — no emoji.
window.__ModuleLoader__.load({ id: 'dsh-serena-lens', factory: () => {
  var module = { exports: {} };

  var MACHINES = [
    { id: 'm4', label: 'm4', url: 'https://m4.tail9464ee.ts.net:24282' },
    { id: 'm5', label: 'm5', url: 'https://m5.tail9464ee.ts.net:24282' }
  ];

  var EYE_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>';
  var POP_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6"/><path d="M20 4L10 14"/><path d="M20 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5"/></svg>';
  var CLOSE_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>';
  var REFRESH_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 1 0-2.3 6.3"/><path d="M20 5v6h-6"/></svg>';

  // ── Shared composer-tools toolbar (idempotent; any plugin may create it) ──
  var TOOLBAR_CSS = ''
    + '#dsh-composer-tools{position:fixed;z-index:40;display:flex;align-items:center;gap:4px;padding:4px;'
    + 'border-radius:20px;border:1px solid var(--dsw-alias-border-inverted,rgba(255,255,255,.12));'
    + 'background:var(--dsw-specific-menu,rgba(20,22,28,.85));backdrop-filter:blur(8px);'
    + 'box-shadow:var(--dsw-shadow-lv2,0 2px 8px rgba(0,0,0,.35))}'
    + '#dsh-composer-tools .dsh-ct-btn{width:32px;height:32px;border-radius:50%;border:none;background:transparent;'
    + 'color:var(--dsw-alias-label-secondary,#bbb);cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0}'
    + '#dsh-composer-tools .dsh-ct-btn:hover{color:var(--dsw-alias-label-primary,#fff);'
    + 'background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.08))}'
    + '#dsh-composer-tools .dsh-ct-btn svg{width:17px;height:17px;display:block}'
    + "html[data-dsh-menu-open='1'] #dsh-composer-tools{visibility:hidden}";

  function findComposer() {
    var tas = document.querySelectorAll('textarea');
    for (var i = 0; i < tas.length; i++) {
      var ta = tas[i];
      if (ta.offsetWidth > 80 && ta.offsetHeight > 20) return ta;
    }
    return null;
  }

  function positionToolbar(tb) {
    var ta = findComposer();
    if (!ta) { tb.style.display = 'none'; return; }
    var r = ta.getBoundingClientRect();
    // iOS: fixed positioning follows the VISUAL viewport, but
    // getBoundingClientRect is layout-viewport-relative. With the keyboard
    // open or a pinch-zoom pan, the two diverge and the toolbar detaches
    // from the composer (floats mid-screen over the submit area). Convert
    // via visualViewport offsets; on desktop offsets are 0 (no-op).
    var vv = window.visualViewport;
    var offT = vv ? vv.offsetTop : 0;
    var offL = vv ? vv.offsetLeft : 0;
    var vw = vv ? vv.width : window.innerWidth;
    var vh = vv ? vv.height : window.innerHeight;
    var topV = r.top - offT;
    if (r.bottom - offT < 0 || topV > vh) { tb.style.display = 'none'; return; }
    tb.style.display = 'flex';
    tb.style.left = 'auto';
    tb.style.right = Math.max(6, vw - (r.right - offL)) + 'px';
    tb.style.top = Math.max(6, topV - 42) + 'px';
  }

  function ensureToolbar() {
    if (!document.getElementById('dsh-composer-tools-css')) {
      var tag = document.createElement('style');
      tag.id = 'dsh-composer-tools-css';
      tag.textContent = TOOLBAR_CSS;
      document.head.appendChild(tag);
    }
    var tb = document.getElementById('dsh-composer-tools');
    if (tb) return tb;
    tb = document.createElement('div');
    tb.id = 'dsh-composer-tools';
    document.body.appendChild(tb);
    var pos = function () { positionToolbar(tb); };
    window.addEventListener('resize', pos);
    window.addEventListener('scroll', pos, true);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', pos);
      window.visualViewport.addEventListener('scroll', pos); // iOS keyboard pan
    }
    setInterval(pos, 1500);
    pos();
    return tb;
  }
  // ─────────────────────────────────────────────────────────────────────────

  var CSS = ''
    + '.dsh-lens-panel{position:fixed;z-index:39;display:flex;flex-direction:column;overflow:hidden;'
    + 'border:1px solid var(--dsw-alias-border-inverted,#555);border-radius:14px;background:var(--dsw-specific-menu,#1e2129);'
    + 'box-shadow:var(--dsw-shadow-lv3,0 8px 28px rgba(0,0,0,.45))}'
    + '@media (min-width: 521px){.dsh-lens-panel{top:12px;right:12px;bottom:88px;width:min(560px,46vw)}}'
    + '@media (max-width: 520px){.dsh-lens-panel{left:8px;right:8px;bottom:64px;height:62vh}}'
    + '.dsh-lens-head{display:flex;align-items:center;gap:6px;padding:6px 8px;'
    + 'border-bottom:1px solid var(--dsw-alias-border-inverted,#444);flex:none}'
    + '.dsh-lens-title{font-size:12px;font-weight:600;color:var(--dsw-alias-label-tertiary,#999);margin-right:auto}'
    + '.dsh-lens-tab{font-size:12px;font-weight:500;padding:3px 10px;border-radius:14px;border:1px solid transparent;'
    + 'background:0 0;color:var(--dsw-alias-label-secondary,#bbb);cursor:pointer;font-family:inherit}'
    + '.dsh-lens-tab-active{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.1));'
    + 'color:var(--dsw-alias-label-primary,#fff);border-color:var(--dsw-alias-border-inverted,#666)}'
    + '.dsh-lens-icon{width:26px;height:26px;display:flex;align-items:center;justify-content:center;'
    + 'border-radius:8px;border:none;background:0 0;color:var(--dsw-alias-label-secondary,#bbb);cursor:pointer;padding:0}'
    + '.dsh-lens-icon:hover{color:var(--dsw-alias-label-primary,#fff)}'
    + '.dsh-lens-icon svg{width:15px;height:15px;display:block}'
    + '.dsh-lens-body{flex:1;min-height:0;position:relative}'
    + '.dsh-lens-frame{position:absolute;inset:0;width:100%;height:100%;border:0;background:#111}'
    + '.dsh-lens-hidden{display:none}';

  function ensureCss() {
    if (document.getElementById('dsh-serena-lens-css')) return;
    var tag = document.createElement('style');
    tag.id = 'dsh-serena-lens-css';
    tag.textContent = CSS;
    document.head.appendChild(tag);
  }

  function apply() {
    ensureCss();

    var open = false;
    var activeId = MACHINES[0].id;
    var frames = {};

    var tb = ensureToolbar();
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'dsh-ct-btn';
    btn.setAttribute('aria-label', 'Serena lens');
    btn.title = 'Serena dashboard lens (m4/m5)';
    btn.innerHTML = EYE_SVG;
    tb.appendChild(btn);

    var panel = document.createElement('div');
    panel.className = 'dsh-lens-panel dsh-lens-hidden';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Serena dashboards');

    var head = document.createElement('div');
    head.className = 'dsh-lens-head';
    var title = document.createElement('span');
    title.className = 'dsh-lens-title';
    title.textContent = 'SERENA';
    head.appendChild(title);

    var body = document.createElement('div');
    body.className = 'dsh-lens-body';

    function frameFor(m) {
      if (frames[m.id]) return frames[m.id];
      var f = document.createElement('iframe');
      f.className = 'dsh-lens-frame';
      f.src = m.url;
      f.loading = 'lazy';
      f.referrerPolicy = 'no-referrer';
      frames[m.id] = f;
      body.appendChild(f);
      return f;
    }

    function show(id) {
      activeId = id;
      MACHINES.forEach(function (m) {
        var f = frames[m.id];
        if (f) f.classList.toggle('dsh-lens-hidden', m.id !== id);
      });
      tabs.forEach(function (t) {
        t.el.classList.toggle('dsh-lens-tab-active', t.id === id);
      });
    }

    var tabs = MACHINES.map(function (m) {
      var t = document.createElement('button');
      t.type = 'button';
      t.className = 'dsh-lens-tab';
      t.textContent = m.label;
      t.addEventListener('click', function () { frameFor(m); show(m.id); });
      head.appendChild(t);
      return { id: m.id, el: t };
    });

    var refresh = document.createElement('button');
    refresh.type = 'button';
    refresh.className = 'dsh-lens-icon';
    refresh.title = 'Reload dashboard';
    refresh.setAttribute('aria-label', 'Reload dashboard');
    refresh.innerHTML = REFRESH_SVG;
    refresh.addEventListener('click', function () {
      var m = MACHINES.find(function (x) { return x.id === activeId; });
      var f = frames[m.id];
      if (f) { f.src = 'about:blank'; f.src = m.url; }
      else frameFor(m);
    });
    head.appendChild(refresh);

    var pop = document.createElement('button');
    pop.type = 'button';
    pop.className = 'dsh-lens-icon';
    pop.title = 'Open in new tab';
    pop.setAttribute('aria-label', 'Open in new tab');
    pop.innerHTML = POP_SVG;
    pop.addEventListener('click', function () {
      var m = MACHINES.find(function (x) { return x.id === activeId; });
      window.open(m.url, '_blank', 'noopener');
    });
    head.appendChild(pop);

    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'dsh-lens-icon';
    close.title = 'Close';
    close.setAttribute('aria-label', 'Close');
    close.innerHTML = CLOSE_SVG;
    close.addEventListener('click', function () { toggle(false); });
    head.appendChild(close);

    panel.appendChild(head);
    panel.appendChild(body);

    function toggle(next) {
      open = next === undefined ? !open : next;
      panel.classList.toggle('dsh-lens-hidden', !open);
      if (open) { frameFor(MACHINES.find(function (m) { return m.id === activeId; })); show(activeId); }
    }

    // Escape closes the panel (unless focus is inside a dashboard iframe,
    // where key events never reach us — click the panel chrome first).
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && open) { toggle(false); event.stopPropagation(); }
    }, true);

    btn.addEventListener('click', function () { toggle(); });
    document.body.appendChild(panel);
  }

  module.exports = { apply: apply };
  return module.exports;
} });
