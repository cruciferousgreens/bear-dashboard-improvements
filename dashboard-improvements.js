(function() {
    // Skip entirely on mobile (phones/tablets)
    if (window.innerWidth <= 768) return;

    const postList = document.querySelector('ul.post-list');
    const h1 = document.querySelector('h1');
    if (!postList) return;

    // Create flex container for header row
    let headerRow = h1?.parentElement;
    let titleElement = h1; // This is what we'll move into the flex container

    // If h1 is inside a link (logo link), we need to work with the link instead
    if (headerRow?.tagName === 'A') {
        titleElement = headerRow; // Move the whole anchor, not just the h1
        headerRow = headerRow.parentElement; // Work at the level above the anchor
    }

    if (h1 && !headerRow?.classList.contains('page-header-row')) {
        const wrapper = document.createElement('div');
        wrapper.className = 'page-header-row';
        wrapper.style.cssText = 'display: flex; align-items: center; flex-wrap: nowrap; gap: 15px; width: 100%;';

        // Insert wrapper BEFORE the anchor (or h1), not inside it
        titleElement.parentNode.insertBefore(wrapper, titleElement);

        // Move the title (anchor or h1) into wrapper first
        wrapper.appendChild(titleElement);

        headerRow = wrapper;
    }

    const isPostsPage = window.location.pathname.endsWith('/posts/');
    const isPagesPage = window.location.pathname.endsWith('/pages/');

    const starredTitles = ['Contact', 'Now', 'Gratitude'];
    const posts = Array.from(postList.querySelectorAll('li'));

    // Count drafts/published
    const draftCount = posts.filter(p => p.querySelector('small')?.textContent.includes('not published')).length;
    const publishedCount = posts.length - draftCount;

    // Build filter nav - allow shrinking but don't grow
    const nav = document.createElement('div');
    nav.className = 'filter-nav';
    
    const makeLink = (text, filter, bold = false) => {
        const a = document.createElement('a');
        a.href = '#';
        a.textContent = text;
        a.dataset.filter = filter;
        a.style.cssText = `color: var(--text-color); text-decoration: none; cursor: pointer; white-space: nowrap;${bold ? ' font-weight: bold; color: var(--text-color);' : ''}`;
        return a;
    };

    if (isPagesPage) nav.appendChild(makeLink('Starred', 'starred'));
    nav.appendChild(makeLink(`All (${posts.length})`, 'all', true));
    nav.appendChild(makeLink(`Published (${publishedCount})`, 'published'));
    nav.appendChild(makeLink(`Drafts (${draftCount})`, 'drafts'));

    // Create search input - fixed size, margin-left:auto pushes it to right edge
    const search = document.createElement('input');
    search.type = 'text';
    search.id = 'searchInput';
    search.placeholder = 'Search...';
    search.style.cssText = 'flex: 0 0 200px; margin-left: auto; padding: 4px 8px; font-size: 0.85em; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;';

    // Search handler
    search.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        posts.forEach(post => {
            const text = post.textContent.toLowerCase();
            post.style.display = text.includes(term) ? '' : 'none';
        });
    });

    // Append to the flex row: [Logo Link] [Filters] [Search]
    headerRow.appendChild(nav);
    headerRow.appendChild(search);

    // Filter click handler
    nav.addEventListener('click', (e) => {
        if (e.target.tagName !== 'A') return;
        e.preventDefault();

        nav.querySelectorAll('a').forEach(a => {
            a.style.fontWeight = 'normal';
            a.style.color = 'var(--text-color)';
        });
        e.target.style.fontWeight = 'bold';
        e.target.style.color = 'var(--text-color)';

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

    // Only organize by month on posts page
    if (isPostsPage) organizeByMonth(posts, postList);
    initPagination();

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
})();
