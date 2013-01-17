require "bundler"
require "aws-sdk"
require "json"
require "uuidtools"
require "rest_client"

AWS_ACCESS_KEY = "AKIAINPARSP7PEW7I6DA"
AWS_SECRET_KEY = "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"

SQS_DATA_WITH_LOCATIONS_URL = "https://sqs.us-east-1.amazonaws.com/766921168018/RestNap_OpenGraph_DataWithLocations"
SQS_PLACES_URL = "https://sqs.us-east-1.amazonaws.com/766921168018/RestNap_OpenGraph_Places"
SQS_USERS_URL = "https://sqs.us-east-1.amazonaws.com/766921168018/RestNap_OpenGraph_Users"

GMAPS_GEOCODE_BASE = "http://maps.google.com/maps/api/geocode/json"

# Takes an address and geocodes it with Google.
def geocode_address(street, city, state, country)
	address = "#{street}, #{city}, #{state}, #{country}"

	puts "    Attempting to geocode: #{address}"

	resp = RestClient.get(GMAPS_GEOCODE_BASE, {
		:params => {
			:address => address,
			:sensor => false,
			:components => "locality:#{city}|administrative_area:#{state}"
		},
		:content_type => :json,
		:accept => :json
	})

	parsed = JSON.parse(resp)

	if parsed["results"] && parsed["results"].length >= 1
		puts "    Geocoded successfully."

		info = {
			"formatted_address" => parsed["results"][0]["formatted_address"]
		}

		parsed["results"][0]["address_components"].each do |component|
			if component["types"].include?("street_number")
				info["street_number"] = component["long_name"]
			end

			if component["types"].include?("route")
				info["street"] = component["short_name"]
			end

			if component["types"].include?("neighborhood")
				info["neighborhood"] = component["long_name"]
			end

			if component["types"].include?("locality")
				info["locality"] = component["long_name"]
			end

			if component["types"].include?("administrative_area_level_2") # US county
				info["county"] = component["long_name"]
			end

			if component["types"].include?("administrative_area_level_1") # US state
				info["region"] = component["long_name"]
				info["region_abbreviation"] = component["short_name"]
			end

			if component["types"].include?("country")
				info["country"] = component["long_name"]
				info["country_abbreviation"] = component["short_name"]
			end

			if component["types"].include?("postal_code")
				info["postal_code"] = component["long_name"]
			end
		end

		info["address"] = "#{info["street_number"]} #{info["street"]}".strip

		return info
	end

	return nil
end

namespace :macrodeck do
	desc "Boots the MacroDeck platform"
	task :boot_platform do
		# MacroDeck
		require "macrodeck-platform"
		require "macrodeck-config"

		# Load the config file.
		puts ">>> Loading configuration."
		cfg = MacroDeck::Config.new(File.join(File.dirname(__FILE__), "config", "macrodeck.yml"))

		# Start the MacroDeck platform.
		puts ">>> Starting MacroDeck Platform on #{cfg.db_url}"
		MacroDeck::Platform.start!(cfg.db_url)
		MacroDeck::PlatformDataObjects.define

		puts ">>> MacroDeck Platform started."
	end
end

