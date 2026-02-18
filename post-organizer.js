// Categorize posts page by month
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

            // Create navigation container with fixed width
            const navContainer = document.createElement('div');
            navContainer.style.margin = '10px 0';
            navContainer.style.width = '100%'; // Fixed width to prevent layout shifts

            // Create the navigation links
            const allLink = document.createElement('a');
            allLink.href = '#';
            allLink.textContent = 'ALL';
            allLink.className = 'filterSwitcher';
            allLink.style.cursor = 'pointer';
            allLink.style.marginRight = '15px';
            allLink.style.textTransform = 'uppercase';
            allLink.style.fontSize = '0.8em';
            allLink.style.color = '#777';
            allLink.style.fontWeight = 'bold'; // Default active state

            const publishedLink = document.createElement('a');
            publishedLink.href = '#';
            publishedLink.textContent = `PUBLISHED (${publishedCount})`;
            publishedLink.className = 'filterSwitcher';
            publishedLink.style.cursor = 'pointer';
            publishedLink.style.marginRight = '15px';
            publishedLink.style.textTransform = 'uppercase';
            publishedLink.style.fontSize = '0.8em';
            publishedLink.style.color = '#777';
            publishedLink.style.fontWeight = 'normal';

            const draftsLink = document.createElement('a');
            draftsLink.href = '#';
            draftsLink.textContent = `DRAFTS (${draftCount})`;
            draftsLink.className = 'filterSwitcher';
            draftsLink.style.cursor = 'pointer';
            draftsLink.style.textTransform = 'uppercase';
            draftsLink.style.fontSize = '0.8em';
            draftsLink.style.color = '#777';
            draftsLink.style.fontWeight = 'normal';

            // Add links to container
            navContainer.appendChild(allLink);
            navContainer.appendChild(publishedLink);
            navContainer.appendChild(draftsLink);

            // Insert after search input (wait for search to be created)
            setTimeout(() => {
                const searchInput = document.getElementById('searchInput');
                if (searchInput) {
                    searchInput.parentNode.insertBefore(navContainer, searchInput.nextSibling);
                }
            }, 100);

            // Add click event listeners
            allLink.addEventListener('click', function(e) {
                e.preventDefault();
                filterPosts('all');
                // Update link styles
                allLink.style.fontWeight = 'bold';
                publishedLink.style.fontWeight = 'normal';
                draftsLink.style.fontWeight = 'normal';
            });

            publishedLink.addEventListener('click', function(e) {
                e.preventDefault();
                filterPosts('published');
                // Update link styles
                allLink.style.fontWeight = 'normal';
                publishedLink.style.fontWeight = 'bold';
                draftsLink.style.fontWeight = 'normal';
            });

            draftsLink.addEventListener('click', function(e) {
                e.preventDefault();
                filterPosts('draft');
                // Update link styles
                allLink.style.fontWeight = 'normal';
                publishedLink.style.fontWeight = 'normal';
                draftsLink.style.fontWeight = 'bold';
            });

            // Function to filter posts by status
            function filterPosts(status) {
                allPosts.forEach(post => {
                    const smallElement = post.querySelector('small');
                    const isDraft = smallElement && smallElement.textContent.includes('not published');

                    if (status === 'all') {
                        post.style.display = '';
                    } else if (status === 'published' && !isDraft) {
                        post.style.display = '';
                    } else if (status === 'draft' && isDraft) {
                        post.style.display = '';
                    } else {
                        post.style.display = 'none';
                    }
                });
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