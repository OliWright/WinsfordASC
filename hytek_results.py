# Winsford ASC Google AppEngine App
#   hytek_results.py
#   Code for parsing a meet results hy3 file
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

from event import Event
import hytek_helpers

class HyTekResult:
  def __init__(self, first_name, last_name, date_of_birth, meet, date, event, race_time ):
    self.first_name = first_name
    self.last_name = last_name
    self.date_of_birth = date_of_birth
    self.meet = meet
    self.date = date
    self.event = event
    self.race_time = race_time

# Parse a .hy3 file containing meet results.
# Returns an array of HyTekResult objects, each one corresponding to
# a single swimmer's result in a single race
def parse_results_hy3( file_contents ):
  lines = file_contents.splitlines()
  for line in lines:
    parsed_line = hytek_helpers.parse_hy3_line( line )