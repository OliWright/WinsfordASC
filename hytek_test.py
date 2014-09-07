# Winsford ASC Google AppEngine App
#   hytek_test.py
#   Some code to help test the Hy-Tek file importing as a stand-alone
#   python script, without having to run in AppEngine
#
# Copyright (C) 2014 Oliver Wright
#    oli.wright.github@gmail.com
# 
# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; either version 2 of the License, or
# (at your option) any later version.
# 
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
# 
# You should have received a copy of the GNU General Public License along
# with this program (file LICENSE); if not, write to the Free Software Foundation, Inc.,
# 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.

import hytek_hy3_parser
import hytek_helpers
from race_time import RaceTime

# Open a sample HY3 file and parse the lines
f = open('C:\Users\Oli\Documents\TimeTrialResults_11_5_2013.HY3', 'r')
parsed_lines = hytek_hy3_parser.parse( f )
f.close()
# Now take those parsed lines and parse them as race results to get
# a list of swimmers, each with a list of race results
swimmers = hytek_helpers.parse_results( parsed_lines )

# Print them out to show it works....
for swimmer in swimmers:
  print( "Swimmer: " + swimmer.first_name + " " + swimmer.last_name + ", DoB: " + str( swimmer.date_of_birth ) )
  for swim in swimmer.swims:
    print( "Meet: " + swim.meet + ", Date: " + str( swim.date ) + ", Event: " + str( swim.event ) + ", Time: " + str( RaceTime( swim.race_time ) ) )
