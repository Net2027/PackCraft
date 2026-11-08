// PackCraft site generator — کامل و خودکار
// همه‌ی صفحات آرشیو + صفحه‌ی اختصاصی هر مود/پک/شیدر/ویدیو + sitemap.xml + llms.txt را از packs-data.json می‌سازد.
// هر بار که دیتا تغییر کند (پنل ادمین/اپراتور → ربات → commit)، GitHub Actions این اسکریپت را اجرا می‌کند
// تا اعداد، صفحات جدید و جایگاه‌های تبلیغات همیشه به‌روز بمانند.
// Idempotent است و هیچ timestamp ثابتی در خروجی نمی‌گذارد (تا حلقه‌ی Actions بی‌نهایت نشود).
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://packcraft.ir';
const API_BASE = 'https://web-production-b6b4a.up.railway.app';
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'packs-data.json'), 'utf8'));

// ---------- helpers ----------
function escapeHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function cleanName(s) {
  return String(s ?? '').replace(/§./g, ' ').replace(/\s+/g, ' ').replace(/^[!\s]+|[!\s]+$/g, '').trim();
}
const faDigits = n => String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
function testedBadge(item) {
  return item && item.tested
    ? '<span class="tested-badge tested"><i class="ph-fill ph-check-circle"></i> تست شده</span>'
    : '<span class="tested-badge untested"><i class="ph-bold ph-minus-circle"></i> تست نشده</span>';
}
function featuredBadge(item) {
  return item && item.featured
    ? '<span class="featured-badge"><i class="ph-fill ph-medal"></i><span>پیشنهاد شده توسط سردبیر<span class="featured-badge-line2">پک کرفت</span></span></span>'
    : '';
}
function compatBadge(item) {
  return item && item.compatibility ? `<span class="mod-compat-badge">${escapeHtml(item.compatibility)}</span>` : '';
}
function itemIcon(item, fallback, klass) {
  return item && item.icon
    ? `<img src="${escapeHtml(item.icon)}" alt="${escapeHtml(cleanName(item.name))}" class="${klass || 'item-icon-img'}" loading="lazy" width="72" height="72">`
    : `<i class="ph-fill ${fallback}"></i>`;
}
function slugify(name, idx, taken) {
  let s = cleanName(name)
    .replace(/[§!@#$%^&*()+=\[\]{};:'"\\|,.<>\/?~`؟،«»]/g, ' ')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 70)
    .replace(/-+$/g, '');
  if (!s) s = 'item-' + (idx + 1);
  let base = s, i = 2;
  while (taken.has(s)) s = base + '-' + (i++);
  taken.add(s);
  return s;
}
const enc = encodeURIComponent;

// ---------- categories ----------
const CATS = [
  {
    id: 'mods', dir: 'mods', label: 'مودها', labelSingular: 'مود', eyebrow: 'GAME MODS',
    list: data.mods, fallbackIcon: 'ph-puzzle-piece mod-item-icon', dlIcon: 'ph-download-simple',
    titleFn: n => `دانلود مود ماینکرفت | ${faDigits(n)} مود تست‌شده جاوا و بدراک | پک کرفت`,
    descFn: n => `دانلود مود ماینکرفت برای جاوا و بدراک — ${faDigits(n)} مود تست‌شده با توضیح فارسی، سازگاری و لینک مستقیم. همراه با راهنمای نصب مود.`,
    h1: 'دانلود مود ماینکرفت',
    leadFn: n => `قابلیت‌های بیشتر، ماجراجویی‌های تازه‌تر؛ ${faDigits(n)} مود تست‌شده برای نسخه‌های جاوا و بدراک با توضیح فارسی و لینک دانلود مستقیم. برای نصب، راهنمای مودهای جاوا و بدراک را ببین.`,
    itemTitleFn: n => `دانلود مود ${n} ماینکرفت | پک کرفت`,
    itemH1Fn: n => `دانلود مود ${n} ماینکرفت`,
    itemDescFn: (n, d) => `${d || `مود ${n} برای ماینکرفت`} — دانلود مستقیم مود ${n} با توضیح فارسی، وضعیت تست و سازگاری از پک کرفت، مرجع تخصصی ماینکرفت.`.slice(0, 300),
  },
  {
    id: 'packs', dir: 'resource-packs', label: 'ریسورس پک‌ها', labelSingular: 'ریسورس پک', eyebrow: 'RESOURCE PACKS',
    list: data.packs, fallbackIcon: 'ph-folder', dlIcon: null,
    titleFn: n => `دانلود ریسورس پک ماینکرفت | ${faDigits(n)} پک تست‌شده | پک کرفت`,
    descFn: n => `دانلود ریسورس پک و تکسچر پک ماینکرفت برای نسخه‌های جاوا و بدراک — ${faDigits(n)} پک تست‌شده با توضیح فارسی و لینک مستقیم، رایگان از پک کرفت.`,
    h1: 'دانلود ریسورس پک ماینکرفت',
    leadFn: n => `بافت تازه‌ای به دنیایت بده؛ ${faDigits(n)} ریسورس پک تست‌شده برای جاوا و بدراک، با توضیح فارسی و لینک دانلود مستقیم.`,
    itemTitleFn: n => `دانلود ریسورس پک ${n} ماینکرفت | پک کرفت`,
    itemH1Fn: n => `دانلود ریسورس پک ${n} ماینکرفت`,
    itemDescFn: (n, d) => `${d || `ریسورس پک ${n} برای ماینکرفت`} — دانلود مستقیم ریسورس پک ${n} برای نسخه‌های جاوا و بدراک با توضیح فارسی از پک کرفت.`.slice(0, 300),
  },
  {
    id: 'shaders', dir: 'shaders', label: 'شیدرها', labelSingular: 'شیدر', eyebrow: 'SHADERS',
    list: data.shaders, fallbackIcon: 'ph-sparkle mod-item-icon', dlIcon: 'ph-download-simple',
    titleFn: n => `دانلود شیدر ماینکرفت | ${faDigits(n)} شیدر تست‌شده | پک کرفت`,
    descFn: n => `دانلود شیدر ماینکرفت برای جاوا و بدراک — ${faDigits(n)} شیدر تست‌شده با توضیح فارسی و لینک مستقیم؛ نور و رنگ تازه برای دنیای بلوکی تو.`,
    h1: 'دانلود شیدر ماینکرفت',
    leadFn: n => `نور و رنگ تازه برای دنیای بلوکی تو؛ ${faDigits(n)} شیدر تست‌شده با توضیح فارسی و لینک دانلود مستقیم.`,
    itemTitleFn: n => `دانلود شیدر ${n} ماینکرفت | پک کرفت`,
    itemH1Fn: n => `دانلود شیدر ${n} ماینکرفت`,
    itemDescFn: (n, d) => `${d || `شیدر ${n} برای ماینکرفت`} — دانلود مستقیم شیدر ${n} با توضیح فارسی و وضعیت تست از پک کرفت.`.slice(0, 300),
  },
  {
    id: 'films', dir: 'videos', label: 'ویدیوها', labelSingular: 'ویدیو', eyebrow: 'WATCH & PLAY',
    list: data.films, fallbackIcon: 'ph-video-camera mod-item-icon', dlIcon: 'ph-play-circle',
    titleFn: () => 'ویدیوهای ماینکرفت | آموزش و معرفی مودها | پک کرفت',
    descFn: () => 'تماشای ویدیوهای ماینکرفت پک کرفت: آموزش نصب مود و شیدر، تست و معرفی مودهای ماینکرفت به فارسی در آپارات.',
    h1: 'ویدیوهای ماینکرفت',
    leadFn: () => 'آموزش، الهام و ماجراجویی؛ تست و معرفی مودها و پک‌های ماینکرفت به فارسی.',
    itemTitleFn: n => `${n} | ویدیو ماینکرفت | پک کرفت`,
    itemH1Fn: n => `${n}`,
    itemDescFn: (n, d) => `${d || `ویدیو ${n}`} — تماشای ویدیو ماینکرفت «${n}» در پک کرفت؛ آموزش و معرفی به فارسی.`.slice(0, 300),
  },
];

// پیش‌محاسبه slug برای همه آیتم‌ها
for (const cat of CATS) {
  const taken = new Set();
  cat.items = cat.list.map((it, i) => ({ ...it, _name: cleanName(it.name), _slug: slugify(it.name, i, taken) }));
}

// ---------- shared shell ----------
const THEME_INIT = `<script>(function(){try{var s=localStorage.getItem('packcraft_theme');document.documentElement.setAttribute('data-theme',s==='light'?'light':'dark');}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();</script>`;

const YEKTANET_HEAD = `    <!-- تبلیغات -->
    <script>
        (function () {
            function runYektanet() {
                !function(e,t,n){e.yektanetAnalyticsObject=n,e[n]=e[n]||function(){e[n].q.push(arguments)},e[n].q=e[n].q||[];var a=t.getElementsByTagName("head")[0],r=new Date,c="https://cdn.yektanet.com/superscript/OfKrnJbZ/native-no-data-47945/yn_pub.js?v="+r.getFullYear().toString()+"0"+r.getMonth()+"0"+r.getDate()+"0"+r.getHours(),s=t.createElement("link");s.rel="preload",s.as="script",s.href=c,a.appendChild(s);var l=t.createElement("script");l.async=!0,l.src=c,a.appendChild(l)}(window,document,"yektanet");
            }

            function scheduleYektanet() {
                if ('requestIdleCallback' in window) {
                    requestIdleCallback(runYektanet, { timeout: 2000 });
                } else {
                    setTimeout(runYektanet, 1000);
                }
            }

            if (document.readyState === 'complete') {
                scheduleYektanet();
            } else {
                window.addEventListener('load', scheduleYektanet);
            }
        })();
    </script>`;

const PAGE_JS = `<script>
(function(){
    var t=document.getElementById('theme-toggle');
    if(t)t.addEventListener('click',function(){var d=document.documentElement;var n=d.getAttribute('data-theme')==='light'?'dark':'light';d.setAttribute('data-theme',n);try{localStorage.setItem('packcraft_theme',n);}catch(e){}});
    var h=document.getElementById('site-header'),b=document.getElementById('nav-toggle');
    function setMenu(o){if(h)h.classList.toggle('nav-open',o);if(b){b.setAttribute('aria-expanded',o?'true':'false');var i=b.querySelector('i');if(i)i.className=o?'ph-bold ph-x':'ph-bold ph-list';}}
    if(b)b.addEventListener('click',function(){setMenu(!h.classList.contains('nav-open'));});
    document.addEventListener('click',function(e){if(h&&h.classList.contains('nav-open')&&!h.contains(e.target))setMenu(false);});
    document.addEventListener('keydown',function(e){if(e.key==='Escape')setMenu(false);});
    var AB='${API_BASE}';
    document.addEventListener('click',function(e){var a=e.target.closest('[data-dl]');if(!a)return;try{fetch(AB+'/api/download-hit/'+a.getAttribute('data-dl')+'/'+encodeURIComponent(a.getAttribute('data-name')),{keepalive:true}).catch(function(){});}catch(x){}});
})();
</script>`;

function navHtml(active) {
  const items = [
    ['/', 'ph-house', 'صفحه اصلی', active === 'home'],
    ['/resource-packs/', 'ph-package', 'ریسورس پک‌ها', active === 'resource-packs'],
    ['/mods/', 'ph-puzzle-piece', 'مودها', active === 'mods'],
    ['/shaders/', 'ph-sparkle', 'شیدرها', active === 'shaders'],
    ['/videos/', 'ph-video-camera', 'ویدیوها', active === 'videos'],
    ['/#guide', 'ph-book-open-text', 'راهنما', false],
    ['/#about', 'ph-users-three', 'درباره ما', false],
    ['/#contact', 'ph-envelope-simple-open', 'تماس', false],
  ];
  return `<header id="site-header">
            <a href="/" class="logo-section" aria-label="پک کرفت — صفحه اصلی">
                <span class="logo-badge">
                    <img src="/logo.png" alt="پک کرفت">
                    <span class="logo-badge-corners" aria-hidden="true"></span>
                </span>
                <span class="brand-text">
                    <span class="brand-name">PackCraft</span>
                    <span class="brand-tagline">مرجع تخصصی ماینکرفت</span>
                    <span class="brand-sys" aria-hidden="true">ARCTIC PROTOCOL // v2</span>
                </span>
            </a>
            <div class="nav-wrapper" id="nav-wrapper">
                <nav aria-label="ناوبری اصلی">
                    <ul>${items.map(([href, icon, label, act]) => `
                        <li><a href="${href}" class="nav-link${act ? ' active' : ''}"${act ? ' aria-current="page"' : ''}><i class="ph ${icon}" aria-hidden="true"></i><span>${label}</span></a></li>`).join('')}
                    </ul>
                </nav>
            </div>
            <div class="header-actions">
                <button id="theme-toggle" class="theme-toggle" type="button" aria-label="تغییر حالت روشن و تاریک" title="حالت روشن / تاریک">
                    <i class="ph-fill ph-moon theme-icon-dark"></i>
                    <i class="ph-fill ph-sun theme-icon-light"></i>
                </button>
                <button id="nav-toggle" class="nav-toggle" type="button" aria-label="باز و بسته کردن منو" aria-expanded="false" aria-controls="nav-wrapper">
                    <i class="ph-bold ph-list"></i>
                </button>
            </div>
        </header>`;
}

const FOOTER_HTML = `<footer>
        <div class="footer-inner">
            <div class="footer-brand">
                <img src="/logo.png" alt="" loading="lazy">
                <div class="footer-brand-text">
                    <strong>پک کرفت</strong>
                    <span aria-hidden="true">دنیای تو، به سبک تو</span>
                </div>
            </div>
            <div class="footer-rights">
                تمامی حقوق برای <strong>پک کرفت</strong> محفوظ است - ۱۴۰۵
            </div>
        </div>
    </footer>`;

function pageShell(cfg) {
  return `<!DOCTYPE html>
<html lang="fa" dir="rtl" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${cfg.title}</title>
    <meta name="description" content="${escapeHtml(cfg.description)}">
    <link rel="canonical" href="${cfg.url}">
    <meta name="theme-color" content="#080d17">
    <meta name="theme-color" media="(prefers-color-scheme: light)" content="#f0f5fb">
    <meta property="og:site_name" content="پک کرفت | PackCraft">
    <meta property="og:type" content="website">
    <meta property="og:locale" content="fa_IR">
    <meta property="og:url" content="${cfg.url}">
    <meta property="og:title" content="${escapeHtml(cfg.title)}">
    <meta property="og:description" content="${escapeHtml(cfg.description)}">
    <meta property="og:image" content="${cfg.image || SITE + '/world.png'}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(cfg.title)}">
    <meta name="twitter:description" content="${escapeHtml(cfg.description)}">
    <meta name="twitter:image" content="${cfg.image || SITE + '/world.png'}">
    <link rel="icon" type="image/png" href="/logo.png">
    <link rel="preload" href="/fonts/vazirmatn-var.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="stylesheet" href="/style.css">
    <script type="application/ld+json">
    ${cfg.ld}
    </script>
    ${THEME_INIT}
    ${YEKTANET_HEAD}
</head>
<body>
    <a href="#main-content" class="skip-link">رفتن به محتوای اصلی</a>

    <div class="fixed-bg" aria-hidden="true">
        <span class="cinema-atmosphere"></span>
        <span class="cinema-architecture"></span>
        <span class="cinema-floor"></span>
        <span class="cinema-vignette"></span>
    </div>
    <div class="bg-scanlines"></div>
    <div class="bg-pixel">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
    </div>

    <div class="header-shell animate-up delay-1" id="header-shell">
    ${navHtml(cfg.active)}
    </div>
    <main id="main-content" tabindex="-1">
        ${cfg.content}
        <div class="ad-inline"><div class="yn-bnr" id="ynpos-21391"></div></div>
    </main>
    <div class="ad-strip ad-strip--bottom">
        <div class="yn-bnr" id="ynpos-20084"></div>
    </div>
    ${FOOTER_HTML}
    ${PAGE_JS}
</body>
</html>
`;
}

function writePage(relPath, cfg) {
  const outPath = path.join(ROOT, relPath);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, pageShell(cfg));
}

// ---------- 1) hub pages ----------
const cardHref = (cat, it) => `/${cat.dir}/${enc(it._slug)}/`;

function hubCard(cat, it, idx) {
  const href = cardHref(cat, it);
  if (cat.id === 'packs') {
    return `<a href="${href}" class="pack-item" style="text-decoration:none;color:inherit;--i:${Math.min(idx, 9)}">
                        <div class="item-head">${itemIcon(it, 'ph-folder')}</div>
                        <span class="item-name">${escapeHtml(it._name)}</span>
                        <div class="item-badges">${testedBadge(it)}${featuredBadge(it)}</div>
                        ${it.description ? `<p class="pack-item-desc">${escapeHtml(it.description)}</p>` : ''}
                        <span class="item-more">مشاهده و دانلود <i class="ph-bold ph-arrow-left"></i></span>
                    </a>`;
  }
  return `<a href="${href}" class="mod-item" style="text-decoration:none;color:inherit;--i:${Math.min(idx, 9)}">
                        <div class="item-head">${itemIcon(it, cat.fallbackIcon)}</div>
                        <span class="mod-item-name">${escapeHtml(it._name)}</span>
                        <div class="item-badges">${testedBadge(it)}${featuredBadge(it)}${cat.id !== 'films' ? compatBadge(it) : ''}</div>
                        ${it.description ? `<p class="pack-item-desc">${escapeHtml(it.description)}</p>` : ''}
                        <span class="item-more">مشاهده و دانلود <i class="ph-bold ph-arrow-left"></i></span>
                    </a>`;
}

function itemListLd(name, url, items) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'name': name,
    'numberOfItems': items.length,
    'itemListElement': items.map((it, i) => {
      const el = { '@type': 'ListItem', 'position': i + 1, 'name': it._name, 'url': url };
      if (it.description) el.description = String(it.description).slice(0, 300);
      return el;
    }),
  }, null, 2);
}

