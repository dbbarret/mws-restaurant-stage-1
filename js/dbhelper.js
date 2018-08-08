
/*
let idbPromised = idb.open('idb-restaurants', 1, function(upgradeDB){
  let keyValStore = upgradeDB.createObjectStore('keyval');
  keyValStore.put(restJSON, 'http://localhost:1337/restaurants');
});

idbPromised.then(function(db) {
  let tx = db.transaction('keyval');
  let keyValStore = tx.objectStore('keyval');
  return keyValStore.get('http://localhost:1337/restaurants');
}).then(function(val) {
  console.log('the value of key=URL is: ' + val);
});
*/


/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants from node server.
   */
  static get DATABASE_URL() {
    const port = 1337 // SAILS must be running in restaraunt server: run via C:\Users\dbbarret\Documents\GitHub\GrowWithGoogle\mws-restaurant-stage-2>node server
    return `http://localhost:${port}/restaurants`;
  }


  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    //open the idb and create objstore if it doesn't exist
    const idbPromised = idb.open('idb-restaurants', 1, upgradeDB => {
      if (!upgradeDB.objectStoreNames.contains('restaurants-object-store')) {
        const objStore = upgradeDB.createObjectStore('restaurants-object-store', {
          keyPath: 'id'
        });
      }
    });

    //get the data from the objstore
    idbPromised.then(db => {
      const trans = db.transaction('restaurants-object-store', 'readonly');
      const objStore = trans.objectStore('restaurants-object-store');
      return objStore.getAll(); //need to store each rest by id for this to work!!
    }).then(restaurants => {
      if (restaurants.length !== 0) { //we have data!
        callback(null, restaurants);
      } else {  //we don't have data - go to server
        DBHelper.fetchRestaurantsFromServer(callback);
      }
    })
      .catch(error => {
        callback(error, null);
      });

  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurantsFromServer(callback) {
    let fetchcall = DBHelper.DATABASE_URL;

    //if (rest_num) fetchcall = fetchcall + '/rest_num';
    console.log('Calling fetchcall = ' + fetchcall);
    fetch(fetchcall).then(resp => {
      resp.json().then(jsonrestlist => {
        DBHelper.storeRestarauntsIDB(jsonrestlist); //save to idb!!
        callback(null, jsonrestlist);
      });
    }).catch(e => {
      callback('something bad happened in fetchRestaurantsFromServer', null);
    });

  }


  /**
   * Store Restaurants in idb.
   */
  static storeRestarauntsIDB(json) {
    
    //open the idb and create objstore if it doesn't exist
    const idbPromised = idb.open('idb-restaurants', 1, upgradeDB => {
      if (!upgradeDB.objectStoreNames.contains('restaurants-object-store')) {
        const objStore = upgradeDB.createObjectStore('restaurants-object-store', {
          keyPath: 'id'
        });
      }
    });

    idbPromised.then(db => {
      const trans = db.transaction('restaurants-object-store', 'readwrite');
      const objStore = trans.objectStore('restaurants-object-store');
      json.forEach(j => {
        objStore.put(j);
        return trans.complete;
      });
    });
  }


  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph}.jpg`);
  }

  /**
   * Small restaurant image URL.
   */
  static smallImageUrlForRestaurant(restaurant) {
    return (`/img/small/${restaurant.photograph}.jpg`);
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
    }
    );
    return marker;
  }

}
