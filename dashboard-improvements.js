// 1. Inject aggressive containment CSS
const style = document.createElement('style');
style.textContent = `
    main { contain: layout style; }
    #searchInput, .navContainer { 
        content-visibility: hidden; 
        contain-intrinsic-size: auto 40px; 
    }
    #searchInput.ready, .navContainer.ready { 
        content-visibility: visible; 
        animation: fadeIn 50ms ease-out;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
`;
document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', function() {
    const main = document.querySelector('main');
    const postList = document.querySelector('ul.post-list');
    if (!main || !postList || document.getElementById('searchInput')) return;

    // Measure exact width synchronously before any DOM changes
    const exactWidth = main.getBoundingClientRect().width;

    const starred = ['Contact', 'Now', 'Gratitude'];
    const allPosts = Array.from(postList.querySelectorAll('li'));

    // Pre-count
    let draftCount = 0;
    allPosts.forEach(p => {
        if (p.querySelector('small')?.textContent.includes('not published')) draftCount++;
    });
    const pubCount = allPosts.length - draftCount;

    // Build container
    const wrap = document.createElement('div');
    wrap.style.cssText = 'margin: 0 0 15px 0; width: 100%;';

    // Create search at EXACT measured width immediately (no percentage calculation needed)
    const search = document.createElement('input');
    search.type = 'text';
    search.id = 'searchInput';
    search.placeholder = 'Search...';
    // Critical: exact pixel width prevents any "too wide" flash
    search.style.cssText = `display: block; width: ${exactWidth}px; max-width: 400px; box-sizing: border-box; margin: 0 0 10px 0; padding: 8px 12px; font-size: 14px; border: 1px solid #ccc; border-radius: 4px; height: 36px;`;

    // Create filters
    const nav = document.createElement('div');
    nav.className = 'navContainer';
    nav.style.cssText = 'width: 100%;';

    const makeLink = (text, type, bold) => {
        const a = document.createElement('a');
        a.href = '#';
        a.className = 'filterSwitcher';
        a.dataset.filter = type;
        a.textContent = text;
        a.style.cssText = 'cursor: pointer; margin-right: 15px; text-transform: uppercase; font-size: 0.8em; color: #777; text-decoration: none;' + (bold ? ' font-weight: bold;' : '');
        return a;
    };

    if (window.location.pathname.endsWith('/pages/')) nav.appendChild(makeLink('STARRED', 'STARRED', false));
    nav.appendChild(makeLink('ALL', 'ALL', true));
    nav.appendChild(makeLink(`PUBLISHED (${pubCount})`, 'PUBLISHED', false));
    nav.appendChild(makeLink(`DRAFTS (${draftCount})`, 'DRAFTS', false));

    wrap.appendChild(search);
    wrap.appendChild(nav);

    // Insert while content-visibility:hidden prevents all layout/render
    main.insertBefore(wrap, postList);

    // Attach handlers
    search.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        document.querySelectorAll('.post-list li').forEach(post => {
            post.style.display = post.textContent.toLowerCase().includes(term) ? '' : 'none';
        });
    });

    nav.addEventListener('click', (e) => {
        if (!e.target.classList.contains('filterSwitcher')) return;
        e.preventDefault();
        const type = e.target.dataset.filter;
        nav.querySelectorAll('a').forEach(a => a.style.fontWeight = 'normal');
        e.target.style.fontWeight = 'bold';

        document.querySelectorAll('.post-list li').forEach(post => {
            const isDraft = post.querySelector('small')?.textContent.includes('not published');
            const linkText = post.querySelector('a')?.textContent.trim();
            const isStar = linkText && starred.includes(linkText);

            post.style.display = 
                type === 'PUBLISHED' ? (isDraft ? 'none' : '') :
                type === 'DRAFTS' ? (isDraft ? '' : 'none') :
                type === 'STARRED' ? (isStar ? '' : 'none') : '';
        });
    });

    // Organize while hidden
    organizeBlogPosts();
    initPagination();

    // Reveal with 50ms animation (perceptually instant but smooth)
    requestAnimationFrame(() => {
        search.classList.add('ready');
        nav.classList.add('ready');
        // Clean up style after animation
        setTimeout(() => style.remove(), 100);
    });
});

function formatMonthYear(date) {
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
}

function organizeBlogPosts() {
    const list = document.querySelector('.post-list');
    if (!list) return;
    const posts = Array.from(list.querySelectorAll('li'));
    const byMonth = new Map();

    posts.forEach(p => {
        const time = p.querySelector('time');
        if (!time) return;
        const date = new Date(time.getAttribute('datetime'));
        const key = formatMonthYear(date);
        if (!byMonth.has(key)) byMonth.set(key, []);
        byMonth.get(key).push(p);
    });

    list.innerHTML = '';
    Array.from(byMonth.keys())
        .sort((a, b) => new Date(b) - new Date(a))
        .forEach(month => {
            const h2 = document.createElement('h2');
            h2.textContent = month;
            h2.className = 'month-header';
            list.appendChild(h2);
            byMonth.get(month).forEach(p => list.appendChild(p));
        });
}

