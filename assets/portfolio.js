/* ─────────────────────────────────────────────────────────────────────────────
   Portfolio shell JS — Justin Adler
   Shared nav, theme toggle, synthetic-data banner, seeded PRNG, formatters,
   Chart.js theming, and a generic sortable-table helper.
   Dashboards: synthetic data. Storefront replicas: real public catalog content.
   ───────────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  // ── Theme ────────────────────────────────────────────────────────────────
  var stored = null;
  try { stored = localStorage.getItem('pf-theme'); } catch (e) {}
  var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.setAttribute('data-theme', stored || (prefersDark ? 'dark' : 'light'));

  window.PF = window.PF || {};

  PF.toggleTheme = function () {
    var cur = document.documentElement.getAttribute('data-theme');
    var next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('pf-theme', next); } catch (e) {}
    var b = document.querySelector('.pf-theme');
    if (b) b.textContent = next === 'dark' ? 'Light' : 'Dark';
    PF.retheme();
  };

  // ── Seeded PRNG (mulberry32) — deterministic synthetic data ──────────────
  PF.rng = function (seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  // Gaussian-ish jitter in [-1,1], centred
  PF.jitter = function (rnd) { return (rnd() + rnd() + rnd() - 1.5) / 1.5; };

  // ── Formatters ───────────────────────────────────────────────────────────
  PF.usd = function (n, dp) {
    if (n === null || n === undefined || isNaN(n)) return '—';
    return '$' + Number(n).toLocaleString('en-US', {
      minimumFractionDigits: dp === undefined ? 0 : dp,
      maximumFractionDigits: dp === undefined ? 0 : dp
    });
  };
  PF.usdK = function (n) {
    if (n === null || n === undefined || isNaN(n)) return '—';
    var a = Math.abs(n);
    if (a >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
    if (a >= 1e3) return '$' + Math.round(n / 1e3) + 'K';
    return '$' + Math.round(n);
  };
  PF.num = function (n, dp) {
    if (n === null || n === undefined || isNaN(n)) return '—';
    return Number(n).toLocaleString('en-US', {
      minimumFractionDigits: dp === undefined ? 0 : dp,
      maximumFractionDigits: dp === undefined ? 0 : dp
    });
  };
  PF.numK = function (n) {
    if (n === null || n === undefined || isNaN(n)) return '—';
    var a = Math.abs(n);
    if (a >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (a >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return String(Math.round(n));
  };
  PF.pct = function (n, dp) {
    if (n === null || n === undefined || isNaN(n)) return '—';
    return Number(n).toFixed(dp === undefined ? 1 : dp) + '%';
  };
  PF.delta = function (n, dp, invert) {
    if (n === null || n === undefined || isNaN(n)) return '<span class="flat">—</span>';
    var good = invert ? n < 0 : n > 0;
    var cls = Math.abs(n) < 0.05 ? 'flat' : (good ? 'up' : 'down');
    var sign = n > 0 ? '▲ ' : (n < 0 ? '▼ ' : '');
    return '<span class="' + cls + '">' + sign + Math.abs(n).toFixed(dp === undefined ? 1 : dp) + '%</span>';
  };
  PF.MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  // ── Chart.js theming ─────────────────────────────────────────────────────
  PF.colors = function () {
    var cs = getComputedStyle(document.documentElement);
    var g = function (v, f) { return (cs.getPropertyValue(v) || '').trim() || f; };
    return {
      fg: g('--fg', '#0b0b0b'), muted: g('--muted', '#6b6a65'),
      line: g('--line', '#e6e6e3'), card: g('--card', '#fff'),
      accent: g('--accent', '#2a78d6'), good: g('--good', '#1f9d55'),
      warn: g('--warn', '#d97706'), bad: g('--bad', '#d64545')
    };
  };
  // Categorical series palette — distinguishable in both themes
  PF.series = function () {
    var c = PF.colors();
    return [c.accent, '#7c5cd6', c.good, c.warn, '#e0669a', '#2bb3c0', c.bad, '#8a8984'];
  };

  PF.applyChartDefaults = function () {
    if (!window.Chart) return;
    var c = PF.colors();
    Chart.defaults.font.family = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    Chart.defaults.font.size = 11.5;
    Chart.defaults.color = c.muted;
    Chart.defaults.borderColor = c.line;
    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    Chart.defaults.plugins.legend.labels.boxWidth = 8;
    Chart.defaults.plugins.legend.labels.padding = 14;
    Chart.defaults.plugins.tooltip.backgroundColor = c.fg;
    Chart.defaults.plugins.tooltip.titleColor = c.card;
    Chart.defaults.plugins.tooltip.bodyColor = c.card;
    Chart.defaults.plugins.tooltip.padding = 10;
    Chart.defaults.plugins.tooltip.cornerRadius = 8;
    Chart.defaults.plugins.tooltip.displayColors = true;
    Chart.defaults.plugins.tooltip.boxPadding = 4;
    Chart.defaults.maintainAspectRatio = false;
  };

  // Re-theme every live chart after a light/dark flip
  PF.retheme = function () {
    if (!window.Chart) return;
    PF.applyChartDefaults();
    var c = PF.colors();
    var reg = Chart.instances || {};
    Object.keys(reg).forEach(function (k) {
      var ch = reg[k];
      if (!ch || !ch.options) return;
      var sc = ch.options.scales || {};
      Object.keys(sc).forEach(function (ax) {
        if (sc[ax].grid) sc[ax].grid.color = c.line;
        if (sc[ax].ticks) sc[ax].ticks.color = c.muted;
      });
      ch.update('none');
    });
  };

  // ── Sortable tables ──────────────────────────────────────────────────────
  // <th class="sortable" data-sort="num|text"> ; sorts the parent table's tbody.
  PF.initSort = function (root) {
    (root || document).querySelectorAll('th.sortable').forEach(function (th) {
      if (th.dataset.bound) return;
      th.dataset.bound = '1';
      if (!th.querySelector('.arrow')) {
        var s = document.createElement('span');
        s.className = 'arrow'; s.textContent = ' ▲▼';
        th.appendChild(s);
      }
      th.addEventListener('click', function () {
        var table = th.closest('table');
        var tbody = table.tBodies[0];
        var idx = Array.prototype.indexOf.call(th.parentNode.children, th);
        var asc = th.dataset.dir !== 'asc';
        th.parentNode.querySelectorAll('th').forEach(function (o) { delete o.dataset.dir; });
        th.dataset.dir = asc ? 'asc' : 'desc';
        var isNum = th.dataset.sort !== 'text';
        var rows = Array.prototype.slice.call(tbody.rows);
        rows.sort(function (a, b) {
          var x = a.cells[idx], y = b.cells[idx];
          var av = x ? (x.dataset.v !== undefined ? x.dataset.v : x.textContent) : '';
          var bv = y ? (y.dataset.v !== undefined ? y.dataset.v : y.textContent) : '';
          if (isNum) {
            var an = parseFloat(String(av).replace(/[^0-9.\-]/g, ''));
            var bn = parseFloat(String(bv).replace(/[^0-9.\-]/g, ''));
            an = isNaN(an) ? -Infinity : an; bn = isNaN(bn) ? -Infinity : bn;
            return asc ? an - bn : bn - an;
          }
          return asc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
        });
        rows.forEach(function (r) { tbody.appendChild(r); });
      });
    });
  };

  // ── Segmented controls ───────────────────────────────────────────────────
  // <div class="seg" data-seg="name"><button data-v="x" aria-pressed="true">…
  PF.initSeg = function (root, onChange) {
    (root || document).querySelectorAll('.seg').forEach(function (seg) {
      if (seg.dataset.bound) return;
      seg.dataset.bound = '1';
      seg.addEventListener('click', function (e) {
        var b = e.target.closest('button');
        if (!b) return;
        seg.querySelectorAll('button').forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
        if (onChange) onChange(seg.dataset.seg, b.dataset.v, seg);
      });
    });
  };
  PF.segValue = function (name) {
    var b = document.querySelector('.seg[data-seg="' + name + '"] button[aria-pressed="true"]');
    return b ? b.dataset.v : null;
  };

  // ── Shared chrome ────────────────────────────────────────────────────────
  PF.NAV = [
    ['index.html', 'Overview'],
    ['mtd-kpi.html', 'Marketing KPIs'],
    ['ad-performance-meta.html', 'Meta Ads'],
    ['ad-spend-yoy.html', 'Ad Spend YoY'],
    ['conversion-by-source.html', 'Conversions'],
    ['new-customer-cost.html', 'New-Customer Cost'],
    ['ltv-2year.html', '2-Yr LTV'],
    ['search-performance.html', 'Search'],
    ['production-throughput.html', 'Throughput'],
    ['production-cost-variance.html', 'Cost Variance'],
    ['product-page.html', 'Product Page'],
    ['collection-page.html', 'Collection Page'],
    ['jackpak-concept.html', 'PDP Concept']
  ];

  PF.chrome = function (active) {
    var theme = document.documentElement.getAttribute('data-theme');
    var links = PF.NAV.map(function (n) {
      return '<a href="' + n[0] + '"' + (n[0] === active ? ' class="active"' : '') + '>' + n[1] + '</a>';
    }).join('');
    var STOREFRONT = { 'product-page.html': 1, 'collection-page.html': 1 };
    var CONCEPT = { 'jackpak-concept.html': 1 };
    var banner = CONCEPT[active]
      ? '<b>Independent concept.</b><span>Spec work. Not affiliated with or endorsed by the brand '
        + 'shown. Nothing here transacts.</span>'
      : STOREFRONT[active]
      ? '<b>Static replica.</b><span>This mirrors a live public storefront page. Product '
        + 'names, prices and photography are real public catalog content; the page itself '
        + 'is a static rebuild, so nothing here transacts.</span>'
      : '<b>Sample data.</b><span>Every figure on this page is synthetic. These are working '
        + 'rebuilds of dashboards I designed and built in production; the data has been '
        + 'replaced so nothing confidential is shown.</span>';
    var nav =
      '<div class="pf-nav"><div class="pf-nav-inner">' +
        '<a class="pf-brand" href="index.html">Justin Adler <span>· Portfolio</span></a>' +
        '<div class="pf-links">' + links +
          '<button class="pf-theme" onclick="PF.toggleTheme()">' + (theme === 'dark' ? 'Light' : 'Dark') + '</button>' +
        '</div>' +
      '</div></div>' +
      '<div class="pf-banner"><div class="pf-banner-inner">' +
        banner +
      '</div></div>';
    document.body.insertAdjacentHTML('afterbegin', nav);
  };

  PF.foot = function (note) {
    var html = '<footer class="pf-foot"><div><strong>Justin Adler</strong> · e-commerce &amp; growth ' +
      '· <a href="index.html">Portfolio overview</a></div>' +
      '<div style="margin-top:6px">Dashboards use synthetic data; storefront replicas mirror live public pages. Rebuilt from work ' +
      'I designed, built and operate.' + (note ? ' ' + note : '') + '</div></footer>';
    document.body.insertAdjacentHTML('beforeend', html);
  };

  PF.crumbs = function (title) {
    return '<div class="crumbs"><a href="index.html">Portfolio</a>' +
           '<span class="sep">/</span>' + title + '</div>';
  };
})();
