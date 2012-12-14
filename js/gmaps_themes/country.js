var gmapCountryStyle = [
                    
    //////////
    // WATER
    //////////
    {
        featureType: "water",
        stylers: [
        {
            hue: "#00caff"
        },
{
            saturation: 20
        },
{
            lightness: -40
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
            hue: "#0096ff"
        },
{
            saturation: 20
        },
{
            lightness: 70
        }
        ]
    },
    {
        featureType: "landscape.natural", // Set the ground color in cities
        elementType: "geometry",
        stylers: [
        {
            visibility: "on"
        },
{
            hue: "#0096ff"
        },
{
            saturation: 30
        },
{
            lightness: 45
        }
        ]
    },
    {
        featureType: "administrative.land_parcel", // Remove borders between buildings
        stylers: [
        {
            visibility: "on"
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
        featureType: "poi.park",
        stylers: [
        {
            hue: "#57ff00"
        },
{
            saturation: -30
        },
{
            lightness: -32
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
                        
        stylers: [
                            
        {
            visibility: "on"
        },
{
            hue: "#ff1b00"
        },
{
            saturation: 40
        },
{
            lightness: 10
        }
        ]
    },
    {
        featureType: "poi.school",
                        
        stylers: [
        {
            visibility: "on"
        },
{
            hue: "#ffbe00"
        },
{
            saturation: 50
        },
{
            lightness: 0
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
        {
            hue: "#000000"
        },
{
            saturation: -100
        },
{
            gamma: 2
        },
{
            visibility: "on"
        } 
        ]
    },
                    
{
        featureType: "road.arterial",
        elementType: "geometry",
        stylers: [
        {
            visibility: "simplified"
        },
{
            saturation: -100
        },
{
            hue: "#00fff7"
        },
{
            lightness: 00
        }
        ]
    },

    { 
        featureType: "road.local", 
        elementType: "geometry",
        stylers: [
        {
            visibility: "simplified"
        },
{
            saturation: -100
        },
{
            hue: "#00fff7"
        },
{
            lightness: -10
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
        {
            visibility: "simplified"
        },
{
            saturation: -100
        },
{
            hue: "#ffcc00"
        },
{
            lightness: -40
        },
{
            invert_ligthness: true
        }
        ]
    },
    {
        featureType: "road.highway",
        elementType: "labels",
        stylers: [
        {
            visibility: "simplified"
        },
{
            saturation: 70
        },
{
            hue: "#ff0e00"
        },
{
            lightness: 0
        }
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