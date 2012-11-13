// Global variables because I'm lazy.
var fb_current_user_id;

// jQuery event handlers
$(document).ready(function () {
	$("#fb-login").click(function () {
		FB.login(function(response) {
			if (response.authResponse) {
				fb_current_user_id = response.authResponse.userID;

				$("#welcome").fadeOut("slow");
				get_locations_from_url("/me/locations?fields=place,created_time,tags,from");
			} else {
				console.log('User cancelled login or did not fully authorize.');
			}
		}, { scope: "user_checkins,friends_checkins,user_status,friends_status,user_photos,friends_photos" });
	});

	$("#test-template").click(function () {
		var $place = $("#place_template").clone().find("li").first();
		$place.attr("id", "test-template");
		$place.hide();
		$("#places").append($place);
		$place.fadeIn("slow");
	});
});

function get_locations_from_url(url) {
	console.log("get_locations_from_url called with url " + url);
	FB.api(url, function (result) {
		console.log("FB.api executed callback!");
		console.log(result);
		for (var i = 0, l = result.data.length; i < l; i++) {
			console.log(result.data[i]);

			var $place = $("#place_template").clone().find("li").first();

			// Make sure tags always includes the from and the tags, if they
			// are available.
			var tags = [];
			if (result.data[i].tags && result.data[i].tags.data) {
				tags = tags.concat(result.data[i].tags.data);
			}
			if (result.data[i].from) {
				tags.push(result.data[i].from);
			}

			$place.attr("id", "place_" + result.data[i].place.id);
			$place.attr("data-facebook-id", result.data[i].place.id); // Not using .data() because we need to be able to use a selector to find it.
			$place.addClass("vcard");

			$place.find("h4 span").text(result.data[i].place.name);
			$place.find("time")
				.addClass("timeago")
				.attr("datetime", result.data[i].created_time)
				.text((new Date(result.data[i].created_time)).toString());

			// Hide the been with list.
			$place.find(".fb-been-with").hide();

			if (tags.length > 0) {
				for (var t = 0; t < tags.length; t++) {
					// Don't add yourself.
					if (tags[t].id != fb_current_user_id) {
						var $person = $("<li>" + tags[t].name + "</li>");
						$place.find(".fb-been-with ul").append($person);

						// Show the been with list.
						$place.find(".fb-been-with").show();
					}
				}
			}

			// so we can fade it in after adding it.
			$place.hide();

			$("#places").append($place);
			$place.fadeIn("slow");
		}

		// Update the times now.
		$("time.timeago").timeago();
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