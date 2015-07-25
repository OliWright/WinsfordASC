# Winsford ASC Google AppEngine App
#   main.py
#   Entry point for most http requests.
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

import webapp2

import helpers

from swimmer import Swimmer
from swim import Swim
from unofficialswim import UnofficialSwim
from swim import ScrapeSplits
from event import short_course_events
from event import long_course_events
from event import Event
from race_time import RaceTime
from static_data import StaticData

# Member check URL: https://www.swimmingresults.org/membershipcheck/member_details.php?myiref=smith
# Swim list for member URL: http://www.swimmingresults.org/individualbest/personal_best_time_date.php?back=individualbest&tiref=892569&mode=A&tstroke=1&tcourse=S

# http://www.swimmingresults.org/individualbest/personal_best_time_date.php?back=individualbest&tiref=526253&mode=A&tstroke=1&tcourse=S

# If we find a club member listing, then the club property is likely to be "targetclub" like https://www.swimmingresults.org/clubofficers/officers_list.php?targetclub=FSSTESXQ
# although that looks like it's hashed in some way.   Winsford's code is WINNCHRN

class RequestHandler( webapp2.RequestHandler ):
  def check_credentials(self):
    # Check for Cookie user id
    user_id = self.request.cookies.get('user_id')
    if user_id:
      self.user = User.get( user_id )

class PersonalBests(RequestHandler):
  def get(self):
    asa_numbers = self.request.get_all('asa_numbers')
    num_swimmers = len( asa_numbers )
    self.response.headers['Content-Type'] = 'text/plain'
    if num_swimmers == 0:
      # Show error page
      self.response.out( "Missing asa_numbers parameters" )
    else:
      # Collate list of swimmers
      swimmers = []
      for asa_number in asa_numbers:
        swimmer = Swimmer.get( "Winsford", int(asa_number) )
        if swimmer is not None:
          swimmers.append( swimmer )
      
      def listEvents( events ):
        for event in events:
          self.response.out.write( event.to_string() )
          # Write a '^' separated list of PB swims of each requested swimmer.
          # Leave blank if the swimmer has no PB for this event.
          for swimmer in swimmers:
            self.response.out.write('^')
            swim = Swim.fetch_pb( swimmer, event )
            if swim is not None:
              self.response.out.write( str( swim )  )
          self.response.out.write( '\n' )

      listEvents( short_course_events )
      listEvents( long_course_events )
        
class GetSwimmerList(RequestHandler):
  def get(self):
    self.response.headers['Content-Type'] = 'text/plain'
    self.response.out.write( StaticData.get_swimmer_list() )
        
class GetSwimDetails(RequestHandler):
  def get(self):
    self.response.headers['Content-Type'] = 'text/plain'
    swim_key_str = self.request.get('swim')
    if swim_key_str is None:
      self.response.out.write( "Missing swim key" )
      return
    swim = Swim.get_from_key_str( swim_key_str )
    if swim is None:
      self.response.out.write( "Unrecognised swim key: " + swim_key_str )
      return
    if swim.get_asa_swim_id() is not None:
      # This swim has an ASA swim id, so that means there should be
      # split times available for it.
      if not hasattr(swim, 'splits' ):
        # Try and get them from swimmingresults.org
        ScrapeSplits( swim )

    self.response.out.write( str( swim ) )

# Expects attributes for asa_number, stroke_id and distance in the URL
# Returns a list of all swims.
class GetSwimHistory(RequestHandler):
  def get(self):
    self.response.headers['Content-Type'] = 'text/plain'
    asa_number_str = self.request.get('asa_number')
    if asa_number_str == '':
      self.response.out.write( "Missing asa_number" )
      self.response.set_status( 400 )
      return
    stroke_code_str = self.request.get('stroke_code')
    if stroke_code_str == '':
      self.response.out.write( "Missing stroke_code" )
      self.response.set_status( 400 )
      return
    distance_str = self.request.get('distance')
    if distance_str == '':
      self.response.out.write( "Missing distance" )
      self.response.set_status( 400 )
      return
    asa_number = int(asa_number_str)
    stroke_code = int(stroke_code_str)
    distance = int(distance_str)
    
    swims = Swim.fetch_all( asa_number, Event.create( stroke_code, distance, "S" ) )
    swims.extend( Swim.fetch_all( asa_number, Event.create( stroke_code, distance, "L" ) ) )
    swims.extend( UnofficialSwim.fetch_all( asa_number, Event.create( stroke_code, distance, "S" ) ) )
    swims.extend( UnofficialSwim.fetch_all( asa_number, Event.create( stroke_code, distance, "L" ) ) )
    
    for swim in swims:
      self.response.out.write( str( swim ) + "\n" )
    
app = webapp2.WSGIApplication([
  ('/personal_bests', PersonalBests),
  ('/swimmer_list', GetSwimmerList),
  ('/swim_details', GetSwimDetails),
  ('/swim_history', GetSwimHistory),
])