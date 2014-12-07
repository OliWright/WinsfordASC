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
import logging
from google.appengine.ext import ndb
from auth import authomatic

class User(ndb.Model):
  """Models a user."""
  data = ndb.StringProperty()

  @classmethod
  def pack_data( cls, credentials_str, name, email):
    packed_data = "V1|" + email + "|" + name + "|" + credentials_str
    return packed_data

  def unpack_data(self):
    tokens = self.data.split( "|" )
    num_tokens = len( tokens )
    if tokens[0] == "V1":
      self.email = tokens[1]
      self.name = tokens[2]
      self.credentials_str = tokens[3]
      # Deserialise the credentials
      credentials = authomatic.credentials( self.credentials_str )
      if credentials.valid:
        # We've got credentials, and they're valid.
        # Store them in the object.
        self.credentials = credentials
        if credentials.expire_soon(60 * 60 * 24):
          # But there's not much life in them.
          # Try to refresh them.
          logging.info( "Attempting to refresh credentials for " + self.name )
          old_expiration = credentials.expiration_date
          response = credentials.refresh()
          if response:
            new_expiration = credentials.expiration_date

            if response.status == 200:
              logging.info( "Credentials were refreshed successfully. Expiration date was extended from {0} to {1}.".format(old_expiration, new_expiration) )
            else:
              logging.info( "Refresh failed. Status code: {0}. Error: {1}.".format(response.status, response.content) )
          else:
            logging.info( "Credentials for " + self.name + " don't support refresh." )
    else:
      logging.error( "Unhandled version unpacking '" + self.data + "'" )
  
  @classmethod
  def create(cls, id, credentials_str, name, email):
    key = ndb.Key( "User", str(id) )
    logging.info( "Creating user: " + name + ", Credentials: " + credentials_str )
    packed_data = cls.pack_data( credentials_str, name, email )
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
