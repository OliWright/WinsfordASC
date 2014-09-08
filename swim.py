# Winsford ASC Google AppEngine App
#   swim.py
#   Provides the Swim ndb model, which encapsulates all data for an
#   individual's performance in a single race, including split
#   times when available.
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


# Google Python style guide http://google-styleguide.googlecode.com/svn/trunk/pyguide.html
#
# Naming...
# module_name, package_name, ClassName
# method_name, ExceptionName, function_name,
# GLOBAL_CONSTANT_NAME, global_var_name, instance_var_name,
# function_parameter_name, local_var_name
#
# Prefix an _ to indicate privateness

import webapp2
import logging
from google.appengine.ext import ndb
import time
import datetime
import helpers
from event import Event
from lxml import html
from lxml import etree
from table_parser import TableRows
from race_time import RaceTime

def compute_swim_key_id( date, asa_number, event ):  
  # Compute an ID that is a hash of event, date and swimmer
  datehash = ((date.year - 1900) * 365) + (date.month * 31) + date.day
  hash = ((event.to_int() << 24) + datehash) ^ (asa_number << 8)
  return hash

def compute_parent_key_id( asa_number, event ):  
  # Compute a key id that is a hash of event swimmer
  return (event.to_int() << 24) ^ (asa_number << 8)
  
def create_parent_key( asa_number, event ):  
  return ndb.Key( "SwimmerEvent", compute_parent_key_id( asa_number, event ) )
    
class Split():
  def __init__(self, distance, time, interpolated):
    self.distance = distance
    self.time = time
    self.interpolated = interpolated

  def __str__(self):
    return str( self.distance ) + "m : " + str( RaceTime( self.time  ) )
    
