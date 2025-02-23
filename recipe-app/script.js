document.addEventListener('DOMContentLoaded', () => {
    const recipeGrid = document.querySelector('.recipe-grid');
    let recipes = JSON.parse(localStorage.getItem('recipes')) || [
        {
            id: 1,
            title: 'Spaghetti Carbonara',
            image: 'https://via.placeholder.com/300',
            ingredients: ['Spaghetti', 'Eggs', 'Parmesan', 'Bacon'],
            process: 'Cook spaghetti, mix with eggs and cheese, add bacon.',
            time: '30 mins',
            reviews: [],
            wishlist: false
        },
        {
            id: 2,
            title: 'Chicken Curry',
            image: 'https://via.placeholder.com/300',
            ingredients: ['Chicken', 'Curry Powder', 'Coconut Milk', 'Onions'],
            process: 'Cook chicken with onions, add curry powder and coconut milk.',
            time: '45 mins',
            reviews: [],
            wishlist: false
        }
    ];
    let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];


    // Function to render recipes
    function renderRecipes() {
        recipeGrid.innerHTML = '';
        recipes.forEach(recipe => {
            const recipeCard = document.createElement('div');
            recipeCard.className = 'recipe-card';
            recipeCard.innerHTML = `
                <img src="${recipe.image}" alt="${recipe.title}">
                <h3>${recipe.title}</h3>
                <p>Time: ${recipe.time}</p>
                <div class="recipe-actions">
                    <button onclick="showRecipeDetails(${recipe.id})">View Details</button>
                    <button onclick="addToWishlist(${recipe.id})" style="background-color: ${recipe.wishlist ? '#ff6f61' : '#ffcccb'}">
                        ${recipe.wishlist ? '❤️ Added' : '❤️ Wishlist'}
                    </button>
                    <button onclick="showReviewForm(${recipe.id})">✍️ Review</button>
                </div>
            `;
            recipeGrid.appendChild(recipeCard);
        });
    }

    // Add recipe form handling
    document.getElementById('add-recipe-btn').addEventListener('click', () => {
        document.getElementById('add-recipe-form').style.display = 'flex';
    });

    document.getElementById('close-form').addEventListener('click', () => {
        document.getElementById('add-recipe-form').style.display = 'none';
    });

    document.getElementById('recipe-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const newRecipe = {
            id: Date.now(),
            title: document.getElementById('recipe-title').value,
            image: document.getElementById('recipe-image').value,
            ingredients: document.getElementById('recipe-ingredients').value.split('\n'),
            process: document.getElementById('recipe-process').value,
            time: document.getElementById('recipe-time').value,
            reviews: [],
            wishlist: false
        };
        recipes.push(newRecipe);
        localStorage.setItem('recipes', JSON.stringify(recipes));
        renderRecipes();
        document.getElementById('add-recipe-form').style.display = 'none';
        document.getElementById('recipe-form').reset();
    });


    // Function to show recipe details
    window.showRecipeDetails = (id) => {
        const recipe = recipes.find(r => r.id === id);
        if (recipe) {
            document.getElementById('detail-title').textContent = recipe.title;
            document.getElementById('detail-ingredients').innerHTML = 
                recipe.ingredients.map(ing => `<li>${ing}</li>`).join('');
            document.getElementById('detail-process').textContent = recipe.process;
            document.getElementById('detail-time').textContent = recipe.time;
            
            // Show reviews if any
            const reviewsContent = recipe.reviews.length > 0 ?
                `<h3>Reviews</h3>
                ${recipe.reviews.map(review => `
                    <div class="review">
                        <div class="rating">${'★'.repeat(review.rating)}</div>
                        <p>${review.comment}</p>
                    </div>
                `).join('')}` : '<p>No reviews yet</p>';
            
            document.getElementById('recipe-details').querySelector('.details-content').innerHTML += reviewsContent;
            document.getElementById('recipe-details').style.display = 'flex';
        }
    };

    // Close details container
    document.getElementById('close-details').addEventListener('click', () => {
        document.getElementById('recipe-details').style.display = 'none';
        // Reset reviews section
        const detailsContent = document.getElementById('recipe-details').querySelector('.details-content');
        detailsContent.innerHTML = `
            <button id="close-details" class="close-btn">&times;</button>
            <h2 id="detail-title"></h2>
            <p><strong>Ingredients:</strong></p>
            <ul id="detail-ingredients"></ul>
            <p><strong>Process:</strong></p>
            <p id="detail-process"></p>
            <p><strong>Time:</strong> <span id="detail-time"></span></p>
        `;
    });

    // Wishlist functionality
    window.addToWishlist = (id) => {
        const recipe = recipes.find(r => r.id === id);
        if (recipe) {
            recipe.wishlist = !recipe.wishlist;
            localStorage.setItem('recipes', JSON.stringify(recipes));
            renderRecipes();
        }
    };

    // Show wishlist
    document.getElementById('view-wishlist-btn').addEventListener('click', () => {
        const wishlistItems = recipes.filter(r => r.wishlist);
        const wishlistContent = document.getElementById('wishlist-items');
        wishlistContent.innerHTML = wishlistItems.length > 0 ?
            wishlistItems.map(recipe => `
                <div class="wishlist-item">
                    <h3>${recipe.title}</h3>
                    <p>Time: ${recipe.time}</p>
                </div>
            `).join('') : '<p>Your wishlist is empty</p>';
        document.getElementById('wishlist-container').style.display = 'flex';
    });

    // Close wishlist
    document.getElementById('close-wishlist').addEventListener('click', () => {
        document.getElementById('wishlist-container').style.display = 'none';
    });

    // Review functionality
    let currentRating = 0;
    window.setRating = (rating) => {
        currentRating = rating;
        const stars = document.querySelectorAll('.rating span');
        stars.forEach((star, index) => {
            star.classList.toggle('active', index < rating);
        });
    };

    window.showReviewForm = (id) => {
        document.getElementById('review-recipe-id').value = id;
        document.getElementById('review-form').style.display = 'flex';
    };

    document.getElementById('close-review').addEventListener('click', () => {
        document.getElementById('review-form').style.display = 'none';
    });

    document.getElementById('review-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const recipeId = parseInt(document.getElementById('review-recipe-id').value);
        const recipe = recipes.find(r => r.id === recipeId);
        if (recipe) {
            recipe.reviews.push({
                rating: currentRating,
                comment: document.getElementById('review-comment').value
            });
            localStorage.setItem('recipes', JSON.stringify(recipes));
            document.getElementById('review-form').style.display = 'none';
            document.getElementById('review-form').reset();
            renderRecipes();
        }
    });



    // Initial render
    renderRecipes();

    // Close forms when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('form-container') || 
            e.target.classList.contains('wishlist-container') ||
            e.target.classList.contains('recipe-details-container')) {
            e.target.style.display = 'none';
        }
    });

});
