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
					geocoded = RestlessNapkin::Utils.geocode_address(location["street"], location["city"], location["state"], location["country"])

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
	end
end