for (const cat of CATS) {
  const url = `${SITE}/${cat.dir}/`;
  const content = `<div class="catalog-heading"><div class="page-eyebrow">${cat.eyebrow}</div><h1>${cat.h1}</h1><p>${escapeHtml(cat.leadFn(cat.items.length))}</p></div>
        <div class="packs-grid" style="display:grid;">\n${cat.items.map((it, i) => hubCard(cat, it, i)).join('\n')}\n</div>`;
  writePage(path.join(cat.dir, 'index.html'), {
    active: cat.dir,
    title: cat.titleFn(cat.items.length),
    description: cat.descFn(cat.items.length),
    url,
    content,
    ld: itemListLd(cat.h1, url, cat.items),
  });
  console.log(`hub  /${cat.dir}/  (${cat.items.length} items)`);
}

// ---------- 2) item pages ----------
function crumbHtml(cat, name) {
  return `<div class="page-crumb" aria-label="مسیر">
        <a href="/">خانه</a>
        <span class="crumb-sep" aria-hidden="true">‹</span>
        <a href="/${cat.dir}/">${escapeHtml(cat.label)}</a>
        <span class="crumb-sep" aria-hidden="true">‹</span>
        <span class="crumb-here" aria-current="page">${escapeHtml(name)}</span>
    </div>`;
}

