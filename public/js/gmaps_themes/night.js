   var gmapNightStyle = [
                    
                    //////////
                    // ALL
                    //////////
                    {
                        stylers: [
                            { hue: "#00b1ff" },
                            {invert_lightness: true}
                            
                        ]
                    },
                    
                    //////////
                    // WATER
                    //////////
                    {
                        featureType: "water",
                        stylers: [
                            { hue: "#009aff" },
                            { saturation: 75 },
                            { lightness: -64 }
                        ]
                    },
                                     
                    //////////
                    // General Landscape
                    //////////
                    
                    {
                        featureType: "administrative", // Borders color
                        elementType: "geometry",
                        stylers: [
                            { visibility: "off" }
                        ]
                    }, 
                     {
                        featureType: "administrative", // Remove borders between buildings
                        elementType: "labels",
                        stylers: [
                            
                            { hue: "#00bfff" },
                            { saturation: 38 },
                            { lightness: -50 }
                        ]
                    },
                    {
                        featureType: "administrative.province", // Remove all labels about countris, provinces, cities, ...
                        elementType: "labels",
                        stylers: [
                            { visibility: "off" }
                        ]
                    },                    
                    {
                        featureType: "landscape.man_made", 
                       stylers: [
                            
                            { hue: "#00bfff" },
                            { saturation: 48 },
                            { lightness: -5  }
                        ]
                    },
                    {
                        featureType: "landscape.natural",
                        stylers: [
                            
                            { hue: "#00bfff" },
                            { saturation: 48 },
                            { lightness: 5  }
                        ]
                    },
                    {
                        featureType: "administrative.land_parcel", // Remove borders between buildings
                        stylers: [
                            { visibility: "off" }
                        ]
                    },
                    {
                        featureType: "administrative.neighborhood", // Remove neighborhood labels
                        stylers: [
                            { visibility: "off" }
                        ]
                    },
                    {
                        featureType: "landscape.man_made",
                        elementType: "labels",
                        stylers: [
                            { visibility: "off" }
                        ]
                    },
                    
                    //////////
                    // Point Of Interest
                    //////////
         
                    {
                        featureType: "poi",
                        elementType: "geometry",
                        stylers: [
                            { hue: "#00bfff" },
                            { saturation: 18 },
                            { lightness: -99  },
                            {gamma : 4}
                        ]
                    },
                    {
                        featureType: "poi.medical",
                        elementType: "geometry",
                        stylers: [
                            { visibility: "on" },
                            { lightness: -10  }
                        ]
                    },
                    {
                        featureType: "poi.government",
                        elementType: "geometry",
                        stylers: [
                            { hue: "#00bfff" },
                            { saturation: 28 },
                            { lightness: 4  }
                        ]
                    },
                    {
                        featureType: "poi.attraction",
                        stylers: [
                            { visibility: "off" }
                        ]
                    },
                    {
                        featureType: "poi.business",
                        stylers: [
                            { visibility: "off" }
                        ]
                    },
                    {
                        featureType: "poi.government",
                        elementType: "labels",
                        stylers: [
                            { visibility: "off" }
                        ]
                    },
                    {
                        featureType: "poi.government",
                        elementType: "geometry",
                        stylers: [
                            { hue: "#00bfff" },
                            { saturation: 28 },
                            { lightness: -30  }
                        ]
                    },
                    {
                        featureType: "poi.park",
                        elementType: "labels",
                        stylers: [
                            { visibility: "off" }
                        ]
                    },
                    {
                        featureType: "poi.park",
                        elementType: "geometry",
                        stylers: [
                            { hue: "#00bfff" },
                            { saturation: 28 },
                            { lightness: -30  }
                        ]
                    },
                    {
                        featureType: "poi.place_of_worship",
                        elementType: "labels",
                        stylers: [
                            { visibility: "off" }
                        ]
                    },
                    {
                        featureType: "poi.school",
                        stylers: [
                            { visibility: "off" }
                        ]
                    },
                    {
                        featureType: "poi.sports_complex",
                        stylers: [
                            { visibility: "off" }
                        ]
                    },
                    
                   
                    //////////
                    // Roads
                    //////////

                    {
                        featureType: "road.local",
                        elementType: "labels",
                        stylers: [
                            
                            { hue: "#00bfff" },
                            { saturation: 48 },
                            { lightness: -60  }
                        ]
                    },
                    {
                        featureType: "road.local",
                        elementType: "geometry",
                        stylers: [
                            {visibility:"simplified"}
                        ]
                    },
                   
                    {
                        featureType: "road.arterial",
                        elementType: "labels",
                        stylers: [
                            
                            { hue: "#00bfff" },
                            { saturation: 28 },
                            { lightness: -60  }
                        ]
                    },
                    {
                        featureType: "road.arterial",
                        elementType: "geometry",
                        stylers: [
                            { visibility: "simplified" },
                            { hue: "#00bfff" },
                            { saturation: 28 },
                            { lightness: -70  }
                        ]
                    },
                   
                    {
                        featureType: "road.highway", // slim highways
                        elementType: "geometry",
                        stylers: [
                            { visibility: "simplified" },
                            { hue: "#00bfff" },
                            { saturation: 38 },
                            { lightness: -60  }
                        ]
                    },
                    
                    {
                        featureType: "road.highway",
                        elementType: "labels",
                        stylers: [
                            { hue: "#00bfff" },
                            { saturation: 28 },
                            { lightness: -70  }
                            
                        ]
                    },
                    
                    {
                        featureType: "transit",
                        elementType: "geometry",
                        stylers: [
                            { visibility: "off" }
                        ]
                    },
                    {
                        featureType: "transit",
                        elementType: "labels",
                        stylers: [
                            { visibility: "simplified" },
                            { hue: "#00bfff" },
                            { saturation: 18 },
                            { lightness: -50 }
                        ]
                    }
                    
                ]; // End of style array