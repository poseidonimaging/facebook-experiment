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
SQS_FRIENDS_URL = "https://sqs.us-east-1.amazonaws.com/766921168018/RestNap_OpenGraph_Friends"

GMAPS_GEOCODE_BASE = "http://maps.google.com/maps/api/geocode/json"
FB_GRAPH_BASE = "https://graph.facebook.com"

# Takes a Facebook ID and returns the public profile
def get_public_fb_profile(id)
	puts "    Attempting to get FB profile ID: #{id}"

	resp = RestClient.get("#{FB_GRAPH_BASE}/#{id}", {
		:content_type => :json,
		:accept => :json
	})

	if resp
		parsed = JSON.parse(resp)
		return parsed
	end
end

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

					if geocoded && geocoded["country"]
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
		task :data_with_locations => "macrodeck:boot_platform" do
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

				if parsed["facebook"] && parsed["facebook"].length > 0
					facebook_id = parsed["facebook"][0]["id"]

					users = ::User.view("by_facebook_id", :key => facebook_id, :reduce => false)

					if users.length == 0
						puts "--- Creating new user #{facebook_id}..."
						user = User.new
						user.id = UUIDTools::UUID.random_create.to_s
						user.path = [user.id]
						user.singly_id = singly_id
						user.facebook_id = facebook_id
						user.created_by = "_system/RestNap/FacebookExperiment"
						user.updated_by = "_system/RestNap/FacebookExperiment"
						user.owned_by = user.id
					elsif users.length == 1
						puts "--- Updating existing user #{facebook_id}..."
						user = users[0]
					else
						raise "!!! #{facebook_id} exists more than once!"
					end

					# Parse FB profile.
					puts "    Parsing Facebook profile..."

					fb = parsed["facebook"][0]["profile"]
					user.first_name = fb["first_name"] unless fb["first_name"].nil?
					user.last_name = fb["last_name"] unless fb["last_name"].nil?
					user.facebook_profile = fb

					if user.valid?
						user.save
						puts "    User saved! ID=#{user.id}"
					else
						puts "    User invalid :("
						user.errors.each do |err|
							puts "        #{err.inspect}"
						end
					end
				else
					puts "!!! Singly ID #{singly_id} doesn't have a facebook profile!"
				end
			end

			puts ">>> Done!"
		end

		desc "Processes queued friend relationships"
		task :friends => "macrodeck:boot_platform" do
			# TODO:
			# 1. Poll the queue
			# 2. Make sure we have the source user record. If not, punt it for next run.
			# 3. Loop over this user record's friends. Create them as needed.
			# 4. Create relationship records between the different objects.

			friends_queue = AWS::SQS.new(:access_key_id => AWS_ACCESS_KEY, :secret_access_key => AWS_SECRET_KEY).queues[SQS_FRIENDS_URL]
			facebook_id_to_uuids = {}
			uuid_to_facebook_ids = {}

			puts ">>> Polling for friends..."

			friends_queue.poll(:idle_timeout => 10) do |msg|
				parsed = JSON.parse(msg.body)

				parsed.each_pair do |source_user_id, friends|
					users = ::User.view("by_facebook_id", :key => source_user_id, :reduce => false)

					puts "--- Parsing friends for #{source_user_id}..."

					if users.length == 1
						# Yay, we found the user, now do our thing!
						source_user_uuid = users[0].id

						puts "    User mapped successfully to MacroDeck UUID #{source_user_uuid}"

						# Record this user's UUID.
						facebook_id_to_uuids[source_user_id] = source_user_uuid
						uuid_to_facebook_ids[source_user_uuid] = source_user_id

						if friends["data"]
							puts "    Friend data present. There are #{friends["data"].length} friends to parse."

							friends["data"].each do |friend|
								friend_profile = get_public_fb_profile(friend["id"])
								friend_facebook_id = friend_profile["id"]

								# Look up the user (should only be one!)
								friend_users = ::User.view("by_facebook_id", :key => friend_facebook_id, :reduce => false)

								# Create or choose the active friend.
								if friend_users.length == 0
									puts "--- Creating new user #{friend_facebook_id}..."
									friend_user = User.new
									friend_user.id = UUIDTools::UUID.random_create.to_s
									friend_user.path = [friend_user.id]
									friend_user.facebook_id = friend_facebook_id
									friend_user.created_by = "_system/RestNap/FacebookExperiment"
									friend_user.updated_by = "_system/RestNap/FacebookExperiment"
									friend_user.owned_by = friend_user.id
								elsif users.length == 1
									puts "--- Updating existing user #{friend_facebook_id}..."
									friend_user = friend_users[0]
								else
									raise "!!! #{friend_facebook_id} exists more than once!"
								end

								# Update name.
								friend_user.first_name = friend_profile["first_name"] unless friend_profile["first_name"].nil?
								friend_user.last_name = friend_profile["last_name"] unless friend_profile["last_name"].nil?

								# Attempt to save
								if friend_user.valid?
									friend_user.save
									puts "    User saved! ID=#{friend_user.id}"
								else
									puts "    User invalid :("
									friend_user.errors.each do |err|
										puts "        #{err.inspect}"
									end
								end

								target_user_uuid = friend_user.id
								facebook_id_to_uuids[friend_facebook_id] = target_user_uuid
								uuid_to_facebook_ids[target_user_uuid] = friend_facebook_id

								# Now search for a relationship and create one if it doesn't exist.
								relationships = ::Relationship.view("by_relationship", :key => [source_user_uuid, "friend", target_user_uuid], :reduce => false, :include_docs => false)

								if relationships["rows"].length == 0
									puts "--- Creating new relationship: #{source_user_uuid} friend #{target_user_uuid}"
									relationship = Relationship.new
									relationship.id = UUIDTools::UUID.random_create.to_s
									relationship.path = [relationship.id]
									relationship.source = source_user_uuid
									relationship.relationship = "friend"
									relationship.target = target_user_uuid
									relationship.reciprocal = true
									relationship.created_by = "_system/RestNap/FacebookExperiment"
									relationship.updated_by = "_system/RestNap/FacebookExperiment"
									relationship.owned_by = "_system"

									# Attempt to save
									if relationship.valid?
										relationship.save
										puts "    Relationship saved! ID=#{relationship.id}"
									else
										puts "    Relationship invalid :("
										relationship.errors.each do |err|
											puts "        #{err.inspect}"
										end
									end
								end
							end

							# Check for friend deletions.
							fb_ids_you_should_have = friends["data"].collect { |x| x["id"] }
							fb_ids_you_do_have = []
							all_your_friend_relationships = ::Relationship.view("by_relationship", :startkey => [source_user_uuid, "friend"], :endkey => [source_user_uuid, "friend", {}], :reduce => false, :include_docs => false)

							if all_your_friend_relationships["rows"] && all_your_friend_relationships["rows"].length > 0
								all_your_friend_relationships["rows"].each do |rel|
									fb_ids_you_do_have << uuid_to_facebook_ids[rel["key"][2]]
								end
							end

							# Maybe get the list down more.
							fb_ids_you_should_have.compact!
							fb_ids_you_should_have.uniq!
							fb_ids_you_should_have.sort!
							fb_ids_you_do_have.compact!
							fb_ids_you_do_have.uniq!
							fb_ids_you_do_have.sort!

							if fb_ids_you_should_have != fb_ids_you_do_have
								puts "    OH NO, WE HAVE TO UPDATE FRIENDS! :("
								fb_ids_to_delete = fb_ids_you_do_have - fb_ids_you_should_have
								fb_ids_to_delete.each do |id_to_delete|
									user = ::User.view("by_facebook_id", :key => id_to_delete, :reduce => false, :include_docs => false)

									if user["rows"].length > 0
										relationship_to_delete = ::Relationship.view("by_relationship", :key => [source_user_uuid, "friend", user["rows"][0]["id"]])
										if relationship_to_delete
											relationship_to_delete.destroy
										end
									end
								end
							end
						else
							puts "    Friend data not present."
						end
					else
						# Punt until next run.
						false
					end
				end
			end
		end
	end
end