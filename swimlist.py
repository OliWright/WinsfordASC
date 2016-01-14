# Winsford ASC Google AppEngine App
#   swmilist.py
#   Provides the SwimList ndb model, which encapsulates all swims for an
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
import logging
import helpers

from oauth2client.appengine import AppAssertionCredentials

# Run the 'monkeypatch' to fix the requests module to work in GAE
# This is required for gspread to work properly in GAE
from requests_toolbelt.adapters import appengine
appengine.monkeypatch()

import gspread
import httplib2
from google.appengine.api import memcache

from google.appengine.ext import ndb
from swim import Swim
from unofficialswim import UnofficialSwim

from event import Event
from event import short_course_events
from event import long_course_events

_NUM_WORKSHEET_COLUMNS = 7

scope = 'https://spreadsheets.google.com/feeds https://docs.google.com/feeds'
credentials = None
# Get the app's credentials scpoed to access google sheets and initialise gspread
gc = None

def _get_spreadsheet():
  # Open the swim data spreadsheet.
  # The following accounts need to be given edit access from the spreadsheet..
  #    google-apps-service@winsford-asc.iam.gserviceaccount.com   To be able to work in the dev environment
  #    winsford-asc@appspot.gserviceaccount.com                   To be able to work in the production environment
  logging.info( "Attempting to access google sheet swim database" )
  credentials = AppAssertionCredentials( scope )
  # Get the app's credentials scpoed to access google sheets and initialise gspread
  gc = gspread.authorize( credentials )
  try:
    sheet = gc.open_by_key( "1nXyDM4GeVDKWE45RI3SdHioTUcch1NSQhRAuBtX3rrA" )
    return sheet
  except gspread.AuthenticationError:
    logging.info( 'Failed to open google sheet. AuthenticationError.' )
  except gspread.SpreadsheetNotFound:
    logging.info( 'Failed to open google sheet. SpreadsheetNotFound.' )
  except:
    logging.info( 'Failed to open google sheet. Unhandled exception.' )

