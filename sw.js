staticCacheName = 'rest-review-cache-04'
let resourcesToCache = [
    '/',
    '/index.html',
    '/restaurant.html',
    '/css/styles.css',
    '/data/restaurants.json',
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
    console.log("FETCH CALLED: " + event.request);
    let cacheRequest = event.request;

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
});