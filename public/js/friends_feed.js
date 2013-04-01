// JavaScript loaded on the friends page.

$(window).on("load", function () {
	$("#result_info").fadeIn();

	$(".placedata").each(function () {
		var $placedata = $(this);

		$.ajax({
			method: "GET",
			url: "".concat("/", $placedata.data("place-id"), ".json"),
			success: function (result) {
				var latitude;
				var longitude;

				if (result.geo && result.geo.length > 0) {
					latitude = result.geo[0];
					longitude = result.geo[1];
				}

				var card_data = {
					facebook_id: result.facebook_id,
					name: result.title,
					phone: result.phone_number,
					time: $placedata.data("timestamp"),
					location: {
						street_address: result.address,
						postal_code: result.postal_code,
						latitude: latitude,
						longitude: longitude
					}
				};

				$.ajax({
					method: "GET",
					url: "".concat("/", $placedata.data("friend-id"), ".json"),
					success: function (result) {
						card_data.visit_by = {
							first_name: result.first_name,
							last_name: result.last_name,
							facebook_id: result.facebook_id
						};

						RestNap.Cards.add(card_data);
					}
				});
			}
		});
	});
});

$(document)
	// Handle updating the count on the top of the page and tags.
	.on("restnap:place:card_added", function (e, data) {
		var $place = $(e.target);

		$place
			.find(".timeago")
				.timeago()
			.end();

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
	});