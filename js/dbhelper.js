/**
 * Common database helper functions.
 */
class DBHelper {
  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337; // your server port
    return `http://localhost:${port}`;
  }

  /**
   * Get Restaurants data from IndexedDB or service.
   */
  static getRestaurants() {
    if (!this._dbPromise) {
      this._dbPromise = DBHelper.openDatabase();
    }

    // How to get Restaurants data:
    // 1. if not exists, call service request and return data
    // 2. if exists, return data from database
    // 3. then in the background call service request and update data in database
    return DBHelper.getRestaurantsFromDatabase().then(data => {
      // if database is empty then call service to get Restaurants data
      if (!data || !data.length) {
        return DBHelper.fetchRestaurants();
      } else {
        // fetch Restaurants service to update database
        DBHelper.fetchRestaurants();
        // return already retrieved data from database
        return data;
      }
    });
  }

  /**
   * Fetch all restaurants with service.
   */
  static fetchRestaurants() {
    return fetch(DBHelper.DATABASE_URL + '/restaurants').then(response => {
      if (response.ok) {
        return response.json().then(data => {
          // update IdexedDB with latest service data
          DBHelper.saveRestaurantsToDatabase(data);
          return data;
        });
      }
      return Promise.reject(new Error(`Request failed. Returned status of ${response.status}`));
    });
  }

  /**
   * Open Restaurants IndexedDB database.
   */
  static openDatabase() {
    return idb.open('restaurant-review', 1, upgradeDB => {
      // create all needed object stores for application
      upgradeDB.createObjectStore('restaurants', {
        keyPath: 'id'
      });
      upgradeDB.createObjectStore('reviews', {
        keyPath: 'restaurant_id'
      });
    });
  }

  /**
   * Save Restaurants to IndexedDB.
   * @param {Array} restaurants Array with Restaurants
   */
  static saveRestaurantsToDatabase(restaurants) {
    this._dbPromise
      .then(db => {
        const tx = db.transaction('restaurants', 'readwrite');
        const store = tx.objectStore('restaurants');
        // add Restaurants to IndexedDB
        restaurants.forEach(restaurant => {
          store.put(restaurant);
        });
        return tx.complete;
      })
      .then(() => {
        console.log('Restaurants added to IndexedDB!');
      })
      .catch(error => console.error('Error while adding Restaurants to DB', error));
  }

  /**
   * Get saved Restaurants from IndexedDB.
   */
  static getRestaurantsFromDatabase() {
    return this._dbPromise.then(function (db) {
      if (!db) return false;

      const store = db.transaction('restaurants').objectStore('restaurants');

      return store.getAll().then(function (restaurants) {
        return restaurants;
      });
    });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id) {
    // fetch all restaurants with proper error handling.
    return DBHelper.getRestaurants().then(restaurants => {
      const restaurant = restaurants.find(r => r.id == id);
      if (restaurant) {
        // Got the restaurant
        return restaurant;
      } else {
        // Restaurant does not exist in the database
        Promise.reject(new Error('Restaurant does not exist'));
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine) {
    // Fetch all restaurants  with proper error handling
    return DBHelper.getRestaurants().then(restaurants => {
      return restaurants.filter(r => r.cuisine_type === cuisine);
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood) {
    // Fetch all restaurants
    return DBHelper.getRestaurants().then(restaurants => {
      return restaurants.filter(r => r.neighborhood === neighborhood);
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood) {
    // Fetch all restaurants
    return DBHelper.getRestaurants().then(restaurants => {
      if (cuisine != 'all') {
        // filter by cuisine
        restaurants = restaurants.filter(r => r.cuisine_type === cuisine);
      }
      if (neighborhood != 'all') {
        // filter by neighborhood
        restaurants = restaurants.filter(r => r.neighborhood === neighborhood);
      }
      return restaurants;
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods() {
    // Fetch all restaurants
    return DBHelper.getRestaurants().then(restaurants => {
      // Get all neighborhoods from all restaurants
      const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
      // Remove duplicates from neighborhoods
      const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) === i);
      return uniqueNeighborhoods;
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines() {
    // Fetch all restaurants
    return DBHelper.getRestaurants().then(restaurants => {
      // Get all cuisines from all restaurants
      const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
      // Remove duplicates from cuisines
      const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) === i);
      return uniqueCuisines;
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return `./restaurant.html?id=${restaurant.id}`;
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    if (!restaurant) return '';
    // default image width
    const PHOTO_WIDTH = '400w';
    // remove at the end '.jpg' to add specific width for current case
    const photo = restaurant.photograph.replace(/\.jpg$/, '');
    return `/img/${photo}-${PHOTO_WIDTH}.jpg`;
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP
    });
    return marker;
  }

  // ******************** REVIEWS ******************** //
  /**
   * Get Reviews data from IndexedDB or service.
   */
  static getRestaurantReviews(restaurantId) {
    if (!this._dbPromise) {
      this._dbPromise = DBHelper.openDatabase();
    }

    // How to get Reviews data:
    // 1. if not exists, call service request and return data
    // 2. if exists, return data from database
    // 3. then in the background call service request and update data in database
    return DBHelper.getReviewsFromDatabase(restaurantId).then(data => {
      // if database is empty then call service to get Restaurants data
      if (!data || !data.reviews || !data.reviews.length) {
        return DBHelper.fetchRestaurantReviews(restaurantId);
      } else {
        // fetch Reviews service to update database
        DBHelper.fetchRestaurantReviews(restaurantId);
        // return already retrieved data from database
        return data.reviews;
      }
    });
  }

  /**
   * Get Restaurant Reviews from service.
   */
  static fetchRestaurantReviews(restaurantId) {
    return fetch(DBHelper.DATABASE_URL + '/reviews/?restaurant_id=' + restaurantId).then(response => {
      if (response.ok) {
        return response.json().then(data => {
          // update IdexedDB with latest service data
          DBHelper.saveReviewsToDatabase(restaurantId, data);
          return data;
        });
      }
      return Promise.reject(new Error(`Request failed. Returned status of ${response.status}`));
    });
  }

  /**
   * Save Reviews to IndexedDB.
   * @param {Array} reviews Array with Reviews
   */
  static saveReviewsToDatabase(restaurantId, reviews) {
    this._dbPromise
      .then(db => {
        const tx = db.transaction('reviews', 'readwrite');
        const store = tx.objectStore('reviews');
        // add reviews by Restaurant ID to IndexedDB
        store.put({
          restaurant_id: restaurantId,
          reviews: reviews
        });

        return tx.complete;
      })
      .then(() => {
        console.log('Reviews added to IndexedDB!');
      })
      .catch(error => console.error('Error while adding Reviews to DB', error));
  }

  /**
   * Get saved Reviews from IndexedDB.
   */
  static getReviewsFromDatabase(restaurantId) {
    return this._dbPromise.then(function (db) {
      if (!db) return false;

      const store = db.transaction('reviews').objectStore('reviews');

      return store.get(restaurantId).then(function (reviews) {
        return reviews;
      });
    });
  }

  /**
   * Save Offline Review to LocalStorage. When user is in offline mode,
   * then temporary store reviews in LocalStorage till user get back online.
   * @param {Object} review Review's object
   */
  static saveOfflineReviewLocally(review) {
    // TODO: better solution there should be to use localForage library which is async
    const key = 'offline-reviews';
    // check if exists any items
    const offlineReviews = localStorage.getItem(key);
    if (offlineReviews) {
      try {
        const reviewsJSON = JSON.parse(offlineReviews);
        reviewsJSON.push(review);
        const reviewsString = JSON.stringify(reviewsJSON);
        localStorage.setItem(key, reviewsString);
      } catch (error) {
        console.error('Error while parsing JSON: ', error);
      }
    } else {
      const reviewsJSON = [review];
      const reviewsString = JSON.stringify(reviewsJSON);
      localStorage.setItem(key, reviewsString);
    }
  }

  static saveOfflineReviewToDataBase(review) {
    // TODO: implement logic how to add only one review for restaurant into database
  }

  /**
   * Save Review to back-end.
   * @param {Object} review Review's object
   */
  static addReviewToServer(review) {
    return fetch(DBHelper.DATABASE_URL + '/reviews', {
      method: 'POST',
      body: JSON.stringify(review)
    }).then(response => {
      if (response.ok) {
        return response.json().then(data => {
          // update IdexedDB with latest service data
          // DBHelper.saveRestaurantsToDatabase(data);
          return data;
        });
      }
      return Promise.reject(new Error(`Request failed. Returned status of ${response.status}`));
    });
  }
}