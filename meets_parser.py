# Winsford ASC Google AppEngine App
#   meets_parser.py
#   Scrapes meets from www.swimmingresults.org
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
import time
import datetime
import helpers
from google.appengine.api import taskqueue
from event import Event
from lxml import html
from lxml import etree
from table_parser import TableRows
from race_time import RaceTime
from swimmer import Swimmer
from swimmer_cat1 import SwimmerCat1
from swim import Swim
from swimlist import SwimList
from parsed_meet import has_meet_been_parsed
from parsed_meet import meet_has_been_parsed
# from admin import QueueUpdateSwimsForSwimmer
from swim_parser import put_new_swims
from swim_parser import get_asa_swim_id
from page_count import scrape_num_pages

_meet_headers_of_interest = ( "Member", "Event", "DoB", "Time" )

def scrape_meet( asa_meet_code, page_number, meet_name, date, course_code ):
  logging.info( "Attempting to parse meet " + meet_name + ", meet code: " + str( asa_meet_code ) + ", page: " + str(page_number) )
  # Load a meet page from a URL like this...
  # https://www.swimmingresults.org/showmeetsbyclub/index.php?meetcode=19611&targetclub=WINNCHRN 
  url = "https://www.swimmingresults.org/showmeetsbyclub/index.php?meetcode=" + str( asa_meet_code ) + "&targetclub=WINNCHRN&page=" + str( page_number )
  page = helpers.FetchUrl( url )

  if page is None:
    logging.error( "Failed to get page " + url )
    return 503
  tree = html.fromstring( page )
  try:
    table = tree.get_element_by_id( "rankTable" )
  except:
    logging.info( "No rankTable for " + url + ". Presuming no Winsford swimmers at that meet" )
    return
  
  if page_number == 1:
    # When scraping the first page, one of our jobs is to count how many other pages
    # there are and add tasks to scrape those pages
    num_pages = scrape_num_pages( tree )
    logging.info( "Meet contains " + str( num_pages ) + " pages ")
    date_str = date.strftime( "%d/%m/%y" )
    for i in range( 2, num_pages+1 ):
      logging.info( "Queing update of page " + str(i) + " of " + meet_name )
      taskqueue.add(url='/admin/scrape_meet', params={'asa_meet_code': str(asa_meet_code), 'meet_name' : meet_name, 'date' : date_str, 'course_code' : course_code, 'page' : str(i) })

  swimmers_checked = set()
  update_swimmer_list = False
  for row in TableRows( table, _meet_headers_of_interest ):
    # First we look at the swimmer.
    # Is it one we've already seen while scraping this meet, or is it a new one?
    # If it's a new one, is it a swimmer that's in our database?
    # Perhaps it's a swimmer that's in our database as Cat 1 and needs upgrading.
    asa_number = int( row[0].text )
    if asa_number not in swimmers_checked:
      swimmers_checked.add( asa_number )
      swimmer = Swimmer.get( "Winsford", asa_number )
      if swimmer is None:
        swimmer = SwimmerCat1.get( "Winsford", asa_number )
        if swimmer is None:
          # This looks like a new Winsford swimmer that isn't in the database
          # Add a task to add them
          logging.info( "Found new Winsford swimmer: " + str( asa_number ) + ". Adding task to scrape." )
          taskqueue.add(url='/admin/update_swimmers', params={'name_search': str(asa_number)})
          #QueueUpdateSwimsForSwimmer( str(asa_number) )
          update_swimmer_list = True
        else:
          # This is a swimmer that's in our database as Cat1
          # Add a task to upgrade them
          logging.info( "Found new Cat 2 Winsford swimmer: " + str( asa_number ) + ". Adding task to upgrade." )
          taskqueue.add(url='/admin/check_for_swimmer_upgrade', params={'asa_number': str(asa_number)})
          update_swimmer_list = True
      else:
        logging.info( "Found existing Winsford swimmer: " + swimmer.full_name() )

  if update_swimmer_list:
    taskqueue.add(url='/admin/update_swimmer_list')

  swims_for_swimmer = {}
  for row in TableRows( table, _meet_headers_of_interest ):
    # Now look at the actual swims.
    # If there's a swim link, then that means there are some splits. In those
    # cases we also add a task to parse the splits and add them to the Swim.
    asa_number = int( row[0].text )
    event_str = row[1].text
    date_of_birth = helpers.ParseDate_dmy( row[2].text )
    race_time = float( RaceTime( row[3].text ) )
    event = Event.create_from_str( event_str, course_code )
    asa_swim_id = get_asa_swim_id( row[3] )
      
    swim = Swim.create( asa_number, date_of_birth, event, date, meet_name, race_time, asa_swim_id )

    if asa_swim_id is not None:
      # Swim link. Add a task to parse the splits.
      swim_key_str = swim.create_swim_key_str()
      logging.info( "Adding split scraping task for swim " + swim_key_str )
      taskqueue.add(url='/admin/scrape_splits', params={'swim': swim_key_str})

    # Record this swim
    if asa_number not in swims_for_swimmer:
      swims_for_swimmer[ asa_number ] = [];
      
    swims_for_swimmer[ asa_number ].append( swim )
    
  for asa_number, swims in swims_for_swimmer.iteritems():
    num_swims = len( swims )
    logging.info( "Putting " + str(num_swims) + " swims for " + str( asa_number ) )
    put_new_swims( asa_number, swims )
    
_meets_headers_of_interest = ( "License", "Meet Name", "Date", "Pool" )
    
def scrape_new_meets( page = 1 ):
  # Loads https://www.swimmingresults.org/showmeetsbyclub/ and
  # adds a task to scrape each meet listed that we haven't already parsed
  url = "https://www.swimmingresults.org/showmeetsbyclub/?page=" + str(page)
  page = helpers.FetchUrl( url )

  if page is None:
    logging.error( "Failed to get page " + url )
    return 503
  tree = html.fromstring( page )
  try:
    table = tree.get_element_by_id( "rankTable" )
  except:
    logging.error( "Missing rankTable at " + url )
    return
    
  for row in TableRows( table, _meets_headers_of_interest ):
    if row[0].link is not None:
      # Parse the link which is of the form ?targetyear=2015&masters=0&pgm=1&meetcode=16145 to extract the meetcode
      pos = row[0].link.find( "meetcode=" )
      if pos != -1:
        asa_meet_code = int( row[0].link[pos + 9:] )
        if not has_meet_been_parsed( asa_meet_code ):
          meet_name = row[1].text
          date_str = row[2].text
          course_code = "S"
          if row[3].text == "LC":
            course_code = "L"
          logging.info( "Got new meet: " + meet_name + ", code: " + str( asa_meet_code ) )
          taskqueue.add(url='/admin/scrape_meet', params={'asa_meet_code': str(asa_meet_code), 'meet_name' : meet_name, 'date' : date_str, 'course_code' : course_code, 'page' : '1' })

          
