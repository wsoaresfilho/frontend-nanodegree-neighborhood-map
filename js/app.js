// Object containing all the data for the restaurants
var data = [
    {
        name: "Estalagem Dom João",
        id: "4d98c451647d8cfa4caff73d",
        latitude: -22.980394424391555,
        longitude: -46.525234092324915
    },
    {
        name: "Alecrim Restaurante",
        id: "4e6f70497d8bbeefd9dc7d0a",
        latitude: -22.975861,
        longitude: -46.537054
    },
    {
        name: "Oso",
        id: "56350637498e1894acf24bc2",
        latitude: -22.996208,
        longitude: -46.528551
    },
    {
        name: "Reis Restaurante",
        id: "4c5edef485a1e21e893f5d11",
        latitude: -22.981576,
        longitude: -46.529751
    },
    {
        name: "Padoka do Lago",
        id: "538bb1f5498e2936ab9b88e2",
        latitude: -22.97741427538521,
        longitude: -46.53247502532562
    },
    {
        name: "Restaurante do Rosário",
        id: "4fa3fdd6e4b0ac15cea04de2",
        latitude: -22.978782434627004,
        longitude: -46.53029793239617
    }
];

// The Place Model
var Place = function(data, index) {
    this.name = ko.observable(data.name);
    this.id = ko.observable(data.id);
    this.img = ko.observable(data.img);
    this.latitude = ko.observable(data.latitude);
    this.longitude = ko.observable(data.longitude);
    this.content = ko.observable(data.content);
    this.index = ko.observable(index);
    this.visible = ko.observable(true);
    this.highlight = ko.observable(false);
};

// ViewModel - where all the action happens
var ViewModel = function() {
    var self = this;

    self.side = ko.observable(false); // Controls the sidebar animation
    self.filter = ko.observable(""); // The filter input
    self.placeList = ko.observableArray([]); // A list with all the places

    // Open or close the sidebar
    self.toggleSidebar = function() {
        if(this.side() === false) {
            this.side(true);
        } else {
            this.side(false);
        }
    };

    // Inserting all the places from the data object into the placeList array
    data.forEach(function(place_elem, index){
        self.placeList.push(new Place(place_elem, index));
    });

    // Filters the placeList array
    self.filteredPlaceList = ko.computed(function() {
        var filter = self.filter().toLowerCase();
        var pl = self.placeList();
        for (var i = 0; i < pl.length; i++) {
            if (pl[i].name().toLowerCase().indexOf(filter) >= 0) {
                pl[i].visible(true);
                if (pl[i].marker) {
                    stopAnimations();
                    pl[i].marker.setVisible(true);
                }
            } else {
                pl[i].visible(false);
                if (pl[i].marker) {
                    pl[i].marker.setVisible(false);
                }
            }
            pl[i].highlight(false);
        }
    });

    // When clicking on a list item, do this actions
    self.selectPlace = function() {
        self.setAllDefault();
        this.highlight(true);
        selectMarker(this);
    };

    // Set all the items from the placeList to the default condition
    self.setAllDefault = function() {
        this.placeList().forEach(function(p){
            p.highlight(false);
        });
    };

};

var vm = new ViewModel();
var map;
var markers = [];
var infowindows = [];

// Show an alert if the gmaps API has an error
function noMapsAPI() {
    alert("An error occurred with the Google Maps API!");
}

