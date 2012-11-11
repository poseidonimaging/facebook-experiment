// jQuery event handlers
$(document).ready(function () {
	$("#fb-login").click(function () {
		FB.login(function(response) {
			if (response.authResponse) {
				console.log('Welcome!  Fetching your information.... ');

				$("#welcome").fadeOut("slow");
				get_locations_from_url("/me/locations?fields=place,created_time");
			} else {
				console.log('User cancelled login or did not fully authorize.');
			}
		}, { scope: "user_checkins,friends_checkins,user_status,friends_status,user_photos,friends_photos" });
	});
});

function get_locations_from_url(url) {
	console.log("get_locations_from_url called with url " + url);
	FB.api(url, function (result) {
		console.log("FB.api executed callback!");
		for (var i = 0, l = result.length; i < l; i++) {
			var $place = $("#place_template").clone().closest("li");

			$place.attr("id", "place_" + result[i].place.id);
			$place.find("h3").text(result[i].place.name);
			$place.hide(); // so we can fade it in after adding it.

			$("#places").append($place);
			$place.fadeIn("slow");
		}
	});
}

///////////////////////////////////////////////////////////////////////////////

// Facebook stuff
window.fbAsyncInit = function() {
	// init the FB JS SDK
	FB.init({
	  appId      : '167478190043137', // App ID from the App Dashboard
	  channelUrl : '//fb.restlessnapkin.com/channel.html', // Channel File for x-domain communication
	  status     : true, // check the login status upon init?
	  cookie     : true, // set sessions cookies to allow your server to access the session?
	  xfbml      : true  // parse XFBML tags on this page?
	});

	// Additional initialization code such as adding Event Listeners goes here
};

// Load the SDK's source Asynchronously
(function(d, debug){
 var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
 if (d.getElementById(id)) {return;}
 js = d.createElement('script'); js.id = id; js.async = true;
 js.src = "//connect.facebook.net/en_US/all" + (debug ? "/debug" : "") + ".js";
 ref.parentNode.insertBefore(js, ref);
}(document, /*debug*/ false));
