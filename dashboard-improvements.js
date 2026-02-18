(function() {
    // Run immediately if DOM ready, else wait
    function init() {
        const postList = document.querySelector('ul.post-list');
        const mainContainer = document.querySelector('main');
        if (!postList || !mainContainer || document.getElementById('searchInput')) return;

        const starredTitles = ['Contact', 'Now', 'Gratitude'];
        let allPosts = [];
        let draftCount = 0;

        // Pre-count while list is intact
        allPosts = Array.from(postList.querySelectorAll('li'));
        allPosts.forEach(post => {
            const smallElement = post.querySelector('small');
            if (smallElement && smallElement.textContent.includes('not published')) {
                draftCount++;
            }
        });
        const publishedCount = allPosts.length - draftCount;

        // Build everything off-DOM first (no reflows yet)
        const fragment = document.createDocumentFragment();
        const container = document.createElement('div');
        container.style.cssText = 'margin: 0 0 15px 0; width: 100%;';

        // Create search (fully styled before insertion)
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.id = 'searchInput';
        searchInput.placeholder = 'Search...';
        searchInput.style.cssText = 'display: block; width: 100%; max-width: 400px; box-sizing: border-box; margin: 0 0 10px 0; padding: 8px 12px; font-size: 14px; border: 1px solid #ccc; border-radius: 4px;';

        // Create filters container
        const navContainer = document.createElement('div');
        navContainer.className = 'navContainer';
        navContainer.style.cssText = 'width: 100%;';

        function makeFilter(text, filterType, isBold) {
            const link = document.createElement('a');
            link.href = '#';
            link.className = 'filterSwitcher';
            link.dataset.filter = filterType;
            link.textContent = text;
            link.style.cssText = 'cursor: pointer; margin-right: 15px; text-transform: uppercase; font-size: 0.8em; color: #777; text-decoration: none;' + (isBold ? ' font-weight: bold;' : '');
            return link;
        }

        // Add filters (STARRED only on /pages/)
        if (window.location.pathname.endsWith('/pages/')) {
            navContainer.appendChild(makeFilter('STARRED', 'STARRED', false));
        }
        navContainer.appendChild(makeFilter('ALL', 'ALL', true));
        navContainer.appendChild(makeFilter(`PUBLISHED (${publishedCount})`, 'PUBLISHED', false));
        navContainer.appendChild(makeFilter(`DRAFTS (${draftCount})`, 'DRAFTS', false));

        // Assemble container
        container.appendChild(searchInput);
        container.appendChild(navContainer);
        fragment.appendChild(container);

        // SINGLE DOM INSERTION (atomic - both appear together)
        mainContainer.insertBefore(fragment, postList);

        // Attach listeners
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            document.querySelectorAll('.post-list li').forEach(post => {
                post.style.display = post.textContent.toLowerCase().includes(searchTerm) ? '' : 'none';
            });
        });

        navContainer.addEventListener('click', function(e) {
            if (!e.target.classList.contains('filterSwitcher')) return;
            e.preventDefault();
            const filterType = e.target.dataset.filter;

            document.querySelectorAll('.filterSwitcher').forEach(link => link.style.fontWeight = 'normal');
            e.target.style.fontWeight = 'bold';

            document.querySelectorAll('.post-list li').forEach(post => {
                const smallElement = post.querySelector('small');
                const isDraft = smallElement && smallElement.textContent.includes('not published');
                const linkText = post.querySelector('a')?.textContent.trim();
                const isPostStarred = linkText && starredTitles.includes(linkText);

                if (filterType === 'PUBLISHED') post.style.display = isDraft ? 'none' : '';
                else if (filterType === 'DRAFTS') post.style.display = isDraft ? '' : 'none';
                else if (filterType === 'STARRED') post.style.display = isPostStarred ? '' : 'none';
                else post.style.display = '';
            });
        });

        // Now organize by month (this will reflow, but search+filters are already stable)
        organizeBlogPosts();
        initPagination();
    }

    // Format month/year
    function formatMonthYear(date) {
        return date.toLocaleString('default', { month: 'long', year: 'numeric' });
    }

    // Organize posts
    function organizeBlogPosts() {
        const blogPostsList = document.querySelector('.post-list');
        if (!blogPostsList) return;

        const posts = Array.from(blogPostsList.querySelectorAll('li'));
        const postsByMonth = new Map();

        posts.forEach(post => {
            const timeElement = post.querySelector('time');
            if (!timeElement) return;
            const date = new Date(timeElement.getAttribute('datetime'));
            const monthYear = formatMonthYear(date);
            if (!postsByMonth.has(monthYear)) postsByMonth.set(monthYear, []);
            postsByMonth.get(monthYear).push(post);
        });

        blogPostsList.innerHTML = '';

        Array.from(postsByMonth.keys())
            .sort((a, b) => new Date(b) - new Date(a))
            .forEach(monthYear => {
                const header = document.createElement('h2');
                header.textContent = monthYear;
                header.className = 'month-header';
                blogPostsList.appendChild(header);
                postsByMonth.get(monthYear).forEach(post => blogPostsList.appendChild(post));
            });
    }

    // Pagination
    function initPagination() {
        const postsPerPage = 20;
        const posts = document.querySelectorAll('.post-list li');
        const totalPages = Math.ceil(posts.length / postsPerPage);
        if (totalPages <= 1) return;

        let currentPage = 1;
        const paginationDiv = document.createElement('div');
        paginationDiv.innerHTML = '<div class="pagination"><a id="prevPage">Previous</a><span id="pageInfo"></span><a id="nextPage">Next</a></div>';
        document.querySelector('.post-list').after(paginationDiv);

        function showPage(page) {
            const start = (page - 1) * postsPerPage;
            const end = start + postsPerPage;
            posts.forEach((post, index) => {
                post.style.display = (index >= start && index < end) ? '' : 'none';
            });
            document.getElementById('pageInfo').textContent = `Page ${page} of ${totalPages}`;
            document.getElementById('prevPage').style.opacity = page === 1 ? '0.5' : '1';
            document.getElementById('nextPage').style.opacity = page === totalPages ? '0.5' : '1';
        }

        document.getElementById('prevPage').onclick = (e) => {
            e.preventDefault();
            if (currentPage > 1) showPage(--currentPage);
        };
        document.getElementById('nextPage').onclick = (e) => {
            e.preventDefault();
            if (currentPage < totalPages) showPage(++currentPage);
        };
        showPage(1);
    }

    // Execute immediately or on ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

