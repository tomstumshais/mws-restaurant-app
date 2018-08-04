let restaurants;
let neighborhoods;
let cuisines;
var map;
var markers = [];

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener("DOMContentLoaded", (event) => {
  registerServiceWorker();

  const neighborhoodsPromise = DBHelper.fetchNeighborhoods();
  const cuisinesPromise = DBHelper.fetchCuisines();

  // get necessary data for Restaurant load
  Promise.all([neighborhoodsPromise, cuisinesPromise])
    .then((values) => {
      self.neighborhoods = values[0]; // neighborhoods
      self.cuisines = values[1]; // cuisines
      fillCuisinesHTML();
      fillNeighborhoodsHTML();

      updateRestaurants();
    });
});

/**
 * Register Service Worker.
 */
registerServiceWorker = () => {
  if (!navigator.serviceWorker) return;

  navigator.serviceWorker
    .register("/sw.js")
    .then(() => {
      console.log("Service Worker registered!");
    })
    .catch(() => {
      console.log("Error while registering Service Worker!");
    });
};

/**
 * Set neighborhoods HTML.
 * @param {String} neighborhoods Neighborhoods type
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById("neighborhoods-select");
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement("option");
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
};

/**
 * Set cuisines HTML.
 * @param {String} cuisines Cuisines type
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById("cuisines-select");

  cuisines.forEach(cuisine => {
    const option = document.createElement("option");
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
};

/**
 * Initialize Google map on button click.
 */
initializeMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };

  self.map = new google.maps.Map(document.getElementById("map"), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });

  // set title for all iframe elements in Google Maps container
  google.maps.event.addListenerOnce(self.map, "idle", () => {
    const mapFrames = document.querySelectorAll("#map iframe");
    mapFrames.forEach(frame => {
      frame.setAttribute("title", "Google Maps");
    });
  });

  addMarkersToMap();
};

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById("cuisines-select");
  const nSelect = document.getElementById("neighborhoods-select");

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood).then(restaurants => {
    resetRestaurants(restaurants);
    fillRestaurantsHTML();
  });
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 * @param {Array} restaurants Array of Restaurants
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById("restaurants-list");
  ul.innerHTML = "";

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 * @param {Array} restaurants Array of Restaurants
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById("restaurants-list");
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
};

/**
 * Create restaurant HTML.
 * @param {Object} restaurant Restaurant's object
 */
createRestaurantHTML = restaurant => {
  const id = restaurant.id;
  const li = document.createElement("li");
  li.setAttribute("aria-label", `List item for ${restaurant.name} restaurant`);

  const image = document.createElement("img");
  image.className = "restaurant-img";
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  // handle responsive images for different resolutions
  image.srcset = `
    /img/${id}-300w.jpg,
    /img/${id}-600w.jpg 2x
  `;
  image.alt = `Picture from ${restaurant.name} restaurant`;
  li.append(image);

  const name = document.createElement("h2");
  name.setAttribute("aria-label", `Restaurant name is ${restaurant.name}`);
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement("p");
  neighborhood.setAttribute(
    "aria-label",
    `Restaurant neighborhood is ${restaurant.neighborhood}`
  );
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement("p");
  address.setAttribute(
    "aria-label",
    `Restaurant address is ${restaurant.address}`
  );
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement("a");
  more.innerHTML = "View Details";
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more);

  return li;
};

/**
 * Add markers for current restaurants to the map.
 * @param {Array} restaurants Array of Restaurants
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, "click", () => {
      window.location.href = marker.url;
    });
    self.markers.push(marker);
  });
};