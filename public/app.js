$(function() {

  // TODO POSSIBILITIES
  // 
  // Add in new marker icons - based on nerdType
  // Obviously add a nerdType to profile
  // 
  // Kill listener after first set of data is passed in sendData.
  // Change the timing of the listener based on $.now() - emit
  // 
  // Show the distance from the party
  //
  // Push notification manually from Admin, or using a bot at certain time interval. 
  //
  // Colder Hotter, server side switch for distance to the party.
  // Use a distance() mehod on the client to send a command to the server that will broadcast back a NOTE based on how close you are. 

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
  var yellowIcon = new tinyIcon({ iconUrl: '../vendor/leaflet/assets/marker-yellow.png' });

  var sentData = {}
  var connects = {};
  console.log(connects)
  var markers = {};
  var active = false;

  socket.on('count', function (data) {
    $(".count").text(data.number);
  });

  socket.on('load:coords', function(data) {
    console.log('load:coords')

    // if the user is new
    // set the marker if that instance with unique id is not present in connects object. 
    // unique id and coords were created on page load - not updated - just sending 
    // the same coords as the user moves the mouse
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
      icon: redIcon
    });

    // uncomment for static debug
    //userMarker = L.marker([30.2630, 262.254], { icon: redIcon });

    // load leaflet map
    map = L.map('map', {
      center: [30.2630, 262.254],
      zoom: 15,
      zoomControl: false,
      attributionControl: false
    });

    // leaflet API key tiler
    L.tileLayer('http://{s}.tile.cloudmade.com/BC9A493B41014CAABB98F0471D759707/997/256/{z}/{x}/{y}.png', { maxZoom: 18, detectRetina: true }).addTo(map);
    
    // set map bounds
    //map.fitWorld();
    userMarker.addTo(map);
    //userMarker.bindPopup('<p>You are here! Your ID is ' + userId + '</p>').openPopup();

    //map.fitWorld();

/////////////////////////////////////////////// SOUTH AUSTIN DUMMY DATA   

    var markers = new L.MarkerClusterGroup();
    
    for (var i = 0; i < addressPoints.length; i++) {
      console.log('add addressPoints')
      var a = addressPoints[i];
      var title = a[2];
      var marker = new L.Marker(new L.LatLng(a[0], a[1]), { title: title });
      marker.bindPopup(title);
      markers.addLayer(marker);
    }

    map.addLayer(markers);

/////////////////////////////////////////////// SOUTH AUSTIN DUMMY DATA  


/////////////////////////////////////////////// MOUSE EVENTS EMITTER  

    // // set up mousemove listener to broadcast sentData object to all other connected clients 
    // var emit = $.now();
    // // send coords on when user is active
    // doc.on('mousemove', function() {
    //   active = true; 

    //   sentData = {
    //     id: userId,
    //     active: active,
    //     coords: [{
    //       lat: lat,
    //       lng: lng,
    //       acr: acr
    //     }]
    //   }

    //   //console.log("now: " + $.now());
    //   //console.log("emit: " + emit);

    //   console.log($.now() - emit);

    //   if ($.now() - emit > 10000) {
    //     socket.emit('send:coords', sentData);
    //     emit = $.now();
    //   }
    // });

/////////////////////// MANUAL INITIAL DATA EMITTER 

      sentData = {
        id: userId,
        active: active,
        coords: [{
          lat: lat,
          lng: lng,
          acr: acr
        }]
      }

    socket.emit('send:coords', sentData);

/////////////////////// MANUAL INITIAL DATA EMITTER     

  }

/////////////////////////////////////////////// MOUSE EVENTS EMITTER

  doc.bind('mouseup mouseleave', function() {
    active = false;
  });

  function updateMarker( marker, latitude, longitude, label ){

    console.log('updating marker location')

      sentData = {
        id: userId,
        active: active,
        coords: [{
          lat: latitude,
          lng: longitude,
          acr: label
        }]
      }
    
    var latlng = new L.LatLng(latitude, longitude);

    userMarker.setLatLng(latlng);

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



  ///// Marker Clusters

  markers = new L.MarkerClusterGroup();

  // showing markers for connections
  function setMarker(data) {
    console.log('setMarker');

    console.log(data);

    nerdsPoints = [];

    var nerdsPoint = [];

    nerdsPoint[0] = data.coords[0].lat;
    nerdsPoint[1] = data.coords[0].lng;
    nerdsPoint[2] = data.id;

    nerdsPoints.push(nerdsPoint);

    // for (i = 0; i < data.coords.length; i++) {
    //   var marker = L.marker([data.coords[i].lat, data.coords[i].lng], { icon: yellowIcon }).addTo(map);
    //   marker.bindPopup('<p>One more external user is here!</p>');

      for (var i = 0; i < nerdsPoints.length; i++) {
        var a = nerdsPoints[i];
        var title = a[2];
        var marker = new L.Marker(new L.LatLng(a[0], a[1]), { title: title });
        marker.bindPopup(title);
        markers.addLayer(marker);
      }

      map.addLayer(markers);
      markers[data.id] = marker;

    // var markers = new L.MarkerClusterGroup();
    
    // for (var i = 0; i < addressPoints.length; i++) {
    //   var a = addressPoints[i];
    //   var title = a[2];
    //   var marker = new L.Marker(new L.LatLng(a[0], a[1]), { title: title });
    //   marker.bindPopup(title);
    //   markers.addLayer(marker);
    // }

    // map.addLayer(markers);

    //}

  }

  // handle geolocation api errors
  function positionError(error) {
    var errors = {
      1: 'Authorization fails', // permission denied
      2: 'Can\'t detect your location', //position unavailable
      3: 'Connection timeout' // timeout
    };
    showError('Error:' + errors[error.code]);
  }

  function showError(msg) {
    info.addClass('error').text(msg);

    doc.click(function() { info.removeClass('error') });
  }

  // delete inactive users every 15 sec
  // setInterval(function() {
  //   for (ident in connects){
  //     if ($.now() - connects[ident].updated > 15000) {
  //       delete connects[ident];
  //       map.removeLayer(markers[ident]);
  //     }
  //   }
  // }, 15000);

  // var cloudmadeUrl = 'http://{s}.tile.cloudmade.com/BC9A493B41014CAABB98F0471D759707/997/256/{z}/{x}/{y}.png',
  //   cloudmadeAttribution = 'Map data &copy; 2011 OpenStreetMap contributors, Imagery &copy; 2011 CloudMade, Points &copy 2012 LINZ',
  //   cloudmade = new L.TileLayer(cloudmadeUrl, {maxZoom: 17, attribution: cloudmadeAttribution}),
  //   latlng = new L.LatLng(-37.82, 175.24);

  // var map = new L.Map('map', {center: latlng, zoom: 13, layers: [cloudmade]});

  // var markers = new L.MarkerClusterGroup();
  
  // for (var i = 0; i < addressPoints.length; i++) {
  //   var a = addressPoints[i];
  //   var title = a[2];
  //   var marker = new L.Marker(new L.LatLng(a[0], a[1]), { title: title });
  //   marker.bindPopup(title);
  //   markers.addLayer(marker);
  // }

  // map.addLayer(markers);

});

