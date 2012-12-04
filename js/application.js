// Global variables because I'm lazy.
var fb_current_user_id;
var gmaps_api_key = "AIzaSyCxh2fB3cLbNc5XvAWSOO_0YFuOxFoTwFg";
var templates = {
	analytics_count: '<li>{{count}} {{value}}</li>',
	visit_count_person: '<div id="place_{{place_id}}_visit_with_{{person_id}}" class="fb-visit-count-person">{{visit_count}} {{person_name}}</div>',
	visit_timestamp: "<time class='timeago' datetime='{{timestamp}}'>{{human_time}}</time>",
	gmaps_url: "http://maps.googleapis.com/maps/api/staticmap?size={{size}}&scale={{scale}}&zoom={{zoom}}&markers={{lat}},{{lng}}&sensor=false&key={{api_key}}"
};

// Analytics stuff
var Analytics = {
	count_column: { column: 0, aggregation: google.visualization.data.count, type: 'number'},
	checkins: new google.visualization.DataTable(),
	cities: new google.visualization.DataTable(),
	friends: new google.visualization.DataTable(),
	checkin_habits: new google.visualization.DataTable(),
	checkin_habits_max: 0
};

// jQuery event handlers
$(document).ready(function () {
	init_analytics_data_table(Analytics.checkins);
	init_analytics_data_table(Analytics.cities);
	init_analytics_data_table(Analytics.friends);
	init_checkin_habits_data_table(Analytics.checkin_habits);

	$("#fb-login").click(function () {
		FB.login(function(response) {
			if (response.authResponse) {
				fb_current_user_id = response.authResponse.userID;

				$("#welcome").fadeOut("slow");
				$("#result_info").fadeIn("slow");
				get_locations_from_url("/me/locations?fields=place.fields(id,name,location,about,phone,picture),created_time,tags,from");
			} else {
				console.log('User cancelled login or did not fully authorize.');
			}
		}, { scope: "user_checkins,friends_checkins,user_status,friends_status,user_photos,friends_photos" });
	});

	$(document)
		// Handle fresh analytics information.
		.on("restnap:analytics:data_available", function (e) {
			// Show the checkins.
			var checkins_grouped = google.visualization.data.group(Analytics.checkins, [0], [Analytics.count_column]);
			var checkin_rows = checkins_grouped.getSortedRows([{ column: 1, desc: true }]).slice(0,5);

			$("#analytics-checkins ul").empty();

			$.each(checkin_rows, function () {
				$("#analytics-checkins ul")
					.append($.mustache(templates.analytics_count, {
						count: checkins_grouped.getValue(parseInt(this), 1),
						value: checkins_grouped.getValue(parseInt(this), 0)
					})
				);
			});

			// Show friend info.
			var friends_grouped = google.visualization.data.group(Analytics.friends, [0], [Analytics.count_column]);
			var friend_rows = friends_grouped.getSortedRows([{ column: 1, desc: true }]).slice(0,5);

			$("#analytics-friends ul").empty();

			$.each(friend_rows, function () {
				$("#analytics-friends ul")
					.append($.mustache(templates.analytics_count, {
						count: friends_grouped.getValue(parseInt(this), 1),
						value: friends_grouped.getValue(parseInt(this), 0)
					})
				);
			});

			// Show city info.
			var cities_grouped = google.visualization.data.group(Analytics.cities, [0], [Analytics.count_column]);
			var city_rows = cities_grouped.getSortedRows([{ column: 1, desc: true }]).slice(0,5);

			$("#analytics-cities ul").empty();

			$.each(city_rows, function () {
				$("#analytics-cities ul")
					.append($.mustache(templates.analytics_count, {
						count: cities_grouped.getValue(parseInt(this), 1),
						value: cities_grouped.getValue(parseInt(this), 0)
					})
				);
			});

			// Show checkin habits.
			update_checkin_habits_html_table(Analytics.checkin_habits);

			// Fade the whole thing in.
			$("#analytics").fadeIn("slow");
		})
		// Handle updating the background image with the cover image
		.on("restnap:cover_image_available", function (e, data) {
			console.log("restnap:cover_image_available fired!");
			var $place = $(e.target);

			$place.css("background-image", "url('" + $place.data("cover_image") + "')");
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
		});
});

// Sets the DataTable up. Should be called on page load.
function init_analytics_data_table(table) {
	table.addColumn("string", "Name");
	table.addColumn("datetime", "Timestamp");
}

