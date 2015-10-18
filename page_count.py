# Winsford ASC Google AppEngine App
#   page_count.py
#   Scrapes number of pages from a www.swimmingresults.org page
#
# Copyright (C) 2015 Oliver Wright
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

import logging
from lxml import html
from lxml import etree

def scrape_num_pages( tree ):
  rankingsContent = tree.xpath("//div[contains(@class, 'rankingsContent')]") 
  if len(rankingsContent) != 1:
    logging.error( "Expected a single div with class rankingsContent, got " + str( len( rankingsContent ) ) )
    return 1
    
  parent_div = rankingsContent[0];
  num_pages = 1
  expected_next_page_number = None
  
  # Find all p child elements
  for p in parent_div.iterchildren( 'p' ):
    for a in p.iterchildren( 'a' ):
      # This link could be a page number, or it might not be.
      # If it's a page number, it might be in a child <b> element
      page_number = None
      if a.text is None:
        for b in a.iterchildren( 'b' ):
          if b.text is not None:
            if b.text.isdigit():
              page_number = int( b.text )
      else:
        if a.text.isdigit():
          page_number = int( a.text )
      if page_number is None:
        if expected_next_page_number is not None:
          # We're done.
          return num_pages
      else:
        if expected_next_page_number is not None:
          if page_number != expected_next_page_number:
            if page_number == 1:
              # This must be that we've picked up the page links at the bottom of the page
              return num_pages
            else:
              logging.error( "Error scraping number of pages. page_number: " + str( page_number ) + ", expected_next_page_number: " + str( expected_next_page_number ) )
        if page_number > num_pages:
          num_pages = page_number
          expected_next_page_number = page_number + 1
        # Sanity check
        if num_pages > 20:
          logging.error( "Unexpectedly large number of pages. Aborting" )
          return 20
      
  return num_pages
