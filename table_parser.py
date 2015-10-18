# Winsford ASC Google AppEngine App
#   swimmer_parser.py
#   Code to help scraping data from HTML tables, particularly
#   the style of tables used at swimming.org
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
import StringIO
import helpers
import logging

class Cell():
  def __init__(self, text, link):
    self.text = text
    self.link = link
    
  def __str__(self):
    return self.text

  def __int__(self):
    return int( self.text )
    
  def __bool__(self):
    if self.text is None:
      return False
    else:
      return True

def ReadTableCell( element ):
  # The contents of the cell can be either plain text
  # or a hyperlink.
  # This version will parse both versions but will just
  # return the plain text
  txt = helpers.Trim( element.text )
  if txt is None:
    # Look for a hyperlink
    element = element.find( path="a" )
    if element is None:
      return Cell( text = None, link = None )
    else:
      return Cell( text = helpers.Trim( element.text ), link = element.get( key="href" ) )
  return Cell( text = txt, link = None )

#
# Iterator class for iterating over the rows of a html table.
#
# You pass in the headers that your interested in, in the order that you would
# like to get them.
#
# Each row that you iterate over will return a list containing the same number
# of elements as in the headers_of_interest.   The contents of the list will
# correspond to the data in that row for that header.
#
# Any missing data will be None in the array.
#
class TableRows:
  def __init__(self, table, headers_of_interest):
    self.body = table.find( "tbody" )
    self.heading_types = []

    header_row = self.body.find( "tr" )
    self.row = header_row
    self.num_headers_of_interest = len( headers_of_interest )
    for element in header_row.iterchildren( tag="th" ):
      heading = helpers.Trim( element.text )
      heading_type = -1
      idx = 0
      for interesting_heading in headers_of_interest:
        if heading == interesting_heading:
          #logging.info( "Found interesting header: " + heading )
          heading_type = idx
          break;
        #logging.info( "No match: " + heading + ", " + interesting_heading )
        idx = idx + 1
      #if heading_type == -1:
        #logging.info( "Uninteresting header: " + heading )
      self.heading_types.append( heading_type )

  def __iter__(self):
      return self

  def next(self):
    self.row = self.row.getnext()
    while self.row != None and self.row.tag != "tr":
      self.row = self.row.getnext()
    if self.row is None:
        raise StopIteration
    else:
      # Iterate over the data elements in the row, pulling out the data
      # for the columns that we're interested in
      row_data = [None] * self.num_headers_of_interest;
      column = 0
      for element in self.row.iterchildren( tag="td" ):
        interested_data_type = self.heading_types[ column ];
        if interested_data_type != -1:
          row_data[ interested_data_type ] = ReadTableCell( element )
        column = column + 1
      return row_data

# You pass in a lxml.html.HtmlElement for the root of the table, and the column headers that you're
# interested in, and it outputs a 2d array containing the parsed data.
def ParseTable( table, headers_of_interest ):
  parsed_rows = []
  for row in TableRows( table, headers_of_interest ):
    parsed_rows.append( row )
  return parsed_rows
