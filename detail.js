// Detail page functionality for individual places and figures - Functional approach
let itemType = null;
let itemId = null;
let item = null;
let currentRating = 0;
let places = [];
let figures = [];

// Initialize the detail page
async function init() {
    try {
        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        itemType = urlParams.get('type');
        itemId = parseInt(urlParams.get('id'));

        if (!itemType || !itemId) {
            showError('Invalid URL parameters');
            return;
        }

        // Load data
        await loadData();
        
        // Find the specific item
        item = itemType === 'place' 
            ? places.find(p => p.id === itemId)
            : figures.find(f => f.id === itemId);

        if (!item) {
            showError('Item not found');
            return;
        }

        // Initialize page
        renderItem();
        setupNavigation();
        setupForms();
        await loadReviews();
        await loadComments();
        
    } catch (error) {
        console.error('Failed to initialize detail page:', error);
        showError('Failed to load content');
    }
}

// Load data from JS files
async function loadData() {
    try {
        const [placesModule, figuresModule] = await Promise.all([
            import('./data/places.js').catch(() => null),
            import('./data/figures.js').catch(() => null)
        ]);

        if (placesModule && figuresModule) {
            places = placesModule.default || placesModule.places || [];
            figures = figuresModule.default || figuresModule.figures || [];
        } else {
            throw new Error('Could not load data files');
        }
        
    } catch (error) {
        console.error('Error loading data:', error);
        throw error;
    }
}

// Render the main item content
function renderItem() {
    // Update page title
    document.title = `${item.name} - Nativa`;
    document.getElementById('pageTitle').textContent = `${item.name} - Nativa`;

    // Update content
    document.getElementById('itemTitle').textContent = item.name;
    document.getElementById('itemSubtitle').textContent = item.period;
    document.getElementById('itemDescription').textContent = item.description;
    document.getElementById('itemImage').src = item.image;
    document.getElementById('itemImage').alt = item.name;

    // Render details based on type
    renderDetails();
}

// Render item details
function renderDetails() {
    const detailsGrid = document.getElementById('detailsGrid');
    
    if (itemType === 'place') {
        detailsGrid.innerHTML = `
            <div class="detail-item">
                <div class="detail-label">Location</div>
                <div class="detail-value">${item.location}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Type</div>
                <div class="detail-value">${item.type}</div>
            </div>
            ${item.yearBuilt ? `
                <div class="detail-item">
                    <div class="detail-label">Year Built</div>
                    <div class="detail-value">${item.yearBuilt}</div>
                </div>
            ` : ''}
            <div class="detail-item">
                <div class="detail-label">Significance</div>
                <div class="detail-value">${item.significance}</div>
            </div>
            <div class="detail-item" style="grid-column: 1 / -1;">
                <div class="detail-label">Tags</div>
                <div class="detail-value">
                    ${item.tags.map(tag => `<span class="tag">${tag}</span>`).join(' ')}
                </div>
            </div>
        `;
    } else if (itemType === 'figure') {
        detailsGrid.innerHTML = `
            ${item.birth ? `
                <div class="detail-item">
                    <div class="detail-label">Birth</div>
                    <div class="detail-value">${item.birth}</div>
                </div>
            ` : ''}
            ${item.death ? `
                <div class="detail-item">
                    <div class="detail-label">Death</div>
                    <div class="detail-value">${item.death}</div>
                </div>
            ` : ''}
            <div class="detail-item">
                <div class="detail-label">Role</div>
                <div class="detail-value">${item.role}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Legacy</div>
                <div class="detail-value">${item.legacy}</div>
            </div>
            <div class="detail-item" style="grid-column: 1 / -1;">
                <div class="detail-label">Key Achievements</div>
                <div class="detail-value">
                    <ul style="margin: 0; padding-left: 1rem;">
                        ${item.achievements.map(achievement => `<li>${achievement}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
    }
}

// Setup navigation
function setupNavigation() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');

    navToggle?.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        navToggle.classList.toggle('active');
    });
}

