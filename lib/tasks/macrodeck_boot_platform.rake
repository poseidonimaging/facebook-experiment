namespace :macrodeck do
	desc "Boots the MacroDeck platform"
	task :boot_platform do
		# MacroDeck
		require "macrodeck-platform"
		require "macrodeck-config"

		# Load the config file.
		puts ">>> Loading configuration."
		cfg = MacroDeck::Config.new(File.join(File.dirname(__FILE__), "..", "..", "config", "macrodeck.yml"))

		# Start the MacroDeck platform.
		puts ">>> Starting MacroDeck Platform on #{cfg.db_url}"
		MacroDeck::Platform.start!(cfg.db_url)
		MacroDeck::PlatformDataObjects.define

		puts ">>> MacroDeck Platform started."
	end
end
