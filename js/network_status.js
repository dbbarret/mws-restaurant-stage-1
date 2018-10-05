
  window.addEventListener("load", () => {
    function handleNetworkChange(event) {
      if (navigator.onLine) {
        document.getElementById("network-status").style.display = "none";
        DBHelper.fetchAndPostTempReviews();
      } else {
        document.getElementById("network-status").style.display = "block";
      }
    }
  
    window.addEventListener("online", handleNetworkChange);
    window.addEventListener("offline", handleNetworkChange);
  });