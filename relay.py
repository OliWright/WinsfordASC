# Winsford ASC Google AppEngine App
#   relay.py
#   Supports http requests from the JavaScript relay team generator.
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

import logging
import datetime

import webapp2
import lxml

import helpers

from swimmer import Swimmer
from swim import Swim
from event import Event
from event import short_course_events
from event import long_course_events
from race_time import RaceTime

class Relay:
  """Encapsulation of a relay definition"""
  is_male = True
  distance = 50
  is_im = False
  min_age = 9
  max_age = 200
  date = datetime.date.today()
  error = False

  def __init__(self, request): 
    distance_str = request.get('distance')
    gender_str = request.get('gender')
    min_age_str = request.get('min_age')
    max_age_str = request.get('max_age')
    date_str = request.get('date')
    # Validate args
    if (distance_str is None) or (gender_str is None) or (min_age_str is None) or (max_age_str is None) or (date_str is None):
      self.error = True
      return
    self.is_male = (gender_str[0:1] == "M")
    self.distance = int( distance_str )
    self.min_age = int( min_age_str )
    self.max_age = int( max_age_str )
    self.date = helpers.ParseDate_dmY( date_str )

def GetCandidates( relay, stroke, swimmers ):
  candidates = []
  shortCourseEvent = Event.create( stroke, relay.distance, "S" )
  longCourseEvent = Event.create( stroke, relay.distance, "L" )
  
  for swimmer in swimmers:
    if swimmer.is_male == relay.is_male:
      age_on_day = helpers.CalcAge( swimmer.date_of_birth, relay.date )
      if (age_on_day >= relay.min_age) and (age_on_day <= relay.max_age):
        # Get this swimmer's PB
        scPbSwim = Swim.fetch_pb( swimmer, shortCourseEvent )
        lcPbSwim = Swim.fetch_pb( swimmer, longCourseEvent )
        pbRaceTime = None
        if scPbSwim is None:
          if lcPbSwim is not None:
            pbRaceTime = longCourseEvent.convertTime( lcPbSwim.race_time )
        else:
          pbRaceTime = scPbSwim.race_time
          #logging.info( swimmer.full_name() + str( scPbSwim.race_time ) + "  " + str( pbRaceTime )   )
          if lcPbSwim is not None:
            lcConvertedRaceTime = longCourseEvent.convertTime( lcPbSwim.race_time )
            if lcConvertedRaceTime < pbRaceTime:
              pbRaceTime = lcConvertedRaceTime
          
        #logging.info( swimmer.full_name() + " Age: " + str( age_on_day ) )
        if pbRaceTime is not None:
          #logging.info( swimmer.full_name() + " PB: " + str( age_on_day ) )
          swimmer.relay_time = pbRaceTime
          swimmer.age_on_day = age_on_day
          candidates.append( swimmer )

  candidates.sort( key = lambda swimmer: swimmer.relay_time )
  return candidates;

def ListCandidates( candidates, output ):
  output.write( str( len( candidates ) ) + "\n" )
  for swimmer in candidates:
    output.write( str( swimmer ) + '#' + str( swimmer.relay_time ) + "\n" )
  
class FreeStyleRelay(webapp2.RequestHandler):
  def get(self):
    self.response.headers['Content-Type'] = 'text/plain'
    relay = Relay( self.request )
    if relay.error:
      self.response.out.write( "Missing args" )
      return
    
    # First we filter the swimmers for those who meet the gender and age criteria
    swimmers = Swimmer.query_club( "Winsford" )

    candidates = GetCandidates( relay, 0, swimmers )
    ListCandidates( candidates, self.response.out )

class ImRelay(webapp2.RequestHandler):
  def get(self):
    self.response.headers['Content-Type'] = 'text/plain'
    relay = Relay( self.request )
    if relay.error:
      self.response.out.write( "Missing args" )
      return
    
    # First we filter the swimmers for those who meet the gender and age criteria
    swimmers = Swimmer.query_club( "Winsford" )

    for stroke in range(0, 4):
      candidates = GetCandidates( relay, stroke, swimmers )
      ListCandidates( candidates, self.response.out )

      
app = webapp2.WSGIApplication([
  ('/relay/free', FreeStyleRelay),
  ('/relay/im', ImRelay),
])