// $(document).ready(function () {

//   var socket = io.connect();

//   var map;

//   function initialize() {
//     var mapOptions = {
//       zoom: 16,
//       mapTypeId: google.maps.MapTypeId.ROADMAP
//     };
//     map = new google.maps.Map(document.getElementById('map_canvas'),
//         mapOptions);

//     // Try HTML5 geolocation
//     if(navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(function(position) {
//         var pos = new google.maps.LatLng(position.coords.latitude,
//                                          position.coords.longitude);

//         var infowindow = new google.maps.Marker({
//           map: map,
//           position: pos,
//           content: 'me'
//         });

//         map.setCenter(pos);

//         socket.emit('init', pos);
//         socket.on('message', function (data) {

//           console.log('message received')


//           var json = JSON.parse(data);    

//             if (json['type'] = "pin") {
//               console.log('type: ' + json.type);
//               console.log("TYPE PIN MESSAGE");
//               // fire an event
//               //$.deck('go', json.state);

//               console.log('create new pin:' + json.username)
//               var latlng = new google.maps.LatLng(json.lat, json.lng);
//               var markerz = new google.maps.Marker({
//                 position: latlng, 
//                 map: map 
//                 //content: data.username
//               });

//             }
            // if (json.cmd) {
            //   console.log('cmd: ' + json.cmd);
            //   console.log("CMD MESSAGE");
            //   // call deck.js api
            //   $.deck(json.cmd)
            // }
            // else if (json.clients) {
            //   console.log('clients: ' + json.clients);
            //   console.log("CLIENT NUMBER MESSAGE");   
            //   // update the DOM
            //   $('#viewers').text('viewers:' + json.clients);
            // }
            // else if (json.loc) {
            //   console.log('loc: ' + json.loc);
            //   console.log("CLIENT loc MESSAGE");  
            //   // update the DOM
            //   $('#locations').append('location: ' + json.loc +'</br>');
            // }
            // else if (json.fn) {
            //   console.log('callback fn: ' + json.fn);
            //   console.log("FIRING SERVER DEFINED CALLBACK");
            //   json.fn();
            // }


  //       });

  //     }, function() {
  //       handleNoGeolocation(true);
  //     });
  //   } else {
  //     // Browser doesn't support Geolocation
  //     handleNoGeolocation(false);
  //   }
  // }

  // function handleNoGeolocation(errorFlag) {
  //   if (errorFlag) {
  //     var content = 'Error: The Geolocation service failed.';
  //   } else {
  //     var content = 'Error: Your browser doesn\'t support geolocation.';
  //   }

  //   var options = {
  //     map: map,
  //     position: new google.maps.LatLng(60, 105),
  //     content: content
  //   };

  //   var infowindow = new google.maps.InfoWindow(options);
  //   map.setCenter(options.position);
  // }

  // google.maps.event.addDomListener(window, 'load', initialize);


  // socket.on('count', function (data) {
  //   $(".count").text(data.number);
  // });

  // function updateMarker( marker, latitude, longitude, label ){
  //   marker.setPosition(
  //     new google.maps.LatLng(
  //       latitude,
  //       longitude
  //     )
  //   );
   
  //   if (label){        
  //     marker.setTitle( label );
  //   }
  // }

  // function success(position) {
  //   latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

  //   socket.emit('init', latlng);

  //   var myOptions = {
  //     zoom: 15,
  //     center: latlng,
  //     mapTypeControl: false,
  //     navigationControlOptions: {style: google.maps.NavigationControlStyle.SMALL},
  //     mapTypeId: google.maps.MapTypeId.ROADMAP
  //   };

  //   map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);

  //   var circle = new google.maps.Circle({
  //     map:map, radius:300
  //   });

  //   circle.bindTo('center', marker, 'position');
  //   map.setCenter( new google.maps.LatLng(position.coords.latitude, position.coords.longitude));

  //   var marker = new google.maps.Marker({
  //     position: latlng, 
  //     map: map, 
  //     title:"Html5 Hacks!"
  //   });

  // }

  // function error(msg) {
  //   console.log(msg);
  // }

  // if (navigator.geolocation) {
  //   navigator.geolocation.getCurrentPosition(success, error)
  // } else {
  //   error('not supported');
  // }

  // var positionTimer = navigator.geolocation.watchPosition(
  //   function(position){
  //     console.log( "Newer Position Found" );
  //     updateMarker(
  //       marker,
  //       position.coords.latitude,
  //       position.coords.longitude,
  //       "Updated / Accurate Position"
  //     );  
  //   }
  // );  
  
// });