namespace :restnap do
	namespace :process do
		desc "Processes queued places"
		task :places => "macrodeck:boot_platform" do
			places_queue = AWS::SQS.new(:access_key_id => AWS_ACCESS_KEY, :secret_access_key => AWS_SECRET_KEY).queues[SQS_PLACES_URL]

			puts ">>> Polling for places..."

			# Get each message
			places_queue.poll(:idle_timeout => 10) do |msg|
				parsed = JSON.parse(msg.body)

				puts "--- Parsing FB place ID #{parsed["id"]}"

				# Get the location
				location = parsed["location"] if parsed["location"]

				# Parse the location.
				if location && location["street"] && location["street"].length > 0 && location["city"] && location["city"].length > 0 && parsed["name"] && parsed["name"].length > 0
					if location["country"]
						countries = ::Country.view("by_title", :key => location["country"], :reduce => false)

						# Create the country if needed.
						if countries.length == 0
							puts "--- Creating new country #{location["country"]}..."
							country = Country.new
							country.id = UUIDTools::UUID.random_create.to_s
							country.path = [country.id]
							country.title = location["country"]
							country.created_by = "_system/RestNap/FacebookExperiment"
							country.updated_by = "_system/RestNap/FacebookExperiment"
							country.owned_by = "_system"
							country.save
							countries = [country]
						end

						# Check if we can get the state/city
						if countries.length == 1
							if location["state"]
								# FIXME: This needs to filter by the country as well in case there are abbreviation overlaps.
								states = ::Region.view("by_abbreviation", :key => location["state"], :reduce => false)

								if states.length == 0
									puts "--- Region with abbreviation #{location["state"]} needs to be created"
								elsif states.length == 1
									# We have a state, now look for a city.
									cities = ::Locality.view("by_title", :key => location["city"], :reduce => false)
									cities.each do |city|
										if city.path == [countries[0].id, states[0].id, city.id]
											puts "    Correct city found! ID=#{city.id} Title=#{city.title}"

											# TODO: Make this not be stupid
											places = ::Place.view("by_title", :key => parsed["name"], :reduce => false)
											places.each do |place|
												if place.path.length >= 3
													# Check if the place is in the city's path
													if place.path[0] == countries[0].id && place.path[1] == states[0].id && place.path[2] == city.id
														puts "    Place ID=#{place.id} has correct path, checking address"
														# It is, check the address.
														if place.address == location["street"] || place.postal_code == location["zip"]
															puts "    Correct place found! ID=#{place.id} Address=#{place.address} PostalCode=#{place.postal_code}"
															place.address = location["street"] unless location["street"].blank?
															place.postal_code = location["zip"] unless location["zip"].blank?
															place.phone_number = parsed["phone"] unless parsed["phone"].blank?
															place.url = parsed["website"] unless parsed["website"].blank?

															if location["latitude"] && location["longitude"]
																place.geo = [location["latitude"], location["longitude"]]
															end

															begin
																place.save
																puts "    Saved!"
																break
															rescue
																puts "!!! Error saving :("
															end
														end
													else
														puts "    FB address #{location["street"]} #{location["zip"]} does not match our address of #{place.address} #{place.postal_code}, trying another..."
													end
												else
													puts "    Place path isn't >= 3 (it's #{place.path.length})"
												end
											end

											puts "    Done processing... if it didn't save, we couldn't match #{parsed["name"]}"

											break
										end
									end
								end
							else
								puts "!!! Place #{parsed["id"]} does not have a state."
							end
						end
					else
						puts "!!! Place #{parsed["id"]} does not have a country."
					end
				else
					puts "!!! Place #{parsed["id"]} has insufficient information to update/create a place."
				end
			end
		end

		desc "Processes queued data with locations"
		task :data_with_locations do
			data_loc_queue = AWS::SQS.new(:access_key_id => AWS_ACCESS_KEY, :secret_access_key => AWS_SECRET_KEY).queues[SQS_DATA_WITH_LOCATIONS_URL]

			data_loc_queue.poll(:idle_timeout => 10) do |msg|
				parsed = JSON.parse(msg.body)

				puts parsed["id"] if parsed["id"]
			end
		end

		desc "Processes queued users"
		task :users => "macrodeck:boot_platform" do
			users_queue = AWS::SQS.new(:access_key_id => AWS_ACCESS_KEY, :secret_access_key => AWS_SECRET_KEY).queues[SQS_USERS_URL]

			puts ">>> Polling for users..."

			users_queue.poll(:idle_timeout => 10) do |msg|
				parsed = JSON.parse(msg.body)
				singly_id = parsed["id"]

				users = ::User.view("by_singly_id", :key => singly_id, :reduce => false)

				if users.length == 0
					puts "--- Creating new user #{singly_id}..."
					user = User.new
					user.id = UUIDTools::UUID.random_create.to_s
					user.path = [user.id]
					user.singly_id = singly_id
					user.created_by = "_system/RestNap/FacebookExperiment"
					user.updated_by = "_system/RestNap/FacebookExperiment"
					user.owned_by = user.id
				elsif users.length == 1
					puts "--- Updating existing user #{singly_id}..."
					user = users[0]
				else
					raise "!!! #{singly_id} exists more than once!"
				end

				# Check for a Facebook profile.
				if parsed["facebook"] && parsed["facebook"].length > 0
					puts "    Parsing Facebook profile..."

					fb = parsed["facebook"][0]["profile"]
					user.first_name = fb["first_name"] unless fb["first_name"].nil?
					user.last_name = fb["last_name"] unless fb["last_name"].nil?
					user.facebook_id = fb["id"] unless parsed["facebook"][0]["id"].nil?
					user.facebook_profile = fb
				else
					puts "    No Facebook profile to parse :("
				end

				if user.valid?
					user.save
					puts "    User saved! ID=#{user.id}"
				else
					puts "    User invalid :("
					user.errors.each do |err|
						puts "        #{err.inspect}"
					end
				end
			end

			puts ">>> Done!"
		end
	end
end