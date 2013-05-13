namespace :restnap do
	namespace :process do
		desc "Processes queued data with locations"
		task :data_with_locations => "macrodeck:boot_platform" do
			data_loc_queue = AWS::SQS.new(:access_key_id => AWS_ACCESS_KEY, :secret_access_key => AWS_SECRET_KEY).queues[SQS_DATA_WITH_LOCATIONS_URL]

			data_loc_queue.poll(:idle_timeout => 10) do |msg|
				parsed = JSON.parse(msg.body)

				# Check if the data has a place.
				if parsed["place"]
					puts "--- Checking on place ID #{parsed["place"]}..."

					# Attempt to get that place.
					place = Place.view("by_facebook_id", :key => parsed["place"], :reduce => false, :include_docs => false)

					if place["rows"].length == 1
						place_uuid = place["rows"][0]["id"]

						# Get the list of user IDs included in this data w/ location.
						user_ids = []
						user_ids << parsed["from"]["id"] if parsed["from"] && parsed["from"]["id"]

						if parsed["tags"] && parsed["tags"]["data"]
							user_ids += parsed["tags"]["data"].collect { |tag| tag["id"] }
						end

						# Get the user.
						if user_ids.length > 0
							user_ids.each do |user_id|
								user = User.view("by_facebook_id", :key => user_id, :reduce => false, :include_docs => false)

								if user["rows"].length == 1
									user_uuid = user["rows"][0]["id"]

									# Now check the relationship.
									rels = Relationship.view("by_relationship", :key => [user_uuid, "checkin", place_uuid], :reduce => false, :include_docs => false)

									# Handle multiple checkins at the same place.
									if rels["rows"].length > 0
										puts "    Relationship already exists."

										create_rel = true
										rel_objs = Relationship.all(:keys => rels["rows"].collect { |x| x["id"] }, :reduce => false, :include_docs => true)

										raise if rel_objs.length == 0 # This should not happen

										# Check for a checkin on the same day.
										rel_objs.each do |rel|
											rel_yday  = Time.parse(rel.created_at).utc.yday
											rel_year  = Time.parse(rel.created_at).utc.year
											this_yday = Time.parse(parsed["created_time"]).utc.yday
											this_year = Time.parse(parsed["created_time"]).utc.year
											puts "    Checking if #{rel_yday} #{rel_year} is the same as #{this_yday} #{this_year}"

											if rel_yday == this_yday && rel_year == this_year
												create_rel = false
												puts "    It is, don't create another relationship."
												break
											else
												puts "    It is not, still OK to create another relationship."
											end
										end

										# This will be set to false if one of the relationships has the same facebook ID
										if create_rel
											# Create new relationship.
											puts "--- Creating new relationship: #{user_uuid} checkin #{place_uuid}"
											relationship = Relationship.new
											relationship.id = UUIDTools::UUID.random_create.to_s
											relationship.path = [relationship.id]
											relationship.source = user_uuid
											relationship.relationship = "checkin"
											relationship.facebook_id = parsed["id"]
											relationship.target = place_uuid
											relationship.reciprocal = false
											relationship.created_by = "_system/RestNap/FacebookExperiment"
											relationship.updated_by = "_system/RestNap/FacebookExperiment"
											relationship.owned_by = "_system"
											relationship.created_at = Time.parse(parsed["created_time"]).utc.iso8601
											relationship.updated_at = Time.parse(parsed["created_time"]).utc.iso8601

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
										else
											puts "    Not creating a relationship."
										end
									else
										# Create new relationship.
										puts "--- Creating new relationship: #{user_uuid} checkin #{place_uuid}"
										relationship = Relationship.new
										relationship.id = UUIDTools::UUID.random_create.to_s
										relationship.path = [relationship.id]
										relationship.source = user_uuid
										relationship.relationship = "checkin"
										relationship.facebook_id = parsed["id"]
										relationship.target = place_uuid
										relationship.reciprocal = false
										relationship.created_by = "_system/RestNap/FacebookExperiment"
										relationship.updated_by = "_system/RestNap/FacebookExperiment"
										relationship.owned_by = "_system"
										relationship.created_at = Time.parse(parsed["created_time"]).utc.iso8601
										relationship.updated_at = Time.parse(parsed["created_time"]).utc.iso8601

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
								else
									puts "    User #{user_id} doesn't exist, punting."
									false
								end
							end
						else
							puts "    Skipping place because there were no user IDs (this should not happen)."
						end
					elsif place["rows"].length > 1
						puts "!!! Place ID #{parsed["place"]} exists more than once in our system!"
						false
					else
						puts "--- Skipping place ID #{parsed["place"]} because it doesn't exist in our system"
						false
					end
				else
					# Don't handle this piece of data.
					false
				end
			end
		end
	end
end
