//basic map config with custom fills, mercator projection
d3.json("./testdest.json", function(error, locations) {
  var og = { //UIUC coordinates
        latitude: 40.1105,
        longitude: -88.2284
  };

  var lat = [];
  var lon = [];
  for (var n = 0; n < locations.destinations.length; n++) {
      lat.push(locations.destinations[n].latitude);
      lon.push(locations.destinations[n].longitude);
  }

  var loc = [];
  var arc1;
  for (var i = 0; i < lat.length; i++) {
    arc1 = {
      origin: og,
      destination: {
          latitude: lat[i],
          longitude: lon[i]
      }
    };
    loc.push(arc1);
  }

  var map = new Datamap({
    scope: 'usa',
    element: document.getElementById('container1'),
    // projection: 'orthographic',
    fills: {
      defaultFill: 'rgba(0,0,0,0.3)',
      lt50: 'rgba(0,244,244,0.9)',
      gt50: 'red'
    },
    // projectionConfig: {
    //   rotation: [97,-30]
    // },
    data: {
      '071': {fillKey: 'lt50' },
      '001': {fillKey: 'gt50' }       
    }
  });

  // map.graticule();

  map.arc(loc, {
    greatArc: true,
    animationSpeed: 2000,
    arcSharpness: 5
  });
});

