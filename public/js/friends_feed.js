// JavaScript loaded on the friends page.

$(document).on("load", function () {
	$(".placedata").each(function () {
		var $placedata = $(this);

		get_locations_from_url(''.concat("/", $placedata.data("place-id"), "?fields=id,name,location,about,phone,picture,cover"));
	});
});