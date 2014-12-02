# Winsford ASC Google AppEngine App
#   user.py
#   Provides the User ndb model, which encapsulates all data for a
#   registered user
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

class User(ndb.Model):
  """Models a user."""
  data = ndb.StringProperty()

  @classmethod
  def pack_data( cls, credentials, name, email):
    packed_data = "V1|" + email + "|" + name + "|" + credentials
    return packed_data

  def unpack_data(self):
    tokens = self.data.split( "|" )
    num_tokens = len( tokens )
    if tokens[0] == "V1":
      self.email = tokens[1]
      self.name = tokens[2]
      self.credentials_str = tokens[3]
    else:
      logging.error( "Unhandled version unpacking '" + self.data + "'" )
  
  @classmethod
  def create(cls, id, credentials, name, email):
    key = ndb.Key( "User", str(id) )
    packed_data = cls.pack_data( credentials, name, email )
    user = cls( key = key, data = packed_data )
    user.put()
    return user
  
  @classmethod
  def get(cls, id):
    key = ndb.Key( "User", str(id) )
    user = key.get()
    if user:
      user.unpack_data()
    return user
