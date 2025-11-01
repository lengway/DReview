document.addEventListener('DOMContentLoaded', function () {
  const reviewsList = document.getElementById('reviews-list');
  const loadMoreBtn = document.getElementById('load-more-btn');
  const reviewCountElement = document.getElementById('review-count');

  let allReviews = [];
  let currentIndex = 0;
  const reviewsPerLoad = 3;

  // --- Основная логика ---
  fetch('../../../data/reviews.json')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
      }
      return response.json();
    })
    .then(data => {
      allReviews = data;
      updateTotalReviewCount();
      loadMoreReviews();
    })
    .catch(error => {
      console.error('Error fetching reviews:', error);
      reviewsList.innerHTML = '<p>Failed to load reviews.</p>';
    });

  loadMoreBtn.addEventListener('click', loadMoreReviews);

  function loadMoreReviews() {
    const reviewsToLoad = allReviews.slice(currentIndex, currentIndex + reviewsPerLoad);
    renderReviews(reviewsToLoad);
    currentIndex += reviewsPerLoad;

    if (currentIndex >= allReviews.length) {
      loadMoreBtn.style.display = 'none';
    }
  }

  function renderReviews(reviews) {
    if (!reviews.length) return;

    reviews.forEach((review, index) => {
      const reviewText = review.text;
      const showReadMore = reviewText.length > 200;

      const visibleText = showReadMore ? reviewText.substring(0, 200) : reviewText;
      const hiddenText = showReadMore ? reviewText.substring(200) : '';

      const reviewHTML = `
        <article class="review-item">
        <div class="avatar">
          <img src="${review.avatar}" alt="${review.author} avatar">
        </div>
          <div class="review-text-content">
            <strong>${review.author}</strong>
            <small style="color:var(--muted);"> · ${review.date}</small>
            <div class="review-body">
                <p class="review-paragraph">
                    ${visibleText}<span class="more-text">${hiddenText}</span>
                </p>
                ${showReadMore ? `<button class="btn read-more-btn">Read more</button>` : ''}
            </div>
          </div>
          <div class="rating">
            <small class="star">&#9733;</small>
            <small class="star">&#9733;</small>
            <small class="star">&#9733;</small>
            <small class="star">&#9733;</small>
            <small class="star">&#9733;</small>
          </div>
        </article>
      `;

      reviewsList.insertAdjacentHTML('beforeend', reviewHTML);

      const newReview = reviewsList.lastElementChild;
      setTimeout(() => {
        newReview.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        newReview.style.opacity = '1';
        newReview.style.transform = 'translateY(0)';
      }, index * 100);
    });

    setupReadMoreListeners();
  }

  function setupReadMoreListeners() {
    const newButtons = reviewsList.querySelectorAll('.read-more-btn:not(.listener-attached)');

    newButtons.forEach(button => {
      button.classList.add('listener-attached');

      button.addEventListener('click', function (e) {
        e.preventDefault();
        const reviewBody = e.target.closest('.review-body');
        const moreText = reviewBody.querySelector('.more-text');

        if (moreText) {
          const isExpanded = moreText.classList.contains('expanded');

          if (!isExpanded) {
            moreText.style.display = 'inline';

            setTimeout(() => {
              moreText.classList.add('expanded');
            }, 10);
            // Раскрываем
            e.target.textContent = 'Hide';
          } else {
            // Скрываем
            moreText.classList.remove('expanded');
            e.target.textContent = 'Read more';

            setTimeout(() => {
              moreText.style.display = 'none';
            }, 100);
          }
        }
      });
    });
    
    setupStarListeners();
  }

  function setupStarListeners() {
    const newRatings = reviewsList.querySelectorAll('.rating:not(.listener-attached)');
    
    newRatings.forEach(rating => {
      rating.classList.add('listener-attached');
      const stars = rating.querySelectorAll('.star');
      
      stars.forEach((star, index) => {
        star.addEventListener('click', () => {
          stars.forEach(s => s.classList.remove('active'));
          
          for (let i = 0; i <= index; i++) {
            stars[i].classList.add('active');
          }
        });
      });
    });
  }

  function updateTotalReviewCount() {
    if (reviewCountElement) {
      reviewCountElement.textContent = allReviews.length;
    }
  }
});