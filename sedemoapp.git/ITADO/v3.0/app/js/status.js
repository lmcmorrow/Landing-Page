var statusElem = document.getElementById('status')
setInterval(function () {
  statusElem.className = navigator.onLine ? 'online label label-success' : 'offline label label-info';
  statusElem.innerHTML = navigator.onLine ? 'online' : 'offline';
}, 250)
