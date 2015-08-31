# Winsford ASC Google AppEngine App
#   swmilist.py
#   Provides the SwimList ndb model, which encapsulates all swims for an
#   individual cat2 swimmer
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
# 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.import logging

import webapp2
import datetime
from google.appengine.ext import ndb
from swim import Swim
from unofficialswim import UnofficialSwim

from event import Event
from event import short_course_events
from event import long_course_events

class SwimList(ndb.Model):
  """Models all the swims for an individual swimmer."""
  swims = ndb.TextProperty( "Swims", required=True )

  @classmethod
  def create(cls, asa_number):
    swimlist = cls( id = asa_number, swims = "" )
    for event in short_course_events:
      swimlist.append_swims( Swim.fetch_all( asa_number, event ) )
      swimlist.append_swims( UnofficialSwim.fetch_all( asa_number, event ), licensed=False )
    for event in long_course_events:
      swimlist.append_swims( Swim.fetch_all( asa_number, event ) )
      swimlist.append_swims( UnofficialSwim.fetch_all( asa_number, event ), licensed=False )
    return swimlist
  
  @classmethod
  def get(cls, asa_number):
    return cls.get_by_id( asa_number )
  
  def append_swims(self, swims, licensed=True):
    for swim in swims:
      self.append_swim( swim, licensed )
    
  def append_swim(self, swim, licensed=True):
    swim_str = swim.data
    if licensed:
      swim_str += '|y|'
    else:
      swim_str += '|n|'
    swim_str += str( swim.race_time )
    if len( self.swims ) > 0:
      self.swims += '\n'
    self.swims += swim_str

  # Output the whole swims field
  def __str__(self):
    return self.swims