// Setup forms and event listeners
function setupForms() {
    // Star rating setup
    const starRating = document.getElementById('starRating');
    const stars = starRating.querySelectorAll('.star');

    stars.forEach((star, index) => {
        star.addEventListener('click', () => {
            currentRating = index + 1;
            updateStarDisplay(stars, currentRating, 'clicking');
        });

        star.addEventListener('mouseenter', () => {
            updateStarDisplay(stars, index + 1, 'hoveringin');
        });
    });

    starRating.addEventListener('mouseleave', () => {
        updateStarDisplay(stars, currentRating, 'hoveringout');
    });

    // Review form
    const reviewForm = document.getElementById('reviewForm');
    reviewForm.addEventListener('submit', handleReviewSubmit);

    // Comment form
    const commentForm = document.getElementById('commentForm');
    commentForm.addEventListener('submit', handleCommentSubmit);
}

// Update star display
function updateStarDisplay(stars, rating, type) {
    if (type === 'clicking') {
        stars.forEach((star, index) => {
            star.innerHTML = '★';
            if (index < rating) {
                star.classList.remove('empty');
                star.classList.add('selected');
            } else {
                star.classList.add('empty');
                star.classList.remove('selected');
            }
        });
    }
    else if (type === 'hoveringin') {
        stars.forEach((star, index) => {
            if (index < rating) {
                if (index > currentRating-1) {
                    star.innerHTML = '☆';
                } else {
                    star.innerHTML = '★';
                }
                star.classList.remove('empty');
                star.classList.add('selected');
            } else {
                star.classList.add('empty');
                star.classList.remove('selected');
                star.innerHTML = '★';
            }
        });
    }
    else{
        stars.forEach((star, index) => {
            star.innerHTML = '★';
            if (index < rating) {
                star.classList.remove('empty');
                star.classList.add('selected');
            }
            else {
                star.classList.add('empty');
                star.classList.remove('selected');
            }
        });
    }
}

// Handle review form submission
async function handleReviewSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('reviewerName').value.trim();
    const text = document.getElementById('reviewText').value.trim();
    
    if (!name || !text || currentRating === 0) {
        alert('Please fill in all fields and select a rating');
        return;
    }

    try {
        const reviewData = {
            name,
            reviewText: text,
            rating: currentRating
        };

        // Use Firebase DB function
        await window.firebaseDb.addReview(itemType, itemId, reviewData);
        
        // Reset form
        document.getElementById('reviewForm').reset();
        currentRating = 0;
        updateStarDisplay(document.querySelectorAll('#starRating .star'), 0);
        
        // Reload reviews
        await loadReviews();
        
        alert('Review submitted successfully!');
        
    } catch (error) {
        console.error('Error submitting review:', error);
        alert('Failed to submit review. Please try again.');
    }
}

// Handle comment form submission
async function handleCommentSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('commenterName').value.trim();
    const text = document.getElementById('commentText').value.trim();
    
    if (!name || !text) {
        alert('Please fill in all fields');
        return;
    }

    try {
        const commentData = {
            name,
            commentText: text
        };

        // Use Firebase DB function
        await window.firebaseDb.addComment(itemType, itemId, commentData);
        
        // Reset form
        document.getElementById('commentForm').reset();
        
        // Reload comments
        await loadComments();
        
        alert('Comment posted successfully!');
        
    } catch (error) {
        console.error('Error submitting comment:', error);
        alert('Failed to submit comment. Please try again.');
    }
}

// Load reviews from Firebase/localStorage
async function loadReviews() {
    try {
        const reviews = await window.firebaseDb.getReviews(itemType, itemId);

        // Calculate average rating
        let averageRating = 0;
        if (reviews.length > 0) {
            const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
            averageRating = (sum / reviews.length).toFixed(1);
        }

        // Update rating display
        updateRatingDisplay(averageRating, reviews.length);

        // Render reviews
        renderReviews(reviews);
        
    } catch (error) {
        console.error('Error loading reviews:', error);
    }
}

