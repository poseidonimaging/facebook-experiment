// Global variables because I'm lazy.
var fb_current_user_id;
var gmaps_api_key = "AIzaSyCxh2fB3cLbNc5XvAWSOO_0YFuOxFoTwFg";
var templates = {
	visit_count_person: '<div id="place_{{place_id}}_visit_with_{{person_id}}" class="fb-visit-count-person">{{visit_count}} {{person_name}}</div>'
};

// jQuery event handlers
$(document).ready(function () {
	$("#fb-login").click(function () {
		FB.login(function(response) {
			if (response.authResponse) {
				fb_current_user_id = response.authResponse.userID;

				$("#welcome").fadeOut("slow");
				$("#result_info").fadeIn("slow");
				get_locations_from_url("/me/locations?fields=place,created_time,tags,from");
			} else {
				console.log('User cancelled login or did not fully authorize.');
			}
		}, { scope: "user_checkins,friends_checkins,user_status,friends_status,user_photos,friends_photos" });
	});

	// Handle showing location data.
	$(document).on("restnap:place:location_available", function (e, data) {
		var $place = $(e.target);

		$place.find(".adr").show();

		if (data.city) {
			$place.find(".adr .locality").show().text(data.city);
		}

		if (data.street) {
			$place.find(".adr .street-address").show().text(data.street.replace(/(\n|\r|\s)+$/, ''));
		}

		if (data.state) {
			$place.find(".adr .region").show().text(data.state);
		}

		if (data.zip) {
			$place.find(".adr .postal-code").show().text(data.zip);
		}

		if (data.latitude) {
			$place.data("facebook-location-lat", data.latitude);
		}

		if (data.longitude) {
			$place.data("facebook-location-lng", data.longitude);
		}
	});
});

