namespace :restnap do
	namespace :process do
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
	end
end
