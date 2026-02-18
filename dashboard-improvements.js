// Function to format the month and year for headers
function formatMonthYear(date) {
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
}

// Function to organize blog posts by month
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

        if (!postsByMonth.has(monthYear)) {
            postsByMonth.set(monthYear, []);
        }
        postsByMonth.get(monthYear).push(post);
    });

    blogPostsList.innerHTML = '';

    const sortedMonths = Array.from(postsByMonth.keys()).sort((a, b) => {
        const dateA = new Date(a);
        const dateB = new Date(b);
        return dateB - dateA;
    });

    sortedMonths.forEach(monthYear => {
        const header = document.createElement('h2');
        header.textContent = monthYear;
        header.className = 'month-header';
        blogPostsList.appendChild(header);

        postsByMonth.get(monthYear).forEach(post => {
            blogPostsList.appendChild(post);
        });
    });
}

// Add search to posts page
function addSearch() {
    const blogPosts = document.querySelector('.post-list');
    if (!blogPosts) return;

    const mainContainer = document.querySelector('main');
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.id = 'searchInput';
    searchInput.placeholder = 'Search...';
    searchInput.style.display = 'block';
    searchInput.style.width = '100%';
    searchInput.style.boxSizing = 'border-box';

    mainContainer.insertBefore(searchInput, blogPosts);

    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const posts = document.querySelectorAll('.post-list li');
        posts.forEach(post => {
            const title = post.textContent.toLowerCase();
            post.style.display = title.includes(searchTerm) ? '' : 'none';
        });
    });
}

// Initialize pagination after all DOM manipulations
function initPagination() {
    const postsPerPage = 20;
    const posts = document.querySelectorAll('.post-list li');
    const totalPages = Math.ceil(posts.length / postsPerPage);
    let currentPage = 1;

    if (totalPages <= 1) return;

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

// Run all post-processing in correct order after DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const postList = document.querySelector('ul.post-list');
    const starredTitles = ['Contact', 'Now', 'Gratitude'];
    let allPosts = [];
    let draftCount = 0;
    let publishedCount = 0;

    // Pre-count posts BEFORE any DOM manipulation (while list is intact)
    if (postList) {
        allPosts = Array.from(postList.querySelectorAll('li'));
        const totalCount = allPosts.length;

        allPosts.forEach(post => {
            const smallElement = post.querySelector('small');
            if (smallElement && smallElement.textContent.includes('not published')) {
                draftCount++;
            }
        });
        publishedCount = totalCount - draftCount;
    }

    // Add search and filters synchronously (no layout shift between them)
    addSearch();

    // Create and insert filter nav immediately (no 100ms timeout)
    if (postList) {
        const navContainer = document.createElement('div');
        navContainer.className = 'navContainer';
        navContainer.style.margin = '10px 0';
        navContainer.style.width = '100%';

        function filterLink(name) {
            const displayLink = document.createElement('a');
            if (name === "PUBLISHED") {
                displayLink.textContent = `PUBLISHED (${publishedCount})`;
            } else if (name === "DRAFTS") {
                displayLink.textContent = `DRAFTS (${draftCount})`;
            } else {
                displayLink.textContent = name;
            }
            displayLink.className = 'filterSwitcher';
            displayLink.href = '#';
            displayLink.title = name;
            displayLink.style.cursor = 'pointer';
            displayLink.style.marginRight = '15px';
            displayLink.style.textTransform = 'uppercase';
            displayLink.style.fontSize = '0.8em';
            displayLink.style.color = '#777';

            if (name === 'ALL') {
                displayLink.style.fontWeight = 'bold';
            }

            navContainer.appendChild(displayLink);
        }

        if (window.location.pathname.endsWith('/pages/')) {
            filterLink('STARRED');
        }
        filterLink('ALL');
        filterLink('PUBLISHED');
        filterLink('DRAFTS');

        // Insert immediately after search (no setTimeout)
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.parentNode.insertBefore(navContainer, searchInput.nextSibling);
        }

        // Filter click handler
        navContainer.addEventListener('click', function(e) {
            if (!e.target.classList.contains('filterSwitcher')) return;

            e.preventDefault();
            const name = e.target.textContent;

            allPosts.forEach(post => {
                const smallElement = post.querySelector('small');
                const isDraft = smallElement && smallElement.textContent.includes('not published');
                const linkText = post.querySelector('a')?.textContent.trim();
                const isPostStarred = linkText && starredTitles.includes(linkText);

                if (name.includes('PUBLISHED')) {
                    post.style.display = isDraft ? 'none' : '';
                } else if (name.includes('DRAFTS')) {
                    post.style.display = isDraft ? '' : 'none';
                } else if (name.includes('STARRED')) {
                    post.style.display = isPostStarred ? '' : 'none';
                } else {
                    post.style.display = '';
                }
            });

            document.querySelectorAll('.filterSwitcher').forEach(link => {
                link.style.fontWeight = 'normal';
            });
            e.target.style.fontWeight = 'bold';
        });
    }

    // Then organize by month and paginate
    organizeBlogPosts();
    initPagination();
});

<!-- markdown hotkeys -->
(() => {
  const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);

  const getTextarea = () =>
    document.querySelector('textarea#body_content') ||
    document.querySelector('textarea');

  const isFocused = (el) => el && document.activeElement === el;

  const setSel = (el, start, end) => {
    el.selectionStart = start;
    el.selectionEnd = end;
  };

  const wrap = (el, w) => {
    const v = el.value;
    const s = el.selectionStart ?? 0;
    const e = el.selectionEnd ?? 0;

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
      let L = s;
      while (L > 0 && !/\s/.test(v[L - 1])) L--;
      let R = s;
      while (R < v.length && !/\s/.test(v[R])) R++;
      if (L === R) return;
      s = L;
      e = R;
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

<!-- Autosave my blog drafts -->
(() => {
    const restore_btn = document.createElement('button');
    restore_btn.classList.add('rdb_post_restorer');
    restore_btn.setAttribute('onclick', "event.preventDefault();rdb_restore_post();");
    restore_btn.innerText = 'Restore Last Post';
    document.querySelector('.sticky-controls')?.appendChild(restore_btn);

    function rdb_restore_post(){
        var ebody = document.getElementById('body_content');
        var eheaders = document.getElementById('header_content');

        if (ebody && ebody.value.length > 30){
            if (!confirm("Overwrite your current post with previous post?")) return;
        }

        if (ebody) ebody.value = localStorage.getItem('body');
        if (eheaders) eheaders.innerText = localStorage.getItem('headers');
    }

    function rdb_save_post(){
        setTimeout(function(){rdb_save_post();}, 10000);
        var body = document.getElementById('body_content')?.value;
        var headers = document.getElementById('header_content')?.innerText;
        if (!body || body.length < 50){
            console.log("Body less than 50 chars. Not saving.");
            return;
        }
        localStorage.setItem('body', body);
        localStorage.setItem('headers', headers);
        console.log("Post saved locally");
    }

    setTimeout(function(){rdb_save_post();}, 10000);
})();
