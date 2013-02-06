$(document).ready(function () {

var socket = io.connect();

socket.on('init',function(msg){
  //alert(msg.msg)

  // var mapOptions = {
  //   center: new google.maps.LatLng(30.2630, 262.254),
  //   zoom: 15,
  //   mapTypeId: google.maps.MapTypeId.ROADMAP
  // };
  // var map = new google.maps.Map(document.getElementById("map_canvas"),
  //     mapOptions);



      function updateMarker( marker, latitude, longitude, label ){

        marker.setPosition(
          new google.maps.LatLng(
            latitude,
            longitude
          )
        );
       
        if (label){        
          marker.setTitle( label );
        }
      }


    function success(position) {
      
      var latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

      var myOptions = {
        zoom: 15,
        center: latlng,
        mapTypeControl: false,
        navigationControlOptions: {style: google.maps.NavigationControlStyle.SMALL},
        mapTypeId: google.maps.MapTypeId.ROADMAP
      };

      var map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
      
      marker = new google.maps.Marker({
          position: latlng, 
          map: map, 
          title:"Html5 Hacks!"
      });

        var circle = new google.maps.Circle({
            map:map, radius:300
          });

          circle.bindTo('center', marker, 'position');

        map.setCenter( new google.maps.LatLng(position.coords.latitude, position.coords.longitude));

    }

    function error(msg) {
      console.log(msg);
    }


    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(success, error)
    } else {
      error('not supported');
    }

    var positionTimer = navigator.geolocation.watchPosition(
      function(position){
       
        console.log( "Newer Position Found" );
       
        updateMarker(
          marker,
          position.coords.latitude,
          position.coords.longitude,
          "Updated / Accurate Position"
        );  
      }
    );




  
})

  // testObj = {name: "test"}
  // socket.emit('msg', testObj);

  // socket.on('count', function (data) {
  //   //console.log(data.number);
  //   //socket.emit('my other event', { my: 'data' });
  //   //$(".number").text(data.number);

  //   // here we can also generate canvas circles
  //   // and fade in opacity

  // });



  
});