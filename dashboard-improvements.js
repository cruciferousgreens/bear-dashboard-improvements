<!-- Categorize posts page by month -->

(function() {
    'use strict';

    document.addEventListener("DOMContentLoaded", function() {
        const postList = document.querySelector('ul.post-list');
        if (postList) {
            const allPosts = postList.querySelectorAll('li');
            const totalCount = allPosts.length;
            
            // Count drafts (posts with "not published" text)
            let draftCount = 0;
            allPosts.forEach(post => {
                const smallElement = post.querySelector('small');
                if (smallElement && smallElement.textContent.includes('not published')) {
                    draftCount++;
                }
            });
            
            const publishedCount = totalCount - draftCount;
            
            const h1Element = document.querySelector('main h1');
            if (h1Element) {
                const countSpan = document.createElement('span');
                countSpan.textContent = ` (${publishedCount} published, ${draftCount} drafts)`;
                countSpan.style.fontSize = '0.8em';
                countSpan.style.fontWeight = 'normal';
                countSpan.style.color = '#777';
                h1Element.appendChild(countSpan);
            }
        }
    });
})();
// Function to format the month and year for headers
function formatMonthYear(date) {
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
}

// Function to organize blog posts by month
function organizeBlogPosts() {
    const blogPostsList = document.querySelector('.post-list');
    if (!blogPostsList) return;

    // Get all list items
    const posts = Array.from(blogPostsList.querySelectorAll('li'));
    
    // Group posts by month
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

    // Clear the list
    blogPostsList.innerHTML = '';

    // Sort months in descending order (newest first)
    const sortedMonths = Array.from(postsByMonth.keys()).sort((a, b) => {
        const dateA = new Date(a);
        const dateB = new Date(b);
        return dateB - dateA;
    });

    // Add posts back with headers
    sortedMonths.forEach(monthYear => {
        // Create and add month header
        const header = document.createElement('h2');
        header.textContent = monthYear;
        header.className = 'month-header';
        blogPostsList.appendChild(header);

        // Add posts for this month
        postsByMonth.get(monthYear).forEach(post => {
            blogPostsList.appendChild(post);
        });
    });
}

// Run the organization when the DOM is loaded
if (document.querySelector(".post-list")) {
    document.addEventListener('DOMContentLoaded', organizeBlogPosts); 
}

<!-- Add search to posts page -->

  function addSearch() {
    const blogPosts = document.querySelector('.post-list');
    if (blogPosts) {  // Check if the post list exists
        const mainContainer = document.querySelector('main');
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.id = 'searchInput';
        searchInput.placeholder = 'Search...';
        searchInput.style.display = 'block';

        // Insert the search input before the blog posts
        mainContainer.insertBefore(searchInput, blogPosts);

        // Add event listener to filter posts based on input
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const posts = document.querySelectorAll('.post-list li');
            posts.forEach(post => {
                const title = post.textContent.toLowerCase();
                post.style.display = title.includes(searchTerm) ? '' : 'none';
            });
        });
    }
}

// Run after the page has fully loaded
document.addEventListener('DOMContentLoaded', addSearch);

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
    const restore_btn = document.createElement('button');
    restore_btn.classList.add('rdb_post_restorer');
    restore_btn.setAttribute('onclick', "event.preventDefault();rdb_restore_post();");
    restore_btn.innerText = 'Restore Last Post';
    document.querySelector('.sticky-controls').appendChild(restore_btn);

    function rdb_restore_post(){
        var ebody = document.getElementById('body_content');
        var eheaders = document.getElementById('header_content');
      
        if (ebody.value.length > 30){
            if (!confirm("Overwrite your current post with previous post?"))return;
        }

        ebody.value= localStorage.getItem('body');
        eheaders.innerText = localStorage.getItem('headers');
    }
    function rdb_save_post(){
        setTimeout(function(){rdb_save_post();}, 10000);
        console.log(localStorage);
        var body = document.getElementById('body_content').value;
        var headers = document.getElementById('header_content').innerText;
        if (body.length < 50){
            console.log("Body less than 50 chars. Not saving.");
            return;
        }
        localStorage.setItem('body', body);
        localStorage.setItem('headers', headers);
        console.log("Post saved locally",localStorage);
    }
    setTimeout(function(){rdb_save_post();}, 10000);
