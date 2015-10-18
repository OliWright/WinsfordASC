# Winsford ASC Google AppEngine App
#   parsed_meet.py
#   Provides the ParsedMeet ndb model, which contains no data, but just
#   indicates which meets we have already parsed.
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
import logging
import helpers

from google.appengine.ext import ndb

class ParsedMeet(ndb.Model):
  """Indicates which ASA meet codes have already been parsed."""

  @classmethod
  def create(cls, asa_meet_code):
    return cls( id = asa_meet_code )
  
  @classmethod
  def get(cls, asa_meet_code):
    return cls.get_by_id( asa_meet_code )

def has_meet_been_parsed( asa_meet_code ):
  return ParsedMeet.get( asa_meet_code ) is not None

def meet_has_been_parsed( asa_meet_code ):
  ParsedMeet.create( asa_meet_code ).put()