if (navigator.serviceWorker) {
    navigator.serviceWorker.register('/sw.js').then(function(reg) {
        console.log('sw running');
    }).catch(function(error) {
        console.log('sw fail ' + error);
    })
}

