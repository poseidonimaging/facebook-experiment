require "sinatra"
require "omniauth-singly"
require "httparty"

module MacroDeck
	class SinglyController < Sinatra::Base
		SINGLY_API_BASE = "https://api.singly.com"
		SINGLY_ID = ""
		SINGLY_SECRET = ""

		enable :sessions
		set :public_folder, File.join(File.expand_path(File.dirname(__FILE__)), "..", "public")
		set :views, File.join(File.expand_path(File.dirname(__FILE__)), "..", "views")

		use OmniAuth::Builder do
		  provider :singly, SINGLY_ID, SINGLY_SECRET
		end

		get "/" do
			redirect "/index.html"
		end

		get "/auth/singly/callback" do
			auth = request.env["omniauth.auth"]
			session[:access_token] = auth.credentials.token
			redirect "/"
		end

		get "/logout" do
			session.clear
			redirect "/"
		end
	end
end