class SwimList(ndb.Model):
  """Models all the swims for an individual swimmer."""
  swims = ndb.TextProperty( "Swims", required=True )

  # Create a SwimList for a swimmer and populate it with all their swims
  @classmethod
  def create(cls, asa_number):
    swimlist = cls( id = asa_number, swims = "" )
    swimlist.asa_number = asa_number
    
    # Create the google sheet worksheet for this swimmer
    sheet = _get_spreadsheet()
    if sheet is not None:
      asa_number_str = str( asa_number )
      try:
        # If there's an existing worksheet for this swimmer, then delete it
        ws = sheet.worksheet( asa_number_str )
        sheet.del_worksheet( ws )
      except gspread.WorksheetNotFound:
        # No existing worksheet
        pass
      logging.info( 'Creating worksheet for ' + asa_number_str )
      ws = sheet.add_worksheet( asa_number_str, 1, _NUM_WORKSHEET_COLUMNS )
      
      values = [ None ] * _NUM_WORKSHEET_COLUMNS
      values[0] = "Date"
      values[1] = "Event"
      values[2] = "Meet"
      values[3] = "License"
      values[4] = "Time"
      values[5] = "Splits"
      values[6] = "Id"
      ws.update_row( values, 1 )
    
    licensed_swims = []
    unlicensed_swims = []
    for event in short_course_events:
      licensed_swims.extend( Swim.fetch_all( asa_number, event ) )
      unlicensed_swims.extend( UnofficialSwim.fetch_all( asa_number, event ) )
    for event in long_course_events:
      licensed_swims.extend( Swim.fetch_all( asa_number, event ) )
      unlicensed_swims.extend( UnofficialSwim.fetch_all( asa_number, event ) )
    swimlist.append_swims( licensed_swims, licensed=True, check_if_already_exist=False, sheet=sheet )
    swimlist.append_swims( unlicensed_swims, licensed=False, check_if_already_exist=False, sheet=sheet )
    return swimlist
  
  # Retrieve a SwimList by ASA id
  @classmethod
  def get(cls, asa_number):
    swimlist = cls.get_by_id( asa_number )
    if swimlist is not None:
      swimlist.asa_number = asa_number
    return swimlist
  
  # Append multiple swims to a swimlist
  def append_swims(self, swims, licensed=True, check_if_already_exist=False, sheet=None):
    #logging.info( 'Appending ' + str( len( swims ) ) + ' swims' )
    if check_if_already_exist:
      # Iterate over the lines in self.swims, generating a hash
      # for each swim based on event and date, and add them to a set
      existing_swims = set()
      
      prevnl = -1
      full_length = len( self.swims )
      if full_length > 0:
        while True:
          nextnl = self.swims.find('\n', prevnl + 1)
          line_end = nextnl
          if line_end < 0:
            line_end = full_length
        
          # Skip the version
          bar = self.swims.find('|', prevnl + 1)
          # Skip the asa_number
          bar = self.swims.find('|', bar + 1)
          # Read the event code
          nextbar = self.swims.find('|', bar + 1)
          event_code = int( self.swims[bar + 1:nextbar])
          # Read the date
          bar = nextbar
          nextbar = self.swims.find('|', bar + 1)
          #date = helpers.ParseDate_dmY( self.swims[bar + 1:nextbar])
          # Read the meet
          bar = nextbar
          nextbar = self.swims.find('|', bar + 1)
          meet = self.swims[bar + 1:nextbar]
          # Read the time
          bar = line_end - 1
          while self.swims[bar] != '|':
            bar = bar - 1
          race_time_str = self.swims[bar + 1:line_end]
          
          # Generate a hash and add it to the set 
          hash_value = hash( (event_code, meet, float(race_time_str) ) )
          #logging.info( 'Swim hash for ' + str(event_code) + ', ' + meet + ': ' + str( hash_value ) )
          existing_swims.add( hash_value )
      
          if nextnl < 0: break
          prevnl = nextnl  

      # Make a new list of swims that aren't in the set
      added_swims = []
      # Now append the swims if they're not in the set already
      for swim in swims:
        hash_value = hash( (swim.event.event_code, swim.meet, swim.race_time ) )
        if hash_value not in existing_swims:
          #logging.info( 'Appending ' + str(swim.event.event_code) + ', ' + str( swim.meet ) + ': ' + str( hash_value ) )
          added_swims.append( swim )
        #else:
          #logging.info( 'Skipping ' + str(swim.event.event_code) + ', ' + str( swim.date ) + ': ' + str( hash ) )
          
      self.append_swims( added_swims, licensed = licensed, check_if_already_exist = False, sheet = sheet )
      return added_swims
    else:
      num_swims = len( swims )
      if num_swims > 0:
        for swim in swims:
          self._append_swim( swim, licensed )
        # Append the swims to the google sheet worksheet for this swimmer
        if sheet is None:
          sheet = _get_spreadsheet()
        if sheet is not None:
          # Open the worksheet
          asa_number_str = str( self.asa_number )
          ws = None
          try:
            ws = sheet.worksheet( asa_number_str )
          except gspread.WorksheetNotFound:
            logging.error( 'Missing worksheet for ' + asa_number_str )

          if ws is not None:
            # Add new data for the swims
            start_row = ws.row_count
            rows = []
            for i in range(0, num_swims):
              values = [ None ] * _NUM_WORKSHEET_COLUMNS
              swim = swims[i];
              values[0] = swim.date
              values[1] = swim.event.short_name()
              values[2] = swim.meet
              if licensed:
                values[3] = 'y'
              else:
                values[3] = 'n'
              values[4] = swim.race_time
              values[5] = swim.splits_str
              if swim.asa_swim_id != -1:
                values[6] = swim.asa_swim_id
              else:
                values[6] = ""
              rows.append( values )
            #logging.info( "Adding rows" )
            ws.append_rows( rows )
            #logging.info( "Finished adding rows" )
      return swims
      
  # Append an individual swim to a SwimList
  def _append_swim(self, swim, licensed=True):
    swim_str = swim.data
    if licensed:
      swim_str += '|y|'
    else:
      swim_str += '|n|'
    swim_str += str( swim.race_time )
    if len( self.swims ) > 0:
      self.swims += '\n'
    self.swims += swim_str

  # Output the whole swims field
  def __str__(self):
    return self.swims
