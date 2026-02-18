document.addEventListener('DOMContentLoaded', function() {
    const postList = document.querySelector('ul.post-list');
    const h1 = document.querySelector('h1');
    if (!postList) return;

    // Find or create header container for inline layout
    let headerRow = h1?.parentElement;
    if (h1 && !headerRow.classList.contains('page-header-row')) {
        // Wrap h1 in a flex container if not already
        const wrapper = document.createElement('div');
        wrapper.className = 'page-header-row';
        wrapper.style.cssText = 'display: flex; align-items: baseline; justify-content: space-between; flex-wrap: wrap; gap: 20px; margin-bottom: 20px;';
        h1.parentNode.insertBefore(wrapper, h1);
        wrapper.appendChild(h1);
        headerRow = wrapper;
    }

    const starredTitles = ['Contact', 'Now', 'Gratitude'];
    const posts = Array.from(postList.querySelectorAll('li'));

    // Count drafts/published
    const draftCount = posts.filter(p => p.querySelector('small')?.textContent.includes('not published')).length;
    const publishedCount = posts.length - draftCount;

    // Build filter nav (inline style)
    const nav = document.createElement('div');
    nav.className = 'filter-nav';
    nav.style.cssText = 'font-size: 0.8em; text-transform: uppercase; display: flex; gap: 15px; flex-wrap: wrap;';

    const makeLink = (text, filter, bold = false) => {
        const a = document.createElement('a');
        a.href = '#';
        a.textContent = text;
        a.dataset.filter = filter;
        a.style.cssText = `color: #777; text-decoration: none; cursor: pointer;${bold ? ' font-weight: bold; color: #333;' : ''}`;
        return a;
    };

    if (window.location.pathname.endsWith('/pages/')) {
        nav.appendChild(makeLink('Starred', 'starred'));
    }
    nav.appendChild(makeLink(`All (${posts.length})`, 'all', true));
    nav.appendChild(makeLink(`Published (${publishedCount})`, 'published'));
    nav.appendChild(makeLink(`Drafts (${draftCount})`, 'drafts'));

    // Insert into header row (or before post list if no h1)
    if (headerRow) {
        headerRow.appendChild(nav);
    } else {
        postList.parentNode.insertBefore(nav, postList);
        nav.style.marginBottom = '20px';
    }

    // Filter handler
    nav.addEventListener('click', (e) => {
        if (e.target.tagName !== 'A') return;
        e.preventDefault();

        // Update active state
        nav.querySelectorAll('a').forEach(a => {
            a.style.fontWeight = 'normal';
            a.style.color = '#777';
        });
        e.target.style.fontWeight = 'bold';
        e.target.style.color = '#333';

        const filter = e.target.dataset.filter;

        posts.forEach(post => {
            const isDraft = post.querySelector('small')?.textContent.includes('not published');
            const title = post.querySelector('a')?.textContent.trim();
            const isStarred = starredTitles.includes(title);

            const show = 
                filter === 'drafts' ? isDraft :
                filter === 'published' ? !isDraft :
                filter === 'starred' ? isStarred :
                true;

            post.style.display = show ? '' : 'none';
        });
    });

    // Organize by month
    organizeByMonth(posts, postList);

    // Paginate
    initPagination();
});

function organizeByMonth(posts, list) {
    const byMonth = new Map();

    posts.forEach(post => {
        const time = post.querySelector('time');
        if (!time) return;
        const date = new Date(time.getAttribute('datetime'));
        const key = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        if (!byMonth.has(key)) byMonth.set(key, []);
        byMonth.get(key).push(post);
    });

    list.innerHTML = '';
    Array.from(byMonth.keys())
        .sort((a, b) => new Date(b) - new Date(a))
        .forEach(month => {
            const h2 = document.createElement('h2');
            h2.className = 'month-header';
            h2.textContent = month;
            list.appendChild(h2);
            byMonth.get(month).forEach(p => list.appendChild(p));
        });
}