function downloadButtons(cat, it) {
  if (cat.id === 'packs') {
    const btn = (href, icon, label, small) => href
      ? `<a href="${escapeHtml(href)}" target="_blank" rel="noopener" class="pack-download-btn available" data-dl="packs" data-name="${escapeHtml(it.name)}"><i class="ph-fill ${icon}"></i> ${label}<small>${small}</small></a>`
      : `<div class="pack-download-btn disabled"><i class="ph-fill ${icon}"></i> ${label}<small>به زودی</small></div>`;
    return `<div class="pack-download-buttons">
                ${btn(it.java, 'ph-cube', 'دانلود جاوا', 'MINECRAFT JAVA EDITION')}
                ${btn(it.bedrock, 'ph-cube-transparent', 'دانلود بدراک', 'MINECRAFT BEDROCK')}
            </div>`;
  }
  if (cat.id === 'films') {
    return it.link
      ? `<a href="${escapeHtml(it.link)}" target="_blank" rel="noopener" class="mod-download-btn available"><i class="ph-fill ph-play-circle"></i> مشاهده فیلم در آپارات</a>`
      : `<div class="mod-download-btn disabled"><i class="ph-fill ph-play-circle"></i> به زودی</div>`;
  }
  const dlCat = cat.id; // mods | shaders
  return it.file
    ? `<a href="${escapeHtml(it.file)}" target="_blank" rel="noopener" class="mod-download-btn available" data-dl="${dlCat}" data-name="${escapeHtml(it.name)}"><i class="ph-fill ${cat.dlIcon}"></i> دانلود مستقیم</a>`
    : `<div class="mod-download-btn disabled"><i class="ph-fill ${cat.dlIcon}"></i> به زودی</div>`;
}

