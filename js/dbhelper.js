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
    return `http://localhost:${port}/restaurants`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants() {
    this._dbPromise = DBHelper.openDatabase();

    // TODO:
    // 1. if exists, show restaurants from db
    // 2. call service request to get latest restaurants
    // 3. save latest restaurants to db
    DBHelper.showRestaurantsFromDatabase().then(data => {
      // get all Restaurants from database
      console.log(data);
    });

    return fetch(DBHelper.DATABASE_URL).then(response => {
      if (response.ok) {
        return response.json().then(data => {
          // Restaurants which came from back-end save to IndexedDB
          DBHelper.saveRestaurantsToDatabase(data);
          // return restaurants data
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
      const store = upgradeDB.createObjectStore('restaurants', {
        keyPath: 'id'
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
   * Show Restaurants which were saved in IndexedDB.
   */
  static showRestaurantsFromDatabase() {
    return this._dbPromise.then(function(db) {
      // if we're already showing posts, eg shift-refresh
      // or the very first load, there's no point fetching
      // posts from IDB
      if (!db) return false;

      const store = db.transaction('restaurants').objectStore('restaurants');

      return store.getAll().then(function(restaurants) {
        return restaurants;
      });
    });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id) {
    // fetch all restaurants with proper error handling.
    return DBHelper.fetchRestaurants().then(restaurants => {
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
    return DBHelper.fetchRestaurants().then(restaurants => {
      return restaurants.filter(r => r.cuisine_type === cuisine);
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood) {
    // Fetch all restaurants
    return DBHelper.fetchRestaurants().then(restaurants => {
      return restaurants.filter(r => r.neighborhood === neighborhood);
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood) {
    // Fetch all restaurants
    return DBHelper.fetchRestaurants().then(restaurants => {
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
    return DBHelper.fetchRestaurants().then(restaurants => {
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
    return DBHelper.fetchRestaurants().then(restaurants => {
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
}
