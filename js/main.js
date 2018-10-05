let restaurants,
  neighborhoods,
  cuisines
var map
var markers = []

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
}

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  li.append(name);

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.src = DBHelper.smallImageUrlForRestaurant(restaurant);
  image.alt='photograph of ' + restaurant.name + ' restaurant'
  li.append(image);

  const neighborhood = document.createElement('div');
  neighborhood.innerHTML = restaurant.neighborhood;
  neighborhood.className = 'neighborhood';
  li.append(neighborhood);

  const address = document.createElement('div');
  address.className = 'restaurant-address'
  address.innerHTML = restaurant.address;
  li.append(address);

 
  const button_container = document.createElement('div');
  button_container.setAttribute('class', 'button_container');
  li.append(button_container);
  

  const more = document.createElement('button');
  more.innerHTML = 'View Details';
  more.onclick = function() { location.href = DBHelper.urlForRestaurant(restaurant); }
  button_container.append(more)

  
  const favorite = document.createElement('i');
  favorite.setAttribute('id', `restaurant_${restaurant.id}`);
  let heart_class;
  
  //need to handle bad data on is_favorite in JSON false vs "false"
  let isfav = undefined;
  if (restaurant.is_favorite === "true")  isfav = true;
  if (restaurant.is_favorite === "false") isfav = false;
  if (typeof isfav == "undefined") isfav = restaurant.is_favorite; //now it is not the text versions so set it to the bool val
  if (isfav) {
    heart_class = 'fas fa-heart favorited';
    favorite.setAttribute('aria-label', `Clear favorite from ${restaurant.name} restaurant`);
  } else {
    heart_class = 'fas fa-heart not_favorited';
    favorite.setAttribute('aria-label', `Set favorite on ${restaurant.name} restaurant`);
  }
  
  favorite.setAttribute('class', heart_class);
  //favorite.setAttribute('tabindex', '0');
  favorite.setAttribute('role', 'button');

  favorite.addEventListener('click', () => {
    const restaurant_id = favorite.getAttribute('id');

      const element = document.getElementById(restaurant_id);
      const setAsFav = element.classList.contains('not_favorited');
      element.classList.toggle('not_favorited');
      element.classList.toggle('favorited');
      if (setAsFav) {
        element.setAttribute('aria-label', `Clear favorite from ${restaurant.name} restaurant`);
      } else {
        element.setAttribute('aria-label', `Set favorite on ${restaurant.name} restaurant`);
      }
    
      DBHelper.setFavorite(restaurant_id, setAsFav);
    

    
  });

  button_container.append(favorite);

 
  return li
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
}


  