function relatedCards(cat, currentIdx) {
  const others = cat.items.filter((_, i) => i !== currentIdx).slice(0, 8);
  if (others.length === 0) return '';
  return `<div class="catalog-heading" style="margin-top:40px;"><h2>${escapeHtml(cat.label + ' دیگر')} </h2><p>از آرشیو پک کرفت ببین:</p></div>
        <div class="packs-grid" style="display:grid;">\n${others.map((it, i) => hubCard(cat, it, i)).join('\n')}\n</div>`;
}

function breadcrumbLd(cat, name, url) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      { '@type': 'ListItem', 'position': 1, 'name': 'خانه', 'item': SITE + '/' },
      { '@type': 'ListItem', 'position': 2, 'name': cat.label, 'item': `${SITE}/${cat.dir}/` },
      { '@type': 'ListItem', 'position': 3, 'name': name, 'item': url },
    ],
  }, null, 2);
}

for (const cat of CATS) {
  // پاکسازی صفحات آیتم‌هایی که دیگر در دیتا نیستند
  const catDir = path.join(ROOT, cat.dir);
  if (fs.existsSync(catDir)) {
    for (const e of fs.readdirSync(catDir, { withFileTypes: true })) {
      if (e.isDirectory()) fs.rmSync(path.join(catDir, e.name), { recursive: true, force: true });
    }
  }
  cat.items.forEach((it, idx) => {
    const name = it._name;
    const url = `${SITE}/${cat.dir}/${enc(it._slug)}/`;
    const img = it.icon || null;
    const ldParts = [breadcrumbLd(cat, name, url)];
    if (cat.id !== 'films') {
      ldParts.push(JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        'name': name,
        'description': cat.itemDescFn(name, it.description || ''),
        'url': url,
        ...(img ? { 'image': img } : {}),
        'applicationCategory': 'GameApplication',
        'operatingSystem': cat.id === 'packs' ? 'Minecraft Java, Minecraft Bedrock' : 'Minecraft Java, Minecraft Bedrock',
      }));
    }
    const content = `${crumbHtml(cat, name)}
        <div class="catalog-heading"><div class="page-eyebrow">${cat.eyebrow}</div><h1>${escapeHtml(cat.itemH1Fn(name))}</h1></div>
        <div class="detail-card">
            <div class="detail-hero">
                ${itemIcon(it, 'ph-package pack-detail-icon', 'pack-detail-icon-img')}
                <div class="detail-titles">
                    <span class="detail-code">جزئیات ${escapeHtml(cat.labelSingular)}</span>
                    <h2>${escapeHtml(name)}</h2>
                </div>
            </div>
            <div class="detail-badges">${testedBadge(it)} ${featuredBadge(it)}${cat.id !== 'films' ? ' ' + compatBadge(it) : ''}</div>
            ${it.description ? `<p class="pack-item-desc" style="padding:8px 4px;line-height:2;">${escapeHtml(it.description)}</p>` : ''}
            ${downloadButtons(cat, it)}
        </div>
        ${relatedCards(cat, idx)}`;
    writePage(path.join(cat.dir, it._slug, 'index.html'), {
      active: cat.dir,
      title: cat.itemTitleFn(name),
      description: cat.itemDescFn(name, it.description || ''),
      url,
      image: img ? img : undefined,
      content,
      ld: ldParts.join('\n    '),
    });
  });
  console.log(`items  /${cat.dir}/<slug>/  (${cat.items.length} pages)`);
}