// Update rating display
function updateRatingDisplay(averageRating, reviewCount) {
    const ratingStars = document.getElementById('ratingStars');
    const ratingText = document.getElementById('ratingText');

    // Generate stars
    let starsHtml = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= Math.floor(averageRating)) {
            starsHtml += '<span class="star">★</span>';
        } else if (i - 0.5 <= averageRating) {
            starsHtml += '<span class="star">☆</span>';
        } else {
            starsHtml += '<span class="star empty">☆</span>';
        }
    }

    ratingStars.innerHTML = starsHtml;
    ratingText.textContent = reviewCount > 0 
        ? `${averageRating} out of 5 (${reviewCount} review${reviewCount !== 1 ? 's' : ''})`
        : 'No reviews yet';
}

// Render reviews list
function renderReviews(reviews) {
    const reviewsList = document.getElementById('reviewsList');
    
    if (reviews.length === 0) {
        reviewsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-star"></i>
                <p>No reviews yet. Be the first to share your experience!</p>
            </div>
        `;
        return;
    }

    reviewsList.innerHTML = reviews.map(review => `
        <div class="review-item">
            <div class="review-header">
                <div>
                    <div class="reviewer-name">${escapeHtml(review.name)}</div>
                    <div class="stars">
                        ${generateStars(review.rating)}
                    </div>
                </div>
                <div class="review-date">${formatDate(review.timestamp)}</div>
            </div>
            <p>${escapeHtml(review.reviewText)}</p>
            <div class="review-actions">
                <button class="action-btn" onclick="markHelpful('${review.id}')">
                    <i class="fas fa-thumbs-up"></i> Helpful (${review.helpful || 0})
                </button>
            </div>
        </div>
    `).join('');
}

// Load comments from Firebase/localStorage
async function loadComments() {
    try {
        const comments = await window.firebaseDb.getComments(itemType, itemId);
        renderComments(comments);
    } catch (error) {
        console.error('Error loading comments:', error);
    }
}

// Render comments list
function renderComments(comments) {
    const commentsList = document.getElementById('commentsList');
    
    if (comments.length === 0) {
        commentsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-comments"></i>
                <p>No comments yet. Start the conversation!</p>
            </div>
        `;
        return;
    }

    commentsList.innerHTML = comments.map(comment => `
        <div class="comment-item">
            <div class="comment-header">
                <div class="commenter-name">${escapeHtml(comment.name)}</div>
                <div class="comment-date">${formatDate(comment.timestamp)}</div>
            </div>
            <p>${escapeHtml(comment.commentText)}</p>
            <div class="comment-actions">
                <button class="action-btn" onclick="likeComment('${comment.id}')">
                    <i class="fas fa-heart"></i> Like (${comment.likes || 0})
                </button>
            </div>
        </div>
    `).join('');
}

// Mark review as helpful
async function markHelpful(reviewId) {
    try {
        await window.firebaseDb.markReviewHelpful(reviewId);
        await loadReviews();
    } catch (error) {
        console.error('Error marking review helpful:', error);
    }
}

// Like comment
async function likeComment(commentId) {
    try {
        await window.firebaseDb.likeComment(commentId);
        await loadComments();
    } catch (error) {
        console.error('Error liking comment:', error);
    }
}

// Generate star display
function generateStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        stars += i <= rating ? '<span class="star">★</span>' : '<span class="star empty">☆</span>';
    }
    return stars;
}

// Format date
function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Escape HTML to prevent XSS
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Show error page
function showError(message) {
    document.body.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; min-height: 100vh; text-align: center;">
            <div>
                <h1>Error</h1>
                <p>${message}</p>
                <a href="index.html" class="btn btn-primary">Return to Home</a>
            </div>
        </div>
    `;
}

// Make functions available globally for onclick handlers
window.markHelpful = markHelpful;
window.likeComment = likeComment;

// Initialize detail page when DOM is loaded
document.addEventListener('DOMContentLoaded', init);