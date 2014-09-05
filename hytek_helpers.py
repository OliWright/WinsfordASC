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

def parse_results( hy3_parsed_lines ):
  swimmers_by_id = {}
  swimmers = []
  swimmer = None
  event = None
  for line in hy3_parsed_lines:
    if line.line_code == "D1":
      # Swimmer information
      swimmer = Hy3Swimmer( line.first_name, line.last_name, line.date_of_birth )
      swimmers_by_id[ line.swimmer_id ] = swimmer
      swimmers.append( swimmer )
      print( "Swimmer: " + swimmer.first_name + " " + swimmer.last_name + ", DoB: " + str( swimmer.date_of_birth ) )
    elif line.line_code == "E1":
      # Individual entry
      event = 