// Sets the checkin habits data table up. Should be called on page load.
function init_checkin_habits_data_table(table) {
	table.addColumn("string", "Day");

	// Add hour columns
	$.each(["12 am", "2", "4", "6", "8", "10 am", "12 pm", "2", "4", "6", "8", "10 pm"], function (idx, value) {
		table.addColumn("number", value);
	});

	// Add days.
	$.each(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], function (idx, value) {
		table.addRow([value, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
	});
}

// Increments the correct counter in the checkin habits data table. Pass in a
// date.
function increment_checkin_habits_counter(timestamp) {
	// Get the row to modify.
	var row = timestamp.getDay();

	// Get column to modify.
	var column;

	switch (timestamp.getHours()) {
		case 0:
		case 1:
			column = 1;
			break;
		case 2:
		case 3:
			column = 2;
			break;
		case 4:
		case 5:
			column = 3;
			break;
		case 6:
		case 7:
			column = 4;
			break;
		case 8:
		case 9:
			column = 5;
			break;
		case 10:
		case 11:
			column = 6;
			break;
		case 12:
		case 13:
			column = 7;
			break;
		case 14:
		case 15:
			column = 8;
			break;
		case 16:
		case 17:
			column = 9;
			break;
		case 18:
		case 19:
			column = 10;
			break;
		case 20:
		case 21:
			column = 11;
			break;
		case 22:
		case 23:
			column = 12;
			break;
		default:
			console.error("Timestamp hours is invalid!");
	}

	// Now get the row and column.
	var value = parseInt(Analytics.checkin_habits.getValue(row, column));

	console.log("Checkin habits - " + row + "," + column + " = " + value);

	// Increment and save value.
	value++;
	Analytics.checkin_habits.setValue(row, column, value);

	// Increment checkin habits max.
	if (value > Analytics.checkin_habits_max) {
		Analytics.checkin_habits_max = value;
	}
}

// Updates the checkin habits HTML table.
function update_checkin_habits_html_table(data_table) {
	var i = 0;
	var j = 0;
	var $table = $("#analytics-checkin-habits");

	// Build header row.
	var header_row = "<tr>";
	for (i = 0; i < data_table.getNumberOfColumns(); i++) {
		header_row += "<th>" + data_table.getColumnLabel(i) + "</th>";
	}
	header_row += "</tr>";

	// Set the header row.
	$table.find("thead").html(header_row);

	// Empty data.
	$table.find("tbody").empty();

	// Build each data row.
	for (i = 0; i < data_table.getNumberOfRows(); i++) {
		// Build initial part of row plus header.
		var data_row = "<tr>";
		data_row += "<th>" + data_table.getValue(i, 0) + "</th>";

		// Get each value and figure out how big it is compared to the
		// max number of checkins.
		for (j = 1; j < data_table.getNumberOfColumns(); j++) {
			data_row += "<td>";

			// Get value and insert a circle.
			var value = parseInt(data_table.getValue(i, j));

			if ((value / Analytics.checkin_habits_max) > 0.75) {
				data_row += '<div class="circle circle-100" title="' + value + '"></div>';
			} else if ((value / Analytics.checkin_habits_max) > 0.50) {
				data_row += '<div class="circle circle-75" title="' + value + '"></div>';
			} else if ((value / Analytics.checkin_habits_max) > 0.25) {
				data_row += '<div class="circle circle-50" title="' + value + '"></div>';
			} else if ((value / Analytics.checkin_habits_max) > 0) {
				data_row += '<div class="circle circle-25" title="' + value + '"></div>';
			} else {
				data_row += '<div class="circle circle-0" title="' + value + '"></div>';
			}

			// Finish cell.
			data_row += "</td>";
		}

		// Finish the row and insert it.
		data_row += "</tr>";
		$table.find("tbody").append(data_row);
	}
}

// Adds a row to the specified analytics table.
function add_analytics_row(table, name, timestamp) {
	table.addRow([name, timestamp]);
}

// Uses the Facebook API to get a cover image.
function get_cover_image(place_id, cover_id) {
	console.log("get_cover_image called with place_id " + place_id + " and cover_id " + cover_id);
	var $place = $("#place_" + place_id);

	FB.api("/" + cover_id + "?fields=images", function (result) {
		console.log(result);
		if (result.images) {
			$place.data("cover_image", result.images[0].source);
			$place.trigger("restnap:cover_image_available");
		}
	});
}

// Uses the Facebook API to get a list of places you've visited.
function get_locations_from_url(url) {
	console.log("get_locations_from_url called with url " + url);
	FB.api(url, function (result) {
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
					var $place = $("#place_template").clone().find("li").first();

					// Ladies and gentlemen, a really long jQuery chain!
					$place
						// Set some stuff on the place object
						.attr("id", "place_" + data.place.id)
						.data("facebook-id", data.place.id)
						.addClass("vcard")
						// Hide some stuff that might not always show up.
						.find(".fb-other-visits")
							.hide()
						.end()
						.find(".fb-about")
							.hide()
						.end()
						.find(".tel")
							.hide()
						.end()
						.find(".adr, .adr *")
							.hide()
						.end()
						// Set timestamp.
						.find("time")
							.addClass("timeago")
							.attr("datetime", data.created_time)
							.text((new Date(data.created_time)).toString())
						.end()
						// Set place name.
						.find("h4 .fn")
							.text(data.place.name)
						.end();

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

					// Add about text if any.
					if (data.place.about) {
						$place.find(".fb-about").text(data.place.about);
					}

					// Add phone number if any.
					if (data.place.phone) {
						$place.find(".tel").text(data.place.phone);
					}

					// Set photo if any.
					if (data.place.picture && !data.place.picture.data.is_silhouette) {
						$place.find("img")
							.attr("src", "https://graph.facebook.com/" + data.place.id + "/picture?width=150&height=150")
							.addClass("fb-photo");
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

			// Analytics ahoy!

			// Keep track of checkin habits
			increment_checkin_habits_counter(new Date(Date.parse(data.created_time)));

			// Keep track of places.
			if (data.place) {
				add_analytics_row(Analytics.checkins, data.place.name, new Date(Date.parse(data.created_time)));
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

		// Update the times now.
		$("time.timeago").timeago();

		// Fire an event to update the analytics
		$(document).trigger("restnap:analytics:data_available");

		// Load the next page if we can.
		if (result.paging && result.paging.next && result.paging.next.replace("https://graph.facebook.com", "") != url) {
			get_locations_from_url(result.paging.next.replace("https://graph.facebook.com", ""));
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