# Encapsulates all data for an individual's performance in a single race, including split
# times when available.
class Swim(ndb.Model):
  # We try to minimise the number of NDB properties to minimise the number of read and
  # write operations that we incur, because Google App Engine's pricing is based on those
  # operations rather than something like number of bytes read and written.
  
  # We need to search by age_on_day so this needs to be a real property
  age_on_day = ndb.IntegerProperty( 'AoD', required=True )
  
  # We need to sort by race_time so this needs to be a real property
  race_time = ndb.FloatProperty( 'T', required=True )
  
  # We put everything else into a non-indexed string, so we only pay one read/write-op for it.
  # Don't use JSON because that just adds bloat for something so simple.
  # It pains me to use a string for storing things like float values, I'd much rather use
  # a binary blob, but I suppose I do need to balance coding simplicity vs. efficiency.
  data = ndb.StringProperty( "Data", indexed=False, required=True)
  
  # Creates a string that uniquely identifies this Swim.
  # The key string can be used with get_from_key_str to retrieve this Swim
  def create_swim_key_str( self ):
    # Key string format is <parent_key_id>_<swim_key_id>
    return str( compute_parent_key_id( self.asa_number, self.event ) ) + "_" + str( compute_swim_key_id( self.date, self.asa_number, self.event ) )

  # Retrieves a Swim from the database given a key string that was previously
  # created with create_swim_key_str
  @classmethod
  def get_from_key_str( cls, key_str ):
    # Split into parent key id and swim key id
    tokens = key_str.split( "_" )
    if len( tokens ) != 2:
      logging.error( "Failed to split swim key string" )
      return
    parent_key_id = int( tokens[0] )
    swim_key_id = int( tokens[1] )
    swim = ndb.Key( "SwimmerEvent", parent_key_id, "Swim", swim_key_id ).get()
    if swim is not None:
      swim.unpack_data()
    return swim

  # Internal helper to create most of the packed data string
  @classmethod
  def pack_data( cls, asa_number, event, date, meet, asa_swim_id ):
    data_str = "V1|" + str( asa_number ) + "|" + str(event.to_int()) + "|" + date.strftime( "%d/%m/%Y" ) + "|" + meet + "|"
    if asa_swim_id is not None:
      data_str += str( asa_swim_id )
    else:
      data_str += "-1"
    data_str += "|"
    return data_str

  # Pass split_times_from_asa as a list of known split times as floats.
  # They can have missing splits, and be either 25m or 50m splits.
  #
  # This function will attempt to create a complete list of splits in self.splits
  # by guessing the distances of the provided splits and interpolating
  # any missing splits.
  #
  # It works most of the time but has been known to go wrong on longer IM races
  # because of the non-uniformity of split times.  This should be fixable
  # with a little more thought and some heuristic data on typical split ratios
  # for IM legs.
  def fix_splits(self, split_times_from_asa):
    # The splits from the ASA website are often completely wrong in terms of
    # distance.  And there are often missing splits.
    num_25m_splits = int( self.event.getDistance() / 25 )
    any_splits_on_25m = False
    splits = [None] * num_25m_splits
    for split_time in split_times_from_asa:
      # Guess the distance of this split by looking at the whole race time
      guessed_25m_split = int( round( float( num_25m_splits ) * split_time / self.race_time ) ) - 1
      #logging.info( "Split:" + str( split_time ) + "25m: " + str( guessed_25m_split ) )
      if guessed_25m_split < 0:
        logging.error( "Split time before first 25m" )
        guessed_25m_split = 0
      if guessed_25m_split >= num_25m_splits:
        guessed_25m_split = num_25m_splits - 1
      if (guessed_25m_split & 1) == 0:
        any_splits_on_25m = True
      if splits[ guessed_25m_split ] is not None:
        logging.error( "More than one split in same 25m segment" )
      splits[ guessed_25m_split ] = Split( (guessed_25m_split + 1) * 25, split_time, False )
      
    # Now we fill in any missing splits with interpolated values
    final_split = Split( self.event.getDistance(), self.race_time, False )
    splits[ num_25m_splits - 1 ] = final_split
    previous_good_split = Split( 0, 0, False )
    for i in range( 0, num_25m_splits ):
      if splits[ i ] is None:
        # Find the next known split
        next_good_split = final_split
        for j in range( i + 1, num_25m_splits - 1 ):
          if splits[ j ] is not None:
            next_good_split = splits[j];
            break;
        # Interpolate
        this_split_distance = (i + 1) * 25;
        interp = (float(this_split_distance) - float(previous_good_split.distance)) / (float(next_good_split.distance) - float(previous_good_split.distance))
        splits[ i ] = Split( this_split_distance, previous_good_split.time + (interp * (next_good_split.time - previous_good_split.time)), True )
        #logging.info( "Interp: " + str( i ) + ", " + str( this_split_distance ) + ", " + str( interp ) + ", " + str( splits[ i ].time ) )
      else:
        previous_good_split = splits[i]
        
    # Now we can transfer the splits to self
    if any_splits_on_25m:
      self.splits = splits
    else:
      num_50m_splits = num_25m_splits / 2
      self.splits = [None] * num_50m_splits
      for i in range( 0, num_50m_splits ):
        self.splits[i] = splits[(i*2) + 1]
        #logging.info( str( self.splits[i] ) )
    
  # Internal helper that is called when a Swim has been read from the database.
  # This unpacks the data that is packed into the string, so they're available to read
  # as member variables.
  # Makes heavy use of string tokenising using split.
  def unpack_data(self):
    #logging.info( self.data )
    tokens = self.data.split( "|" )
    num_tokens = len( tokens )
    
    # Figure out what version data we have
    version = 0
    if tokens[0].startswith( "V" ):
      version = int( tokens[0][1:] )
      
    if version == 0:
      # Old version swim data, missing the version number
      self.asa_number = int( tokens[0] )
      self.event = Event( int( tokens[1] ) )
      self.date = helpers.ParseDate_dmY( tokens[2] )
      self.meet = tokens[3]
      self.asa_swim_id = -1
      if len( tokens[4] ) > 0:
        self.asa_swim_id = int( tokens[4] )
      # Ignore any splits data in version 0 because it's most likely nonsense
    else:
      # Version 1 or higher data.
      # Token 0 is the version number.
      self.asa_number = int( tokens[1] )
      self.event = Event( int( tokens[2] ) )
      self.date = helpers.ParseDate_dmY( tokens[3] )
      self.meet = tokens[4]
      self.asa_swim_id = int( tokens[5] )
      # Read the splits
      if tokens[6] == "-":
        # There are no splits available from the ASA for this swim
        self.splits = []
      else:
        split_times_from_asa = []
        splits = tokens[6].split( "," )
        if len(splits) > 1:
          #logging.info( "T:" + tokens[6] + "N: " + str( len(splits) ) )
          for split in splits:
            split_times_from_asa.append( float( split ) )
          self.fix_splits( split_times_from_asa )
    
    if version != 1:
      # Update database with latest version data
      logging.info( "Upgrading swim data to latest version" )
      self.repack_data()
      self.put()
    
  # Internal helper to re-pack self.data if we change something, like adding
  # splits for example.
  def repack_data(self):
    data_str = Swim.pack_data( self.asa_number, self.event, self.date, self.meet, self.asa_swim_id )
    if hasattr( self, 'splits' ):
      if len( self.splits ) == 0:
        # Write a "-" to mean there are no splits for this swim available.
        # This is to prevent us continually going to the ASA website for splits.
        data_str += "-"
      else:
        first = True
        for split in self.splits:
          if not split.interpolated:
            if not first:
              data_str += ","
            data_str += str( split.time )
            first = False
    self.data = data_str
    
  # Returns the asa number of the swimmer that this swim is for.
  def get_asa_swim_id(self):
    if self.asa_swim_id == -1:
      return None
    return self.asa_swim_id
    
  @classmethod
  def create(cls, swimmer, event, date, meet, race_time, asa_swim_id):
    key = create_parent_key( swimmer.asa_number, event )
    id = compute_swim_key_id( date, swimmer.asa_number, event )

    age_on_day = helpers.CalcAge( swimmer.date_of_birth, date )
    data = cls.pack_data( swimmer.asa_number, event, date, meet, asa_swim_id )
    swim = cls( parent = key, id = id, age_on_day = age_on_day, race_time = race_time, data = data )
    swim.unpack_data()
    return swim
 
  # Retrieves a swimmer's PB for an event.
  # Optionally pass the age that you want the PB for.  This can be used to generate
  # club records by finding a swimmer's fastest 200 Free time when they were 11 for example.
  @classmethod
  def fetch_pb(cls, swimmer, event, age_on_day = None ):
    key = create_parent_key( swimmer.asa_number, event )
    if age_on_day is None:
      # We want this swimmer's absolute PB
      swims = cls.query( ancestor=key ).order(cls.race_time).fetch(1)
    else:
      # Fetch this swimmer's PB for the specified age
      swims = cls.query( age_on_day=age_on_day, ancestor=key ).order(cls.race_time)
    if (swims is not None) and (len(swims) > 0):
      swims[0].unpack_data()
      return swims[0]
 
  # Retrieves all a swimmer's swims for an event.
  @classmethod
  def fetch_all(cls, asa_number, event ):
    key = create_parent_key( asa_number, event )
    swims = cls.query( ancestor=key ).order(cls.race_time).fetch()
    for swim in swims:
      swim.unpack_data()
    return swims

  # Convert to string, usually to send to the JS Swim constructor in swim.js
  def __str__(self):
    data_str = str( self.asa_number ) + "|" + str(self.event.to_int()) + "|" + self.date.strftime( "%d/%m/%Y" ) + "|" + self.meet + "|" + str( self.asa_swim_id ) + "|"
    if hasattr( self, 'splits' ):
      first = True
      previous_time = float(0)
      for split in self.splits:
        if not first:
          data_str += ","
        data_str += str( split.time - previous_time )
        if split.interpolated:
          data_str += "I"
        previous_time = split.time
        first = False
    data_str += "|" + str( self.race_time )
    data_str += "|" + self.create_swim_key_str()
    return data_str
      
