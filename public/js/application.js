// Global variables because I'm lazy.
var fb_current_user_id;
var last_url;
var gmaps_api_key = "AIzaSyCxh2fB3cLbNc5XvAWSOO_0YFuOxFoTwFg";
var milliseconds_in_month = 2629742400;
var milliseconds_in_year = 31556916000;
var google_map;
var google_geocoder = new google.maps.Geocoder();
var google_map_heatmap_data = [];
var google_map_heatmap;
var templates = {
	analytics_count: '<li>{{count}} {{value}}</li>',
	visit_count_person: ''.concat('<div id="place_{{place_id}}_visit_with_{{person_id}}" ',
							'class="fb-visit-count-person" ',
							'{{#hidden}}style="display: none;"{{/hidden}}',
						'>',
								'{{visit_count}} {{person_name}}',
						'</div>'),
	checkin_habits_circle: ''.concat('<div id="checkin_habits_{{row}}_{{column}}"',
									' class="circle circle-{{percent}}"',
									' data-title="{{title}}"',
									' data-trigger="hover"',
									' data-html="true"',
									' data-content="{{content}}"',
									' data-placement="top"',
									'>',
									'</div>'),
	visit_timestamp: "<time class='timeago' datetime='{{timestamp}}'>{{human_time}}</time>",
	gmaps_url: "http://maps.googleapis.com/maps/api/staticmap?size={{size}}&scale={{scale}}&zoom={{zoom}}&markers={{lat}},{{lng}}&sensor=false{{#style}}{{{style}}}{{/style}}&key={{api_key}}"
};

// jQuery event handlers
$(document).ready(function () {
	// Start the process if we have the info we need.
	if (fb_current_user_id) {
		console.log("User ID = " + fb_current_user_id);
		$("#result_info").fadeIn("slow", function () {
			// Init the Google map
			google_map = new google.maps.Map($("#google_map")[0], {
				center: new google.maps.LatLng(0, 0),
				zoom: 8,
				mapTypeId: google.maps.MapTypeId.ROADMAP,
				streetViewControl: false,
				mapTypeControl: false,
				styles: gmapNightStyle
			});

			// Get crackin' on places!
			get_locations_from_url("me/locations?fields=place.fields(id,name,location,about,phone,picture,cover),created_time,tags,from,type");
		});
	}

	// Handle custom events.
	$(document)
		// Handle updating the background image with the cover image
		.on("restnap:cover_image_available", function (e, data) {
			var $place = $(e.target);

			$place.css("background-image", ''.concat("url('", $place.data("cover_image"), "')"));
		})
		// Handle showing location data.
		.on("restnap:place:location_available", function (e, data) {
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

			if (data.latitude && data.longitude && google_map) {
				var point = new google.maps.LatLng(data.latitude, data.longitude);
				google_map_heatmap_data.push({ location: point, weight: parseInt($place.find(".fb-visit-count").text()) });

				if (google_map_heatmap) {
					google_map_heatmap.setData(google_map_heatmap_data);
				} else {
					google_map_heatmap = new google.maps.visualization.HeatmapLayer({
						data: google_map_heatmap_data,
						map: google_map,
						radius: 15
					});
				}
			}

			if (data.latitude && data.longitude && $place.find("img:not(.fb-photo)").length > 0) {
				$place.find("img")
					.attr("src", $.mustache(templates.gmaps_url, {
						zoom: 14,
						scale: 1,
						size: "150x150",
						lat: data.latitude,
						lng: data.longitude,
						api_key: gmaps_api_key
					})
				);
			}

			if (data.latitude && data.longitude && !$place.data("cover_image")) {
				$place.data("cover_image", $.mustache(templates.gmaps_url, {
						zoom: 14,
						scale: 2,
						size: "1170x315",
						lat: data.latitude,
						lng: data.longitude,
						api_key: gmaps_api_key,
						style: gmaps_style_for_static_maps(gmapFreshStyle)
					})
				);
				$place.trigger("restnap:cover_image_available");
			}
		});
});

// Converts an array of map styles to something that can be used with the static maps API.
function gmaps_style_for_static_maps(styles) {
	var style_static = "";

	// Loop over each style
	$.each(styles, function (index, value) {
		style_static = style_static.concat('&style=');

		// Add the feature type if needed.
		if (value.featureType) {
			style_static = style_static.concat('feature:', value.featureType, '%7C')
		}

		// Add the element type if needed.
		if (value.elementType) {
			style_static = style_static.concat('element:', value.elementType, '%7C')
		}

		// Are there stylers? (there should be)
		if (value.stylers) {
			// Loop the stylers
			$.each(value.stylers, function (styler_index, styler_value) {
				// Loop each styler's properties (should be one)
				for (var prop in styler_value) {
					// Hue is a special case because we need to convert the
					// # to 0x.
					if (prop == "hue") {
						style_static = style_static.concat(
							prop, ":", styler_value[prop].replace("#", "0x"), "%7C"
						)
					} else {
						style_static = style_static.concat(
							prop, ":", styler_value[prop], "%7C"
						)
					}
				}
			});
		}
	});

	// Remove redundant %7C& and make it just &.
	style_static = style_static.replace("%7C&", "&")

	return style_static;
}

