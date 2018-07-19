var restaurant;
var map;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });

      // set title for all iframe elements in Google Maps container
      google.maps.event.addListenerOnce(self.map, 'idle', () => {
        const mapFrames = document.querySelectorAll('#map iframe');
        mapFrames.forEach((frame) => {
          frame.setAttribute('title', 'Google Maps');
        });
      });

      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant);
    return;
  }

  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL';
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id).then(restaurant => {
      self.restaurant = restaurant;
      fillRestaurantHTML();
      callback(null, restaurant);
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const id = restaurant.id;
  const name = document.getElementById('restaurant-name');
  name.setAttribute('aria-label', `Restaurant's name is ${restaurant.name}`);
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.setAttribute('aria-label', `Restaurant's address is ${restaurant.address}`);
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img';
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  // handle responsive images for different resolutions
  image.srcset = `
    /img/${id}-400w.jpg,
    /img/${id}-600w.jpg 1.5x,
    /img/${id}-800w.jpg 2x
  `;
  image.alt = `Picture from ${restaurant.name} restaurant`;

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.setAttribute('aria-label', `Restaurant's cuisine is ${restaurant.cuisine_type}`);
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fetch and fill UI with reviews
  fetchRestaurantReviews();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Fetch Restaurant Reviews from back-end
 */
fetchRestaurantReviews = () => {
  DBHelper.getRestaurantReviews(self.restaurant.id)
    .then((reviews) => {
      this.fillReviewsHTML(reviews);
    }, (error) => {
      console.error('Restaurant Reviews service is down: ' + error);
    });
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = []) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews.length) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }

  // add Reviews to UI
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  li.setAttribute('aria-label', 'Review item');

  const name = document.createElement('p');
  name.setAttribute('aria-label', `Reviewer's name is ${review.name}`);
  name.style.fontWeight = 'bold';
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  this.setFormattedDateForReview(review);
  date.setAttribute('aria-label', `Date of review is ${review.date}`);
  date.innerHTML = review.date;
  date.classList.add('reviews-list__date');
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.setAttribute('aria-label', `Reviewer's rating is ${review.rating}`);
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.setAttribute('aria-label', `Reviewer's comment is ${review.comments}`);
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Format Review's date to show properly in UI
 */
setFormattedDateForReview = (review) => {
  const reviewDate = new Date(review.createdAt);
  const date = ('0' + reviewDate.getDate()).slice(-2);
  const month = ('0' + (reviewDate.getMonth() + 1)).slice(-2);
  const year = reviewDate.getFullYear();

  review.date = `${date}/${month}/${year}`;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url) {
    url = window.location.href;
  }

  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`);
  const results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';

  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

/**
 * Take entered user data from 'Add Review' form and add new Review to back-end
 */
addReview = () => {
  const review = {
    restaurant_id: self.restaurant.id,
    name: document.querySelector('input[name="review-name"]').value,
    rating: document.querySelector('select[name="review-rating"]').value,
    comments: document.querySelector('textarea[name="review-comment"]').value
  };

  if (navigator.onLine) {
    // user is online, call request to save review
    DBHelper.addReviewToServer(review)
      .then((reviewObject) => {
        if (reviewObject) {
          this.addReviewToUI(reviewObject);
        }
        this.clearReviewForm();
      }, (error) => {
        console.error('Review creation service down: ' + error);
      });
  } else {
    // user is offline, store data localy
    this.storeReviewData(review);
  }
}

/**
 * Store Review data in IndexedDB while user is offline.
 */
storeReviewData = (review) => {

}

/**
 * Clear Add Review's form.
 */
clearReviewForm = () => {
  document.querySelector('input[name="review-name"]').value = '';
  document.querySelector('select[name="review-rating"]').value = 0;
  document.querySelector('textarea[name="review-comment"]').value = '';
}

/**
 * Add new Reviews to UI by one. Previously check if some review is added yet,
 * if not, then remove 'no data' text and remove first one.
 */
addReviewToUI = (review) => {
  const container = document.getElementById('reviews-container');
  const ul = document.getElementById('reviews-list');
  // check if some reviews are added yet, if not, then remove 'No data' text
  if (ul.getElementsByTagName('li').length) {
    ul.appendChild(createReviewHTML(review));
  } else {
    container.removeChild(container.lastChild);
    ul.appendChild(createReviewHTML(review));
    container.appendChild(ul);
  }
}