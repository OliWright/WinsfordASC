# Winsford ASC Google AppEngine App
#   hytek_helpers.py
#   Helper code for parsing Hy-Tek .hy3 files
#   Format details: https://docs.google.com/document/d/1zNQpfehABQrioNL8TF7dCVS7wdYmmbqC66NC7-e1AWA/edit?usp=sharing
#   Many thanks to the person that created that file.
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

from hytek_hy3_parser import Hy3ParsedLine
from event import Event

class Hy3Swimmer:
  def __init__( self, first_name, last_name, date_of_birth ):
    self.first_name = first_name
    self.last_name = last_name
    self.date_of_birth = date_of_birth
    self.swims = []

class Hy3Swim:
  def __init__( self, event, meet, date, race_time ):
    self.event = event
    self.meet = meet
    self.date = date
    self.race_time = race_time

# Conversion of Hy-Tek stroke codes to our codes.
# Seems like overkill to use an associative array to do this, but hey
# it's not going to be called very often.
hytek_stroke_code_to_stroke_id = {}
hytek_stroke_code_to_stroke_id[ "A" ] = 0 # Free
hytek_stroke_code_to_stroke_id[ "B" ] = 3 # Back
hytek_stroke_code_to_stroke_id[ "C" ] = 1 # Breast
hytek_stroke_code_to_stroke_id[ "D" ] = 2 # Fly
hytek_stroke_code_to_stroke_id[ "E" ] = 4 # IM

# Take a parsed meet results hy3 file in the form of an array of Hy3ParsedLine objects
# and parse them, returning an array of Hy3Swimmer, each of which contains
# an array of Hy3Swims.
def parse_results( hy3_parsed_lines ):
  swimmers_by_id = {}
  swimmers = []
  swimmer = None
  event = None
  meet = None
  meet_date = None
  course_code = None
  for line in hy3_parsed_lines:
    if line.line_code == "D1":
      # Swimmer information
      swimmer = Hy3Swimmer( line.first_name, line.last_name, line.date_of_birth )
      swimmers_by_id[ line.swimmer_id ] = swimmer
      swimmers.append( swimmer )
    elif line.line_code == "B1":
      # Meet information
      meet = line.meet_name
      meet_date = line.start_date
    elif line.line_code == "B2":
      # More meet information
      course_code = line.course_code
    elif line.line_code == "E1":
      # Individual entry
      event = Event.create( hytek_stroke_code_to_stroke_id[ line.stroke ], line.distance, course_code )
    elif line.line_code == "E2":
      # Individual result
      date = line.date
      if date is None:
        # The HY3 documentation says there should be a date here, but there doesn't appear to be
        date = meet_date
      swim = Hy3Swim( event, meet, date, line.time )
      swimmer.swims.append( swim )
  return swimmers