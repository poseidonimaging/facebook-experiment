module MacroDeck
	class RestNap2Controller < Sinatra::Base
		enable :sessions
		set :public_folder, File.join(File.expand_path(File.dirname(__FILE__)), "..", "public")
		set :views, File.join(File.expand_path(File.dirname(__FILE__)), "..", "views")

		get "/" do
			@extra_scripts = ["js/my_feed.js"]
			@page = "my_feed"
			erb :"index.html", :layout => :"layout.html"
		end

		# Basic thing to get place/user data.
		get "/:id.json" do
			content_type :json

			# Check that you're logged in
			pass if session[:access_token].nil? || session[:facebook_uid].nil?

			# Get the object
			obj = ::DataObject.get(params[:id])

			# Make sure it's something we want to give you
			pass unless [Place, User].include?(obj.class)

			# Return some JSON.
			obj.to_json
		end

		get "/friends" do
			redirect to("/") if session[:access_token].nil? || session[:facebook_uid].nil?

			@page = "friends"
			@extra_scripts = ["js/friends_feed.js"]

			me = ::User.view("by_facebook_id", :key => session[:facebook_uid], :reduce => false, :include_docs => true)
			@me = me[0] if me.length > 0

			@friend_keys = []

			rels = ::Relationship.view("by_relationship", :startkey => [@me.id, "friend"], :endkey => [@me.id, "friend", {}], :reduce => false, :include_docs => false)

			if rels["rows"] && rels["rows"].length > 0
				rels["rows"].each do |row|
					@friend_keys << "#{row["key"][2]}/checkin"
				end
			end

			@place_rels = ::Relationship.view("by_relationship", :keys => @friend_keys, :reduce => false, :include_docs => true)

			erb :"friends.html", :layout => :"layout.html"
		end
	end
end