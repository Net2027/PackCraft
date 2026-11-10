// PackCraft edition poll — «بدراک یا جاوا؟»
// ذخیره‌سازی: Google Form (بدون سرور؛ گوگل فرم برای کاربران ایران باز است).
// - رأی: کلیک روی هر گزینه، فرم گوگل با همان گزینه از پیش انتخاب‌شده باز می‌شود.
// - نتایج عددی: خواندن CSV منتشرشدهٔ شیت (زنده) با fallback به poll-results.json ریپو.
// - هر مرورگر فقط یک رأی (localStorage). هیچ کلید محرمانه‌ای در فرانت‌اند نیست.
// ▼▼▼ کانفیگ گوگل فرم نظرسنجی (وصل شده به فرم «بدراک یا جاوا؟») ▼▼▼
const POLL_CONFIG = {
    // لینک عمومی فرم
    formUrl: "https://docs.google.com/forms/d/e/1FAIpQLSfS2-Lk5NmjCHH30Ccpbs-3xX0YiCIYmdJedBSuJpE0bzOafA/viewform",
    // لینک CSV منتشرشدهٔ شیت پاسخ‌ها
    resultsCsvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTS_R6k8H59kP-eJcNcKBES1GuXnRb6u_BOLWDlMtM_TmnnGRlzecGOtz3_gqtgEjiGAd04MP5pDLLB/pub?output=csv",
    // برچسب دقیق دو گزینه در فرم (برای شمارش)
    labels: { bedrock: "بدراک", java: "جاوا" },
    // شناسه entry سوال در فرم (از لینک‌های پیش‌انتخاب استخراج شد)
    entryIds: { bedrock: "995937204", java: "995937204" },
};
// ▲▲▲

const STORAGE_KEY = "pc-edition-poll";
const CHOICES = ["bedrock", "java"];

const box = document.getElementById("poll-box");
if (!box) {
    throw new Error("poll box element missing");
}

const isConfigured =
    /^https:\/\/docs\.google\.com\/forms/.test(POLL_CONFIG.formUrl) &&
    /^https:\/\/docs\.google\.com\/spreadsheets/.test(POLL_CONFIG.resultsCsvUrl) &&
    !POLL_CONFIG.formUrl.includes("PASTE-") &&
    !POLL_CONFIG.resultsCsvUrl.includes("PASTE-") &&
    !POLL_CONFIG.entryIds.bedrock.includes("PASTE-") &&
    !POLL_CONFIG.entryIds.java.includes("PASTE-");

if (isConfigured) {
    init().catch((err) => console.warn("[poll] init failed:", err));
}

function faDigits(n) {
    return Number(n || 0).toLocaleString("fa-IR");
}

async function init() {
    const actions = box.querySelector("#poll-actions");
    const results = box.querySelector("#poll-results");
    const thanks = box.querySelector("#poll-thanks");
    const errorNote = box.querySelector("#poll-error");
    const viewBtn = box.querySelector("#poll-view");
    const bars = {};
    for (const c of CHOICES) {
        bars[c] = {
            count: box.querySelector(`[data-poll-count="${c}"]`),
            fill: box.querySelector(`[data-poll-fill="${c}"]`),
            bar: box.querySelector(`[data-poll-bar="${c}"]`),
        };
    }

    let myChoice = null;
    try {
        myChoice = localStorage.getItem(STORAGE_KEY);
    } catch {
        /* private mode — no persistence */
    }
    if (myChoice && !CHOICES.includes(myChoice)) myChoice = null;

    let latestCounts = null;

    function renderResults() {
        if (!latestCounts) return;
        const total = latestCounts.bedrock + latestCounts.java;
        for (const c of CHOICES) {
            const n = latestCounts[c];
            const pct = total > 0 ? Math.round((100 * n) / total) : 0;
            bars[c].count.textContent = `${faDigits(n)} رأی (${faDigits(pct)}٪)`;
            bars[c].fill.style.width = `${pct}%`;
            bars[c].bar.classList.toggle("is-mine", myChoice === c);
        }
        const totalEl = box.querySelector("#poll-total");
        if (totalEl) totalEl.textContent = `مجموع رأی‌ها: ${faDigits(total)}`;
    }

    function showResults() {
        if (actions) actions.hidden = true;
        if (viewBtn) viewBtn.hidden = true;
        if (results) results.hidden = false;
        if (thanks && myChoice) thanks.hidden = false;
        renderResults();
    }

    async function parseCsv(text) {
        const rows = text.trim().split(/\r?\n/);
        if (rows.length < 2) return { bedrock: 0, java: 0 };
        let bedrock = 0;
        let java = 0;
        // ستون پاسخ: بعد از خط سرستون (هر خط = یک رأی؛ برچسب گزینه در ستون سؤال)
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (row.includes(POLL_CONFIG.labels.bedrock)) bedrock += 1;
            else if (row.includes(POLL_CONFIG.labels.java)) java += 1;
        }
        return { bedrock, java };
    }

    async function loadResults() {
        try {
            const res = await fetch(POLL_CONFIG.resultsCsvUrl, { cache: "no-store" });
            if (!res.ok) throw new Error("CSV HTTP " + res.status);
            latestCounts = await parseCsv(await res.text());
        } catch (err) {
            console.warn("[poll] live CSV failed, falling back to repo JSON:", err);
            try {
                const res = await fetch("/poll-results.json", { cache: "no-store" });
                if (res.ok) {
                    const data = await res.json();
                    latestCounts = { bedrock: data.bedrock || 0, java: data.java || 0 };
                }
            } catch (err2) {
                console.warn("[poll] repo JSON also failed:", err2);
            }
        }
        if (latestCounts) {
            box.classList.add("is-live");
            renderResults();
            if (myChoice) showResults();
        }
    }

    // نتیجه‌ها هر ۶۰ ثانیه یک‌بار به‌روزرسانی می‌شوند (در حال باز بودن صفحه)
    loadResults();
    setInterval(loadResults, 60000);

    function vote(choice) {
        if (myChoice) return;
        const entry = POLL_CONFIG.entryIds[choice];
        const base = POLL_CONFIG.formUrl.replace("/viewform", "/viewform");
        const sep = base.includes("?") ? "&" : "?";
        window.open(`${base}${sep}entry.${entry}=${encodeURIComponent(POLL_CONFIG.labels[choice])}&hl=fa`, "_blank", "noopener");
        myChoice = choice;
        try {
            localStorage.setItem(STORAGE_KEY, choice);
        } catch {
            /* private mode */
        }
        showResults();
    }

    if (actions) {
        actions.addEventListener("click", (e) => {
            const btn = e.target.closest("button[data-choice]");
            if (btn) vote(btn.dataset.choice);
        });
    }
    if (viewBtn) {
        viewBtn.addEventListener("click", () => {
            myChoice = null;
            showResults();
        });
    }

    box.hidden = false;
}
