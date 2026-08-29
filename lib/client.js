// dsh-serena-lens — browser half.
// A lens into Serena: floating button toggles a panel embedding the Serena
// web dashboard (tool-call stream, executions, stats) from BOTH machines —
// m4 and m5 tabs — so the agent's code-level "thinking" is one click from
// the conversation it serves.
//
// House rules honored:
//  - No DOM mutation inside React's tree: button + panel are position:fixed
//    overlays (the file-mentions crash class avoided).
//  - iOS: bottom-sheet layout on narrow viewports; desktop side panel else.
window.__ModuleLoader__.load({ id: 'dsh-serena-lens', factory: () => {
  var module = { exports: {} };

  var MACHINES = [
    { id: 'm4', label: 'm4', url: 'https://m4.tail9464ee.ts.net:24282' },
    { id: 'm5', label: 'm5', url: 'https://m5.tail9464ee.ts.net:24282' }
  ];
  var NARROW_PX = 520;

  var CSS = ''
    + '.dsh-lens-btn{position:fixed;z-index:38;right:16px;bottom:88px;width:34px;height:34px;border-radius:50%;'
    + 'border:1px solid var(--dsw-alias-border-inverted,#555);background:var(--dsw-specific-menu,#1e2129);'
    + 'color:var(--dsw-alias-label-secondary,#bbb);cursor:pointer;display:flex;align-items:center;justify-content:center;'
    + 'font-size:16px;padding:0;box-shadow:var(--dsw-shadow-lv2,0 1px 4px rgba(0,0,0,.3))}'
    + '.dsh-lens-btn:hover{color:var(--dsw-alias-label-primary,#fff)}'
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
    + '.dsh-lens-icon{font-size:13px;padding:3px 7px;border-radius:8px;border:none;background:0 0;'
    + 'color:var(--dsw-alias-label-secondary,#bbb);cursor:pointer}'
    + '.dsh-lens-icon:hover{color:var(--dsw-alias-label-primary,#fff)}'
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
    var frames = {}; // machine id -> iframe (kept alive across tab switches)

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'dsh-lens-btn';
    btn.setAttribute('aria-label', 'Serena lens');
    btn.title = 'Serena dashboard lens (m4/m5)';
    btn.textContent = '🧠';

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

    var pop = document.createElement('button');
    pop.type = 'button';
    pop.className = 'dsh-lens-icon';
    pop.title = 'Open in new tab';
    pop.textContent = '↗';
    pop.addEventListener('click', function () {
      var m = MACHINES.find(function (x) { return x.id === activeId; });
      window.open(m.url, '_blank', 'noopener');
    });
    head.appendChild(pop);

    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'dsh-lens-icon';
    close.title = 'Close';
    close.textContent = '✕';
    close.addEventListener('click', function () { toggle(false); });
    head.appendChild(close);

    panel.appendChild(head);
    panel.appendChild(body);

    function toggle(next) {
      open = next === undefined ? !open : next;
      panel.classList.toggle('dsh-lens-hidden', !open);
      if (open) { frameFor(MACHINES.find(function (m) { return m.id === activeId; })); show(activeId); }
    }

    btn.addEventListener('click', function () { toggle(); });
    document.body.appendChild(btn);
    document.body.appendChild(panel);
  }

  module.exports = { apply: apply };
  return module.exports;
} });
