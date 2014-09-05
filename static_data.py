# Winsford ASC Google AppEngine App
#   static_data.py
#   Support for semi-static blobs of data that we store in the database.
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

from google.appengine.ext import ndb
from swimmer import Swimmer

swimmer_list_key = ndb.Key( "StaticData", 1 )

class StaticData(ndb.Model):
  data = ndb.TextProperty( "Data", indexed=False, required=True )

  @classmethod
  def get_swimmer_list( cls ):
    return swimmer_list_key.get().data

  # Query the Swimmer model and update the single entry containing the entire swimmer list
  @classmethod
  def update_swimmer_list( cls ):
    swimmers = Swimmer.query_club( "Winsford" );
    txt = ""
    for swimmer in swimmers:
      txt += str( swimmer ) + "\n"
    swimmer_list = cls( key = swimmer_list_key, data = txt )
    swimmer_list.put()
