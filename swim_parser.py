# Winsford ASC Google AppEngine App
#   swim_parser.py
#   Scrapes swims from www.swimmingresults.org
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
from swim import Swim
from swim import Split
from swimlist import SwimList
      
swims_headers_of_interest = ( "Swim Date", "Meet", "Time" )

def get_asa_swim_id( race_time_cell ):
  if race_time_cell.link is not None:
    # Parse the link which is of the form /splits/?swimid=8349902 to extract the swimid
    pos = race_time_cell.link.find( "swimid=" )
    if pos != -1:
      asa_swim_id = int( race_time_cell.link[pos + 7:] )
      logging.info( "Got swim link: " + str( asa_swim_id ) )
      return asa_swim_id

# Private helper to scrape a Swim from a pre-parsed table row from a swimmingresults.org page
def _create_swim( swimmer, event, row, output ):
  date = helpers.ParseDate_dmy( row[0].text )
  meet = row[1].text
  swim_time = RaceTime( row[2].text )
  output.write( "Event: " + str(event) + ", Date: " + row[0].text + ", Meet: " + meet + ", Time: " + str( swim_time ) + "\n" )
  asa_swim_id = get_asa_swim_id( row[2] );
  swim = Swim.create( swimmer.asa_number, swimmer.date_of_birth, event, date, meet, float( swim_time ), asa_swim_id );
  return swim

# Add multiple new swims to the database
def put_new_swims( asa_number, swims ):
  ndb.put_multi( swims )
  #logging.info( 'Putting ' + str( len( swims ) ) + ' swims' )
  swim_list = SwimList.get( asa_number )
  if swim_list is None:
    # There wasn't a SwimList for this Swimmer yet.
    # Create one.  This will initialise it with all Swims, including
    # the ones we've just added.
    swim_list = SwimList.create( asa_number )
    swim_list.put()
  else:
    # There was a pre-existing SwimList for this Swimmer.
    # Append the new Swims.
    swim_list.append_swims( swims, licensed=True, check_if_already_exist=True )
    swim_list.put()
  
def scrape_swims( swimmer, event, output ):
  # Parses this kind of page
  # http://www.swimmingresults.org/individualbest/personal_best_time_date.php?back=individualbest&tiref=892569&mode=A&tstroke=1&tcourse=S
  
  # Fetch the swims for this event from swimmingresults.org
  url = "http://www.swimmingresults.org/individualbest/personal_best_time_date.php?back=individualbest&mode=A&tiref=" + str(swimmer.asa_number) + "&tstroke=" + str(event.to_asa_event_number()) + "&tcourse=" + event.to_asa_course_code()
  page = helpers.FetchUrl( url )

  if page is None:
    logging.error( "Expected page text but got none." )
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
  put_new_swims( swimmer.asa_number, swims )
    
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
    put_new_swims( swimmer.asa_number, swims )

splits_headers_of_interest = ( "Distance", "Cumulative", "Incremental" )
    
def scrape_splits( swim ):
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