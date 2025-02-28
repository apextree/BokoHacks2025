function initializeApp() {
    console.log("News app initialized");
    initializeSearch();
    setupEventListeners();
    fetchNews('business'); // Default category
}

function cleanupApp() {
    console.log('News app cleanup');
}

function setupEventListeners() {
    const newsContainer = document.getElementById('news-root');
    
    // Event delegation for category buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            console.log('Category button clicked:', this.getAttribute('data-category'));
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            // Fetch news for selected category
            const category = this.getAttribute('data-category');
            fetchNews(category);
        });
    });

    // Toggle advanced options
    const toggleBtn = document.getElementById('toggle-advanced');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function() {
            const advancedSection = document.getElementById('advanced-options');
            if (advancedSection.style.display === 'none') {
                advancedSection.style.display = 'block';
                this.textContent = 'Hide Advanced Options';
            } else {
                advancedSection.style.display = 'none';
                this.textContent = 'Show Advanced Options';
            }
        });
    }

    // Custom URL button
    const applyUrlBtn = document.getElementById('apply-custom-url');
    if (applyUrlBtn) {
        applyUrlBtn.addEventListener('click', function() {
            const customUrl = document.getElementById('custom-api-url').value.trim();
            if (customUrl) {
                const activeCategory = document.querySelector('.filter-btn.active').getAttribute('data-category');
                fetchNews(activeCategory, customUrl);
            } else {
                alert('Please enter a custom API URL');
            }
        });
    }

    // Fetch source button
    const fetchSourceBtn = document.getElementById('fetch-source');
    if (fetchSourceBtn) {
        fetchSourceBtn.addEventListener('click', function() {
            fetchSourceDetails();
        });
    }

    // Import news button
    const importNewsBtn = document.getElementById('import-news');
    if (importNewsBtn) {
        importNewsBtn.addEventListener('click', function() {
            importNewsData();
        });
    }
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

function updateDebugInfo(data) {
    const debugOutput = document.getElementById('debug-output');
    if (debugOutput) {
        debugOutput.style.display = 'block';
        
        // Format the data for display
        let debugText = '';
        if (data.error) {
            debugText = `Error: ${data.error}`;
        } else {
            // Show a truncated version of the response
            const simplifiedData = {...data};
            if (simplifiedData.data && simplifiedData.data.length > 2) {
                simplifiedData.data = [
                    simplifiedData.data[0],
                    simplifiedData.data[1],
                    "... (truncated for display)"
                ];
            }
            debugText = 'API Response:\n' + JSON.stringify(simplifiedData, null, 2);
        }
        
        debugOutput.textContent = debugText;
    }
}

function fetchSourceDetails() {
    const sourceId = document.getElementById('source-id').value.trim();
    const sourceDetails = document.getElementById('source-details');
    
    sourceDetails.innerHTML = '<div class="loading">Loading source details...</div>';
    sourceDetails.style.display = 'block';
    
    fetch(`/apps/news/admin/fetch_source?id=${sourceId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                sourceDetails.innerHTML = `<pre>${JSON.stringify(data.source, null, 2)}</pre>`;
            } else {
                sourceDetails.innerHTML = `<div class="error-message">${data.error || 'Source not found'}</div>`;
            }
        })
        .catch(error => {
            sourceDetails.innerHTML = `<div class="error-message">Error: ${error.message}</div>`;
        });
}

function importNewsData() {
    const importData = document.getElementById('import-data').value.trim();
    if (!importData) {
        alert('Please enter base64 encoded data');
        return;
    }
    
    const formData = new FormData();
    formData.append('data', importData);
    
    fetch('/apps/news/import', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(`Import successful! ${data.count} items imported.`);
        } else {
            alert(`Import failed: ${data.error}`);
        }
    })
    .catch(error => {
        alert(`Error: ${error.message}`);
    });
}

function generateExamplePicklePayload() {
    const payload = "KGRwMApTJ2V4YW1wbGUnCnAxClMndGVzdCBwYXlsb2FkJwpwMgpzLg==";
    
    navigator.clipboard.writeText(payload)
        .then(() => {
            alert("Example payload copied to clipboard! Use it in the Import field.");
        })
        .catch(err => {
            console.error('Could not copy text: ', err);
            alert("Example payload: " + payload);
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

// Make functions available globally
window.initializeApp = initializeApp;
window.cleanupApp = cleanupApp;
window.fetchNews = fetchNews;
window.generateExamplePicklePayload = generateExamplePicklePayload;

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('news-root')) {
        initializeApp();
    }
});

console.log('News.js loaded');
