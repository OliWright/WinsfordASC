# Winsford ASC Google AppEngine App
#   hytek_helpers.py
#   Helper code for parsing Hy-Tek .hy3 files
#   Format details: https://docs.google.com/document/d/1zNQpfehABQrioNL8TF7dCVS7wdYmmbqC66NC7-e1AWA/edit?usp=sharing
#   Many thanks to the person that created that file.
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

import datetime

def strip_string( val ):
  return val.strip()

def read_date_MMDDYYYY( val ):
  if val == "        ":
    return None
  else:
    day = int( val[2:4] )
    month = int( val[0:2] )
    year = int( val[4:8] )
    return datetime.date( year, month, day )

class Hy3FieldDescriptor:
  def __init__( self, name, first, last, parse_function = strip_string ):
    self.name = name
    self.first = first
    self.last = last
    self.parse_function = parse_function

line_code_fields = {}

# File descriptor
line_code_fields[ 'A1' ] = (
Hy3FieldDescriptor( "file_type_code", 2, 3 ),
Hy3FieldDescriptor( "file_type", 4, 28 )
)

# Meet information
line_code_fields[ 'B1' ] = (
Hy3FieldDescriptor( "meet_name", 2, 46 ),
Hy3FieldDescriptor( "location", 47, 91 ),
Hy3FieldDescriptor( "start_date", 92, 99, read_date_MMDDYYYY ),
Hy3FieldDescriptor( "end_date", 100, 107, read_date_MMDDYYYY ),
Hy3FieldDescriptor( "age_up_date", 108, 115, read_date_MMDDYYYY ),
)

# Meet information
line_code_fields[ 'B2' ] = (
Hy3FieldDescriptor( "course_code", 98, 98 ),
)

# Swimmer information
line_code_fields[ 'D1' ] = (
Hy3FieldDescriptor( "gender", 2, 2 ),
Hy3FieldDescriptor( "swimmer_id", 3, 7, int ),
Hy3FieldDescriptor( "last_name", 8, 27 ),
Hy3FieldDescriptor( "first_name", 28, 47 ),
Hy3FieldDescriptor( "nick_name", 48, 67 ),
Hy3FieldDescriptor( "date_of_birth", 88, 95, read_date_MMDDYYYY )
)

# Individual event entry
line_code_fields[ 'E1' ] = (
Hy3FieldDescriptor( "gender", 2, 2 ),
Hy3FieldDescriptor( "swimmer_id", 3, 7, int ),
Hy3FieldDescriptor( "distance", 17, 20, int ),
Hy3FieldDescriptor( "stroke", 21, 21 )
)

# Individual event results
line_code_fields[ 'E2' ] = (
Hy3FieldDescriptor( "type", 2, 2 ),
Hy3FieldDescriptor( "time", 3, 10, float ),
Hy3FieldDescriptor( "length_unit", 11, 11 ),
Hy3FieldDescriptor( "time_code", 12, 14 ),
Hy3FieldDescriptor( "date", 102, 109, read_date_MMDDYYYY )
)

# Empty class to contain parsed attributes
class Hy3ParsedLine:
  def __init__( self, line_code ):
    self.line_code = line_code

def parse_hy3_line( line ):
  # The first two characters denote the line code, which then leads to a
  # specific tokenisation for that type of data
  line_code = line[:2]
  ret_val = Hy3ParsedLine( line_code )
  # Do we know how to tokenise that line?
  if line_code in line_code_fields:
    ret_val.parsed = True
    fields = line_code_fields[ line_code ]
    for field in fields:
      field_value = field.parse_function( line[field.first:field.last+1] )
      setattr( ret_val, field.name, field_value )
  else:
    ret_val.parsed = False
  return ret_val

# Pass either a string, a collection of lines, or a file.
# This function will return a collection of Hy3ParsedLine objects.
def parse( hy3 ):
  lines = hy3
  parsed_lines = []
  if type(hy3) is str:
    # We've had
    lines = hy3.splitlines()
    
  for line in lines:
    parsed_lines.append( parse_hy3_line( line ) )
  return parsed_lines
  
