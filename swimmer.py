# Winsford ASC Google AppEngine App
#   swimmer.py
#   Provides the Swimmer ndb model, which encapsulates all data for an
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

from event import Event

class Swimmer(ndb.Model):
  """Models an individual swimmer."""
  asa_number = ndb.IntegerProperty()
  first_name = ndb.StringProperty()
  last_name = ndb.StringProperty()
  known_as = ndb.StringProperty()
  date_of_birth = ndb.DateProperty()
  is_male = ndb.BooleanProperty()
  last_updated = ndb.DateProperty()

  @classmethod
  def create(cls, asa_number, club, first_name, last_name, known_as, date_of_birth, is_male):
    club_key = ndb.Key( "Club", club )
    return cls( parent = club_key, id = asa_number, asa_number = asa_number, first_name = first_name, last_name = last_name, known_as = known_as, date_of_birth = date_of_birth, is_male = is_male, last_updated = datetime.datetime.now() )
  
  @classmethod
  def get(cls, club, asa_number):
    club_key = ndb.Key( "Club", club )
    swimmer = cls.get_by_id( asa_number, parent = club_key )
    return swimmer
  
  @classmethod
  def query_club(cls, club):
    club_key = ndb.Key( "Club", club )
    return cls.query( ancestor = club_key ).order( cls.last_name, cls.first_name )
    
  def full_name(self):
    return self.first_name + " " + self.last_name
    
  def date_of_birth_str(self):
    return self.date_of_birth.strftime("%d/%m/%Y")

  # Output the whole Swimmer in string format, with fields separated by '|' characters.
  # This is mirrored in swimmer.js
  def __str__(self):
    gender = "F"
    if self.is_male:
      gender = "M"
    return str( self.asa_number ) + "|" + self.last_name + "|" + self.first_name + "|" + self.known_as + "|" + gender + "|" + self.date_of_birth_str()
