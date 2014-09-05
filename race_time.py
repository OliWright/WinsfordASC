# Winsford ASC Google AppEngine App
#   race_time.py
#   Provides the RaceTime class, which encapsulates a time for
#   a race in seconds as a float, but can parse or format
#   the time as a string in m:ss.xx form.
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

class RaceTime():
  # Constructor.  Can be passed time as a string or as a float.
  def __init__(self, time):
    if type(time) is str:
      parts = time.split( ":" )
      num_parts = len( parts )
      if num_parts == 1:
        self.seconds = float( time )
      elif num_parts == 2:
        self.seconds = (float( parts[0] ) * 60) + float( parts[1] )
    elif type(time) is float:
      self.seconds = time
  
  # Cast to string
  def __str__(self):
    if self.seconds is None:
      return "Error"
    minutes = int( self.seconds / 60 )
    if minutes > 0:
      seconds = self.seconds - float( minutes * 60 );
      return "%d:%05.2f" % (minutes, seconds)
    return "%05.2f" % self.seconds

  # Cast to float
  def __float__(self):
    return self.seconds
