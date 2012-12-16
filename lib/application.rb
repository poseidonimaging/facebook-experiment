require "json"
require "sinatra"
require "omniauth-singly"
require "httparty"

module MacroDeck
	class SinglyController < Sinatra::Base
		SINGLY_API_BASE = "https://api.singly.com"
		SINGLY_ID = "a3745728d0ee7a409a711b18b81e4cb9"
		SINGLY_SECRET = "9b03181e3cb40948842b14769fcc4f09"

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
				query = { :access_token => session[:access_token] }.merge(params)

				content_type :json
				HTTParty.get("#{SINGLY_API_BASE}/proxy/facebook/#{endpoint}", {
					:query => query
				}).body
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