# Winsford ASC Google AppEngine App
#   helpers.py
#   Dumping ground for misc helper free functions.
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

import time
import datetime
import re
import logging
from google.appengine.api import urlfetch

def Trim( str ):
  if str is None:
    return
  str = str.strip()
  if len(str) == 0:
    return
  return str
  
def StripSlashNs( strings ):
  retStrings = []
  for str in strings:
    retStrings.append( Trim( str ) )
  return retStrings

def NewLine( response ):
  response.out.write( """
""")

# Parse a dd/mm/yy string
def ParseDate_dmy( day_month_year ):
  # We should be able to use the time.strptime to parse this date like this
  # ts = time.strptime( day_month_year, "%d/%m/%y")
  # But it turns out that strptime is not thread safe, which is a bit of a problem
  fields = day_month_year.split( "/" )
  year = int( fields[2] )
  if year < 100:
    # This is very short-sided coding that WILL break eventually.
    # But I won't be around to have to worry about it :-)
    year += 2000
    if year > 2070:
      year -= 100
  return datetime.date( year, int( fields[1] ), int( fields[0] ) )

# Parse a dd/mm/yyyy string
def ParseDate_dmY( day_month_Year ):
  # We should be able to use the time.strptime to parse this date like this
  # ts = time.strptime( day_month_year, "%d/%m/%Y")
  # But it turns out that strptime is not thread safe, which is a bit of a problem
  fields = day_month_Year.split( "/" )
  return datetime.date( int( fields[2] ), int( fields[1] ), int( fields[0] ) )

# Regular expression to trim 1st, 2nd etc. to 1 2 etc. when used with ordinals.sub
ordinals = re.compile( '(?<=\d)(st|nd|rd|th)' )

def ParseDateOfBirth( date_of_birth ):
  # Remove ordinal suffixes from numbers.
  date_of_birth = ordinals.sub("", date_of_birth)
  # Parse the pure date.
  ts = time.strptime( date_of_birth, "%d %B %Y")
  return datetime.date( ts.tm_year, ts.tm_mon, ts.tm_mday )

def FetchUrl( url ):
  try:
    result = urlfetch.fetch( url, headers={'User-Agent' : "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.115 Safari/537.36"}, validate_certificate=False )
    return result.content
  except:
    logging.error( "Failed fetching URL: " + url )
    logging.error( "Exception: " + str(type(e)) + ", Code: " + str(e.code) + ", Reason: " + str(e.reason) )
    return
  
def CalcAge( date_of_birth, date_to_test ):
  return date_to_test.year - date_of_birth.year - int((date_to_test.month, date_to_test.day) < (date_of_birth.month, date_of_birth.day))