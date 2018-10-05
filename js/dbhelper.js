
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
   * Reviews URL
   */
  static get REVIEWS_URL() {
    const port = 1337;
    //return `http://localhost:${port}/reviews/?restaurant_id=`;
    return `http://localhost:${port}/reviews/`;
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
      //console.log(json);
      json.forEach(j => {
        objStore.put(j);
      });
      
      return trans.complete;
    });
  }

  /**
   * Set is_favorite on restaurant
   */
  static setFavorite(restaurant_id, setAsFav) {
    let id_num = restaurant_id.split("_");
    DBHelper.fetchRestaurants((error, restaurants) => {
      const restaurant = restaurants.find(r => r.id == id_num[1]);
      restaurant.is_favorite = setAsFav;
      DBHelper.storeRestarauntsIDB(restaurants);
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

  //TODO: REVIEWS

   /**
   * Fetch all reviews.
   */
  static fetchReviews(id, callback) {
    //open the idb and create objstore if it doesn't exist
    const idbPromised = idb.open('idb-reviews', 1, upgradeDB => {
      if (!upgradeDB.objectStoreNames.contains('reviews-object-store')) {
        const objStore = upgradeDB.createObjectStore('reviews-object-store', {
          keyPath: 'id', autoIncrement: true
        });
        objStore.createIndex('restaurant_id', 'restaurant_id', { unique: false });
      }
    });

    //get the data from the objstore
    idbPromised.then(db => {
      const trans = db.transaction('reviews-object-store', 'readonly');
      const objStore = trans.objectStore('reviews-object-store');
      let restaurantIndex = objStore.index('restaurant_id');
      let reviews = restaurantIndex.getAll(parseInt(id)); //need to store each review by rest_id for this to work!!
      return reviews;
    }).then(reviews => {
      if (reviews.length !== 0) { //we have data!
        callback(null, reviews);
      } else {  //we don't have data - go to server
        DBHelper.fetchReviewsFromServer(callback);
      }
    })
      .catch(error => {
        callback(error, null);
      });

  }

  /**
   * Fetch all reviews.
   */
  static fetchReviewsFromServer(callback) {
    let fetchcall = DBHelper.REVIEWS_URL;

    console.log('Calling fetchcall = ' + fetchcall);
    fetch(fetchcall).then(resp => {
      resp.json().then(jsonrestlist => {
        DBHelper.storeReviewsIDB(jsonrestlist); //save to idb!!
        callback(null, jsonrestlist);
      });
    }).catch(e => {
      callback('something bad happened in fetchreviewsFromServer', null);
    });

  }


  /**
   * Fetch a review by its ID.
   */
  static fetchReviewById(id, callback) {
    // fetch all reviews with proper error handling.
    DBHelper.fetchReviews(id, (error, reviews) => {
      if (error) {
        callback(error, null);
      } else {
        if (reviews) { // Got the reviews
          callback(null, reviews);
        } else { // review does not exist in the database
          callback('review does not exist', null);
        }
      }
    });
  }

  /**
   * Store Reviews in idb.
   */
  static storeReviewsIDB(json) {
    
    //open the idb and create objstore if it doesn't exist
    const idbPromised = idb.open('idb-reviews', 1, upgradeDB => {
      if (!upgradeDB.objectStoreNames.contains('reviews-object-store')) {
        const objStore = upgradeDB.createObjectStore('reviews-object-store', {
          keyPath: 'id', autoIncrement: true
        });
        objStore.createIndex('restaurant_id', 'restaurant_id', { unique: false });
      }
    });

    idbPromised.then(db => {
      const trans = db.transaction('reviews-object-store', 'readwrite');
      const objStore = trans.objectStore('reviews-object-store');
      //console.log(json);
      json.forEach(j => {
        objStore.put(j);
      });
      
      return trans.complete;
    });
  }

  /**
   * Store submitted review
   */
  static storeSubmittedReviewIDB(rev) {
    
    //open the idb and create objstore if it doesn't exist
    const idbPromised = idb.open('idb-reviews', 1, upgradeDB => {
      if (!upgradeDB.objectStoreNames.contains('reviews-object-store')) {
        const objStore = upgradeDB.createObjectStore('reviews-object-store', {
          keyPath: 'id', autoIncrement: true
        });
        objStore.createIndex('restaurant_id', 'restaurant_id', { unique: false });
      }
    });

    idbPromised.then(db => {
      const trans = db.transaction('reviews-object-store', 'readwrite');
      const objStore = trans.objectStore('reviews-object-store');

      objStore.put(rev);
      
      return trans.complete;
    });
  }

  
  /**
   * Store OFFLINE submitted review
   */
  static storeSubmittedReviewIDBOffline(rev) {
    
    //open the idb and create objstore if it doesn't exist
    const idbPromised = idb.open('idb-reviews-temp', 1, upgradeDB => {
      if (!upgradeDB.objectStoreNames.contains('reviews-temp-object-store')) {
        const objStore = upgradeDB.createObjectStore('reviews-temp-object-store', {
          keyPath: 'id', autoIncrement: true
        });
      }
    });

    idbPromised.then(db => {
      const trans = db.transaction('reviews-temp-object-store', 'readwrite');
      const objStore = trans.objectStore('reviews-temp-object-store');


        objStore.put(rev);

      
      return trans.complete;
    });
  }

  /**
   * POST new review to server
   */
  static postReviewToServer(new_review, callback = () => null) {
    fetch(DBHelper.REVIEWS_URL, {
      method: 'POST',
      cache: "no-cache",
      body: JSON.stringify(new_review),
      headers:{ 'Content-Type': 'application/json' }
    })
    .then(review => callback(null, review))
    .catch(error => {
      callback(error, null); 
    });
  }

   /**
   * Fetch all temp reviews.
   */
  static fetchAndPostTempReviews(callback) {
    console.log('in fetchAndPostTempReviews');
    //open the idb and create objstore if it doesn't exist
    const idbPromised = idb.open('idb-reviews-temp', 1, upgradeDB => {
      if (!upgradeDB.objectStoreNames.contains('reviews-temp-object-store')) {
        const objStore = upgradeDB.createObjectStore('reviews-temp-object-store', {
          keyPath: 'id', autoIncrement: true
        });
      }
    });

    //get the data from the objstore
    idbPromised.then(db => {
      const trans = db.transaction('reviews-temp-object-store', 'readwrite');
      const objStore = trans.objectStore('reviews-temp-object-store');
      let reviews = objStore.getAll(); 
      objStore.clear(); 
      return reviews;
    }).then(reviews => {
      if (reviews.length !== 0) { //we have data!
        reviews.forEach(r => {
          DBHelper.postReviewToServer(r);
        });
        console.log(reviews);
      }
    })
      .catch(error => {
        console.log(error);
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
