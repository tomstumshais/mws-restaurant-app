/**
 * Common database helper functions.
 */
class DBHelper {
  /**
   * Database URL.
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
   * Get saved Restaurants from IndexedDB. If Restaurant's ID is passed
   * then return only asked Restaurant.
   * @param {Number} restaurantId Restaurant's ID
   */
  static getRestaurantsFromDatabase(restaurantId) {
    return this._dbPromise.then(function (db) {
      if (!db) return false;

      const store = db.transaction('restaurants').objectStore('restaurants');

      if (restaurantId) {
        return store.get(restaurantId).then(function (restaurant) {
          return restaurant;
        });
      } else {
        return store.getAll().then(function (restaurants) {
          return restaurants;
        });
      }
    });
  }

  /**
   * Fetch a restaurant by its ID.
   * @param {Number} id Restaurant's id
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
   * @param {String} cuisine Cuisine type
   */
  static fetchRestaurantByCuisine(cuisine) {
    // Fetch all restaurants  with proper error handling
    return DBHelper.getRestaurants().then(restaurants => {
      return restaurants.filter(r => r.cuisine_type === cuisine);
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   * @param {String} neighborhood Neighborhood type
   */
  static fetchRestaurantByNeighborhood(neighborhood) {
    // Fetch all restaurants
    return DBHelper.getRestaurants().then(restaurants => {
      return restaurants.filter(r => r.neighborhood === neighborhood);
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   * @param {String} cuisine Cuisine type
   * @param {String} neighborhood Neighborhood type
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
      return Promise.resolve(uniqueNeighborhoods);
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
      return Promise.resolve(uniqueCuisines);
    });
  }

  /**
   * Restaurant page URL.
   * @param {Object} restaurant Restaurant's object
   */
  static urlForRestaurant(restaurant) {
    return `./restaurant.html?id=${restaurant.id}`;
  }

  /**
   * Restaurant image URL.
   * @param {Object} restaurant Restaurant's object
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
   * @param {Object} restaurant Restaurant's object
   * @param {Object} map Map object
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
   * @param {Number} restaurantId Restaurant's ID
   */
  static getRestaurantReviews(restaurantId) {
    if (!this._dbPromise) {
      this._dbPromise = DBHelper.openDatabase();
    }

    // How to get Reviews data:
    // 1. Fetch data from Reviews service
    // 2. on success - save data to database and return those data to UI
    // 3. on error - call data from database and look if there are some data
    return DBHelper.fetchRestaurantReviews(restaurantId)
      .then((data) => {
        // data from service
        return data;
      }, (error) => {
        console.error('Restaurant Reviews service failed!', error);
        return DBHelper.getReviewsFromDatabase(restaurantId)
          .then(data => {
            // data from database
            return data.reviews;
          });
      });
  }

  /**
   * Get Restaurant Reviews from service.
   * @param {Number} restaurantId Restaurant's ID
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
   * @param {Number} restaurantId Restaurant's ID
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
   * @param {Number} restaurantId Restaurant's ID
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

        DBHelper.saveReviewObjectToDataBase(review);
      } catch (error) {
        console.error('Error while parsing JSON: ', error);
      }
    } else {
      const reviewsJSON = [review];
      const reviewsString = JSON.stringify(reviewsJSON);
      localStorage.setItem(key, reviewsString);

      DBHelper.saveReviewObjectToDataBase(review);
    }
  }

  /**
   * Save to database only by one review.
   * @param {Object} review Review's object
   */
  static saveReviewObjectToDataBase(review) {
    // get restaurant reviews from database by restaurant's id
    // push new review to this array
    // put back this object with update reviews array

    if (!review || !review.restaurant_id) return false;

    DBHelper.getReviewsFromDatabase(review.restaurant_id)
      .then((data) => {
        if (data) {
          // add review to reviews array which exists in database
          data.reviews.push(review);
        } else {
          // create new object for database
          data = {
            restaurant_id: review.restaurant_id,
            reviews: [review],
          };
        }

        DBHelper.saveReviewsToDatabase(data.restaurant_id, data.reviews);
      }, (error) => {
        console.error('Failed to get Reviews from database!', error);
      });
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
          // update database with latest data
          DBHelper.saveReviewObjectToDataBase(review);
          return data;
        });
      }
      return Promise.reject(new Error(`Request failed. Returned status of ${response.status}`));
    });
  }

  // ******************** FAVORITES ******************** //
  /**
   * Update Restaurant's favorite state.
   * @param {Number} restaurantId Restaurant's number
   * @param {Boolean} isFavorite Restaurant's favorite state
   */
  static setRestaurantFavoriteState(restaurantId, isFavorite) {
    return fetch(DBHelper.DATABASE_URL + '/restaurants/' + restaurantId + '/?is_favorite=' + isFavorite, {
      method: 'PUT'
    }).then(response => {
      if (response.ok) {
        return response.json().then(data => {
          // update database with latest data
          DBHelper.updateRestaurantFavoriteStateInDatabase(restaurantId, isFavorite);
          return data;
        });
      }
      return Promise.reject(new Error(`Request failed. Returned status of ${response.status}`));
    });
  }

  /**
   * Update Restaurant's favorite state in database.
   * @param {Number} restaurantId Restaurant's ID
   * @param {Boolean} isFavorite Favorite state
   */
  static updateRestaurantFavoriteStateInDatabase(restaurantId, isFavorite) {
    DBHelper.getRestaurantsFromDatabase(restaurantId)
      .then(
        (restaurant) => {
          if (restaurant) {
            // update favorite state
            restaurant.is_favorite = isFavorite;
            // update restaurant in database
            DBHelper.saveRestaurantsToDatabase([restaurant]);
          }
        },
        (error) => console.error('Failed to get Restaurant from database!', error)
      );
  }

  /**
   * Update Favorite data for offline mode.
   * @param {Number} restaurantId Restaurant's ID
   * @param {Boolean} isFavorite Favorite state
   */
  static saveOfflineFavoriteDataLocally(restaurantId, isFavorite) {
    // TODO: better solution there should be to use localForage library which is async
    const key = 'offline-favorite';
    // check if exists any items
    const offlineFavorite = localStorage.getItem(key);
    if (offlineFavorite) {
      try {
        const favoriteJSON = JSON.parse(offlineFavorite);

        // overwrite same restaurant's favorite state
        const selectedRestaurant = favoriteJSON.find((item) => {
          return item.restaurantId === restaurantId;
        });

        if (selectedRestaurant) {
          selectedRestaurant.isFavorite = isFavorite;
        } else {
          favoriteJSON.push({
            restaurantId,
            isFavorite,
          });
        }

        const favoriteString = JSON.stringify(favoriteJSON);
        localStorage.setItem(key, favoriteString);

        DBHelper.updateRestaurantFavoriteStateInDatabase(restaurantId, isFavorite);
      } catch (error) {
        console.error('Error while parsing JSON: ', error);
      }
    } else {
      const favoriteJSON = [{
        restaurantId,
        isFavorite,
      }];
      const favoriteString = JSON.stringify(favoriteJSON);
      localStorage.setItem(key, favoriteString);

      DBHelper.updateRestaurantFavoriteStateInDatabase(restaurantId, isFavorite);
    }
  }
}