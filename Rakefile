require "bundler"
require "aws-sdk"
require "json"
require "uuidtools"

AWS_ACCESS_KEY = "AKIAINPARSP7PEW7I6DA"
AWS_SECRET_KEY = "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"

SQS_DATA_WITH_LOCATIONS_URL = "https://sqs.us-east-1.amazonaws.com/766921168018/RestNap_OpenGraph_DataWithLocations"
SQS_PLACES_URL = "https://sqs.us-east-1.amazonaws.com/766921168018/RestNap_OpenGraph_Places"
SQS_USERS_URL = "https://sqs.us-east-1.amazonaws.com/766921168018/RestNap_OpenGraph_Users"

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
		task :places do
			places_queue = AWS::SQS.new(:access_key_id => AWS_ACCESS_KEY, :secret_access_key => AWS_SECRET_KEY).queues[SQS_PLACES_URL]

			# Get each message
			places_queue.poll(:idle_timeout => 10) do |msg|
				parsed = JSON.parse(msg.body)

				puts parsed["name"] if parsed["name"]
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