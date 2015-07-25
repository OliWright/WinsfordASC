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

# Ndb model exactly the same as Swim, but for storing
# data about swims from non-licensed events.

from swim import Swim
    
# Encapsulates all data for an individual's performance in a single race, including split
# times when available.
class UnofficialSwim( Swim ):
  pass
