// Firebase configuration and database management (Functional approach, no authentication)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, query, where, orderBy, doc, updateDoc, increment } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDwZ9B_XRxwee8kREQDRk0jSWsxP67rq7Y",
    authDomain: "project-int-tech.firebaseapp.com",
    databaseURL: "https://project-int-tech-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "project-int-tech",
    storageBucket: "project-int-tech.firebasestorage.app",
    messagingSenderId: "13645983462",
    appId: "1:13645983462:web:bc75696370fe56e4b75527",
    measurementId: "G-LNVZ68F33D"
};

// Initialize Firebase
let app, db;
let isFirebaseAvailable = false;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    isFirebaseAvailable = true;
    console.log('Firebase initialized successfully');
} catch (error) {
    console.log('Firebase not available, using local storage fallback');
    db = null;
    isFirebaseAvailable = false;
}

// Local storage fallback functions
function addReviewLocal(itemType, itemId, reviewData) {
    const reviews = JSON.parse(localStorage.getItem('macedonia_reviews') || '[]');
    const review = {
        id: Date.now().toString(),
        itemType,
        itemId: parseInt(itemId),
        ...reviewData,
        timestamp: new Date().toISOString(),
        helpful: 0
    };
    reviews.push(review);
    localStorage.setItem('macedonia_reviews', JSON.stringify(reviews));
    console.log('Review saved locally:', review);
    return review;
}

function getReviewsLocal(itemType, itemId) {
    const reviews = JSON.parse(localStorage.getItem('macedonia_reviews') || '[]');
    return reviews
        .filter(review => review.itemType === itemType && review.itemId === parseInt(itemId))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function markReviewHelpfulLocal(reviewId) {
    const reviews = JSON.parse(localStorage.getItem('macedonia_reviews') || '[]');
    const review = reviews.find(r => r.id === reviewId);
    if (review) {
        review.helpful++;
        localStorage.setItem('macedonia_reviews', JSON.stringify(reviews));
    }
}

function addCommentLocal(itemType, itemId, commentData) {
    const comments = JSON.parse(localStorage.getItem('macedonia_comments') || '[]');
    const comment = {
        id: Date.now().toString(),
        itemType,
        itemId: parseInt(itemId),
        ...commentData,
        timestamp: new Date().toISOString(),
        likes: 0
    };
    comments.push(comment);
    localStorage.setItem('macedonia_comments', JSON.stringify(comments));
    console.log('Comment saved locally:', comment);
    return comment;
}

function getCommentsLocal(itemType, itemId) {
    const comments = JSON.parse(localStorage.getItem('macedonia_comments') || '[]');
    return comments
        .filter(comment => comment.itemType === itemType && comment.itemId === parseInt(itemId))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function likeCommentLocal(commentId) {
    const comments = JSON.parse(localStorage.getItem('macedonia_comments') || '[]');
    const comment = comments.find(c => c.id === commentId);
    if (comment) {
        comment.likes++;
        localStorage.setItem('macedonia_comments', JSON.stringify(comments));
    }
}

// Main database functions

// Reviews functions
async function addReview(itemType, itemId, reviewData) {
    if (!isFirebaseAvailable) {
        console.warn('Firebase not available, using local storage fallback');
        return addReviewLocal(itemType, itemId, reviewData);
    }

    try {
        const review = {
            itemType,
            itemId: parseInt(itemId),
            ...reviewData,
            timestamp: new Date(),
            helpful: 0
        };
        
        const docRef = await addDoc(collection(db, 'reviews'), review);
        return { id: docRef.id, ...review };
    } catch (error) {
        console.error('Error adding review:', error);
        return addReviewLocal(itemType, itemId, reviewData);
    }
}

async function getReviews(itemType, itemId) {
    if (!isFirebaseAvailable) {
        return getReviewsLocal(itemType, itemId);
    }

    try {
        const q = query(
            collection(db, 'reviews'),
            where('itemType', '==', itemType),
            where('itemId', '==', parseInt(itemId)),
            orderBy('timestamp', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp.toDate().toISOString()
        }));
    } catch (error) {
        console.error('Error getting reviews:', error);
        return getReviewsLocal(itemType, itemId);
    }
}

async function markReviewHelpful(reviewId) {
    if (!isFirebaseAvailable) {
        return markReviewHelpfulLocal(reviewId);
    }

    try {
        const reviewRef = doc(db, 'reviews', reviewId);
        await updateDoc(reviewRef, {
            helpful: increment(1)
        });
    } catch (error) {
        console.error('Error marking review helpful:', error);
        markReviewHelpfulLocal(reviewId);
    }
}

// Comments functions
async function addComment(itemType, itemId, commentData) {
    if (!isFirebaseAvailable) {
        return addCommentLocal(itemType, itemId, commentData);
    }

    try {
        const comment = {
            itemType,
            itemId: parseInt(itemId),
            ...commentData,
            timestamp: new Date(),
            likes: 0
        };
        
        const docRef = await addDoc(collection(db, 'comments'), comment);
        return { id: docRef.id, ...comment };
    } catch (error) {
        console.error('Error adding comment:', error);
        return addCommentLocal(itemType, itemId, commentData);
    }
}

async function getComments(itemType, itemId) {
    if (!isFirebaseAvailable) {
        return getCommentsLocal(itemType, itemId);
    }

    try {
        const q = query(
            collection(db, 'comments'),
            where('itemType', '==', itemType),
            where('itemId', '==', parseInt(itemId)),
            orderBy('timestamp', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp.toDate().toISOString()
        }));
    } catch (error) {
        console.error('Error getting comments:', error);
        return getCommentsLocal(itemType, itemId);
    }
}

async function likeComment(commentId) {
    if (!isFirebaseAvailable) {
        return likeCommentLocal(commentId);
    }

    try {
        const commentRef = doc(db, 'comments', commentId);
        await updateDoc(commentRef, {
            likes: increment(1)
        });
    } catch (error) {
        console.error('Error liking comment:', error);
        likeCommentLocal(commentId);
    }
}

// Utility functions
async function getAverageRating(itemType, itemId) {
    try {
        const reviews = await getReviews(itemType, itemId);
        if (reviews.length === 0) return 0;
        const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
        return (sum / reviews.length).toFixed(1);
    } catch (error) {
        console.error('Error getting average rating:', error);
        return 0;
    }
}

async function getReviewCount(itemType, itemId) {
    try {
        const reviews = await getReviews(itemType, itemId);
        return reviews.length;
    } catch (error) {
        console.error('Error getting review count:', error);
        return 0;
    }
}

// Export all functions for use
const firebaseDb = {
    addReview,
    getReviews,
    markReviewHelpful,
    addComment,
    getComments,
    likeComment,
    getAverageRating,
    getReviewCount,
    isFirebaseAvailable
};

// Make available globally
window.firebaseDb = firebaseDb;
export default firebaseDb;