// Uses the Facebook API to get a cover image.
function get_cover_image(place_id, cover_id) {
	var $place = $("#place_" + place_id);

	$.ajax({
		method: "GET",
		url: "".concat("/singly/facebook/", cover_id, "?fields=images"),
		success: function (result) {
			if (result.images) {
				$place.data("cover_image", result.images[0].source);
				$place.trigger("restnap:cover_image_available");
			}
		}
	});
}

// Uses the Facebook API to get a list of places you've visited.
function get_locations_from_url(endpoint) {
	$.ajax({
		method: "GET",
		url: "".concat("/singly/facebook/", endpoint),
		success: process_facebook_response
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

function process_facebook_response(result) {
	if (result && result.data) {
		for (var i = 0, l = result.data.length; i < l; i++) {
			var data = result.data[i];

			// Make sure tags always includes the from and the tags, if they
			// are available.
			var tags = [];
			if (data.tags && data.tags.data) {
				tags = tags.concat(data.tags.data);
			}
			if (data.from) {
				tags.push(data.from);
			}

			// Ensure there's always a place record so we don't attempt to access <undefined>.<whatever>.
			if (data.place && (data.place.phone || (data.place.location && data.place.location.city))) {
				if ($("#place_" + data.place.id).length == 0) {
					RestNap.Cards.add({
						facebook_id: data.place.id,
						name: data.place.name,
						time: data.created_time,
						about: data.place.about,
						phone: data.place.phone,
						picture: !!(data.place.picture && !data.place.picture.data.is_silhouette),
						cover_id: !!(data.place.cover && data.place.cover.cover_id) ? data.place.cover.cover_id : null,
						location: data.place.location,
						data: {
							tags: tags
						}
					});
				} else {
					// Place already exists in the DOM, update the existing item then.
					var $place = $("#place_" + data.place.id);

					// Don't increment the visit count if we visited the place multiple times
					// in the same time.
					var existing_date = $place.find("h4 time").attr("datetime").split("T")[0];

					if (existing_date !== data.created_time.split("T")[0]) {
						// Update visit count.
						var visit_count = parseInt($place.find(".fb-visit-count").text());
						visit_count++;
						$place.find(".fb-visit-count").text(visit_count + " visits");
					}

					// Build this visit HTML.
					var this_visit_html = "<li>" + $.mustache(templates.visit_timestamp, {
						timestamp: data.created_time,
						human_time: (new Date(data.created_time)).toString()
					});

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

									// Update the count and show the visit.
									$('#place_' + data.place.id + '_visit_with_' + tags[t].id)
										.text(visit_count_person + " " + tags[t].name)
										.fadeIn("slow");
								} else {
									var visit_count_person_html = $.mustache(templates.visit_count_person, {
										place_id: data.place.id,
										person_id: tags[t].id,
										person_name: tags[t].name,
										visit_count: 1,
										hidden: true
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

					// Don't add the visit to the list if it happened on the same day.
					if (existing_date !== data.created_time.split("T")[0]) {
						// Create jQuery object of this visit HTML and initially hide it.
						var $this_visit = $(this_visit_html);
						$this_visit.hide();

						// Now drop that in the DOM
						$place.find(".fb-other-visits ul").append($this_visit);

						// Show "Other visits"
						$place.find(".fb-other-visits").fadeIn("slow");

						// Fade in this visit.
						$this_visit.fadeIn("slow");
					}
				}
			} else if (data.place) {
				console.log("Skipping place " + data.place.name + " (place ID=" + data.place.id + ")");
				if (data.place.location && data.place.location.city) {
					console.log("- Has a location and city");
				} else if (data.place.location && !data.place.location.city) {
					console.log("- Has a location and no city");
				}

				if (data.place.phone) {
					console.log("- Has a phone number");
				} else {
					console.log("- Does not have a phone number");
				}
			} else {
				console.log("Skipping ID " + data.id + " because there is no attached place");
			}

			// Analytics ahoy!

			// Keep track of places.
			if (data.place) {
				add_analytics_row(Analytics.checkins, data.place.name, new Date(Date.parse(data.created_time)));

				// Keep track of checkin habits
				increment_checkin_habits_counter(new Date(Date.parse(data.created_time)), data.place.name, data.place.id);
			}

			// Keep track of cities.
			if (data.place && data.place.location && data.place.location.city) {
				add_analytics_row(Analytics.cities, data.place.location.city + ", " + data.place.location.state, new Date(Date.parse(data.created_time)));
			}

			// Keep track of friends.
			for (var t = 0; t < tags.length; t++) {
				// Don't add yourself.
				if (tags[t].id != fb_current_user_id) {
					add_analytics_row(Analytics.friends, tags[t].name, new Date(Date.parse(data.created_time)));
				}
			}
		}
	}

	// Update the times now.
	$("time.timeago").timeago();

	// Fire an event to update the analytics
	$(document).trigger("restnap:analytics:data_available");

	// Load the next page if we can.
	if (result.paging && result.paging.next) {
		var next_url = result.paging.next.replace("https://graph.facebook.com", "");

		if (next_url != last_url) {
			last_url = next_url;
			get_locations_from_url(next_url);
		}
	}
}