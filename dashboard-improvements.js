// 1. Inject CSS immediately to hide search/filters until ready
const hideStyle = document.createElement('style');
hideStyle.textContent = `
    #searchInput, .navContainer { 
        visibility: hidden !important;
        opacity: 0;
        transition: opacity 0.2s ease-out;
    }
    #searchInput.ready, .navContainer.ready {
        visibility: visible !important;
        opacity: 1;
    }
`;
document.head.appendChild(hideStyle);

document.addEventListener('DOMContentLoaded', function() {
    const postList = document.querySelector('ul.post-list');
    const mainContainer = document.querySelector('main');

    if (!postList || !mainContainer || document.getElementById('searchInput')) {
        hideStyle.remove(); // Show immediately if no work needed
        return;
    }

    const starredTitles = ['Contact', 'Now', 'Gratitude'];
    const allPosts = Array.from(postList.querySelectorAll('li'));

    // Pre-count
    let draftCount = 0;
    allPosts.forEach(post => {
        if (post.querySelector('small')?.textContent.includes('not published')) draftCount++;
    });
    const publishedCount = allPosts.length - draftCount;

    // Build controls container (reserves space immediately with visibility:hidden via CSS)
    const controlsContainer = document.createElement('div');
    controlsContainer.style.cssText = 'margin: 0 0 15px 0; width: 100%;';

    // Create search with exact dimensions to prevent width flash
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.id = 'searchInput';
    searchInput.placeholder = 'Search...';
    // Critical: exact sizing prevents the "too wide" flash
    searchInput.style.cssText = 'display: block; width: 400px; max-width: 100%; box-sizing: border-box; margin: 0 0 10px 0; padding: 8px 12px; font-size: 14px; border: 1px solid #ccc; border-radius: 4px; height: 36px;';

    // Create filters
    const navContainer = document.createElement('div');
    navContainer.className = 'navContainer';
    navContainer.style.cssText = 'width: 100%; height: 20px;'; // Fixed height prevents collapse when hidden

    function makeFilter(text, filterType, isBold) {
        const link = document.createElement('a');
        link.href = '#';
        link.className = 'filterSwitcher';
        link.dataset.filter = filterType;
        link.textContent = text;
        link.style.cssText = 'cursor: pointer; margin-right: 15px; text-transform: uppercase; font-size: 0.8em; color: #777; text-decoration: none;' + (isBold ? ' font-weight: bold;' : '');
        return link;
    }

    if (window.location.pathname.endsWith('/pages/')) {
        navContainer.appendChild(makeFilter('STARRED', 'STARRED', false));
    }
    navContainer.appendChild(makeFilter('ALL', 'ALL', true));
    navContainer.appendChild(makeFilter(`PUBLISHED (${publishedCount})`, 'PUBLISHED', false));
    navContainer.appendChild(makeFilter(`DRAFTS (${draftCount})`, 'DRAFTS', false));

    controlsContainer.appendChild(searchInput);
    controlsContainer.appendChild(navContainer);

    // Insert while still hidden by CSS
    mainContainer.insertBefore(controlsContainer, postList);

    // Attach listeners
    searchInput.addEventListener('input', function() {
        const term = this.value.toLowerCase();
        document.querySelectorAll('.post-list li').forEach(post => {
            post.style.display = post.textContent.toLowerCase().includes(term) ? '' : 'none';
        });
    });

    navContainer.addEventListener('click', function(e) {
        if (!e.target.classList.contains('filterSwitcher')) return;
        e.preventDefault();
        const filterType = e.target.dataset.filter;

        document.querySelectorAll('.filterSwitcher').forEach(l => l.style.fontWeight = 'normal');
        e.target.style.fontWeight = 'bold';

        document.querySelectorAll('.post-list li').forEach(post => {
            const isDraft = post.querySelector('small')?.textContent.includes('not published');
            const linkText = post.querySelector('a')?.textContent.trim();
            const isStarred = linkText && starredTitles.includes(linkText);

            post.style.display = 
                filterType === 'PUBLISHED' ? (isDraft ? 'none' : '') :
                filterType === 'DRAFTS' ? (isDraft ? '' : 'none') :
                filterType === 'STARRED' ? (isStarred ? '' : 'none') : '';
        });
    });

    // Organize posts while hidden
    organizeBlogPosts();
    initPagination();

    // 2. Reveal smoothly (adds .ready class which overrides CSS)
    requestAnimationFrame(() => {
        searchInput.classList.add('ready');
        navContainer.classList.add('ready');
        // Clean up style tag after transition
        setTimeout(() => hideStyle.remove(), 300);
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

    posts.forEach(post => {
        const time = post.querySelector('time');
        if (!time) return;
        const date = new Date(time.getAttribute('datetime'));
        const key = formatMonthYear(date);
        if (!byMonth.has(key)) byMonth.set(key, []);
        byMonth.get(key).push(post);
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

    function show(page) {
        const start = (page - 1) * perPage;
        posts.forEach((p, i) => p.style.display = (i >= start && i < start + perPage) ? '' : 'none');
        document.getElementById('pageInfo').textContent = `Page ${page} of ${pages}`;
        document.getElementById('prevPage').style.opacity = page === 1 ? '0.5' : '1';
        document.getElementById('nextPage').style.opacity = page === pages ? '0.5' : '1';
    }

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
    const getTextarea = () => document.querySelector('textarea#body_content') || document.querySelector('textarea');
    const isFocused = (el) => el && document.activeElement === el;
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
        const ws = ["**", "*", "`"];
        const v = el.value;
        let s = el.selectionStart ?? 0, e = el.selectionEnd ?? 0;
        if (s === e) {
            let L = s, R = s;
            while (L > 0 && !/\s/.test(v[L-1])) L--;
            while (R < v.length && !/\s/.test(v[R])) R++;
            if (L === R) return;
            s = L; e = R;
        }
        for (const w of ws) {
            if (v.slice(s, s+w.length) === w && v.slice(e-w.length, e) === w) {
                el.value = v.slice(0, s) + v.slice(s+w.length, e-w.length) + v.slice(e);
                setSel(el, s, e - w.length*2);
                return;
            }
        }
    };

    document.addEventListener("keydown", (ev) => {
        const ta = getTextarea();
        if (!isFocused(ta)) return;
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

    function save() {
        setTimeout(save, 10000);
        const b = document.getElementById('body_content')?.value;
        const h = document.getElementById('header_content')?.innerText;
        if (!b || b.length < 50) return;
        localStorage.setItem('body', b);
        localStorage.setItem('headers', h);
    }
    setTimeout(save, 10000);
})();
