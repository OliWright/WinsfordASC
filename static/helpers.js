// Winsford ASC Google AppEngine App
//   helpers.js
//   Dumping ground for misc helper code.
//
// Copyright (C) 2014 Oliver Wright
//    oli.wright.github@gmail.com
// 
// This program is free software; you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation; either version 2 of the License, or
// (at your option) any later version.
// 
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
// 
// You should have received a copy of the GNU General Public License along
// with this program (file LICENSE); if not, write to the Free Software Foundation, Inc.,
// 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.import logging

// This is an object that is filled in with the html options.
// e.g. if the url is http://swimstuff.html?a=1&b=2&c=3&d&e
// options will be
// a: "1"
// b: "2"
// c: "3"
// d: undefined
// e: undefined
var options = {}
function readUrlIntoOptions()
{
	location.search.substr(1).split("&").forEach(function(item) {options[item.split("=")[0]] = item.split("=")[1]})
}
readUrlIntoOptions()

// Convert a race time in seconds to a string of the form minutes:seconds.fractions (to 2 decimal places)
function raceTimeToString( raceTime )
{
	var minutes = Math.floor( raceTime / 60 );
	var str = "";
	if( minutes > 0 )
	{
		var seconds = raceTime - (minutes * 60);
		str += minutes + ":";
		if( seconds < 10 )
		{
			str += "0";
		}
		str += seconds.toFixed(2);
	}
	else
	{
		str += raceTime.toFixed(2);
	}
	return str;
}

// Converts a race time string in the form mm:ss.ff to a time in seconds
// To make things complicated, it also parses mm.ss.ff which can make typing
// in times easier on a phone.
function parseRaceTime( raceTimeStr )
{
	// Count the number of .s
	var numDots = 0;
	for( var i = 0; i < raceTimeStr.length; ++i )
	{
		if( raceTimeStr[i] == '.' )
		{
			++numDots;
		}
	}

	if( numDots > 1 )
	{
		// Text has been entered in the mm.ss.ff format
		var fields = raceTimeStr.split( "." );
		if( fields.length == 3 )
		{
			// mm.ss.ff
			return (parseInt( fields[0] ) * 60) + parseInt( fields[1] ) + parseFloat( '0.' + fields[2] );
		}
		else
		{
			return 0;
		}
	}
	else
	{
		// Normal formatting
		var fields = raceTimeStr.split( ":" );
		if( fields.length > 2 )
		{
			// Unlikely
			return 0;
		}
		else if( fields.length == 2 )
		{
			return (parseFloat( fields[0] ) * 60) + parseFloat( fields[1] );
		}
		else
		{
			return parseFloat( fields[0] );
		}
	}

}

// Parse a date of the form dd/mm/yyyy
function parseDate( dateStr )
{
	var dateFields = dateStr.split("/");
	return new Date( parseInt( dateFields[2] ), parseInt( dateFields[1] ) - 1, parseInt( dateFields[0] ) );
}


// When the user navigates the history, re-parse the URL
AddListener( "onPopState", readUrlIntoOptions );