// Markdown hotkeys (IIFE)
(() => {
    const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
    const getTextarea = () => document.querySelector('textarea#body_content') || document.querySelector('textarea');
    const isFocused = (el) => el && document.activeElement === el;
    const setSel = (el, start, end) => { el.selectionStart = start; el.selectionEnd = end; };

    const wrap = (el, w) => {
        const v = el.value, s = el.selectionStart ?? 0, e = el.selectionEnd ?? 0;
        if (s === e) {
            const placeholder = w === "`" ? "code" : "text";
            const ins = w + placeholder + w;
            el.value = v.slice(0, s) + ins + v.slice(e);
            setSel(el, s + w.length, s + w.length + placeholder.length);
            return;
        }
        const left = v.slice(Math.max(0, s - w.length), s);
        const right = v.slice(e, e + w.length);
        if (left === w && right === w) {
            el.value = v.slice(0, s - w.length) + v.slice(s, e) + v.slice(e + w.length);
            setSel(el, s - w.length, e - w.length);
            return;
        }
        const sel = v.slice(s, e);
        if (sel.startsWith(w) && sel.endsWith(w) && sel.length >= w.length * 2) {
            const un = sel.slice(w.length, sel.length - w.length);
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
        let s = el.selectionStart ?? 0;
        let e = el.selectionEnd ?? 0;

        if (s === e) {
            let L = s, R = s;
            while (L > 0 && !/\s/.test(v[L - 1])) L--;
            while (R < v.length && !/\s/.test(v[R])) R++;
            if (L === R) return;
            s = L; e = R;
        }

        for (const w of ws) {
            const left = v.slice(Math.max(0, s - w.length), s);
            const right = v.slice(e, e + w.length);
            if (left === w && right === w) {
                el.value = v.slice(0, s - w.length) + v.slice(s, e) + v.slice(e + w.length);
                setSel(el, s - w.length, e - w.length);
                return;
            }
        }

        const sel = v.slice(s, e);
        for (const w of ws) {
            if (sel.startsWith(w) && sel.endsWith(w) && sel.length >= w.length * 2) {
                const un = sel.slice(w.length, sel.length - w.length);
                el.value = v.slice(0, s) + un + v.slice(e);
                setSel(el, s, s + un.length);
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

// Autosave drafts (IIFE)
(() => {
    const stickyControls = document.querySelector('.sticky-controls');
    if (!stickyControls) return;

    const restore_btn = document.createElement('button');
    restore_btn.className = 'rdb_post_restorer';
    restore_btn.onclick = (e) => {
        e.preventDefault();
        const ebody = document.getElementById('body_content');
        const eheaders = document.getElementById('header_content');
        if (ebody && ebody.value.length > 30 && !confirm("Overwrite your current post with previous post?")) return;
        if (ebody) ebody.value = localStorage.getItem('body');
        if (eheaders) eheaders.innerText = localStorage.getItem('headers');
    };
    restore_btn.textContent = 'Restore Last Post';
    stickyControls.appendChild(restore_btn);

    function rdb_save_post() {
        setTimeout(rdb_save_post, 10000);
        const body = document.getElementById('body_content')?.value;
        const headers = document.getElementById('header_content')?.innerText;
        if (!body || body.length < 50) {
            console.log("Body less than 50 chars. Not saving.");
            return;
        }
        localStorage.setItem('body', body);
        localStorage.setItem('headers', headers);
        console.log("Post saved locally");
    }
    setTimeout(rdb_save_post, 10000);
})();
