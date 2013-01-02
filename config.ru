#!/usr/bin/env ruby

$LOAD_PATH << File.join(File.dirname(__FILE__), "lib")

# Application prerequisites.
require "json"
require "sinatra"
require "omniauth-singly"
require "httparty"
require "aws-sdk"

# MacroDeck
require "macrodeck-platform"
require "macrodeck-config"

# The application
require "application"

# Load the config file.
puts ">>> Loading configuration."
cfg = MacroDeck::Config.new(File.join(File.dirname(__FILE__), "config", "macrodeck.yml"))

# Start the MacroDeck platform.
puts ">>> Starting MacroDeck Platform on #{cfg.db_url}"
MacroDeck::Platform.start!(cfg.db_url)
MacroDeck::PlatformDataObjects.define

puts ">>> MacroDeck Platform started."

run MacroDeck::SinglyController