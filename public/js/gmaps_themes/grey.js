var gmapGreyStyle = [
                    
//////////
// WATER
//////////
{
    featureType: "water",
    stylers: [
    {
        hue: "#ff0000"
    },
    {
        saturation: -100
    },
    {
        lightness: 20
    }
    ]
},
                    
//////////
// General Landscape
//////////
{
    featureType: "landscape.man_made", // Set the ground color in cities
    elementType: "geometry",
    stylers: [
    {
        visibility: "on"
    },
    {
        hue: "#ff0000"
    },
    {
        saturation: -100
    },
    {
        lightness: 1
    }
    ]
},
{
    featureType: "landscape.natural",
    elementType: "geometry",
    stylers: [
    {
        visibility: "on"
    },
    {
        hue: "#ff0000"
    },
    {
        saturation: -100
    },
    {lightness: -1}
    ]
},
{
    featureType: "administrative", // Remove neighborhood labels
    elementType: "labels",
     stylers: [
    {hue: "#ff0000"},
    {saturation: -100},
    {lightness: 30}
    ]
},
{
    featureType: "administrative.land_parcel", // Remove borders between buildings
    stylers: [
    {
        visibility: "off"
    }
    ]
},
{
    featureType: "administrative.neighborhood", // Remove neighborhood labels
    stylers: [
    {
        visibility: "off"
    }
    ]
},
{
    featureType: "landscape.man_made",
    elementType: "labels",
    stylers: [
    {
        visibility: "off"
    }
    ]
},
                    
//////////
// Point Of Interest
//////////
{
    featureType: "poi",
    elementType: "geometry",
    stylers: [
    {
        hue: "#ff0000"
    },
    {
        saturation: -100
    },
    {
        lightness: 70
    }
    ]
},
                    
{
    featureType: "poi",
    elementType: "labels",
    stylers: [
                            
    {
        saturation: -100
    },
    {
        lightness: 20
    }
    ]
},
{
    featureType: "poi.business",
    stylers: [
    {
        visibility: "off"
    }
    ]
},
{
    featureType: "poi.sports_complex", // Remove sport area
    elementType: "labels",
    stylers: [
    {
        visibility: "off"
    }
    ]
},
{
    featureType: "poi.government",
    elementType: "labels",
    stylers: [
    {
        visibility: "off"
    }
    ]
},
{
    featureType: "poi.medical",
    elementType: "labels",
    stylers: [
    {
        visibility: "off"
    }
    ]
},
                   
                    
//////////
// Roads
//////////
{ 
    featureType: "road", 
    elementType: "labels",
    stylers: [
    { saturation: -100 },
    { hue: "#00fff7"},
    { lightness: 40}
    ]
},
                    
{
    featureType: "road.arterial",
    elementType: "geometry",
    stylers: [
    { visibility: "simplified" },
    { saturation: -100 },
    { hue: "#00fff7"},
    { lightness: 10}
    ]
},

{ 
    featureType: "road.local", 
    elementType: "geometry",
    stylers: [ 
    {
        visibility: "simpliefied"
    }
                            
    ]
},
{ 
    featureType: "road.local", 
    elementType: "labels",
    stylers: [ 
    {
        visibility: "off"
    }
                            
    ]
},
{
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [
    { visibility: "simplified" },
    { saturation: -100 },
    { hue: "#00fff7"},
    { lightness: 40}
    ]
},
{
    featureType: "transit",
    stylers: [
    {
        visibility: "off"
    }
    ]
},
{
    featureType: "poi.place_of_worship",
    elementType: "labels",
    stylers: [
    {
        visibility: "off"
    }
    ]
}
] // End of style array

