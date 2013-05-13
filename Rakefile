require "bundler"
require "aws-sdk"
require "json"
require "uuidtools"
require "rest_client"

require "lib/address_comparator"
require "lib/restnap/utils/geocode_address"
require "lib/restnap/utils/get_public_fb_profile"

AWS_ACCESS_KEY = "AKIAINPARSP7PEW7I6DA"
AWS_SECRET_KEY = "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"

SQS_DATA_WITH_LOCATIONS_URL = "https://sqs.us-east-1.amazonaws.com/766921168018/RestNap_OpenGraph_DataWithLocations"
SQS_PLACES_URL = "https://sqs.us-east-1.amazonaws.com/766921168018/RestNap_OpenGraph_Places"
SQS_USERS_URL = "https://sqs.us-east-1.amazonaws.com/766921168018/RestNap_OpenGraph_Users"
SQS_FRIENDS_URL = "https://sqs.us-east-1.amazonaws.com/766921168018/RestNap_OpenGraph_Friends"

FB_GRAPH_BASE = "https://graph.facebook.com"

Dir.glob("lib/tasks/*.rake").each { |r| import r }

namespace :restnap do
	namespace :process do
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
								friend_profile = RestlessNapkin::Utils.get_public_fb_profile(friend["id"])
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
