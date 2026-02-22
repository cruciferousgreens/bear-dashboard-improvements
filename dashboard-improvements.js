(function() {
    // Defer execution to next tick so we don't block Chart.js loading
    setTimeout(function() {
        try {
            // Skip entirely on mobile (phones/tablets)
            if (window.innerWidth <= 768) return;

            // Skip entirely on analytics page
            if (window.location.pathname.includes('/analytics')) return;

            const postList = document.querySelector('ul.post-list');
            const h1 = document.querySelector('h1');
            if (!postList) return;

            // Create flex container for header row
            let headerRow = h1?.parentElement;
            let titleElement = h1;

            if (headerRow?.tagName === 'A') {
                titleElement = headerRow;
                headerRow = headerRow.parentElement;
            }

            if (h1 && !headerRow?.classList.contains('page-header-row')) {
                const wrapper = document.createElement('div');
                wrapper.className = 'page-header-row';
                wrapper.style.cssText = 'display: flex; align-items: center; flex-wrap: nowrap; gap: 15px; width: 100%;';
                titleElement.parentNode.insertBefore(wrapper, titleElement);
                wrapper.appendChild(titleElement);
                headerRow = wrapper;
            }

            const isPostsPage = window.location.pathname.endsWith('/posts/');
            const posts = Array.from(postList.querySelectorAll('li'));

            const draftCount = posts.filter(p => p.querySelector('small')?.textContent.includes('not published')).length;
            const publishedCount = posts.length - draftCount;

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

            nav.appendChild(makeLink(`All (${posts.length})`, 'all', true));
            nav.appendChild(makeLink(`Published (${publishedCount})`, 'published'));
            nav.appendChild(makeLink(`Drafts (${draftCount})`, 'drafts'));

            const search = document.createElement('input');
            search.type = 'text';
            search.id = 'searchInput';
            search.placeholder = 'Search...';

            search.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                posts.forEach(post => {
                    const text = post.textContent.toLowerCase();
                    post.style.display = text.includes(term) ? '' : 'none';
                });
            });

            headerRow.appendChild(nav);
            headerRow.appendChild(search);

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
                    const show = 
                        filter === 'drafts' ? isDraft :
                        filter === 'published' ? !isDraft :
                        true;
                    post.style.display = show ? '' : 'none';
                });
            });

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

        } catch (e) {
            // Silently fail - don't break the page
            console.error('Dashboard improvements error:', e);
        }
    }, 0);
})();