swims_headers_of_interest = ( "Swim Date", "Meet", "Time" )

# Private helper to scrape a Swim from a pre-parsed table row from a swimmingresults.org page
def _create_swim( swimmer, event, row, output ):
  date = helpers.ParseDate_dmy( row[0].text )
  meet = row[1].text
  swim_time = RaceTime( row[2].text )
  output.write( "Event: " + str(event) + ", Date: " + row[0].text + ", Meet: " + meet + ", Time: " + str( swim_time ) + "\n" )
  asa_swim_id = None;
  if row[2].link is not None:
    # Parse the link which is of the form /splits/?swimid=8349902 to extract the swimid
    pos = row[2].link.find( "swimid=" )
    if pos != -1:
      asa_swim_id = int( row[2].link[pos + 7:] )
      logging.info( "Got swim link: " + str( asa_swim_id ) )
  swim = Swim.create( swimmer, event, date, meet, float( swim_time ), asa_swim_id );
  return swim
      
def scrape_swims( swimmer, event, output ):
  # Parses this kind of page
  # http://www.swimmingresults.org/individualbest/personal_best_time_date.php?back=individualbest&tiref=892569&mode=A&tstroke=1&tcourse=S
  
  # Fetch the swims for this event from swimmingresults.org
  url = "http://www.swimmingresults.org/individualbest/personal_best_time_date.php?back=individualbest&mode=A&tiref=" + str(swimmer.asa_number) + "&tstroke=" + str(event.to_asa_event_number()) + "&tcourse=" + event.to_asa_course_code()
  page = helpers.FetchUrl( url )

  if page is None:
    loggin.error( "Expected page text but got none." )
    return 503
    
  # The ASA individual best times page includes the same information in two tables.
  # The first is sorted by swim time, the second is sorted by date.
  # We only want one of them because they contain the same information, but
  # they both have the same table id of "rankTable".
  # So we just get the first one...
  tree = html.fromstring( page )
  try:
    table = tree.get_element_by_id( "rankTable" )
  except:
    # No table means no swims for this event
    logging.info( "No swims listed for " + swimmer.full_name() + " in " + event.to_string() )
    return
    
  if table is None:
    logging.info( "No table for " + swimmer.full_name() + " in " + event.to_string() )
    return
    
  swims = []
  for row in TableRows( table, swims_headers_of_interest ):
    swims.append( _create_swim( swimmer, event, row, output ) )
  ndb.put_multi( swims )
    
