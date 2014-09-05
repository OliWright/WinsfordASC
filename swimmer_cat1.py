# Winsford ASC Google AppEngine App
#   swimmer.py
#   Provides the SwimmerCat1 ndb model, which encapsulates all data for an
#   individual cat1 swimmer
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
from google.appengine.ext import ndb
import datetime

from event import Event

# This is the only data we keep for a Cat1 swimmer because they are not
# eligable to compete.
# We keep these records so we can avoid going to swimming.org to look
# them up too frequently
class SwimmerCat1(ndb.Model):
  """Models a cat1 swimmer."""
  asa_number = ndb.IntegerProperty()
  first_name = ndb.StringProperty()
  last_name = ndb.StringProperty()
  last_updated = ndb.DateProperty()

  @classmethod
  def create(cls, asa_number, club, first_name, last_name):
    club_key = ndb.Key( "Club", club )
    return cls( parent = club_key, id = asa_number, asa_number = asa_number, first_name = first_name, last_name = last_name, last_updated = datetime.datetime.now() )
  
  @classmethod
  def get(cls, club, asa_number):
    club_key = ndb.Key( "Club", club )
    swimmer = cls.get_by_id( asa_number, parent = club_key )
    return swimmer
  
  @classmethod
  def query_club(cls, club):
    club_key = ndb.Key( "Club", club )
    return cls.query(ancestor=club_key)
    
  def full_name(self):
    return self.first_name + " " + self.last_name
