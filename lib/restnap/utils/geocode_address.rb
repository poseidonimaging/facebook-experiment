require "json"
require "rest_client"

module RestlessNapkin
	module Utils
		GMAPS_GEOCODE_BASE = "http://maps.google.com/maps/api/geocode/json"

		# Takes an address and geocodes it with Google.
		# 
		# @param [String] street
		# 	The street address to geocode.
		# @param [String] city
		# 	The city to geocode.
		# @param [String] state
		# 	The state to geocode.
		# @param [String] country
		# 	The country to geocode.
		# @param [true, false] log
		# 	If true, write debugging to STDOUT. Defaults to true.
		def geocode_address(street, city, state, country, log=true)
			address = "#{street}, #{city}, #{state}, #{country}"

			puts "    Attempting to geocode: #{address}" if log

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
				puts "    Geocoded successfully." if log

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
	end
end
