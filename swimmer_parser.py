# Winsford ASC Google AppEngine App
#   swimmer_parser.py
#   Code to scrape swimmer information from swimming.org
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

from lxml import html
from lxml import etree
from table_parser import TableRows
import StringIO
import helpers
import logging

from swimmer import Swimmer
from swimmer_cat1 import SwimmerCat1

class ParsedSwimmerData():
  def __init__(self, cat, gender, date_of_birth, full_name):
    self.cat = cat
    self.gender = gender
    self.date_of_birth = date_of_birth
    
    # full_name is of the form FirstName (KnownAs) LastName
    name_tokens = full_name.split( " " )
    len_name_tokens = len( name_tokens )
    if len_name_tokens == 2:
      self.first_name = name_tokens[0]
      self.last_name = name_tokens[1]
      self.nick_name = self.first_name
    elif len_name_tokens == 3:
      self.first_name = name_tokens[0]
      self.nick_name = name_tokens[1][1:len(name_tokens[1])-2]
      self.last_name = name_tokens[2]
    else:
      # Well this is awkward
      logging.error( "Failed to parse swimmer's full name: " + full_name )
  
  # We identify cat 2 swimmers by the fact that their date of birth is not published.
  # I know - that's a bit pants.
  def is_cat2(self):
    return self.date_of_birth is not None
       
# Scans a table looking for a label in a <td> element.
# Returns the contents of the next <td>.
def _get_horizontal_table_field( root, label ):
  for td in root.getiterator( tag="td" ):
    if td.text.strip() == label:
      # This td has the label that we're looking for.
      # The next sibling should contain the actual data
      value_td = td.getnext()
      if value_td is None:
        return
      else:
        value = helpers.Trim( value_td.text )
        if (value is None) or (len(value) == 0):
          return
        return value

def _parse_swimmer( swimmer_page_text ):
  page = html.fromstring( swimmer_page_text )
  # All the stuff we're interested in is inside a div element id="outerWrapper"
  root = page.get_element_by_id( "outerWrapper" )

  # Most of the data that we're interested in has a heading table cell immediately followed by the value
  # so we use a helper function _get_horizontal_table_field to do most of the parsing

  # Check the date of birth first. If they're Cat1, then there'll be no DOB, so we're not interested.
  date_of_birth = _get_horizontal_table_field( root, "Date of Birth" )
  if date_of_birth is not None:
    date_of_birth = helpers.ParseDateOfBirth( date_of_birth )

  gender = _get_horizontal_table_field( root, "Gender" )
  cat = _get_horizontal_table_field( root, "Category" )
  full_name = _get_horizontal_table_field( root, "Name" )
  return ParsedSwimmerData( cat, gender, date_of_birth, full_name )
  
# Go to swimmingresults.org to get information for this swimmer and add it to our database
def scrape_swimmer( club, asa_number, response, first_name=None, last_name=None, nick_name=None ):
  url = "https://www.swimmingresults.org/membershipcheck/member_details.php?myiref=" + str(asa_number)
  logging.info( "Attempting to scrape " + url );
  page = helpers.FetchUrl( url )
  if page is None:
    response.set_status( 503 )
    return
  else:
    extra_swimmer_data = _parse_swimmer( page )
    #done_one = True
    if extra_swimmer_data is None:
      response.out.write( "Error scraping " );
    else:
      if first_name is None:
        first_name = extra_swimmer_data.first_name
      if last_name is None:
        last_name = extra_swimmer_data.last_name
      if nick_name is None:
        nick_name = extra_swimmer_data.nick_name
      if extra_swimmer_data.is_cat2():
        # Create a new Cat2 Swimmer object and add it to the database
        date_of_birth = extra_swimmer_data.date_of_birth
        is_male = (extra_swimmer_data.gender[0:1] == "M")
        swimmer = Swimmer.create( asa_number, club, first_name, last_name, nick_name, date_of_birth, is_male )
        swimmer.put()
      else:
        # Create a new Cat1 Swimmer object and add it to the database
        swimmer = SwimmerCat1.create( asa_number, club, first_name, last_name )
        swimmer.put()
      response.out.write( "Updated " + extra_swimmer_data.cat + " " + extra_swimmer_data.gender + " swimmer " + swimmer.full_name() + ". ASA Number: " + str(asa_number) + "\n" )
    
  
# The headers in a swimmer list table from https://www.swimmingresults.org/membershipcheck/member_details.php
# that we're interested in parsing.  
swimmer_list_headers_of_interest = ( "Member", "Family Name", "Given Name", "Known As", "Club" )

def _parse_swimmer_list( swimmer_list_page_text, club, response, force_update=False ):
  tree = html.fromstring( swimmer_list_page_text )
  try:
    table = tree.get_element_by_id( "rankTable" )
  except:
    # No table means no swimmers of this name
    logging.info( "No swimmers returned." )
    return

  swimmers = []
  for row in TableRows( table, swimmer_list_headers_of_interest ):
    asa_number = int( row[0] )
    last_name = str( row[1] )
    first_name = str( row[2] )
    nick_name = str( row[3] )
    if row[4].text == club:
      # Validate the remaining fields are ok to use
      valid = True
      if (asa_number is None):
        valid = false
      elif (last_name is None) or (len(last_name) == 0):
        valid = false
      elif (first_name is None) or (len(first_name) == 0):
        valid = false
      elif (nick_name is None) or (len(nick_name) == 0):
        nick_name = first_name
      if valid:
        logging.info( "Found potential swimmer: " + first_name + " " + last_name )
        do_update = force_update
        if not do_update:
          # Do we already have this swimmer in our database?
          existing_cat1 = SwimmerCat1.get( club, asa_number )
          if existing_cat1 is None:
            existing_cat2 = Swimmer.get( club, asa_number )
            if existing_cat2 is None:
              do_update = True
        if not do_update:
          logging.info( first_name + " " + last_name + " is already in database" )
        if do_update:
          scrape_swimmer( club, asa_number, response )
        else:
          full_name = first_name + " " + last_name
          if nick_name != first_name:
            full_name += " (" + nick_name + ") "
          response.out.write( full_name + " " + str(asa_number) + " not updated because they're already in the database.\n" )
    else:
      response.out.write( first_name + " " + last_name + " (ASA Number: "  + str(asa_number) + ") not added because they're in the wrong club (" + row[4].text + ").\n" )

def scrape_swimmers( club, family_name, response, force_update=False ):
  logging.info( "Fetching swimmers of family name: " + family_name )
  url = "https://www.swimmingresults.org/membershipcheck/member_details.php?myiref=" + str(family_name)
  page = helpers.FetchUrl( url )
  if page is None:
    response.set_status( 503 )
    return
  else:
    return _parse_swimmer_list( page, club, response.out, force_update )
          
