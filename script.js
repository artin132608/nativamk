// Application state
let appState = {
    places: [],
    figures: [],
    filteredPlaces: [],
    filteredFigures: [],
    currentFilter: 'all',
    searchQuery: ''
};

// Main initialization function
async function initHistoricalMacedonia() {
    try {
        // Load data
        await loadData();
        
        // Initialize components
        initNavigation();
        initSearch();
        initModal();
        renderPlaces();
        renderFigures();
        renderTimeline();
        
        // Set up event listeners
        setupEventListeners();
        
        console.log('Historical Macedonia website initialized successfully');
    } catch (error) {
        console.error('Failed to initialize website:', error);
        showError('Failed to load historical data. Please refresh the page.');
    }
}

// Data loading function
async function loadData() {
    try {
        const [placesModule, figuresModule] = await Promise.all([
            import('./data/places.js').catch(() => null),
            import('./data/figures.js').catch(() => null)
        ]);

        if (placesModule && figuresModule) {
            appState.places = placesModule.default || placesModule.places || [];
            appState.figures = figuresModule.default || figuresModule.figures || [];
        }
        
        // Initialize filtered arrays
        appState.filteredPlaces = [...appState.places];
        appState.filteredFigures = [...appState.figures];
        
    } catch (error) {
        console.error('Error loading data:', error);
        // Show error state instead of empty data
        showError('Unable to load historical data. Please check your connection and try again.');
        throw error;
    }
}

// Navigation initialization
function initNavigation() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Mobile menu toggle
    navToggle?.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        navToggle.classList.toggle('active');
    });

    // Smooth scrolling for navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                // Close mobile menu
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
                
                // Update active link
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                // Smooth scroll to section
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Update active link on scroll
    window.addEventListener('scroll', updateActiveNavLink);
}

// Update active navigation link based on scroll position
function updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    const scrollPos = window.scrollY + 100;

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');

        if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                }
            });
        }
    });
}

// Search and filter initialization
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const filterBtns = document.querySelectorAll('.filter-btn');

    // Search input handler
    searchInput?.addEventListener('input', (e) => {
        appState.searchQuery = e.target.value.toLowerCase().trim();
        applyFilters();
    });

    // Filter button handlers
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            appState.currentFilter = btn.getAttribute('data-filter');
            applyFilters();
        });
    });
}

// Apply search and filter logic
function applyFilters() {
    // Filter places
    appState.filteredPlaces = appState.places.filter(place => {
        const matchesSearch = !appState.searchQuery || 
            place.name.toLowerCase().includes(appState.searchQuery) ||
            place.description.toLowerCase().includes(appState.searchQuery) ||
            place.period.toLowerCase().includes(appState.searchQuery) ||
            place.tags.some(tag => tag.toLowerCase().includes(appState.searchQuery));

        const matchesFilter = appState.currentFilter === 'all' || appState.currentFilter === 'places';

        return matchesSearch && matchesFilter;
    });

    // Filter figures
    appState.filteredFigures = appState.figures.filter(figure => {
        const matchesSearch = !appState.searchQuery || 
            figure.name.toLowerCase().includes(appState.searchQuery) ||
            figure.description.toLowerCase().includes(appState.searchQuery) ||
            figure.period.toLowerCase().includes(appState.searchQuery) ||
            figure.achievements.some(achievement => achievement.toLowerCase().includes(appState.searchQuery));

        const matchesFilter = appState.currentFilter === 'all' || appState.currentFilter === 'figures';

        return matchesSearch && matchesFilter;
    });

    // if (appState.currentFilter === 'all') {
    //     document.getElementById('places').classList.add('active');
    //     document.getElementById('figures').classList.add('active');
    //     document.getElementById('figures-link').style.display = 'contents';
    //     document.getElementById('places-link').style.display = 'contents';
    // }
    // else if (appState.currentFilter === 'places') {
    //     document.getElementById('places').classList.add('active');
    //     document.getElementById('figures').classList.remove('active');
    //     document.getElementById('figures-link').style.display = 'none';
    //     document.getElementById('places-link').style.display = 'contents';
    // }
    // else if (appState.currentFilter === 'figures') {
    //     document.getElementById('figures').classList.add('active');
    //     document.getElementById('places').classList.remove('active');
    //     document.getElementById('figures-link').style.display = 'contents';
    //     document.getElementById('places-link').style.display = 'none';
    // }

    // Re-render filtered results
    renderPlaces();
    renderFigures();
}