// ---------- 3) sitemap ----------
const urls = [{ loc: `${SITE}/`, pr: '1.0', freq: 'daily' }];
for (const cat of CATS) {
  urls.push({ loc: `${SITE}/${cat.dir}/`, pr: '0.9', freq: 'weekly' });
  for (const it of cat.items) {
    urls.push({ loc: `${SITE}/${cat.dir}/${enc(it._slug)}/`, pr: cat.id === 'films' ? '0.5' : '0.7', freq: 'weekly' });
  }
}
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${u.loc}</loc><changefreq>${u.freq}</changefreq><priority>${u.pr}</priority></url>`).join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap);
console.log('sitemap.xml with', urls.length, 'URLs');

// ---------- 4) llms.txt ----------
const sections = CATS.map(c => `- [آرشیو ${c.label}](https://packcraft.ir/${c.dir}/): ${faDigits(c.items.length)} ${c.label} با صفحه اختصاصی برای هر آیتم`).join('\n');
const llms = `# PackCraft (پک کرفت)

> مرجع تخصصی فارسی دانلود ریسورس پک، مود، شیدر و محتوای ویدیویی بازی Minecraft برای نسخه‌های Java و Bedrock. تمام فایل‌ها تست‌شده و رایگان هستند.

سایت: ${SITE}/
زبان: فارسی (fa)
برند: PackCraft / پک کرفت

## بخش‌ها

- [صفحه اصلی](${SITE}/): معرفی سایت و دسترسی به همه آرشیوها
${sections}
هر مود، پک و شیدر یک صفحه اختصاصی دارد: ${SITE}/mods/<نام-مود>/

## داده ماشین‌خوان

فهرست کامل و به‌روز همه آیتم‌ها (نام، توضیح فارسی، سازگاری، آیکون) در قالب JSON:
${SITE}/packs-data.json

آمار فعلی: ${faDigits(data.packs.length)} ریسورس پک، ${faDigits(data.mods.length)} مود، ${faDigits(data.shaders.length)} شیدر، ${faDigits(data.films.length)} ویدیو

## راه‌های ارتباطی

- ایمیل و کانال‌های رسمی: آپارات، تلگرام، ایتا، سروش، روبیکا — فهرست کامل در صفحه اصلی سایت.

## نحوه استناد

برای ارجاع به یک مود یا پک خاص، از صفحه اختصاصی همان آیتم استفاده کنید (هر آیتم URL مستقل دارد).
`;
fs.writeFileSync(path.join(ROOT, 'llms.txt'), llms);
console.log('llms.txt updated');

console.log('DONE — همه صفحات ساخته شدند');
