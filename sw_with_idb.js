/* importScripts("js/idb.js")  https://gwgnanodegrees.slack.com/archives/CANJJEQRY/p1533172355000152 */
importScripts("js/idb.js");

let idbPromised = idb.open('idb-restaurants', 1, function(upgradeDB){
    let keyValStore = upgradeDB.createObjectStore('keyval');
    keyValStore.put('{ name: "John Doe", age: 21 }', 'http://localhost:1337/restaurants');
});

idbPromised.then(function(db) {
    let tx = db.transaction('keyval');
    let keyValStore = tx.objectStore('keyval');
    return keyValStore.get('URL');
}).then(function(val) {
    console.log('the value of key=URL is: ' + val);
});

staticCacheName = 'rest-review-cache-04'
let resourcesToCache = [
    '/',
    '/index.html',
    '/restaurant.html',
    '/css/styles.css',
    '/js/dbhelper.js',
    '/js/restaurant_info.js',
    '/js/register.js',
    '/js/main.js',
    '/sw.js'
];

self.addEventListener('install', function(event) {
    
    console.log("install CALLED");
    event.waitUntil(
        caches.open(staticCacheName).then(function(cache) {
            return cache.addAll(resourcesToCache).catch(error => {
                console.log("failed to open cache: " + error);
            });
        })
    );
});

self.addEventListener('fetch', function(event) {
    console.log("FETCH CALLED: " + event.request.url);
    let cacheRequest = event.request;

    if (event.request.url.indexOf('1337') !== -1) {
        //hitting our restaraunt server if port 1337 in url
        console.log('hitting our restaraunt server if port 1337 in url: ' + event.request.url);
        event.respondWith(
            idbPromised.then(function(db) {
                return db.transaction('keyval')
                         .objectStore('keyval')
                         .get(event.request.url);
            })
            .then(function(jsonRV) {
                console.log('JSONRV is: ' + jsonRV);
                if (jsonRV) {
                    return jsonRV;
                } else {
                    //grab from network and put in idb
                    let jsonFromNetwork;
                    fetch(event.request)
                    .then(function(fetchResponse) {
                        idbPromised.then(function(db) {
                            jsonFromNetwork = fetchResponse.json().value;
                            db.transaction('keyval','readwrite')
                              .objectStore('keyval')
                              .put(jsonFromNetwork, event.request.url.value);
                        })

                        return jsonFromNetwork;
                    })
                    .catch(function(error) {
                        return new Response("something went wrong", {
                            status: 404,
                            statusText: "something went wrong"
                        });
                    })
                }
            }).then(function(resp) {
                return new Response(JSON.stringify(resp));
            })
        ); //END respondWith
    } else {
        console.log('not for idb, use old cache code instead: ' + event.request.url);
        event.respondWith( 
            caches.match(cacheRequest).then(function(response) {
                return (
                response || 
                fetch(event.request)
                    .then(function(fetchResponse) {
                        return caches.open(staticCacheName).then(function(cache) {
                            cache.put(event.request, fetchResponse.clone());
                            console.log("item placed in cache: " + event.request.url);
                            return fetchResponse;
                        });
                })
                .catch(function(error) {
                return new Response("something went wrong", {
                    status: 404,
                    statusText: "something went wrong"
                });
    
                })
            );
        })); 
    }
    
    
});