// Render places grid
async function renderPlaces() {
    const placesGrid = document.getElementById('placesGrid');
    if (!placesGrid) return;

    if (appState.filteredPlaces.length === 0) {
        placesGrid.innerHTML = getEmptyState('places');
        return;
    }

    // Get ratings for all places using the functional approach
    const placesWithRatings = await Promise.all(
        appState.filteredPlaces.map(async (place) => {
            let rating = 0;
            let reviewCount = 0;
            try {
                // Use the functional firebaseDb object instead of class instance
                if (window.firebaseDb && window.firebaseDb.isFirebaseAvailable !== false) {
                    rating = await window.firebaseDb.getAverageRating('place', place.id);
                    reviewCount = await window.firebaseDb.getReviewCount('place', place.id);
                }
            } catch (error) {
                console.error('Error getting ratings for place:', place.id, error);
            }
            return { ...place, rating: parseFloat(rating), reviewCount };
        })
    );

    placesGrid.innerHTML = placesWithRatings.map(place => `
        <div class="place-card" data-type="place" data-id="${place.id}" tabindex="0" role="button" aria-label="View details for ${place.name}">
            <div class="card-image">
                <img src="${place.image}" alt="${place.name}" loading="lazy">
            </div>
            <div class="card-content">
                <h3 class="card-title">${place.name}</h3>
                <div class="card-subtitle">${place.period}</div>
                ${place.reviewCount > 0 ? `
                    <div class="card-rating">
                        <div class="stars">
                            ${generateStars(place.rating)}
                        </div>
                        <span class="rating-text">${place.rating} (${place.reviewCount} review${place.reviewCount !== 1 ? 's' : ''})</span>
                    </div>
                ` : ''}
                <p class="card-description">${place.description}</p>
                <div class="card-tags">
                    ${place.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            </div>
        </div>
    `).join('');

    // Add click handlers to new cards
    addCardClickHandlers();
}

// Render figures grid
async function renderFigures() {
    const figuresGrid = document.getElementById('figuresGrid');
    if (!figuresGrid) return;

    if (appState.filteredFigures.length === 0) {
        figuresGrid.innerHTML = getEmptyState('figures');
        return;
    }

    // Get ratings for all figures using the functional approach
    const figuresWithRatings = await Promise.all(
        appState.filteredFigures.map(async (figure) => {
            let rating = 0;
            let reviewCount = 0;
            try {
                // Use the functional firebaseDb object instead of class instance
                if (window.firebaseDb && window.firebaseDb.isFirebaseAvailable !== false) {
                    rating = await window.firebaseDb.getAverageRating('figure', figure.id);
                    reviewCount = await window.firebaseDb.getReviewCount('figure', figure.id);
                }
            } catch (error) {
                console.error('Error getting ratings for figure:', figure.id, error);
            }
            return { ...figure, rating: parseFloat(rating), reviewCount };
        })
    );

    figuresGrid.innerHTML = figuresWithRatings.map(figure => `
        <div class="figure-card" data-type="figure" data-id="${figure.id}" tabindex="0" role="button" aria-label="View details for ${figure.name}">
            <div class="card-image">
                <img src="${figure.image}" alt="${figure.name}" loading="lazy">
            </div>
            <div class="card-content">
                <h3 class="card-title">${figure.name}</h3>
                <div class="card-subtitle">${figure.period}</div>
                ${figure.reviewCount > 0 ? `
                    <div class="card-rating">
                        <div class="stars">
                            ${generateStars(figure.rating)}
                        </div>
                        <span class="rating-text">${figure.rating} (${figure.reviewCount} review${figure.reviewCount !== 1 ? 's' : ''})</span>
                    </div>
                ` : ''}
                <p class="card-description">${figure.description}</p>
                <div class="card-tags">
                    ${figure.achievements.slice(0, 3).map(achievement => `<span class="tag">${achievement}</span>`).join('')}
                </div>
            </div>
        </div>
    `).join('');

    // Add click handlers to new cards
    addCardClickHandlers();
}

// Render timeline
function renderTimeline() {
    const timeline = document.getElementById('timeline');
    if (!timeline) return;

    // Combine places and figures for timeline
    const timelineEvents = [
        ...appState.places.map(place => ({
            ...place,
            type: 'place',
            title: place.name,
            date: place.yearBuilt || place.period
        })),
    ].sort((a, b) => {
        // Simple sorting by extracting first year from date strings
        const getYear = (dateStr) => {
            const match = dateStr.match(/\d+/);
            return match ? parseInt(match[0]) : 0;
        };
        return getYear(a.date) - getYear(b.date);
    });

    timeline.innerHTML = timelineEvents.map((event, index) => `
        <div class="timeline-item">
            <div class="timeline-marker"></div>
            <div class="timeline-content">
                <div class="timeline-date">${event.date}</div>
                <h3 class="timeline-title">${event.title}</h3>
                <p class="timeline-description">${event.description}</p>
            </div>
        </div>
    `).join('');
}

