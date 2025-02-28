function initializeApp() {
    console.log("News app initialized");
    initializeSearch();
    setupEventListeners();
    fetchNews('business'); // Default category
}

function setupEventListeners() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            fetchNews(this.getAttribute('data-category'));
        });
    });
}

function initializeSearch() {
    const searchButton = document.getElementById('search-button');
    const searchInput = document.getElementById('search-news');

    if (!searchButton || !searchInput) {
        console.error('Search elements not found');
        return;
    }

    searchButton.onclick = function() {
        const searchTerm = searchInput.value.trim();
        const activeCategory = document.querySelector('.filter-btn.active').getAttribute('data-category');
        
        // If search is empty, just fetch the current category's news
        if (!searchTerm) {
            fetchNews(activeCategory);
            return;
        }

        const newsContainer = document.getElementById('news-root');
        const newsList = newsContainer.querySelector('.news-list');
        
        // Show loading state
        newsList.innerHTML = '<div class="loading">Searching news...</div>';
        
        // Include both search term and category in the API call
        const apiUrl = `/apps/news/fetch?category=${activeCategory}&search=${encodeURIComponent(searchTerm)}`;
        
        console.log(`Searching news with term: ${searchTerm} in category: ${activeCategory}`);
        
        fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => {
                        throw new Error(err.error || `HTTP error! Status: ${response.status}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                if (!data.success) {
                    throw new Error(data.error || 'Failed to search news');
                }
                // Make sure we're passing the correct data structure to renderNews
                renderNews(data.data || []);
            })
            .catch(error => {
                console.error('Error searching news:', error);
                newsList.innerHTML = `
                    <div class="error-message">
                        Failed to search news. Please try again later.
                        <br><small>${error.message}</small>
                    </div>
                `;
            });
    };

    // Add Enter key support
    searchInput.onkeypress = function(e) {
        if (e.key === 'Enter') {
            searchButton.click();
        }
    };

    // Handle empty search
    searchInput.addEventListener('input', function() {
        if (this.value.trim() === '') {
            const activeCategory = document.querySelector('.filter-btn.active').getAttribute('data-category');
            fetchNews(activeCategory);
        }
    });
}

function fetchNews(category, customUrl = null) {
    console.log('Fetching news for category:', category);
    const newsContainer = document.getElementById('news-root');
    const newsList = newsContainer.querySelector('.news-list');
    
    // Show loading state
    newsList.innerHTML = '<div class="loading">Loading news feed...</div>';
    
    // Build the API URL
    let apiUrl = `/apps/news/fetch?category=${category}`;
    if (customUrl) {
        apiUrl += `&api_url=${encodeURIComponent(customUrl)}`;
    }
    
    console.log(`Fetching news from: ${apiUrl}`);
    
    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.error || `HTTP error! Status: ${response.status}`);
                });
            }
            return response.json();
        })
        .then(data => {
            if (!data.success) {
                throw new Error(data.error || 'Failed to fetch news');
            }
            // Make sure we're passing the correct data structure
            renderNews(data.data || []);
        })
        .catch(error => {
            console.error('Error fetching news:', error);
            newsList.innerHTML = `
                <div class="error-message">
                    Failed to load news. Please try again later.
                    <br><small>${error.message}</small>
                </div>
            `;
        });
}

function renderNews(articles) {
    console.log('Rendering news with data:', articles); // Add this for debugging
    const newsList = document.querySelector('.news-list');
    
    if (!Array.isArray(articles) || articles.length === 0) {
        newsList.innerHTML = '<div class="no-results">No news items found.</div>';
        return;
    }

    newsList.innerHTML = articles.map(item => `
        <div class="news-item">
            <div class="news-title">${item.title || 'Untitled'}</div>
            ${item.urlToImage || item.imageUrl ? `
                <div class="news-image">
                    <img src="${item.urlToImage || item.imageUrl}" alt="${item.title}" onerror="this.style.display='none'">
                </div>
            ` : ''}
            <div class="news-content">${item.description || item.content || 'No content available'}</div>
            <div class="news-meta">
                <span>${new Date(item.publishedAt || item.date).toLocaleDateString()}</span>
                ${item.url || item.readMoreUrl ? `
                    <a href="${item.url || item.readMoreUrl}" target="_blank" class="read-more">Read More</a>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function cleanupApp() {
    console.log('News app cleanup');
}

window.initializeApp = initializeApp;
window.cleanupApp = cleanupApp;

document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('news-root')) {
        initializeApp();
    }
});