// Where all the Map´s actions happens
function initMap() {
    // Create a styles array to use with the map.
    var mapstyles = [
      {
        featureType: 'water',
        stylers: [
          { color: '#19a0d8' }
        ]
      },{
        featureType: 'administrative',
        elementType: 'labels.text.stroke',
        stylers: [
          { color: '#ffffff' },
          { weight: 6 }
        ]
      },{
        featureType: 'administrative',
        elementType: 'labels.text.fill',
        stylers: [
          { color: '#e85113' }
        ]
      },{
        featureType: 'road.highway',
        elementType: 'geometry.stroke',
        stylers: [
          { color: '#efe9e4' },
          { lightness: -40 }
        ]
      },{
        featureType: 'transit.station',
        stylers: [
          { weight: 9 },
          { hue: '#e85113' }
        ]
      },{
        featureType: 'road.highway',
        elementType: 'labels.icon',
        stylers: [
          { visibility: 'off' }
        ]
      },{
        featureType: 'water',
        elementType: 'labels.text.stroke',
        stylers: [
          { lightness: 100 }
        ]
      },{
        featureType: 'water',
        elementType: 'labels.text.fill',
        stylers: [
          { lightness: -100 }
        ]
      },{
        featureType: 'poi',
        elementType: 'geometry',
        stylers: [
          { visibility: 'on' },
          { color: '#f0e4d3' }
        ]
      },{
        featureType: 'road.highway',
        elementType: 'geometry.fill',
        stylers: [
          { color: '#efe9e4' },
          { lightness: -25 }
        ]
      }
    ];
    var center = {lat: -22.991105, lng: -46.529776}; // Default center position
    map = new google.maps.Map(document.getElementById('map'), {
      center: center,
      styles: mapstyles,
      zoom: 6
    });

    var bounds = new google.maps.LatLngBounds();
    var pinImage = {
        url: "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png",
        size: new google.maps.Size(40, 37),
        origin: new google.maps.Point(0,0),
        anchor: new google.maps.Point(10, 34)
    };

    for (var i = 0; i < vm.placeList().length; i++) {
        var place = vm.placeList()[i];

        var marker = new google.maps.Marker({
            position: {lat: place.latitude(), lng: place.longitude()},
            map: map,
            animation: google.maps.Animation.DROP,
            title: place.name(),
            icon:pinImage,
            id: i
        });

        place.marker = marker;
        markers.push(marker);

        var infowindow = new google.maps.InfoWindow();
        infowindows.push(infowindow);

        marker.addListener('click', (function(m, info, p) {
            return function(){
                if (m.getAnimation() !== null) {
                    m.setAnimation(null);
                    p.highlight(false);
                } else {
                    vm.setAllDefault();
                    p.highlight(true);
                    stopAnimations();
                    m.setAnimation(google.maps.Animation.BOUNCE);
                    m.setIcon("http://maps.google.com/mapfiles/ms/micons/red-dot.png");
                    setTimeout(function() {
                        m.setAnimation(null);
                    }, 2100);
                }
                getPlaceInfos(m, p, info);
            };
        })(marker, infowindow, place));

        bounds.extend(markers[i].position);
    }

    map.fitBounds(bounds); // Use all the markers to define the bounds for the map
}

function stopAnimations() {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setIcon("http://maps.google.com/mapfiles/ms/icons/yellow-dot.png");
        markers[i].setAnimation(null);
        infowindows[i].close();
    }
}

// Simulate a click on a marker when clicking on a list item
function selectMarker(place) {
    google.maps.event.trigger(markers[place.index()], 'click');
}

// Gets infos for the infowindows using the "Foursquare API"
function getPlaceInfos(marker, place, infowin) {
    var url_preffix = "https://api.foursquare.com/v2/venues/";
    var url_suffix = "?v=20131016&client_id=I0A1TDI1XVLNXT2XQYS5NKH0QET1DEV3VYRU1RAR4HW5DT2B&client_secret=WHXDYB3APJFILYREU0RB13G4A4E5ETGCKCSLLOULVCGQRRI5";
    var title,address,phone;

    var settings = {
        url: url_preffix + place.id() + url_suffix,
        dataType: 'json',
        success: function(result) {
            var resp = result.response.venue;
            if (result.response.venue) {
                resp.name ? title = resp.name : title = "No Title Available";
                resp.location.address ? address = resp.location.address : address = "No Address Available";
                resp.contact.formattedPhone ? phone = resp.contact.formattedPhone : phone = "No Phone Available";

                setInfowindow(infowin, marker, title, address, phone);
            }
        },
        error: function () {
            console.log("There is a problem with the Foursquare API response!");
            alert("There is a problem with the Foursquare API response!");
            title = "No Title Available";
            address = "No Address Available";
            phone = "No Phone Available";

            setInfowindow(infowin, marker, title, address, phone);
        }
    };

    $.ajax(settings);
}

// Sets the infowindows contents
function setInfowindow(infowin, marker, title, address, phone) {
    infowin.marker = marker;
    infowin.setContent (
        '<h3 class="title">' + title + '</h3>' +
        '<div class="phone"><p><i class="fa fa-phone" aria-hidden="true"></i>: ' + phone + '</p></div>' +
        '<div class="address"><p><i class="fa fa-map-marker" aria-hidden="true"></i>: ' + address + '</p></div>'
    );
    infowin.open(map, marker);
    // Make sure the marker property is cleared if the infowindow is closed.
    infowin.addListener('closeclick', function() {
        infowin.marker = null;
    });
}

ko.applyBindings(vm);