function get_locations_from_url(url) {
	console.log("get_locations_from_url called with url " + url);
	FB.api(url, function (result) {
		console.log("FB.api executed callback!");
		console.log(result);
		for (var i = 0, l = result.data.length; i < l; i++) {
			var data = result.data[i];
			console.log(data);

			// Ensure there's always a place record so we don't attempt to access <undefined>.<whatever>.
			if (data.place) {
				// Make sure tags always includes the from and the tags, if they
				// are available.
				var tags = [];
				if (data.tags && data.tags.data) {
					tags = tags.concat(data.tags.data);
				}
				if (data.from) {
					tags.push(data.from);
				}

				if ($("#place_" + data.place.id).length == 0) {
					var $place = $("#place_template").clone().find("li").first();

					// Set up root place LI.
					$place.attr("id", "place_" + result.data[i].place.id);
					$place.data("facebook-id", result.data[i].place.id);
					$place.data("facebook-location-lat", result.data[i].place.location.latitude);
					$place.data("facebook-location-lng", result.data[i].place.location.longitude);
					$place.addClass("vcard");

					// Set place name.
					$place.find("h4 .fn").text(result.data[i].place.name);

					// Set timestamp.
					$place.find("time")
						.addClass("timeago")
						.attr("datetime", result.data[i].created_time)
						.text((new Date(result.data[i].created_time)).toString());

					// Hide some stuff that might not always show up.
					$place.find(".fb-other-visits").hide();
					$place.find(".fb-about").hide();
					$place.find(".tel").hide();
					$place.find(".adr, .adr *").hide();

					// Populate visited with list if we can.
					if (tags.length > 0 && $place.find(".fb-visit-with-list").text() == "by yourself") {
						var visit_with_list = [];

						// Loop over the tags and add the people you've been with but not yourself.
						for (var t = 0; t < tags.length; t++) {
							// Don't add yourself.
							if (tags[t].id != fb_current_user_id) {
								visit_with_list.push(tags[t].name);

								// Add to the list in the top-right.
								var visit_count_person_html = $.mustache(templates.visit_count_person, {
									place_id: data.place.id,
									person_id: tags[t].id,
									person_name: tags[t].name,
									visit_count: 1
								});
								$place.find(".fb-visit-counts").append(visit_count_person_html);
							}
						}

						// Now use array_to_sentence to make it magic.
						if (visit_with_list.length > 0) {
							$place.find(".fb-visit-with-list").text("with " + array_to_sentence(visit_with_list));
						}
					}

					// so we can fade it in after adding it.
					$place.hide();

					// Now add the place and fade it in.
					$("#places").append($place);
					$place.fadeIn("slow");

					// Fire an event that we have location information!
					if (data.place.location) {
						$place.trigger("restnap:place:location_available", data.place.location);
					}

					// And now update the place info (another asynchronous call).
					update_place_info(data.place.id);

					// Increment the place count.
					var place_count = parseInt($("#result_info span").text());
					place_count++;

					if (place_count == 1) {
						$("#result_info span").text(place_count + " place");
					} else {
						$("#result_info span").text(place_count + " places");
					}
				} else {
					// Place already exists in the DOM, update the existing item then.
					var $place = $("#place_" + data.place.id);

					// Update visit count.
					var visit_count = parseInt($place.find(".fb-visit-count").text());
					visit_count++;
					$place.find(".fb-visit-count").text(visit_count + " visits");

					// Show "Other visits"
					$place.find(".fb-other-visits").fadeIn("slow");

					// Build this visit HTML.
					var this_visit_html = "<li><time class='timeago' datetime='" + data.created_time + "'>" + (new Date(data.created_time)).toString() + "</time>";

					// Loop through the tags on this checkin.
					if (tags.length > 0) {
						var visit_with_list = [];

						// Loop over the tags and add the people you've been with but not yourself.
						for (var t = 0; t < tags.length; t++) {
							// Don't add yourself.
							if (tags[t].id != fb_current_user_id) {
								visit_with_list.push(tags[t].name);

								// Update the person's visit count or add a new person.
								if ($('#place_' + data.place.id + '_visit_with_' + tags[t].id).length > 0) {
									var visit_count_person = parseInt($('#place_' + data.place.id + '_visit_with_' + tags[t].id).text());
									visit_count_person++;
									$('#place_' + data.place.id + '_visit_with_' + tags[t].id).text(visit_count_person + " " + tags[t].name);
								} else {
									var visit_count_person_html = $.mustache(templates.visit_count_person, {
										place_id: data.place.id,
										person_id: tags[t].id,
										person_name: tags[t].name,
										visit_count: 1
									});
									$place.find(".fb-visit-counts").append(visit_count_person_html);
								}
							}
						}

						// Now use array_to_sentence to make it magic.
						if (visit_with_list.length > 0) {
							this_visit_html += " with " + array_to_sentence(visit_with_list);
						} else {
							this_visit_html += " by yourself";
						}
					} else {
						this_visit_html += " by yourself";
					}

					// Add closing </li>.
					this_visit_html += "</li>";

					// Create jQuery object of this visit HTML and initially hide it.
					var $this_visit = $(this_visit_html);
					$this_visit.hide();

					// Now drop that in the DOM and fade it in.
					$place.find(".fb-other-visits ul").append($this_visit);
					$this_visit.fadeIn("slow");
				}
			}
		}

		// Update the times now.
		$("time.timeago").timeago();

		// Load the next page if we can.
		if (result.paging && result.paging.next && result.paging.next.replace("https://graph.facebook.com", "") != url) {
			get_locations_from_url(result.paging.next.replace("https://graph.facebook.com", ""));
		}
	});
}

// Gets the place info for the ID
function update_place_info(place_id) {
	FB.api("/" + place_id + "?fields=about,phone,picture", function (result) {
		var $place = $("#place_" + place_id);

		if (result.about) {
			$place.find(".fb-about").text(result.about).fadeIn("slow");
		}
		if (result.phone) {
			$place.find(".tel").text(result.phone).fadeIn("slow");
		}
		if (result.picture) {
			if (result.picture.data.is_silhouette) {
				var ll = $place.data("facebook-location-lat") + "," + $place.data("facebook-location-lng");
				$place.find("img").attr("src", "http://maps.googleapis.com/maps/api/staticmap?size=150x150&zoom=14&markers=" + ll + "&sensor=false&key=" + gmaps_api_key);
			} else {
				$place.find("img").attr("src", "https://graph.facebook.com/" + place_id + "/picture?width=150&height=150");
			}
		}
	});
}

// from: http://stackoverflow.com/a/3766221/516229
function array_to_sentence(array) {
  if (!array || array.length == 0) return "";
  var clone = array.slice(0);

  return function build() {
    if (clone.length == 1) return clone[0];
    if (clone.length == 2) return clone[0] + ' and ' + clone[1];
    return clone.shift() + ", " + build();
  }();
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
