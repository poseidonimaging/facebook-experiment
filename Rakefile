require "bundler"
require "aws-sdk"
require "json"
require "uuidtools"
require "rest_client"

require "lib/address_comparator"

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
					geocoded = geocode_address(location["street"], location["city"], location["state"], location["country"])

					if geocoded["country"]
						countries = ::Country.view("by_title", :key => geocoded["country"], :reduce => false)

						# Create the country if needed.
						if countries.length == 0
							puts "--- Creating new country #{geocoded["country"]}..."
							country = Country.new
							country.id = UUIDTools::UUID.random_create.to_s
							country.path = [country.id]
							country.title = geocoded["country"]
							country.abbreviation = geocoded["country_abbreviation"]
							country.created_by = "_system/RestNap/FacebookExperiment"
							country.updated_by = "_system/RestNap/FacebookExperiment"
							country.owned_by = "_system"
							country.save
							countries = [country]
						end

						if countries.length == 1
							puts "    Using country #{countries[0].title}"

							# Update country info.
							countries[0].title = geocoded["country"]
							countries[0].abbreviation = geocoded["country_abbreviation"]
							countries[0].updated_by = "_system/RestNap/FacebookExperiment"
							countries[0].save

							# Check if we can get the state/city
							if geocoded["region"]
								states = ::Region.view("by_path", :startkey => [countries[0].id], :endkey => [countries[0].id, {}], :reduce => false).select do |obj|
									obj.title == geocoded["region"]
								end

								if states.length == 0
									puts "--- Creating new state #{geocoded["region_abbreviation"]}"
									state = Region.new
									state.id = UUIDTools::UUID.random_create.to_s
									state.path = [countries[0].id, state.id]
									state.title = geocoded["region"]
									state.abbreviation = geocoded["region_abbreviation"]
									state.created_by = "_system/RestNap/FacebookExperiment"
									state.updated_by = "_system/RestNap/FacebookExperiment"
									state.owned_by = "_system"
									state.save
									states = [state]
								end

								if states.length == 1
									puts "    Using state #{states[0].title}"
									# We have a state, now look for a city.
									cities = ::Locality.view("by_path", :startkey => [countries[0].id, states[0].id], :endkey => [countries[0].id, states[0].id, {}],
																		:reduce => false).select { |obj| obj.title == geocoded["locality"] }

									if cities.length == 0
										puts "--- Creating new city #{geocoded["locality"]}"
										city = Locality.new
										city.id = UUIDTools::UUID.random_create.to_s
										city.path = [countries[0].id, states[0].id, city.id]
										city.title = geocoded["locality"]
										city.created_by = "_system/RestNap/FacebookExperiment"
										city.updated_by = "_system/RestNap/FacebookExperiment"
										city.owned_by = "_system"
										city.save
										cities = [city]
									end

									if cities.length == 1
										puts "    Using city #{cities[0].title}"

										# Look up a hood
										hoods = ::Neighborhood.view("by_path", :startkey => [countries[0].id, states[0].id, cities[0].id],
																			  :endkey => [countries[0].id, states[0].id, cities[0].id, {}],
																			  :reduce => false).select do |obj|
																			    obj.title == geocoded["neighborhood"] || obj.title == geocoded["locality"]
																			  end

										if hoods.length == 0 && !geocoded["neighborhood"].nil? && geocoded["neighborhood"].length > 0
											# Create a hood!
											puts "--- Creating new neighborhood #{geocoded["neighborhood"]}"
											hood = Neighborhood.new
											hood.id = UUIDTools::UUID.random_create.to_s
											hood.path = [countries[0].id, states[0].id, cities[0].id, hood.id]
											hood.title = geocoded["neighborhood"]
											hood.created_by = "_system/RestNap/FacebookExperiment"
											hood.updated_by = "_system/RestNap/FacebookExperiment"
											hood.owned_by = "_system"
											hood.save
											hoods = [hood]
										elsif hoods.length == 0 && !geocoded["locality"].nil? && geocoded["locality"].length > 0
											# Create a hood named after thec ity!
											puts "--- Creating new neighborhood #{geocoded["locality"]}"
											hood = Neighborhood.new
											hood.id = UUIDTools::UUID.random_create.to_s
											hood.path = [countries[0].id, states[0].id, cities[0].id, hood.id]
											hood.title = geocoded["locality"]
											hood.created_by = "_system/RestNap/FacebookExperiment"
											hood.updated_by = "_system/RestNap/FacebookExperiment"
											hood.owned_by = "_system"
											hood.save
											hoods = [hood]
										end

										if hoods.length >= 1
											puts "    Using neighborhood #{hoods[0].title}"

											places = ::Place.view("by_path", :startkey => [countries[0].id, states[0].id, cities[0].id, hoods[0].id],
																			 :endkey => [countries[0].id, states[0].id, cities[0].id, hoods[0].id, {}],
																			 :reduce => false).select { |obj| obj.title.downcase.strip == parsed["name"].downcase.strip }

											place_updated = false

											# Check each place we got back to see if we can whittle it down to something that matches.
											if places.length > 0
												places.each do |place|
													if MacroDeck::AddressComparator.compare("#{place.address} #{place.postal_code}", "#{geocoded["address"]} #{geocoded["postal_code"]}")
														puts "    Correct place found! ID=#{place.id} Address=#{place.address} PostalCode=#{place.postal_code}"
														place.address = geocoded["address"] unless geocoded["address"].blank?
														place.postal_code = geocoded["postal_code"] unless geocoded["postal_code"].blank?
														place.phone_number = parsed["phone"] unless parsed["phone"].blank?
														place.url = parsed["website"] unless parsed["website"].blank?
														place.facebook_id = parsed["id"]

														if location["latitude"] && location["longitude"]
															place.geo = [location["latitude"], location["longitude"]]
														end

														begin
															place.save
															puts "    Saved!"
															place_updated = true
															break
														rescue
															puts "!!! Error saving :("
														end
													end
												end
											end

											# Check to see if we need to create a place.
											if places.length == 0 || !place_updated
												puts "--- Creating place #{parsed["name"]} Address=#{geocoded["address"]} PostalCode=#{geocoded["postal_code"]}"
												place = Place.new
												place.id = UUIDTools::UUID.random_create.to_s
												place.path = [countries[0].id, states[0].id, cities[0].id, hoods[0].id, place.id]
												place.title = parsed["name"]
												place.address = geocoded["address"] unless geocoded["address"].blank?
												place.postal_code = geocoded["postal_code"] unless geocoded["postal_code"].blank?
												place.phone_number = parsed["phone"] unless parsed["phone"].blank?
												place.url = parsed["website"] unless parsed["website"].blank?
												place.facebook_id = parsed["id"]

												if location["latitude"] && location["longitude"]
													place.geo = [location["latitude"], location["longitude"]]
												end

												begin
													place.save
													puts "    Saved!"
												rescue
													puts "!!! Error saving :("
												end
											end
										else
											puts "!!! Place #{parsed["id"]} does not have a neighborhood."
										end
									else
										puts "!!! Place #{parsed["id"]} does not have a city."
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