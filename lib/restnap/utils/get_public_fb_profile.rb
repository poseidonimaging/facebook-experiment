module RestlessNapkin
	module Utils
		# Takes a Facebook ID and returns the public profile
		#
		# @param [#to_s] id
		# 	The ID of the Facebook user.
		# @param [true, false] log
		# 	Log to STDOUT? Default is true.
		# @return [Hash] The parsed response from Facebook.
		def get_public_fb_profile(id, log=true)
			puts "    Attempting to get FB profile ID: #{id}" if log

			resp = RestClient.get("#{FB_GRAPH_BASE}/#{id}", {
				:content_type => :json,
				:accept => :json
			})

			if resp
				parsed = JSON.parse(resp)
				return parsed
			end
		end
	end
end
