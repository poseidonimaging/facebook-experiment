


var gmapFreshStyle = [
                    
                    //////////
                    // WATER
                    //////////
                    {
                        featureType: "water",
                        stylers: [
                            {hue: "#0096ff"},
                            {saturation: 39},
                            {lightness: -8}
                        ]
                    },
                    
                    //////////
                    // General Landscape
                    //////////
                    {
                        featureType: "landscape.man_made", // Set the ground color in cities
                        elementType: "geometry",
                        stylers: [
                            {visibility: "on"},
                            {hue: "#ff8000"},
                            {saturation: 2},
                            {lightness: -4}
                        ]
                    },
                    {
                        featureType: "administrative.land_parcel", // Remove borders between buildings
                        stylers: [
                            {visibility: "off"}
                        ]
                    },
                    {
                        featureType: "administrative.neighborhood", // Remove neighborhood labels
                        stylers: [
                            {visibility: "off"}
                        ]
                    },
                    {
                        featureType: "landscape.man_made",
                        elementType: "labels",
                        stylers: [
                            {visibility: "off"}
                        ]
                    },
                    
                    //////////
                    // Point Of Interest
                    //////////
                    {
                        featureType: "poi.park",
                        stylers: [
                            {hue: "#91ff00"},
                            {saturation: 15},
                            {lightness: 0}
                        ]
                    },
                    {
                        featureType: "poi.business",
                        stylers: [
                            {visibility: "off"}
                        ]
                    },
                    {
                        featureType: "poi.sports_complex", // Remove sport area
                        elementType: "labels",
                        stylers: [
                            {visibility: "off"}
                        ]
                    },
                    {
                        featureType: "poi.government",
                        elementType: "labels",
                        stylers: [
                            {visibility: "off"}
                        ]
                    },
                    {
                        featureType: "poi.medical",
                        elementType: "labels",
                        stylers: [
                            {visibility: "off"}
                        ]
                    },
                   
                    
                    //////////
                    // Roads
                    //////////
                    { 
                        featureType: "road", 
                        elementType: "labels",
                        stylers: [ 
                            {hue: "#000000"},
                            {saturation: -100},
                            {gamma: 2},
                            {lightness: "10"} 
                        ]},
                    
                    {
                        featureType: "road.arterial",
                        elementType: "geometry",
                        stylers: [
                            {visibility: "simplified"},
                            {saturation: 59},
                            {hue: "#00fff7"},
                            {lightness: 87},
                            {gamma: 3.82}
                        ]
                    },

                    { 
                        featureType: "road.local", 
                        elementType: "labels",
                        stylers: [ 
                            {visibility: "off"}
                            
                        ]},
                    {
                        featureType: "road.highway",
                        elementType: "geometry",
                        stylers: [
                            {visibility: "on"},
                            {saturation: 59},
                            {hue: "#00fff7"},
                            {lightness: 87},
                            {gamma: 3.82}
                        ]
                    },
                    {
                        featureType: "transit",
                        stylers: [
                            {visibility: "off"}
                        ]
                    },
                    {
                        featureType: "poi.place_of_worship",
                        elementType: "labels",
                        stylers: [
                            {visibility: "off"}
                        ]
                    }
                ]; // End of style array