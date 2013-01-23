require "clockwork"
require "rake"

# Load the normal Rakefile.
load File.join(File.dirname(__FILE__), "..", "Rakefile")

module Clockwork
	every(1.hour, "restnap:process:places") do
		Rake::Task["restnap:process:places"].invoke
	end

	every(1.hour, "restnap:process:users") do
		Rake::Task["restnap:process:users"].invoke
	end
end