function initPagination() {
    const perPage = 20;
    const items = document.querySelectorAll('.post-list li');
    const total = Math.ceil(items.length / perPage);
    if (total <= 1) return;

    let page = 1;
    const div = document.createElement('div');
    div.innerHTML = `<div class="pagination"><a id="prev">Previous</a><span id="info">Page 1 of ${total}</span><a id="next">Next</a></div>`;
    document.querySelector('.post-list').after(div);

    const show = (p) => {
        const start = (p - 1) * perPage;
        items.forEach((item, i) => item.style.display = (i >= start && i < start + perPage) ? '' : 'none');
        document.getElementById('info').textContent = `Page ${p} of ${total}`;
        document.getElementById('prev').style.opacity = p === 1 ? '0.5' : '1';
        document.getElementById('next').style.opacity = p === total ? '0.5' : '1';
    };

    document.getElementById('prev').onclick = (e) => { e.preventDefault(); if (page > 1) show(--page); };
    document.getElementById('next').onclick = (e) => { e.preventDefault(); if (page < total) show(++page); };
    show(1);
}

// Markdown hotkeys
(() => {
    const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
    const getTA = () => document.querySelector('textarea#body_content') || document.querySelector('textarea');

    const wrap = (el, w) => {
        const [v, s, e] = [el.value, el.selectionStart, el.selectionEnd];
        const sel = v.slice(s, e);
        if (!sel) {
            const ph = w === '`' ? 'code' : 'text';
            el.value = v.slice(0, s) + w + ph + w + v.slice(e);
            el.setSelectionRange(s + w.length, s + w.length + ph.length);
            return;
        }
        if (sel.startsWith(w) && sel.endsWith(w)) {
            el.value = v.slice(0, s) + sel.slice(w.length, -w.length) + v.slice(e);
            el.setSelectionRange(s, e - w.length * 2);
            return;
        }
        el.value = v.slice(0, s) + w + sel + w + v.slice(e);
        el.setSelectionRange(s + w.length, e + w.length);
    };

    const unwrapAny = (el) => {
        const ws = ['**', '*', '`'];
        let [s, e] = [el.selectionStart, el.selectionEnd];
        if (s === e) {
            let [L, R] = [s, s];
            while (L > 0 && !/\s/.test(el.value[L-1])) L--;
            while (R < el.value.length && !/\s/.test(el.value[R])) R++;
            if (L === R) return;
            [s, e] = [L, R];
        }
        for (const w of ws) {
            if (el.value.slice(s, s+w.length) === w && el.value.slice(e-w.length, e) === w) {
                el.value = el.value.slice(0, s) + el.value.slice(s+w.length, e-w.length) + el.value.slice(e);
                el.setSelectionRange(s, e - w.length*2);
                return;
            }
        }
    };

    document.addEventListener('keydown', (ev) => {
        const ta = getTA();
        if (document.activeElement !== ta) return;
        const mod = isMac ? ev.metaKey : ev.ctrlKey;
        if (!mod) return;
        const k = ev.key.toLowerCase();
        if (k === 'b') { ev.preventDefault(); wrap(ta, '**'); }
        else if (k === 'i') { ev.preventDefault(); wrap(ta, '*'); }
        else if (k === 'k') { ev.preventDefault(); wrap(ta, '`'); }
        else if (k === 'u') { ev.preventDefault(); unwrapAny(ta); }
    });
})();

// Autosave drafts
(() => {
    const sc = document.querySelector('.sticky-controls');
    if (!sc) return;

    const btn = document.createElement('button');
    btn.textContent = 'Restore Last Post';
    btn.onclick = (e) => {
        e.preventDefault();
        const body = document.getElementById('body_content');
        const headers = document.getElementById('header_content');
        if (body?.value.length > 30 && !confirm('Overwrite current post?')) return;
        if (body) body.value = localStorage.getItem('body');
        if (headers) headers.innerText = localStorage.getItem('headers');
    };
    sc.appendChild(btn);

    const save = () => {
        setTimeout(save, 10000);
        const b = document.getElementById('body_content')?.value;
        if (!b || b.length < 50) return;
        localStorage.setItem('body', b);
        localStorage.setItem('headers', document.getElementById('header_content')?.innerText);
    };
    setTimeout(save, 10000);
})();
