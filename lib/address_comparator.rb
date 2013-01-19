module MacroDeck
	# A simple class that compares two addresses for equality.
	#
	# It does so by removing all postal suffixes and leaving the
	# important address parts.
	#
	# Of course, you will need to include as much information as you
	# can in the address, because 1234 4th Pl and 1234 4th St will be
	# compared as equal.
	class AddressComparator
		POSTAL_SUFFIXES = [ "aly", "anx", "arc", "ave",
				    "byu", "bch", "bnd", "blf", "blfs", "btm", "blvd", "br", "brg", "brk", "brks", "bg", "bgs", "byp",
				    "cp", "cyn", "cpe", "cswy", "ctr", "ctrs", "cir", "cirs", "clf", "clfs", "clb", "cmn", "cmns", "cor", "cors", "crse", "ct", "cts", "cv", "cvs", "crk", "cres", "crst", "xing", "xrd", "xrds", "curv",
				    "dl", "dm", "dv", "dr", "drs",
				    "est", "ests", "expy", "ext", "exts",
				    "fall", "fls", "fry", "fld", "flds", "flt", "flts", "frd", "frds", "frst", "frg", "frgs", "frk", "frks", "ft", "fwy",
				    "gdn", "gdns", "gtwy", "gln", "glns", "grn", "grns", "grv", "grvs",
				    "hbr", "hbrs", "hvn", "hts", "hwy", "hl", "hls", "holw",
				    "inlt", "is", "iss", "isle",
				    "jct", "jcts",
				    "ky", "kys", "knl", "knls",
				    "lk", "lks", "land", "lndg", "ln", "lgt", "lgts", "lf", "lck", "lcks", "ldg", "loop",
				    "mall", "mnr", "mnrs", "mdw", "mdws", "mews", "ml", "mls", "msn", "mtwy", "mt", "mtn", "mtns",
				    "nck",
				    "orch", "oval", "opas",
				    "park", "pkwy", "pass", "psge", "path", "pike", "pne", "pnes", "pl", "pln", "plns", "plz", "pt", "pts", "prt", "prts", "pr",
				    "radl", "ramp", "rnch", "rpd", "rpds", "rst", "rdg", "rdgs", "riv", "rd", "rds", "rte", "row", "rue", "run",
				    "shl", "shls", "shr", "shrs", "skwy", "spg", "spgs", "spur", "sq", "sqs", "sta", "stra", "strm", "st", "sts", "smt",
				    "ter", "trwy", "trce", "trak", "trfy", "trl", "trlr", "trlr", "tunl", "tpke",
				    "upas", "un", "uns",
				    "vly", "vlys", "via", "vw", "vws", "vlg", "vlgs", "vl", "vis",
				    "walk", "wall", "way", "ways", "wl", "wls",
				    "apt", "bsmt", "bldg", "dept", "fl", "frnt", "hngr", "key", "lbby", "lot", "lowr", "ofc", "ph", "pier", "rear", "rm", "side", "slip", "spc", "stop", "ste", "trlr", "unit", "uppr",
				    "n", "s", "e", "w", "ne", "nw", "se", "sw",
				    "north", "south", "east", "west", "northeast", "northwest", "southeast", "southwest",
				    "suite", "street", "circle", "drive", "road", "boulevard"
				  ]

		# Compares address1 with address2 and returns true if we think they're equal. Probably a good idea to include
		# the address's zip code.
		#
		# @param [String] address1
		# 	The first address to compare.
		# @param [String] address2
		# 	The second address to compare.
		# @return [true, false] If address1 and address2 are considered to be equal.
		def self.compare(address1, address2)
			# Remove all special characters.
			address1_no_special = address1.strip.gsub(/[^ A-Za-z0-9]/, "")
			address2_no_special = address2.strip.gsub(/[^ A-Za-z0-9]/, "")

			# Now split the addresses into tokens.
			address1_split = address1_no_special.split(" ")
			address2_split = address2_no_special.split(" ")

			# And then we check if there are tokens we can remove.
			[address1_split, address2_split].each do |address|
				address.collect! do |address_token|
					if POSTAL_SUFFIXES.include?(address_token.downcase)
						nil
					else
						address_token.downcase
					end
				end
			end

			# Now compare the remaining address tokens and return true or false.
			if address1_split.compact.join(" ") == address2_split.compact.join(" ")
				return true
			else
				return false
			end
		end
	end
end