function initPagination() {
    const perPage = 20;
    const posts = document.querySelectorAll('.post-list li');
    const pages = Math.ceil(posts.length / perPage);
    if (pages <= 1) return;

    let current = 1;
    const div = document.createElement('div');
    div.innerHTML = '<div class="pagination"><a id="prevPage">Previous</a><span id="pageInfo"></span><a id="nextPage">Next</a></div>';
    document.querySelector('.post-list').after(div);

    const show = (page) => {
        const start = (page - 1) * perPage;
        posts.forEach((p, i) => p.style.display = (i >= start && i < start + perPage) ? '' : 'none');
        document.getElementById('pageInfo').textContent = `Page ${page} of ${pages}`;
        document.getElementById('prevPage').style.opacity = page === 1 ? '0.5' : '1';
        document.getElementById('nextPage').style.opacity = page === pages ? '0.5' : '1';
    };

    document.getElementById('prevPage').onclick = (e) => {
        e.preventDefault();
        if (current > 1) show(--current);
    };
    document.getElementById('nextPage').onclick = (e) => {
        e.preventDefault();
        if (current < pages) show(++current);
    };
    show(1);
}

// Markdown hotkeys
(() => {
    const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
    const getTA = () => document.querySelector('textarea#body_content') || document.querySelector('textarea');
    const focused = (el) => el && document.activeElement === el;
    const setSel = (el, s, e) => { el.selectionStart = s; el.selectionEnd = e; };

    const wrap = (el, w) => {
        const v = el.value, s = el.selectionStart ?? 0, e = el.selectionEnd ?? 0;
        if (s === e) {
            const ph = w === "`" ? "code" : "text";
            el.value = v.slice(0, s) + w + ph + w + v.slice(e);
            setSel(el, s + w.length, s + w.length + ph.length);
            return;
        }
        const sel = v.slice(s, e);
        if (sel.startsWith(w) && sel.endsWith(w)) {
            const un = sel.slice(w.length, -w.length);
            el.value = v.slice(0, s) + un + v.slice(e);
            setSel(el, s, s + un.length);
            return;
        }
        el.value = v.slice(0, s) + w + sel + w + v.slice(e);
        setSel(el, s + w.length, e + w.length);
    };

    const unwrapAny = (el) => {
        const ws = ["**", "*", "`"], v = el.value;
        let s = el.selectionStart ?? 0, e = el.selectionEnd ?? 0;
        if (s === e) {
            let L = s, R = s;
            while (L > 0 && !/\s/.test(v[L - 1])) L--;
            while (R < v.length && !/\s/.test(v[R])) R++;
            if (L === R) return;
            s = L; e = R;
        }
        for (const w of ws) {
            if (v.slice(s, s + w.length) === w && v.slice(e - w.length, e) === w) {
                el.value = v.slice(0, s) + v.slice(s + w.length, e - w.length) + v.slice(e);
                setSel(el, s, e - w.length * 2);
                return;
            }
        }
    };

    document.addEventListener("keydown", (ev) => {
        const ta = getTA();
        if (!focused(ta)) return;
        const mod = isMac ? ev.metaKey : ev.ctrlKey;
        if (!mod) return;
        const k = (ev.key || "").toLowerCase();
        if (k === "b") { ev.preventDefault(); wrap(ta, "**"); }
        else if (k === "i") { ev.preventDefault(); wrap(ta, "*"); }
        else if (k === "k") { ev.preventDefault(); wrap(ta, "`"); }
        else if (k === "u") { ev.preventDefault(); unwrapAny(ta); }
    });
})();

// Autosave
(() => {
    const sc = document.querySelector('.sticky-controls');
    if (!sc) return;

    const btn = document.createElement('button');
    btn.className = 'rdb_post_restorer';
    btn.textContent = 'Restore Last Post';
    btn.onclick = (e) => {
        e.preventDefault();
        const body = document.getElementById('body_content');
        const headers = document.getElementById('header_content');
        if (body?.value.length > 30 && !confirm("Overwrite current post?")) return;
        if (body) body.value = localStorage.getItem('body');
        if (headers) headers.innerText = localStorage.getItem('headers');
    };
    sc.appendChild(btn);

    const save = () => {
        setTimeout(save, 10000);
        const b = document.getElementById('body_content')?.value;
        const h = document.getElementById('header_content')?.innerText;
        if (!b || b.length < 50) return;
        localStorage.setItem('body', b);
        localStorage.setItem('headers', h);
    };
    setTimeout(save, 10000);
})();
