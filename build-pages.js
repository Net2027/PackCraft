const fs = require('fs');
const path = require('path');

// Read raw data and sitemap
const sitemapXml = fs.readFileSync(path.join(__dirname, 'sitemap.xml'), 'utf8');
const packsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'packs-data.json'), 'utf8'));

// Parse all URLs from sitemap
const allLocs = [...sitemapXml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => decodeURIComponent(new URL(m[1]).pathname));

function getCategorySlugs(prefix) {
    return allLocs
        .filter(l => l.startsWith(prefix) && l !== prefix)
        .map(l => {
            const parts = l.split('/').filter(Boolean);
            return parts[parts.length - 1];
        });
}

const modSlugs = getCategorySlugs('/mods/');
const packSlugs = getCategorySlugs('/resource-packs/');
const shaderSlugs = getCategorySlugs('/shaders/');
const videoSlugs = getCategorySlugs('/videos/');

console.log(`Found slugs -> Mods: ${modSlugs.length}, Packs: ${packSlugs.length}, Shaders: ${shaderSlugs.length}, Videos: ${videoSlugs.length}`);

// Helpers
function cleanItemName(str) {
    if (!str) return '';
    let clean = String(str).replace(/§[0-9a-fk-or]/gi, '').trim();
    clean = clean.replace(/^!\s*/, '');
    return clean || str;
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function escapeJs(str) {
    if (!str) return '';
    return String(str).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"');
}

// Category Configs
const CATEGORIES = {
    mods: {
        key: 'mods',
        title: 'مودهای ماینکرفت',
        singular: 'مود',
        url: '/mods/',
        slugPrefix: '/mods/',
        items: packsData.mods,
        slugs: modSlugs,
        icon: 'ph-puzzle-piece',
        color: '#60a5fa',
        colorGlow: 'rgba(96, 165, 250, 0.25)',
        desc: 'مجموعه برترین و جدیدترین مودهای ماینکرفت برای نسخه‌های جاوا و بدراک با لینک مستقیم و تست‌شده.',
        folderPath: 'mods'
    },
    packs: {
        key: 'packs',
        title: 'ریسورس پک‌های ماینکرفت',
        singular: 'ریسورس پک',
        url: '/resource-packs/',
        slugPrefix: '/resource-packs/',
        items: packsData.packs,
        slugs: packSlugs,
        icon: 'ph-package',
        color: '#34d399',
        colorGlow: 'rgba(52, 211, 153, 0.25)',
        desc: 'بهترین تکسچر پک‌ها و ریسورس پک‌های ماینکرفت با کیفیت‌های 16x تا 512x برای بدوارز، پی‌وی‌پی و سروایول.',
        folderPath: 'resource-packs'
    },
    shaders: {
        key: 'shaders',
        title: 'شیدرهای ماینکرفت',
        singular: 'شیدر',
        url: '/shaders/',
        slugPrefix: '/shaders/',
        items: packsData.shaders,
        slugs: shaderSlugs,
        icon: 'ph-sparkle',
        color: '#fbbf24',
        colorGlow: 'rgba(251, 191, 36, 0.25)',
        desc: 'شیدرهای واقع‌گرایانه و گرافیکی ماینکرفت با نورپردازی طبیعی، آب زلال و سایه‌های پویا برای سیستم‌های ضعیف تا قوی.',
        folderPath: 'shaders'
    },
    videos: {
        key: 'videos',
        title: 'ویدیوهای پک کرفت',
        singular: 'ویدیو',
        url: '/videos/',
        slugPrefix: '/videos/',
        items: packsData.films,
        slugs: videoSlugs,
        icon: 'ph-video-camera',
        color: '#a78bfa',
        colorGlow: 'rgba(167, 139, 250, 0.25)',
        desc: 'ویدیوهای بررسی، آموزش و تست گیم‌پلی جذاب‌ترین مودها و نقشه‌های ماینکرفت در آپارات.',
        folderPath: 'videos'
    }
};

// Common HTML Fragments
function renderHead(title, description, canonicalUrl, ogImage, schemaJson) {
    return `<!DOCTYPE html>
<html lang="fa" dir="rtl" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}">
    <meta name="robots" content="index, follow, max-image-preview:large">
    <meta name="theme-color" content="#060911">

    <!-- Open Graph -->
    <meta property="og:type" content="website">
    <meta property="og:locale" content="fa_IR">
    <meta property="og:site_name" content="PackCraft | پک کرفت">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
    <meta property="og:image" content="${escapeHtml(ogImage || 'https://packcraft.ir/logo.png')}">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <meta name="twitter:image" content="${escapeHtml(ogImage || 'https://packcraft.ir/logo.png')}">

    <!-- Icons & Typography -->
    <link rel="icon" type="image/png" href="/logo.png">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Vazirmatn:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <link rel="preload" href="/fonts/vazirmatn-var.woff2" as="font" type="font/woff2" crossorigin>

    <!-- Theme Initialization Script -->
    <script>
        (function () {
            try {
                var saved = localStorage.getItem('packcraft_theme');
                var theme = saved === 'light' ? 'light' : 'dark';
                document.documentElement.setAttribute('data-theme', theme);
            } catch (e) {
                document.documentElement.setAttribute('data-theme', 'dark');
            }
        })();
    </script>

    <!-- تبلیغات یکتانت -->
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
    </script>

    ${schemaJson ? `<script type="application/ld+json">${JSON.stringify(schemaJson)}</script>` : ''}
    <link rel="stylesheet" href="/style.css">
</head>`;
}

function renderHeader(activeNavKey) {
    return `
    <a href="#main-content" class="skip-link">رفتن به محتوای اصلی</a>

    <!-- پس‌زمینه زنده و شیشه‌ای -->
    <div class="fixed-bg" aria-hidden="true">
        <span class="cinema-atmosphere"></span>
        <span class="cinema-architecture"></span>
        <span class="cinema-floor"></span>
        <span class="cinema-vignette"></span>
        <div class="floating-cubes">
            <span class="f-cube c1"></span>
            <span class="f-cube c2"></span>
            <span class="f-cube c3"></span>
            <span class="f-cube c4"></span>
            <span class="f-cube c5"></span>
            <span class="f-cube c6"></span>
        </div>
    </div>

    <!-- هدر شیشه‌ای شناور -->
    <div class="header-shell" id="header-shell">
        <header id="site-header">
            <a href="/" class="logo-section" aria-label="پک کرفت — صفحه اصلی">
                <span class="logo-badge">
                    <img src="/logo.png" alt="پک کرفت" width="36" height="36">
                </span>
                <span class="brand-text">
                    <span class="brand-name">PackCraft</span>
                    <span class="brand-tagline">مرجع تخصصی ماینکرفت</span>
                </span>
            </a>

            <div class="nav-wrapper" id="nav-wrapper">
                <nav aria-label="ناوبری اصلی">
                    <ul>
                        <li><a href="/" class="nav-link ${activeNavKey === 'home' ? 'active' : ''}"><i class="ph ph-house" aria-hidden="true"></i><span>صفحه اصلی</span></a></li>
                        <li><a href="/resource-packs/" class="nav-link ${activeNavKey === 'packs' ? 'active' : ''}"><i class="ph ph-package" aria-hidden="true"></i><span>ریسورس پک‌ها</span></a></li>
                        <li><a href="/mods/" class="nav-link ${activeNavKey === 'mods' ? 'active' : ''}"><i class="ph ph-puzzle-piece" aria-hidden="true"></i><span>مودها</span></a></li>
                        <li><a href="/shaders/" class="nav-link ${activeNavKey === 'shaders' ? 'active' : ''}"><i class="ph ph-sparkle" aria-hidden="true"></i><span>شیدرها</span></a></li>
                        <li><a href="/videos/" class="nav-link ${activeNavKey === 'videos' ? 'active' : ''}"><i class="ph ph-video-camera" aria-hidden="true"></i><span>ویدیوها</span></a></li>
                        <li><a href="/#guide" class="nav-link"><i class="ph ph-book-open-text" aria-hidden="true"></i><span>راهنما</span></a></li>
                        <li><a href="/#about" class="nav-link"><i class="ph ph-users-three" aria-hidden="true"></i><span>درباره ما</span></a></li>
                        <li><a href="/#contact" class="nav-link"><i class="ph ph-envelope-simple-open" aria-hidden="true"></i><span>تماس</span></a></li>
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
        </header>
    </div>`;
}

function renderFooter() {
    return `
    <footer>
        <div class="footer-inner">
            <div class="footer-brand">
                <img src="/logo.png" alt="پک کرفت" width="32" height="35">
                <div class="footer-brand-text">
                    <strong>پک کرفت // PackCraft.ir</strong>
                    <span>مرجع دانلود و آموزش ریسورس پک، مود و شیدر ماینکرفت</span>
                </div>
            </div>
            <div class="footer-links-quick">
                <a href="/mods/">مودها</a> •
                <a href="/resource-packs/">ریسورس پک‌ها</a> •
                <a href="/shaders/">شیدرها</a> •
                <a href="/videos/">ویدیوها</a> •
                <a href="/#guide">راهنمای نصب</a>
            </div>
            <div class="footer-rights">
                <p>© ۲۰۲۶ تمامی حقوق محفوظ است. ماینکرفت علامت تجاری ثبت‌شدهٔ Mojang Synergies AB است.</p>
            </div>
        </div>
    </footer>

    <!-- Toast Notification -->
    <div id="copy-status" class="copy-status" role="status" aria-live="polite">
        <i class="ph-bold ph-check-circle" aria-hidden="true"></i>
        <span id="copy-status-text">انجام شد</span>
    </div>

    <!-- اسکریپت‌های پایه (تم، منوی موبایل و رهگیری دانلود) -->
    <script>
        // تغییر حالت روشن / تاریک
        (function themeToggle() {
            var btn = document.getElementById('theme-toggle');
            if (!btn) return;
            btn.addEventListener('click', function () {
                var isLight = document.documentElement.getAttribute('data-theme') === 'light';
                var next = isLight ? 'dark' : 'light';
                document.documentElement.setAttribute('data-theme', next);
                try { localStorage.setItem('packcraft_theme', next); } catch (e) {}
            });
        })();

        // منوی همبرگری موبایل
        (function mobileNav() {
            var toggle = document.getElementById('nav-toggle');
            var header = document.getElementById('site-header');
            if (!toggle || !header) return;
            toggle.addEventListener('click', function () {
                var isOpen = header.classList.toggle('nav-open');
                toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
                var icon = toggle.querySelector('i');
                if (icon) {
                    icon.className = isOpen ? 'ph-bold ph-x' : 'ph-bold ph-list';
                }
            });
        })();

        // توابع پیام وضعیت (Toast)
        function showStatus(message) {
            var toast = document.getElementById('copy-status');
            var text = document.getElementById('copy-status-text');
            if (!toast) return;
            if (text) text.textContent = message;
            toast.classList.add('visible');
            clearTimeout(window.__toastTimer);
            window.__toastTimer = setTimeout(function () {
                toast.classList.remove('visible');
            }, 3000);
        }

        // رهگیری تعداد دانلود
        function trackDownload(key) {
            try {
                var current = parseInt(localStorage.getItem('dl_' + key) || '0', 10);
                localStorage.setItem('dl_' + key, current + 1);
            } catch (e) {}
            showStatus('دانلود آغاز شد! در صورت نیاز راهنمای نصب را مطالعه کنید.');
        }

        // کپی کردن مسیرها
        document.addEventListener('click', function (e) {
            var btn = e.target.closest('.copy-path');
            if (!btn) return;
            var targetId = btn.getAttribute('data-copy-target');
            var el = targetId ? document.getElementById(targetId) : null;
            var text = el ? (el.value || el.textContent || '') : (btn.getAttribute('data-copy-text') || '');
            if (!text) return;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(function () {
                    showStatus('مسیر در کلیپ‌بورد کپی شد!');
                }).catch(function () {
                    showStatus('خطا در کپی مسیر');
                });
            }
        });
    </script>`;
}

// -------------------------------------------------------------
// 1. Generate Individual Item Pages
// -------------------------------------------------------------
function generateItemPages() {
    let count = 0;
    for (const catKey of Object.keys(CATEGORIES)) {
        const cat = CATEGORIES[catKey];
        const items = cat.items;
        const slugs = cat.slugs;

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const slug = slugs[i];
            if (!slug) continue;

            const cleanName = cleanItemName(item.name);
            const itemUrl = `${cat.slugPrefix}${slug}/`;
            const fullCanonical = `https://packcraft.ir${itemUrl}`;
            const itemImg = item.icon || '/main.png';

            const metaTitle = `دانلود ${cat.singular} ${cleanName} برای ماینکرفت با لینک مستقیم | پک کرفت`;
            const metaDesc = item.description 
                ? `${cleanName} — ${item.description}. دانلود رایگان و مستقیم با سرعت بالا و تضمین سلامت فایل در پک کرفت.`
                : `دانلود مستقیم و رایگان ${cat.singular} ${cleanName} برای بازی ماینکرفت. فایل تست‌شده و سازگار با نسخه‌های مختلف جاوا و بدراک.`;

            // Download file links
            let downloadActionsHtml = '';
            let fileTypeTag = 'فایل ماینکرفت';

            if (catKey === 'packs') {
                const hasJava = !!item.java;
                const hasBedrock = !!item.bedrock;
                fileTypeTag = hasJava && hasBedrock ? 'جاوا + بدراک' : (hasBedrock ? 'بدراک' : 'جاوا');

                downloadActionsHtml = `
                <div class="download-multi-actions">
                    ${hasJava ? `
                    <a href="${item.java}" class="single-download-btn java-btn" target="_blank" rel="noopener noreferrer" download onclick="trackDownload('packs:${escapeJs(item.name)}:java')">
                        <i class="ph ph-desktop-tower"></i>
                        <span>دانلود نسخه جاوا (Java Edition)</span>
                    </a>` : ''}
                    ${hasBedrock ? `
                    <a href="${item.bedrock}" class="single-download-btn bedrock-btn" target="_blank" rel="noopener noreferrer" download onclick="trackDownload('packs:${escapeJs(item.name)}:bedrock')">
                        <i class="ph ph-device-mobile"></i>
                        <span>دانلود نسخه بدراک (Bedrock / PE)</span>
                    </a>` : ''}
                    ${!hasJava && !hasBedrock ? `<p class="text-dim">لینک دانلود به زودی به‌روزرسانی می‌شود.</p>` : ''}
                </div>`;
            } else if (catKey === 'videos') {
                fileTypeTag = 'ویدیو آپارات';
                downloadActionsHtml = `
                <a href="${item.link}" class="single-download-btn video-btn" target="_blank" rel="noopener noreferrer">
                    <i class="ph ph-play-circle"></i>
                    <span>تماشای ویدیو در آپارات</span>
                </a>`;
            } else {
                // mods, shaders
                const dlUrl = item.file || '#';
                fileTypeTag = item.compatibility || 'جاوا و بدراک';
                downloadActionsHtml = `
                <a href="${dlUrl}" class="single-download-btn" target="_blank" rel="noopener noreferrer" download onclick="trackDownload('${catKey}:${escapeJs(item.name)}')">
                    <i class="ph ph-download-simple"></i>
                    <span>دانلود مستقیم ${cleanName}</span>
                </a>`;
            }

            // Related Items (4 items from same category, excluding current)
            const relatedItems = items
                .map((it, idx) => ({ item: it, slug: slugs[idx] }))
                .filter(x => x.slug !== slug)
                .slice(0, 4);

            let relatedHtml = relatedItems.map(r => {
                const rClean = cleanItemName(r.item.name);
                const rImg = r.item.icon || '/main.png';
                return `
                <article class="pack-card mini-card">
                    <div class="pack-media">
                        <img src="${rImg}" alt="${escapeHtml(rClean)}" loading="lazy" width="300" height="170">
                    </div>
                    <div class="pack-body">
                        <h3 class="pack-title">${escapeHtml(rClean)}</h3>
                        <a href="${cat.slugPrefix}${r.slug}/" class="btn-card-view">مشاهده و دانلود</a>
                    </div>
                </article>`;
            }).join('');

            // Schema.org
            const schemaJson = {
                "@context": "https://schema.org",
                "@type": catKey === 'videos' ? "VideoObject" : "SoftwareApplication",
                "name": cleanName,
                "description": metaDesc,
                "applicationCategory": "GameApplication",
                "operatingSystem": "Windows, Android, iOS, macOS",
                "image": itemImg.startsWith('http') ? itemImg : `https://packcraft.ir${itemImg}`,
                "url": fullCanonical,
                "offers": {
                    "@type": "Offer",
                    "price": "0",
                    "priceCurrency": "IRR"
                }
            };

            const pageHtml = `
${renderHead(metaTitle, metaDesc, fullCanonical, itemImg, schemaJson)}
<body>
    ${renderHeader(catKey)}

    <main id="main-content" tabindex="-1">
        <div class="item-page-wrap">

            <!-- مسیر صفحه (Breadcrumb) -->
            <nav class="page-crumb" aria-label="مسیر صفحه">
                <a href="/"><i class="ph ph-house" aria-hidden="true"></i> خانه</a>
                <span class="crumb-sep">/</span>
                <a href="${cat.url}">${cat.title}</a>
                <span class="crumb-sep">/</span>
                <span class="crumb-current">${escapeHtml(cleanName)}</span>
            </nav>

            <!-- تبلیغ بالای صفحه -->
            <div class="ad-strip ad-strip--top">
                <div class="yn-bnr" id="ynpos-21391"></div>
            </div>

            <!-- هیرو و جزئیات آیتم -->
            <section class="item-detail-hero" aria-label="جزئیات ${escapeHtml(cleanName)}">
                <div class="item-detail-head">
                    <div class="item-detail-banner">
                        <img src="${itemImg}" alt="${escapeHtml(cleanName)}" width="480" height="300">
                    </div>
                    <div class="item-detail-meta">
                        <div class="item-eyebrow-row">
                            <span class="category-chip" style="color: ${cat.color}; border-color: ${cat.colorGlow};">
                                <i class="ph ${cat.icon}"></i> ${cat.singular}
                            </span>
                            ${item.tested ? '<span class="status-pill tested"><i class="ph ph-shield-check"></i> تست‌شده و سالم</span>' : ''}
                            ${item.featured ? '<span class="status-pill featured"><i class="ph ph-medal"></i> برگزیده</span>' : ''}
                        </div>

                        <h1>${escapeHtml(cleanName)}</h1>

                        <div class="item-compat-tags">
                            <span class="tag-pill"><i class="ph ph-cube"></i> سازگاری: ${escapeHtml(fileTypeTag)}</span>
                            <span class="tag-pill"><i class="ph ph-lightning"></i> دانلود مستقیم</span>
                            <span class="tag-pill"><i class="ph ph-check-circle"></i> ترافیک نیم‌بها</span>
                        </div>

                        ${item.description ? `<p class="item-detail-desc">${escapeHtml(item.description)}</p>` : `<p class="item-detail-desc">این ${cat.singular} برای بازی ماینکرفت بهینه‌سازی شده و به صورت کامل توسط تیم پک کرفت بررسی و تست گردیده است.</p>`}
                    </div>
                </div>

                <!-- ویژگی‌های کلیدی -->
                <div class="item-features-strip">
                    <div class="feature-pill">
                        <i class="ph ph-lightning"></i>
                        <div>
                            <strong>دانلود پرسرعت</strong>
                            <span>لینک مستقیم بدون توقف</span>
                        </div>
                    </div>
                    <div class="feature-pill">
                        <i class="ph ph-shield-check"></i>
                        <div>
                            <strong>امن و تضمین‌شده</strong>
                            <span>فاقد هرگونه ویروس و کرش</span>
                        </div>
                    </div>
                    <div class="feature-pill">
                        <i class="ph ph-devices"></i>
                        <div>
                            <strong>پشتیبانی کامل</strong>
                            <span>سازگار با ${escapeHtml(fileTypeTag)}</span>
                        </div>
                    </div>
                    <div class="feature-pill">
                        <i class="ph ph-wrench"></i>
                        <div>
                            <strong>نصب آسان</strong>
                            <span>راهنمای مرحله‌به‌مرحله</span>
                        </div>
                    </div>
                </div>

                <!-- باکس دانلود -->
                <div class="item-download-box">
                    <div class="download-box-title">
                        <h3><i class="ph ph-download-simple"></i> دریافت مستقیم فایل</h3>
                        <span class="download-safe-tag"><i class="ph ph-shield-check"></i> تایید شده توسط پک کرفت</span>
                    </div>

                    ${downloadActionsHtml}
                </div>
            </section>

            <!-- تبلیغ محتوایی یکتانت (درون متنی) -->
            <div class="ad-inline">
                <div id="pos-article-display-122298"></div>
            </div>

            <!-- راهنمای نصب سریع ماینکرفت -->
            <section class="inpage-guide-card">
                <h3><i class="ph ph-lightbulb"></i> راهنمای نصب در بازی</h3>
                <div class="guide-quick-steps">
                    <div class="quick-step-item">
                        <span class="q-num">۱</span>
                        <div class="q-content">
                            <strong>دانلود فایل:</strong>
                            <p>روی دکمه دانلود بالا کلیک کرده و فایل را ذخیره کنید.</p>
                        </div>
                    </div>
                    <div class="quick-step-item">
                        <span class="q-num">۲</span>
                        <div class="q-content">
                            <strong>انتقال به پوشه بازی:</strong>
                            <p>کلیدهای <code>Win + R</code> را زده و عبارت <code>%appdata%\\.minecraft</code> را وارد کنید. فایل را درون پوشه <code>${catKey === 'mods' ? 'mods' : (catKey === 'shaders' ? 'shaderpacks' : 'resourcepacks')}</code> قرار دهید.</p>
                        </div>
                    </div>
                    <div class="quick-step-item">
                        <span class="q-num">۳</span>
                        <div class="q-content">
                            <strong>فعال‌سازی در بازی:</strong>
                            <p>بازی را اجرا کرده و از بخش تنظیمات (Options) گزینه مربوطه را فعال کنید.</p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- آیتم‌های مرتبط -->
            <section class="related-section">
                <h2>سایر ${cat.title} پیشنهادی</h2>
                <div class="packs-grid related-grid">
                    ${relatedHtml}
                </div>
            </section>

            <!-- تبلیغ پایین صفحه -->
            <div class="ad-strip ad-strip--bottom">
                <div class="yn-bnr" id="ynpos-20084"></div>
            </div>

        </div>
    </main>

    ${renderFooter()}
</body>
</html>`;

            // Write to disk
            const targetDir = path.join(__dirname, cat.folderPath, slug);
            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
            }
            fs.writeFileSync(path.join(targetDir, 'index.html'), pageHtml, 'utf8');
            count++;
        }
    }
    console.log(`Generated ${count} individual item pages successfully!`);
}

