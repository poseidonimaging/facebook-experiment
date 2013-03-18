// JavaScript specific to the "My Feed" page.

$(document)
	// Handle updating the count on the top of the page and tags.
	.on("restnap:place:card_added", function (e, data) {
		var $place = $(e.target);

		if ($("#result_info span").length > 0) {
			// Increment the place count.
			var place_count = parseInt($("#result_info span").text());
			place_count++;

			if (place_count == 1) {
				$("#result_info span").text(place_count + " place");
			} else {
				$("#result_info span").text(place_count + " places");
			}
		}

		// Handle tags.
		if ($place.data("tags") && $place.data("tags").length > 0) {
			console.log("Handling tags for " + $place[0].id);

			var tags = $place.data("tags");
			var place_id = $place.data("facebook-id");

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
							place_id: place_id,
							person_id: tags[t].id,
							person_name: tags[t].name,
							visit_count: 1,
							hidden: true
						});
						$place.find(".fb-visit-counts").append(visit_count_person_html);
					}
				}

				// Now use array_to_sentence to make it magic.
				if (visit_with_list.length > 0) {
					$place.find(".fb-visit-with-list").text("with " + array_to_sentence(visit_with_list));
				}
			}
		}
	});