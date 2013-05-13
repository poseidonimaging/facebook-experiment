require "bundler"
require "aws-sdk"
require "json"
require "uuidtools"
require "rest_client"

require "lib/address_comparator"
require "lib/restnap/utils/geocode_address"
require "lib/restnap/utils/get_public_fb_profile"

AWS_ACCESS_KEY = "AKIAINPARSP7PEW7I6DA"
AWS_SECRET_KEY = "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"

SQS_DATA_WITH_LOCATIONS_URL = "https://sqs.us-east-1.amazonaws.com/766921168018/RestNap_OpenGraph_DataWithLocations"
SQS_PLACES_URL = "https://sqs.us-east-1.amazonaws.com/766921168018/RestNap_OpenGraph_Places"
SQS_USERS_URL = "https://sqs.us-east-1.amazonaws.com/766921168018/RestNap_OpenGraph_Users"
SQS_FRIENDS_URL = "https://sqs.us-east-1.amazonaws.com/766921168018/RestNap_OpenGraph_Friends"

FB_GRAPH_BASE = "https://graph.facebook.com"

Dir.glob("lib/tasks/*.rake").each { |r| import r }
