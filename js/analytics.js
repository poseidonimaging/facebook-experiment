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
	// Check for greater than zero rows.
	if (table.getNumberOfRows() > 0) {
		// Don't add the same name twice in a row on the same day.
		var last_name = table.getValue(table.getNumberOfRows() - 1, 0);
		var last_ts = table.getValue(table.getNumberOfRows() - 1, 1);

		if (last_name !== name && !(last_ts.getMonth() === timestamp.getMonth() && last_ts.getDate() === timestamp.getDate() && last_ts.getYear() === timestamp.getYear())) {
			table.addRow([name, timestamp]);
		}
	} else {
		table.addRow([name, timestamp]);
	}
}