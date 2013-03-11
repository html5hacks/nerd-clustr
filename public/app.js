$(function() {

  var initData = JSON.parse($('#data-record').html());
  var username = initData.username;

  // generate unique user id
  var userId = Math.random().toString(16).substring(2,15);
  var socket = io.connect('/');
  var map;

  var info = $('#infobox');
  var doc = $(document);

  // custom marker's icon styles
  var tinyIcon = L.Icon.extend({
    options: {
      shadowUrl: '../vendor/leaflet/assets/marker-shadow.png',
      iconSize: [25, 39],
      iconAnchor:   [12, 36],
      shadowSize: [41, 41],
      shadowAnchor: [12, 38],
      popupAnchor: [0, -30]
    }
  });

  var redIcon = new tinyIcon({ iconUrl: '../vendor/leaflet/assets/marker-red.png' });
  var orangeIcon = new tinyIcon({ iconUrl: '../vendor/leaflet/assets/marker-orange.png' });
  var blueIcon = new tinyIcon({ iconUrl: '../vendor/leaflet/assets/marker-blue.png' });
  var greenIcon = new tinyIcon({ iconUrl: '../vendor/leaflet/assets/marker-green.png' });
  var yellowIcon = new tinyIcon({ iconUrl: '../vendor/leaflet/assets/marker-yellow.png' });
  var purpleIcon = new tinyIcon({ iconUrl: '../vendor/leaflet/assets/marker-purple.png' });

  var sentData = {}
  var connects = {};
  
  var active = false;

    // Marker Clusters
  markers = new L.MarkerClusterGroup();

  socket.on('count', function (data) {
    $(".count").text(data.number);
  });

  socket.on('developer-count', function (data) {
    $(".developers-count").text(data.number);
  });

  socket.on('designers-count', function (data) {
    $(".designers-count").text(data.number);
  });

  // Set up the Markers of other users

  socket.on('load:coords', function(data) {

    console.log('load:coords');
    console.log("New User in Connects obj: " , connects)

    // check if the user is new
    // connects holds onto all user ids

    // set the marker if that instance with unique id is not present in connects object. 
    // unique id and coords were created on page load
    // BUG: so refreshing the page creates a new id and broadcasts to other users
    // Need to check for inactivity and then remove them

    if (!(data.id in connects)) {
      setMarker(data);
    }

    connects[data.id] = data;
    connects[data.id].updated = $.now(); // shorthand for (new Date).getTime()

  });

  // check whether browser supports geolocation api
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(positionSuccess, positionError, { enableHighAccuracy: true });
  } else {
    $('.map').text('Your browser is out of fashion, there\'s no geolocation!');
  }


  function positionSuccess(position) {

    console.log('positionSuccess');

    var lat = position.coords.latitude;
    var lng = position.coords.longitude;
    var acr = position.coords.accuracy;

    // mark user's position
    userMarker = L.marker([lat, lng], {
      icon: orangeIcon
    });

    map = L.map('map', {
      zoomControl: false,
      attributionControl: false
    });

    map.setView(new L.LatLng(lat, lng), 14)

    // leaflet API key tiler
    L.tileLayer('http://{s}.tile.cloudmade.com/BC9A493B41014CAABB98F0471D759707/997/256/{z}/{x}/{y}.png', { maxZoom: 18, detectRetina: true }).addTo(map);
    
    userMarker.addTo(map);
    userMarker.bindPopup(

      '<p>' + initData.nerdtype + ': ' 
      + initData.username + '</p>'

    ).openPopup();

    // NERDTYPE LEGEND

    var legend = L.control({position: 'topleft'});

    legend.onAdd = function (map) {

        var div = L.DomUtil.create('div', 'info legend'),
            types = ['You', 'Developers', 'Designers', 'Managers', 'Gamers', 'Makers'],
            colors = ['orange', 'blue', 'green', 'yellow', 'purple', 'red']
            labels = ['me', 'developer', 'designer', 'business-geek'];

        // loop through our density intervals and generate a label with a colored square for each interval
        for (var i = 0; i < types.length; i++) {
            div.innerHTML +=
                "<img style='padding: 2px 0' src='../vendor/leaflet/assets/marker-" + colors[i] +  ".png'> " +
                types[i] + (types[i] ? '<br>' : '');
        }

        return div;
    };

    legend.addTo(map);

    // SOUTH AUSTIN DUMMY DATA   

    // var markers = new L.MarkerClusterGroup();
    
    // for (var i = 0; i < addressPoints.length; i++) {
    //   console.log('add addressPoints')
    //   var a = addressPoints[i];
    //   var title = a[2];
    //   var marker = new L.Marker(new L.LatLng(a[0], a[1]), { title: title });
    //   marker.bindPopup(title);
    //   markers.addLayer(marker);
    // }

    // map.addLayer(markers);

    // END SOUTH AUSTIN DUMMY DATA  

    sentData = {
      id: userId,
      nerdtype: initData.nerdtype,
      username: initData.username,
      active: active,
      coords: [{
        lat: lat,
        lng: lng,
        acr: acr
      }]
    }

    // Send Data to all connnected clients
    socket.emit('send:coords', sentData);
  }

  function updateMarker( marker, lat, lng, label ){

    console.log('updating marker location')
    sentData = {
      id: userId,
      nerdtype: initData.nerdtype,
      username: initData.username,
      active: active,
      coords: [{
        lat: lat,
        lng: lng
      }]
    }
    
    var latlng = new L.LatLng(lat, lng);
    userMarker.setLatLng(latlng);
    
    // Send Data to all connnected clients
    socket.emit('send:coords', sentData);
  }

  var positionTimer = navigator.geolocation.watchPosition(

    function(position){
      console.log( "Newer Position Found: " + position.coords.latitude + ", " + position.coords.longitude);
      //alert( "Newer Position Found: " + position.coords.latitude + ", " + position.coords.longitude);
      updateMarker(
        userMarker,
        position.coords.latitude,
        position.coords.longitude,
        "Updated / Accurate Position"
      );  
    }
  ); 

  function setMarker(data) {

    nerdsPoints = [];
    nerdsPoints.push(data);

      for (var i = 0; i < nerdsPoints.length; i++) {

        var lat = nerdsPoints[i].coords[0].lat;
        var lng = nerdsPoints[i].coords[0].lng;
        var nerdtype = nerdsPoints[i].nerdtype;
        var username = nerdsPoints[i].username; 
        var title = nerdtype + ", " + username;

        switch(nerdtype){
          case 'developer':
            var icon = blueIcon;
          break;
          case 'designer':
            var icon = greenIcon;
          break;
          case 'manager':
            var icon = yellowIcon;
          break;
          case 'gamer':
            var icon = purpleIcon;
          break;
          case 'maker':
            var icon = redIcon;
          break;          
          default:
            var icon = purpleIcon;
        };
        
        var marker = new L.Marker(
          new L.LatLng(lat, lng), 
          { title: title, icon: icon }
        );
        
        marker.bindPopup(title);
        markers.addLayer(marker);
      }

      map.addLayer(markers);
      markers[data.id] = marker;
  };

  function positionError(error) {
    var errors = {
      1: 'Authorization fails', // permission denied
      2: 'Can\'t detect your location', //position unavailable
      3: 'Connection timeout' // timeout
    };
    showError('Error:' + errors[error.code]);
  };

  function showError(msg) {
    info.addClass('error').text(msg);
    doc.click(function() { info.removeClass('error') });
  };


});

