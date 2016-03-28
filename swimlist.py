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
from google.appengine.api import taskqueue

from google.appengine.ext import ndb
from swim import Swim
from swim import unpack_swim_string
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
    
# Simple object to hold the data contained in a single row of the SwimData
# without using a full-fat Swim.
class SimpleSwim():
  def __init__( self, str ):
    unpack_swim_string( str, self, is_swim_list=True )

class SwimList(ndb.Model):
  """Models all the swims for an individual swimmer."""
  swims = ndb.TextProperty( "Swims", required=True )

  # Create a SwimList for a swimmer and populate it with all their swims
  @classmethod
  def create(cls, asa_number):
    swimlist = cls( id = asa_number, swims = "" )
    swimlist.asa_number = asa_number

    licensed_swims = []
    unlicensed_swims = []
    for event in short_course_events:
      licensed_swims.extend( Swim.fetch_all( asa_number, event ) )
      unlicensed_swims.extend( UnofficialSwim.fetch_all( asa_number, event ) )
    for event in long_course_events:
      licensed_swims.extend( Swim.fetch_all( asa_number, event ) )
      unlicensed_swims.extend( UnofficialSwim.fetch_all( asa_number, event ) )
    swimlist.append_swims( licensed_swims, licensed=True, check_if_already_exist=False )
    swimlist.append_swims( unlicensed_swims, licensed=False, check_if_already_exist=False )
    return swimlist
  
  # Retrieve a SwimList by ASA id
  @classmethod
  def get(cls, asa_number):
    swimlist = cls.get_by_id( asa_number )
    if swimlist is not None:
      swimlist.asa_number = asa_number
    return swimlist
  
  # Append multiple swims to a swimlist
  def append_swims(self, swims, licensed=True, check_if_already_exist=False):
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
          
      self.append_swims( added_swims, licensed = licensed, check_if_already_exist = False )
      return added_swims
    else:
      num_swims = len( swims )
      if num_swims > 0:
        for swim in swims:
          self._append_swim( swim, licensed )
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
    
  def _parse_data( self ):
    full_length = len( self.swims )
    #logging.info( "Parsing swims ")
    simple_swims = []
    if full_length > 0:
      prevln = -1
      while True:
        line_start = prevln + 1
        nextnl = self.swims.find('\n', line_start)
        line_end = nextnl
        if line_end < 0:
          line_end = full_length
        #logging.info( self.swims[line_start:line_end] )
        simple_swims.append( SimpleSwim( self.swims[line_start:line_end] ) )

        if nextnl < 0: break
        prevln = nextnl  
        
    return simple_swims
    
  def update_google_sheet( self ):
    sheet = _get_spreadsheet()
    if sheet is None:
      logging.error( "Failed to access spreasheet" )
      return 503
    else:
      # Parse the swim text into an array of SimpleSwims
      simple_swims = self._parse_data()
      num_simple_swims = len( simple_swims )
      # Open or create the google sheet worksheet for this swimmer
      asa_number_str = str( self.asa_number )
      do_spreadsheet_update = False
      try:
        # If there's an existing worksheet for this swimmer, then delete it
        ws = sheet.worksheet( asa_number_str )
        # See how many rows the spreadsheet has.
        if ws.row_count != (num_simple_swims+1):
          # It's incomplete.
          # We could mess around trying to add what's missing, or we could just
          # re-do the whole thing.
          # Let's just re-do the whole thing, then we'll be sure to get any
          # splits that might have been missed along the way..
          logging.info( "Deleting worksheet for " + asa_number_str + " (has " + str( ws.row_count) + " rows, needs " + str(num_simple_swims+1) + ")" )
          do_spreadsheet_update = True
          sheet.del_worksheet( ws )
      except gspread.WorksheetNotFound:
        # No existing worksheet
        do_spreadsheet_update = True
        pass
        
      if do_spreadsheet_update:
        logging.info( 'Creating worksheet for ' + asa_number_str )
        try:
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
        
          # Append the swims to the google sheet worksheet for this swimmer
          rows = []
          for swim in simple_swims:
            values = [ None ] * _NUM_WORKSHEET_COLUMNS
            values[0] = swim.date
            values[1] = swim.event.short_name()
            values[2] = swim.meet
            values[3] = swim.licence
            values[4] = swim.race_time
            values[5] = swim.splits_str
            if swim.asa_swim_id != -1:
              values[6] = swim.asa_swim_id
            else:
              values[6] = ""
            rows.append( values )
          ws.append_rows( rows )
          logging.info( "Success creating worksheet for " + asa_number_str )
        except gspread.GSpreadException:
          logging.error( "Exception creating worksheet for " + asa_number_str )
          return 503
      else:
        logging.info( "Skipping update of worksheet for " + asa_number_str + " because already up-to-date" )
    
  def queue_update_google_sheet( self ):
    taskqueue.add(url='/admin/update_google_sheet', params={'asa_number': str( self.asa_number ) })
    