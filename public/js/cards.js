var RestNap = RestNap || {};

RestNap.Cards = {
	// data needs these keys:
	// - facebook_id
	// - name
	// - time (ISO8601 format)
	// optional:
	// - about
	// - phone
	// - picture (true/false)
	// - cover_id
	// - data (data attributes to set)
	// - location.locality (city)
	// - location.street_address
	// - location.region (state)
	// - location.postal_code (the ZIP code)
	// - location.latitude
	// - location.longitude
	add: function (data) {
		var $place = $("#place_template").clone().find("li").first();

		// Ladies and gentlemen, a really long jQuery chain!
		$place
			// Set some stuff on the place object
			.attr("id", ''.concat("place_", data.facebook_id))
			.data("facebook-id", data.facebook_id)
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
				.attr("datetime", data.time)
				.text((new Date(data.time)).toString())
			.end()
			// Set place name.
			.find("h4 .fn")
				.text(data.name)
			.end();

		// Add about text if any.
		if (data.about) {
			$place.find(".fb-about").text(data.about);
		}

		// Add phone number if any.
		if (data.phone) {
			$place.find(".tel").text(data.phone);
		}

		// Set photo if any.
		if (data.picture) {
			$place.find("img")
				.attr("src", "https://graph.facebook.com/" + data.facebook_id + "/picture?width=150&height=150")
				.addClass("fb-photo");
		}

		// If this is a "visit by", add that information.
		if (data.visit_by) {
			$place.find(".fb-visit-with-list").text("by ".concat(data.visit_by.first_name, " ", data.visit_by.last_name));
		}

		// Set data attributes.
		if (data.data) {
			$.each(data.data, function (key, value) {
				$place.data(key, value);
			});
		}

		// so we can fade it in after adding it.
		$place.hide();

		// Now add the place and fade it in.
		$("#places").append($place);
		$place.fadeIn("slow");

		// If there's a cover image, fetch the highest resolution one we can get.
		if (data.cover_id) {
			get_cover_image(data.facebook_id, data.cover_id);
		}

		// Fire an event that we have location information!
		if (data.location) {
			$place.trigger("restnap:place:location_available", data.location);
		}

		// Fire an event that we added a place card.
		$place.trigger("restnap:place:card_added", data);
	}
}