// -------------------------------------------------------------
// 2. Generate Category Archive Pages (/mods/, /resource-packs/, ...)
// -------------------------------------------------------------
function generateCategoryPages() {
    for (const catKey of Object.keys(CATEGORIES)) {
        const cat = CATEGORIES[catKey];
        const items = cat.items;
        const slugs = cat.slugs;

        const canonicalUrl = `https://packcraft.ir${cat.url}`;
        const metaTitle = `دانلود ${cat.title} با لینک مستقیم و تست‌شده | پک کرفت`;
        const metaDesc = `فهرست کامل و به‌روز ${cat.title} ماینکرفت. ${items.length} آیتم تست‌شده و سازگار با نسخه‌های جاوا و بدراک همراه با لینک مستقیم و ترافیک نیم‌بها.`;

        // Generate cards HTML
        let cardsHtml = items.map((item, idx) => {
            const slug = slugs[idx];
            if (!slug) return '';
            const cleanName = cleanItemName(item.name);
            const imgUrl = item.icon || '/main.png';
            const itemUrl = `${cat.slugPrefix}${slug}/`;

            let tagText = item.compatibility || (item.java ? 'جاوا' : '') + (item.bedrock ? ' بدراک' : '');
            if (!tagText.trim()) tagText = 'جاوا و بدراک';

            // Direct download link
            let directDlLink = '#';
            if (catKey === 'mods' || catKey === 'shaders') directDlLink = item.file || '#';
            else if (catKey === 'packs') directDlLink = item.java || item.bedrock || '#';
            else if (catKey === 'videos') directDlLink = item.link || '#';

            return `
            <article class="pack-card" data-name="${escapeHtml(cleanName.toLowerCase())}" data-tested="${item.tested ? '1' : '0'}" data-featured="${item.featured ? '1' : '0'}" data-compat="${escapeHtml(tagText.toLowerCase())}">
                <div class="pack-media">
                    <img src="${imgUrl}" alt="${escapeHtml(cleanName)}" loading="lazy" width="360" height="200">
                    <div class="pack-badges">
                        ${item.tested ? '<span class="status-pill tested"><i class="ph ph-shield-check"></i> تست‌شده</span>' : ''}
                        ${item.featured ? '<span class="status-pill featured"><i class="ph ph-medal"></i> ویژه</span>' : ''}
                    </div>
                </div>
                <div class="pack-body">
                    <h3 class="pack-title">${escapeHtml(cleanName)}</h3>
                    <div class="pack-meta-row">
                        <span class="pack-compat-chip"><i class="ph ph-cube"></i> ${escapeHtml(tagText)}</span>
                    </div>
                    ${item.description ? `<p class="pack-desc-snip">${escapeHtml(item.description)}</p>` : ''}
                    <div class="pack-card-actions">
                        <a href="${itemUrl}" class="btn-card-view">
                            <span>مشاهده و دانلود</span>
                            <i class="ph ph-arrow-left"></i>
                        </a>
                        <a href="${directDlLink}" class="btn-card-quick-dl" title="دانلود سریع مستقیم" download onclick="trackDownload('${catKey}:${escapeJs(item.name)}')">
                            <i class="ph ph-download-simple"></i>
                        </a>
                    </div>
                </div>
            </article>`;
        }).join('');

        const schemaJson = {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": cat.title,
            "description": metaDesc,
            "url": canonicalUrl,
            "hasPart": items.map((it, idx) => ({
                "@type": "SoftwareApplication",
                "name": cleanItemName(it.name),
                "url": `https://packcraft.ir${cat.slugPrefix}${slugs[idx]}/`
            }))
        };

        const pageHtml = `
${renderHead(metaTitle, metaDesc, canonicalUrl, 'https://packcraft.ir/logo.png', schemaJson)}
<body>
    ${renderHeader(catKey)}

    <main id="main-content" tabindex="-1">
        <div class="category-page-wrap">

            <!-- مسیر صفحه (Breadcrumb) -->
            <nav class="page-crumb" aria-label="مسیر صفحه">
                <a href="/"><i class="ph ph-house" aria-hidden="true"></i> خانه</a>
                <span class="crumb-sep">/</span>
                <span class="crumb-current">${cat.title}</span>
            </nav>

            <!-- هیرو دسته بندی -->
            <header class="category-archive-hero">
                <div class="cat-hero-icon" style="color: ${cat.color}; border-color: ${cat.colorGlow}; background: ${cat.colorGlow};">
                    <i class="ph ${cat.icon}"></i>
                </div>
                <div class="cat-hero-info">
                    <div class="cat-hero-badges">
                        <span class="hero-chip">${items.length} آیتم تست‌شده</span>
                        <span class="hero-chip"><i class="ph ph-lightning"></i> لینک مستقیم</span>
                    </div>
                    <h1>${cat.title}</h1>
                    <p>${cat.desc}</p>
                </div>
            </header>

            <!-- بنر تبلیغاتی بالای دسته -->
            <div class="ad-strip ad-strip--top">
                <div class="yn-bnr" id="ynpos-21391"></div>
            </div>

            <!-- نوار ابزار جستجو و فیلتر زنده -->
            <div class="catalog-toolbar">
                <div class="site-search-box">
                    <i class="ph ph-magnifying-glass"></i>
                    <input type="text" id="cat-search-input" placeholder="جستجو در بین ${items.length} ${cat.singular}..." autocomplete="off">
                    <button type="button" id="cat-search-clear" class="search-clear-btn" style="display:none;" aria-label="پاک کردن"><i class="ph ph-x"></i></button>
                </div>

                <div class="category-filter-pills" role="radiogroup" aria-label="فیلترهای نمایش">
                    <button type="button" class="filter-pill active" data-filter="all">همه (${items.length})</button>
                    <button type="button" class="filter-pill" data-filter="tested"><i class="ph ph-shield-check"></i> تست‌شده</button>
                    <button type="button" class="filter-pill" data-filter="featured"><i class="ph ph-medal"></i> ویژه</button>
                    <button type="button" class="filter-pill" data-filter="bedrock">بدراک (Bedrock)</button>
                    <button type="button" class="filter-pill" data-filter="java">جاوا (Java)</button>
                </div>

                <div class="catalog-status-badge">
                    <span id="results-count-text">نمایش ${items.length} از ${items.length}</span>
                </div>
            </div>

            <!-- تبلیغ بین محتوا یکتانت -->
            <div id="pos-article-display-122298"></div>

            <!-- شبکه کارت‌های آیتم -->
            <div class="packs-grid" id="cat-cards-grid">
                ${cardsHtml}
            </div>

            <!-- پیام عدم وجود نتیجه -->
            <div id="cat-no-results" class="no-results-panel" style="display:none;">
                <i class="ph ph-info"></i>
                <h3>موردی یافت نشد!</h3>
                <p>عبارت دیگری را جستجو کنید یا فیلترها را ریست کنید.</p>
                <button type="button" class="btn-reset-filters" id="reset-filters-btn">نمایش همه آیتم‌ها</button>
            </div>

            <!-- بنر تبلیغاتی پایین صفحه -->
            <div class="ad-strip ad-strip--bottom">
                <div class="yn-bnr" id="ynpos-20084"></div>
            </div>

        </div>
    </main>

    ${renderFooter()}

    <!-- اسکریپت فیلتر و جستجوی آنی بدون تاخیر -->
    <script>
        (function () {
            var searchInput = document.getElementById('cat-search-input');
            var clearBtn = document.getElementById('cat-search-clear');
            var filterPills = document.querySelectorAll('.category-filter-pills .filter-pill');
            var cards = document.querySelectorAll('#cat-cards-grid .pack-card');
            var countText = document.getElementById('results-count-text');
            var noResults = document.getElementById('cat-no-results');
            var resetBtn = document.getElementById('reset-filters-btn');

            var currentFilter = 'all';
            var currentQuery = '';

            function applyFilters() {
                var visibleCount = 0;
                var q = currentQuery.trim().toLowerCase();

                cards.forEach(function (card) {
                    var name = card.getAttribute('data-name') || '';
                    var isTested = card.getAttribute('data-tested') === '1';
                    var isFeatured = card.getAttribute('data-featured') === '1';
                    var compat = card.getAttribute('data-compat') || '';

                    // Match filter
                    var matchesFilter = true;
                    if (currentFilter === 'tested') matchesFilter = isTested;
                    else if (currentFilter === 'featured') matchesFilter = isFeatured;
                    else if (currentFilter === 'bedrock') matchesFilter = compat.includes('بدراک') || compat.includes('bedrock') || compat.includes('pe');
                    else if (currentFilter === 'java') matchesFilter = compat.includes('جاوا') || compat.includes('java');

                    // Match query
                    var matchesSearch = !q || name.includes(q);

                    if (matchesFilter && matchesSearch) {
                        card.style.display = '';
                        visibleCount++;
                    } else {
                        card.style.display = 'none';
                    }
                });

                if (countText) {
                    countText.textContent = 'نمایش ' + visibleCount + ' از ' + cards.length;
                }

                if (noResults) {
                    noResults.style.display = visibleCount === 0 ? 'block' : 'none';
                }
            }

            if (searchInput) {
                searchInput.addEventListener('input', function () {
                    currentQuery = searchInput.value;
                    if (clearBtn) clearBtn.style.display = currentQuery ? 'block' : 'none';
                    applyFilters();
                });
            }

            if (clearBtn) {
                clearBtn.addEventListener('click', function () {
                    searchInput.value = '';
                    currentQuery = '';
                    clearBtn.style.display = 'none';
                    applyFilters();
                    searchInput.focus();
                });
            }

            filterPills.forEach(function (pill) {
                pill.addEventListener('click', function () {
                    filterPills.forEach(function (p) { p.classList.remove('active'); });
                    pill.classList.add('active');
                    currentFilter = pill.getAttribute('data-filter');
                    applyFilters();
                });
            });

            if (resetBtn) {
                resetBtn.addEventListener('click', function () {
                    currentFilter = 'all';
                    currentQuery = '';
                    if (searchInput) searchInput.value = '';
                    if (clearBtn) clearBtn.style.display = 'none';
                    filterPills.forEach(function (p) {
                        p.classList.toggle('active', p.getAttribute('data-filter') === 'all');
                    });
                    applyFilters();
                });
            }
        })();
    </script>
</body>
</html>`;

        const targetDir = path.join(__dirname, cat.folderPath);
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }
        fs.writeFileSync(path.join(targetDir, 'index.html'), pageHtml, 'utf8');
        console.log(`Generated category archive: ${cat.url}`);
    }
}

// Run generator
console.log('--- Starting PackCraft Static Generator ---');
generateItemPages();
generateCategoryPages();
console.log('--- Finished Static Generation ---');