// Add click handlers to cards
function addCardClickHandlers() {
    const cards = document.querySelectorAll('.place-card, .figure-card');
    cards.forEach(card => {
        const handleClick = () => {
            const type = card.getAttribute('data-type');
            const id = parseInt(card.getAttribute('data-id'));
            // Redirect to detail page instead of showing modal
            window.location.href = `detail.html?type=${type}&id=${id}`;
        };

        card.addEventListener('click', handleClick);
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClick();
            }
        });
    });
}

// Modal initialization
function initModal() {
    const modal = document.getElementById('modal');
    const closeBtn = document.querySelector('.modal-close');

    // Close modal handlers
    closeBtn?.addEventListener('click', () => closeModal());
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Close modal with escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            closeModal();
        }
    });
}

// Show modal with content
function showModal(type, id) {
    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modalBody');
    
    let item;
    if (type === 'place') {
        item = appState.places.find(p => p.id === id);
    } else if (type === 'figure') {
        item = appState.figures.find(f => f.id === id);
    }

    if (!item) {
        console.error(`${type} with id ${id} not found`);
        return;
    }

    modalBody.innerHTML = getModalContent(type, item);
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';

    // Focus management for accessibility
    const firstFocusable = modal.querySelector('.modal-close');
    firstFocusable?.focus();
}

// Get modal content HTML
function getModalContent(type, item) {
    if (type === 'place') {
        return `
            <img src="${item.image}" alt="${item.name}" class="modal-image">
            <h2 class="modal-title">${item.name}</h2>
            <div class="modal-subtitle">${item.period}</div>
            <p class="modal-description">${item.description}</p>
            <div class="modal-details">
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
            </div>
            <div class="card-tags">
                ${item.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
        `;
    } else if (type === 'figure') {
        return `
            <img src="${item.image}" alt="${item.name}" class="modal-image">
            <h2 class="modal-title">${item.name}</h2>
            <div class="modal-subtitle">${item.period}</div>
            <p class="modal-description">${item.description}</p>
            <div class="modal-details">
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
            </div>
            <div class="modal-details">
                <div class="detail-item" style="grid-column: 1 / -1;">
                    <div class="detail-label">Key Achievements</div>
                    <div class="detail-value">
                        <ul style="margin: 0; padding-left: 1rem;">
                            ${item.achievements.map(achievement => `<li>${achievement}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }
}

// Close modal
function closeModal() {
    const modal = document.getElementById('modal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Get empty state HTML
function getEmptyState(type) {
    if (appState.searchQuery) {
        return `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>No results found</h3>
                <p>No ${type} match your search criteria. Try different keywords or clear your search.</p>
            </div>
        `;
    }
    
    return `
        <div class="empty-state">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>No ${type} available</h3>
            <p>Historical ${type} data is currently unavailable. Please try again later.</p>
        </div>
    `;
}

// Show error message
function showError(message) {
    const sections = ['placesGrid', 'figuresGrid', 'timeline'];
    sections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) {
            section.innerHTML = `
                <div class="error">
                    <i class="fas fa-exclamation-circle" style="margin-right: 0.5rem;"></i>
                    ${message}
                </div>
            `;
        }
    });
}

// Generate star rating HTML
function generateStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        stars += i <= rating ? '<span class="star">★</span>' : '<span class="star empty">☆</span>';
    }
    return stars;
}

// Set up additional event listeners
function setupEventListeners() {
    // Hero CTA buttons
    const heroButtons = document.querySelectorAll('.hero-actions .btn');
    heroButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = btn.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Handle window resize for responsive features
    window.addEventListener('resize', () => {
        // Close mobile menu on resize to desktop
        if (window.innerWidth > 768) {
            const navMenu = document.querySelector('.nav-menu');
            const navToggle = document.querySelector('.nav-toggle');
            navMenu?.classList.remove('active');
            navToggle?.classList.remove('active');
        }
    });
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initHistoricalMacedonia();
});

// Handle page visibility change to pause/resume animations if needed
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden, could pause animations here if needed
        console.log('Page hidden');
    } else {
        // Page is visible
        console.log('Page visible');
    }
});

// const navLinks = document.querySelectorAll('.nav-link');
// navLinks.forEach(link => {
//     link.addEventListener('click', () => {
//         Array.from(document.getElementById('section-holder').children).forEach(section => {
//             section.classList.remove('active');
//         });

//         const elms = document.getElementsByClassName(link.getAttribute('data-type'));
//         if (elms.length > 0) {
//             elms[0].classList.add('active');
//         } else {
//             console.warn(`No elements found with class ${link.getAttribute('data-type')}`);
//         }
//     });
// });

// Error handling for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    event.preventDefault();
});

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});