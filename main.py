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
from swim import ScrapeSplits
from event import short_course_events
from event import long_course_events
from event import Event
from race_time import RaceTime
from static_data import StaticData
from user import User

from authomatic import Authomatic
from authomatic.adapters import Webapp2Adapter
from authomatic_config import CONFIG

# Member check URL: https://www.swimmingresults.org/membershipcheck/member_details.php?myiref=smith
# Swim list for member URL: http://www.swimmingresults.org/individualbest/personal_best_time_date.php?back=individualbest&tiref=892569&mode=A&tstroke=1&tcourse=S

# http://www.swimmingresults.org/individualbest/personal_best_time_date.php?back=individualbest&tiref=526253&mode=A&tstroke=1&tcourse=S

# If we find a club member listing, then the club property is likely to be "targetclub" like https://www.swimmingresults.org/clubofficers/officers_list.php?targetclub=FSSTESXQ
# although that looks like it's hashed in some way.   Winsford's code is WINNCHRN
    
# Instantiate Authomatic.
authomatic = Authomatic(config=CONFIG, secret='some random secret string')

class RequestHandler( webapp2.RequestHandler ):
  def check_credentials(self):
    # Check for Cookie user id
    user_id = self.request.cookies.get('user_id')
    if user_id:
      self.user = User.get( user_id )
      #if user:
      # if credentials.valid:
        # # We've got credentials, and they're valid.
        # # Store them in the object.
        # self.credentials = credentials
        # if credentials.expire_soon(60 * 60 * 24):
          # # But there's not much life in them.
          # # Try to refresh them.
          # credentials.refresh()

class PersonalBests(RequestHandler):
  def get(self):
    asa_numbers = self.request.get('asa_numbers', allow_multiple=True)
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
    
    for swim in swims:
      self.response.out.write( str( swim ) + "\n" )

# Create a simple request handler for the login procedure.
class Login(RequestHandler):

  # The handler must accept GET and POST http methods and
  # Accept any HTTP method and catch the "provider_name" URL variable.
  def any(self, provider_name):

    # It all begins with login.
    result = authomatic.login(Webapp2Adapter(self), provider_name)

    # Do not write anything to the response if there is no result!
    if result:
      # If there is result, the login procedure is over and we can write to response.
      self.response.write('<a href="..">Home</a>')

      if result.error:
        # Login procedure finished with an error.
        self.response.write(u'<h2>Damn that error: {}</h2>'.format(result.error.message))

      elif result.user:
        # Hooray, we have the user!

        # OAuth 2.0 and OAuth 1.0a provide only limited user data on login,
        # We need to update the user to get more info.
        if not (result.user.name and result.user.id):
          result.user.update()

        # Welcome the user.
        self.response.write(u'<h1>Hi {}</h1>'.format(result.user.name))
        self.response.write(u'<h2>Your id is: {}</h2>'.format(result.user.id))
        self.response.write(u'<h2>Your email is: {}</h2>'.format(result.user.email))

        # Seems like we're done, but there's more we can do...

        # If there are credentials (only by AuthorizationProvider),
        # we can _access user's protected resources.
        if result.user.credentials:
          self.response.write( 'Credentials: ' + result.user.credentials.serialize() )
          
          # Create a new User in the database
          user = User.create( result.user.id, result.user.credentials.serialize(), result.user.name, result.user.email )
          # Store a user_id cookie so we can retrieve this user
          self.response.set_cookie('user_id', result.user.id)

# Create a home request handler just that you don't have to enter the urls manually.
class SignIn(RequestHandler):
  def get(self):
    # Create links to the Login handler.
    self.response.write('Login with <a href="login/google">Google</a>, <a href="login/fb">Facebook</a> or <a href="login/tw">Twitter</a>.<br />')
    
class GetUser(RequestHandler):
  def get(self):
    self.response.headers['Content-Type'] = 'text/plain'
    self.check_credentials()
    if hasattr( self, "user" ):
      self.response.write( self.user.name )
    
app = webapp2.WSGIApplication([
  ('/personal_bests', PersonalBests),
  ('/swimmer_list', GetSwimmerList),
  ('/swim_details', GetSwimDetails),
  ('/swim_history', GetSwimHistory),
  ('/user', GetUser),
  webapp2.Route(r'/login/<:.*>', Login, handler_method='any'),
])