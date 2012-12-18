require "json"
require "sinatra"
require "omniauth-singly"
require "httparty"
require "aws-sdk"

module MacroDeck
	class SinglyController < Sinatra::Base
		SINGLY_API_BASE = "https://api.singly.com"
		SINGLY_ID = "a3745728d0ee7a409a711b18b81e4cb9"
		SINGLY_SECRET = "9b03181e3cb40948842b14769fcc4f09"

		AWS_ACCESS_KEY = "AKIAINPARSP7PEW7I6DA"
		AWS_SECRET_KEY = "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"

		SQS_DATA_WITH_LOCATIONS_URL = "https://sqs.us-east-1.amazonaws.com/766921168018/RestNap_OpenGraph_DataWithLocations"
		SQS_PLACES_URL = "https://sqs.us-east-1.amazonaws.com/766921168018/RestNap_OpenGraph_Places"

		enable :sessions
		set :public_folder, File.join(File.expand_path(File.dirname(__FILE__)), "..", "public")
		set :views, File.join(File.expand_path(File.dirname(__FILE__)), "..", "views")

		use OmniAuth::Builder do
		  provider :singly, SINGLY_ID, SINGLY_SECRET
		end

		get "/" do
			erb :"index.html", :layout => :"layout.html"
		end

		get "/facebook/*" do
			splat = params.delete("splat")
			
			# Delete params to not send to FB
			params.delete("captures")
			params.delete("access_token")

			if splat && splat.length > 0
				endpoint = splat[0]
			else
				endpoint = nil
			end

			if endpoint
				content_type :json

				query = { :access_token => session[:access_token] }.merge(params)

				# Do the query.
				resp = HTTParty.get("#{SINGLY_API_BASE}/proxy/facebook/#{endpoint}", {
					:query => query
				})

				# Get the parsed response
				parsed = resp.parsed_response

				# See if we have data to send off.
				if !parsed["data"].nil? && parsed["data"].length > 0
					# Get a reference to the SQS queue
					places_queue = AWS::SQS.new(:access_key_id => AWS_ACCESS_KEY, :secret_access_key => AWS_SECRET_KEY).queues[SQS_PLACES_URL]
					data_loc_queue = AWS::SQS.new(:access_key_id => AWS_ACCESS_KEY, :secret_access_key => AWS_SECRET_KEY).queues[SQS_DATA_WITH_LOCATIONS_URL]

					# Loop over all the pieces of data.
					parsed["data"].each do |item|
						if item["place"]
							# Send the place to the places queue
							places_queue.send_message(item["place"].to_json)

							# Make the place be a pointer to the place ID.
							item["place"] = item["place"]["id"]

							# Send the entire item to SQS.
							data_loc_queue.send_message(item.to_json)
						elsif endpoint.include?("/locations")
							# Send the entire item to SQS, but only if we are pulling something with a location.
							data_loc_queue.send_message(item.to_json)
						end
					end
				end

				# No need to re-JSON-encode anything
				return resp.body
			else
				raise "Endpoint not specified - splat=#{splat.inspect} params=#{params.inspect}"
			end
		end

		get "/auth/singly/callback" do
			auth = request.env["omniauth.auth"]
			session[:access_token] = auth.credentials.token

			# Get your Facebook ID.
			session[:facebook_uid] = HTTParty.get("#{SINGLY_API_BASE}/proxy/facebook/me", {
				:query => { :access_token => session[:access_token], :fields => "id" } 
			}).parsed_response["id"]

			redirect "/"
		end

		get "/logout" do
			session.clear
			redirect "/"
		end
	end
end