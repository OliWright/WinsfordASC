# Winsford ASC Google AppEngine App
#   adim.py
#   Provides admin http request.
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

from google.appengine.ext import ndb
from google.appengine.api import taskqueue
from google.appengine.ext import blobstore
from google.appengine.ext.webapp import blobstore_handlers

import helpers
from table_parser import TableRows

from swimmer import Swimmer
from swim import Swim
from swim import scrape_swims
from swim import scrape_personal_bests
from event import Event
from event import short_course_events
from event import long_course_events
from swimmer_parser import scrape_swimmer
from swimmer_parser import scrape_swimmers
from static_data import StaticData

# Helper to scrape swimmingresults.org for ALL recorded swims for a particular
# swimmer in the events specified.
def UpdateSwimsForEvents( swimmer, events, output ):
  for event in events:
    logging.info( event.to_string() )
    ret = scrape_swims( swimmer, event, output )
    if ret is not None:
      # Error
      return ret

def GetNameMatchedSwimmers( name_search ):
  matched = []
  if name_search is not None:
    name_search_len = len( name_search )
    swimmers = Swimmer.query_club( "Winsford" );
    name_search = name_search.lower();
    if (name_search_len == 3) and (name_search[1] == '-'):
      # Ranged update
      start = name_search[0]
      end = name_search[2]
      for swimmer in swimmers:
        letter = swimmer.last_name[0].lower()
        if (letter >= start) and (letter <= end):
          matched.append( swimmer )
    else:
      for swimmer in swimmers:
        if swimmer.last_name.lower().startswith( name_search ):
          matched.append( swimmer )
  return matched
  
# Scrapes swimmingresults.org for ALL recorded swims for a particular swimmer
# in ALL events
class UpdateSwims(webapp2.RequestHandler):
  def post(self):
    self.response.headers['Content-Type'] = 'text/plain'
    asa_numbers = self.request.get_all('asa_number')
    for asa_number in asa_numbers:
      swimmer = Swimmer.get( "Winsford", int( asa_number ) )
      swimmer_name = swimmer.full_name()
      logging.info( "Updating swims for " + swimmer_name )
      ret = UpdateSwimsForEvents( swimmer, short_course_events, self.response.out )
      if ret is not None:
        # Error
        self.response.set_status( ret )
        return
      ret = UpdateSwimsForEvents( swimmer, long_course_events, self.response.out )
      if ret is not None:
        # Error
        self.response.set_status( ret )
        return

# Adds a task to the task queue to scrapes swimmingresults.org for ALL recorded
# swims for a particular swimmer in ALL events
class QueueUpdateSwims(webapp2.RequestHandler):
  def post(self):
    self.response.headers['Content-Type'] = 'text/plain'
    
    # Queue explicit updates
    asa_numbers = self.request.get_all('asa_number')
    for asa_number in asa_numbers:
      self.response.out.write( "Queueing update of swims for " + asa_number + "\n" );
      taskqueue.add(url='/admin/update_swims', params={'asa_number': asa_number})

    # Queue name searched updates
    swimmers = GetNameMatchedSwimmers( self.request.get('name_search') )
    for swimmer in swimmers:
      self.response.out.write( "Queueing update of swims for " + swimmer.full_name() + "\n" );
      taskqueue.add(url='/admin/update_swims', params={'asa_number': str( swimmer.asa_number )})
    
# Scrapes swimmingresults.org for PB swims for a particular swimmer in ALL events
class UpdatePersonalBests(webapp2.RequestHandler):
  def post(self):
    self.response.headers['Content-Type'] = 'text/plain'
    asa_numbers = self.request.get_all('asa_number')
    if len( asa_numbers ) == 0:
      self.response.out.write( "No swimmers specified" )
    for asa_number in asa_numbers:
      swimmer = Swimmer.get( "Winsford", int( asa_number ) )
      if swimmer is None:
        logging.error( "Unable to find swimmer: " + str( asa_number ) )
      else:
        swimmer_name = swimmer.full_name()
        logging.info( "Updating personal bests for " + swimmer_name )
        ret = scrape_personal_bests( swimmer, self.response.out )
        if ret is not None:
          # Error
          self.response.set_status( ret )