pbs_headers_of_interest = ( "Swim Date", "Meet", "Time", "Stroke" )
    
def scrape_personal_bests( swimmer, output ):
  # Parses this kind of page
  # http://www.swimmingresults.org/individualbest/personal_best.php?back=individualbestname&mode=A&tiref=892569#
  
  # Fetch the swims for this event from swimmingresults.org
  url = "http://www.swimmingresults.org/individualbest/personal_best.php?back=individualbestname&mode=A&tiref=" + str(swimmer.asa_number)
  page = helpers.FetchUrl( url )
  
  if page is None:
    logging.error( "Expected page text but got none." )
    return 503
    
  # The ASA individual best times page is in two tables, both called "rankTable"
  # The first is long course, the second is short course, but if there are no long coures
  # PBs then the long course table is omitted, and visa-versa.  So we can't use the
  # implicit table position to determine whether it's long or short course.
  # Instead we need to go back one element from the table, which is a <p> element
  # containing the text "Long Course" or "Short Course"
  tree = html.fromstring( page )
  if tree is None:
    logging.error( "Unparseable page" )
    return 503

  swims = []
  def ParsePersonalBestsTable( swimmer, table, course_code, output ):
    for row in TableRows( table, pbs_headers_of_interest ):
      # The event as text is in row[3]
      event = Event.create_from_str( str( row[3] ), course_code )
      if event is None:
        logging.error( "Failed to parse event: " + str( row[3] ) + " " + course_code )
      else:
        swims.append( _create_swim( swimmer, event, row, output ) )
    
  tree = tree.get_element_by_id( "outerWrapper" ) # The bit of the page that we're interested in
  for table in tree.iterdescendants( tag="table" ):
    if table.get( key="id", default="" ) == "rankTable":
      # Found a rankTable.
      # Is it long course or short course?
      preceding_paragraph = table.getprevious()
      if preceding_paragraph is None:
        logging.error( "Missing course length identifier before table" )
      elif preceding_paragraph.tag != "p":
        logging.error( "Missing course length identifier paragraph before table" )
      else:
        course_text = helpers.Trim( preceding_paragraph.text )
        if course_text == "Long Course":
          ParsePersonalBestsTable( swimmer, table, "L", output )
        elif course_text == "Short Course":
          ParsePersonalBestsTable( swimmer, table, "S", output )
        else:
          logging.error( "Failed to parse course length from " + course_text )
  if len( swims ) != 0:
    ndb.put_multi( swims )

splits_headers_of_interest = ( "Distance", "Cumulative", "Incremental" )
    
def ScrapeSplits( swim ):
  # Parses this kind of page and adds the results to the swim
  # http://www.swimmingresults.org/splits/?swimid=9744866
  
  if hasattr( swim, 'splits' ):
    # We've already got splits
    logging.error( "Asked to scrape splits, but we've already got some" )
    return
  asa_swim_id = swim.get_asa_swim_id()
  if asa_swim_id is None:
    return
  url = "http://www.swimmingresults.org/splits/?swimid=" + str(asa_swim_id)
  page = helpers.FetchUrl( url )

  if page is None:
    logging.error( "Failed to get page " + url )
    return 503
  tree = html.fromstring( page )
  try:
    table = tree.get_element_by_id( "rankTable" )
  except:
    # No table means no splits for this swim
    logging.info( "No splits for swim " + str(asa_swim_id) )
    swim.splits = []
    # Save this swim with its empty splits back to the database so
    # we know not to keep looking at swimmingresults.org
    swim.repack_data()
    swim.put()
    return
    
  # Parse all the splits that the website has, noting down their distances
  # and figuring out the 'correct' distance between splits.
  # We do this because there might be some splits that are missing that we
  # will need to interpolate.
  split_times_from_asa = []
  for row in TableRows( table, splits_headers_of_interest ):
    split_times_from_asa.append( float( RaceTime( row[1].text ) ) ) 

  swim.fix_splits( split_times_from_asa )
  
  logging.info( "Parsed " + str(len( swim.splits )) + " splits for swim " + str(asa_swim_id) + " : " + str( split_times_from_asa ) )
  # Save this swim with its splits back to the database
  swim.repack_data()
  swim.put()