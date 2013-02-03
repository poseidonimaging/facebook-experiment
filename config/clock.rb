require "clockwork"
require "rake"

# Load the normal Rakefile.
load File.join(File.dirname(__FILE__), "..", "Rakefile")

module Clockwork
	every(1.hour, "restnap:process:places") do
		Rake::Task["restnap:process:places"].invoke
	end

	every(5.minutes, "restnap:process:users") do
		Rake::Task["restnap:process:users"].invoke
	end

	every(5.minutes, "restnap:process:friends") do
		Rake::Task["restnap:process:friends"].invoke
	end
end