# Adds a task to the task queue to scrape swimmingresults.org for PB swims for
# a particular swimmer in ALL events
class QueueUpdatePersonalBests(webapp2.RequestHandler):
  def post(self):
    asa_numbers = self.request.get_all('asa_number')
    for asa_number in asa_numbers:
      logging.info( "Queueing update of personal bests for " + asa_number )
      taskqueue.add(url='/admin/update_personal_bests', params={'asa_number': asa_number})
      self.redirect( '/admin.html' )

class QueueUpdateAllSwimsForAllSwimmers(webapp2.RequestHandler):
  def post(self):
    swimmers = Swimmer.query_club( "Winsford" );
    for swimmer in swimmers:
      asa_number = str(swimmer.asa_number)
      logging.info( "Queueing update of swims for " + swimmer.full_name() )
      taskqueue.add(url='/admin/update_swims', params={'asa_number': asa_number})
    self.redirect( '/admin.html' )

class QueueUpdatePersonalBestsForAllSwimmers(webapp2.RequestHandler):
  def post(self):
    swimmers = Swimmer.query_club( "Winsford" );
    for swimmer in swimmers:
      asa_number = str(swimmer.asa_number)
      logging.info( "Queueing update of personal bests for " + swimmer.full_name() )
      taskqueue.add(url='/admin/update_personal_bests', params={'asa_number': asa_number})
    self.redirect( '/admin.html' )
    
class UpdateSwimmers(webapp2.RequestHandler):
  def post(self):
    name_search = self.request.get('name_search')
    self.response.headers['Content-Type'] = 'text/plain'
    self.response.out.write( "Updating swimmers of name " + name_search + "\n\n" )
    name_search_len = len( name_search )
    if (name_search is not None) and (name_search_len > 0):
      if (name_search_len == 3) and (name_search[1] == '-'):
        # Ranged update
        start = name_search[0]
        end = name_search[2]
        for outer in range( ord(start), ord(end) + 1 ):
          for inner in range( ord('a'), ord('z') + 1 ):
            self.response.out.write( "Queueing up request for " + chr(outer) + chr(inner) + "\n" );
            taskqueue.add(url='/admin/update_swimmers', params={'name_search': chr(outer) + chr(inner)})
      elif name_search.isdigit():
        # ASA number.  Try to add them right now
        scrape_swimmer( "Winsford", int(name_search), self.response )
      elif name_search_len == 1:
        # Single letter search.
        # That's going to put a lot of pressure on swimmingresults.org.
        # So instead we'll queue up 26 requests for every possible pair of letters
        # starting with the one requested
        for letter in range( ord('a'), ord('z') + 1 ):
          self.response.out.write( "Queueing up request for " + name_search + chr(letter) + "\n" );
          taskqueue.add(url='/admin/update_swimmers', params={'name_search': name_search + chr(letter)})
      else:
        # Scrape the swimmers right now
        scrape_swimmers( "Winsford", name_search, self.response )

class UpdateSwimmerList(webapp2.RequestHandler):
  def post(self):
    StaticData.update_swimmer_list()
    self.response.headers['Content-Type'] = 'text/plain'
    self.response.out.write( "Updated swimmer list" )

class Test(webapp2.RequestHandler):
  def post(self):
    swimmer = Swimmer.get( "Winsford", 892569 )
    event = short_course_events[3]
    swim = Swim.fetch_pb( swimmer, event )
    key_str = swim.create_swim_key_str()
    self.response.headers['Content-Type'] = 'text/plain'
    self.response.out.write( key_str + "\n" )
    swim = Swim.get_from_key_str( key_str )
    if swim is not None:
      self.response.out.write( "Hoorah" + str( swim.key.id ) + "\n" )
      
    
app = webapp2.WSGIApplication([
  ('/admin/update_swimmers', UpdateSwimmers),
  ('/admin/update_swims', UpdateSwims),
  ('/admin/update_personal_bests', UpdatePersonalBests),
  ('/admin/queue_update_swims', QueueUpdateSwims),
  ('/admin/queue_update_personal_bests', QueueUpdatePersonalBests),
  ('/admin/queue_update_all_swims', QueueUpdateAllSwimsForAllSwimmers),
  ('/admin/queue_update_all_personal_bests', QueueUpdatePersonalBestsForAllSwimmers),
  ('/admin/update_swimmer_list', UpdateSwimmerList),
  ('/admin/test', Test),
])



