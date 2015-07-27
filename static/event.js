// Winsford ASC Google AppEngine App
//   event.js
//  Provides the Event class, which encapsulates a particular
//  swimming event (e.g. 50m FreeStyle Long Course)
//  Also provides methods for converting race times between long and short course.
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


// Notes on the conversion of swim times between 25m and 50m pools
//
// This is taken from https://www.swimmingresults.org/EqvtShare/algorithm.php which tries
// and fails to describe the ASA conversion algorithm.
//
//    Converted Time  = T50 * PoolMeasure – TurnVal * (NumTurnPH – 1)
// Where
//    T50             = Time in a 50m pool
//    PoolMeasure     = Ratio of race distance compared to equivalent distance in a 50m pool.
//                      This is used to convert between events in non-standard length pools.
//                      For our purposes we're only interested in converting between 25m and
//                      50m pools, so there is no difference in the race distance, so we can
//                      take this as 1 and so effectively ignore it.
//    TurnVal         = Time per turn. The time in seconds attributed to execution of a single turn.
//                    = TurnFactor / T50
//    NumTurnPH       = Number of turns per 100m in the length of pool we're converting to.
//
// So far so good.   Unfortunately, reading through the document and trying to follow it,
// we realise there are mistakes and contradictions...
//    (Switching now to lowerCamelCase naming to match my coding style)
//
// turnVal is supposed to be the time [gained] per turn.  But the turnFactor values provided
// in the table look to be normalised per 100m, so it should be....
//    timeGainPerTurn = (raceDistance / 100) * turnFactor / t50
// This is what is used later in the document anyway, and the results match the tables.
//
// If NumTurnsPH is supposed to be the number of turns per 100m in the pool we're converting
// to, then you'd think reasonably that the value would be 4 for a 25m pool.  (If you swam
// indefinitely then every 100m you'd make 4 turns).
// But actually it should be the number of turns in a 100m *race* in the pool we're converting
// to, which is 3 for a 25m pool.
// But more fundamentally, we're actually interested in the number of *additional* turns
// made over the whole race, compared to the same race in a 50m pool.
//    numExtraTurns25 = The number of additional turns in a 25m pool versus the same race in
//                      a 50m pool
//                    = raceDistance / 50         (Think about it)
//
// So this is the actual conversion from a 50m time to a 25m time.
//                t25 = t50 - (timeGainPerTurn * numExtraTurns25)
//
// This makes a lot more sense.
//
// Expanding and re-arranging...
//                t25 = t50 - (((raceDistance / 100) * turnFactor / t50) * (raceDistance / 50))
//                    = t50 - (raceDistance^2 * turnFactor * (1/5000) / t50)
//
// That's straight-forward then to convert from 50m to 25m.  When we try to re-arrange to
// convert from 25m to 50m we realise it's a quadratic...
//
//                t25 = t50 - (raceDistance^2 * turnFactor * (1/5000) / t50)
//        (t25 * t50) = t50^2 - (raceDistance^2 * turnFactor * (1/5000))
//                  0 = t50^2 - (t25 * t50) - (raceDistance^2 * turnFactor * (1/5000))
//
// Remembering to solve a quadratic of the form    a * x^2 + b * x + c = 0
//                                       we use    x = (-b +- sqrt(b^2 - 4 * a * c)) / (2 * a)
// For our quadratic
//                  a = 1
//                  b = -t25
//                  c = -(raceDistance^2 * turnFactor * (1/5000))
// so
//                t50 = (-b + sqrt(b^2 - 4 * a * c)) / (2 * a)
//                          ^--------------the solution we want has the '+' here.
//                    = (-b + sqrt(b^2 - 4 * c)) / 2
//                    = (t25 + sqrt(t25^2 - 4 * c)) / 2
//                    = (t25 + sqrt(t25^2 + (raceDistance^2 * turnFactor * (4/5000)))) / 2


var Stroke = function( code, shortName, longName )
{
	this.code = code;
	this.shortName = shortName;
	this.longName = longName;
}

var strokes =
[
	new Stroke( 0, "Free", "FreeStyle" ),
	new Stroke( 1, "Breast", "Breaststroke" ),
	new Stroke( 2, "Fly", "Butterfly" ),
	new Stroke( 3, "Back", "Backstroke" ),
	new Stroke( 4, "IM", "Individual Medley" )
];

function GetStroke( strokeName )
{
	switch( strokeName.substr(0,2).toLowerCase() )
	{
		case "fr":
			return strokes[0];
		case "br":
			return strokes[1];
		case "bu":
		case "fl":
			return strokes[2];
		case "ba":
			return strokes[3];
		case "im":
		case "in":
			return strokes[4];
	}
}

var Course = function( code, shortName, longName )
{
	this.code = code;
	this.shortName = shortName;
	this.longName = longName;
}

var shortCourse = new Course( 0, "SC", "Short Course" );
var longCourse = new Course( 1, "LC", "Long Course" );

function GetCourse( courseName )
{
	if( courseName[0].toLowerCase() == "s" )
	{
		return shortCourse;
	}
	else
	{
		return longCourse;
	}
}

var Event = function( code, distance, stroke, turnFactor, course )
{
	this.code = code;
	this.distance = parseInt( distance );
	this.stroke = GetStroke( stroke ); 
	this.course = course;
	this.turnFactor = turnFactor;

	this.convertRaceTime = convertRaceTime;
	this.toLongString = toLongString;
	this.toShortString = toShortString;
	this.toShortStringWithoutCourse = toShortStringWithoutCourse;

	function convertRaceTime( raceTime, course )
	{
		if( course.code == this.course.code )
		{
			// No conversion required
			return raceTime;
		}
		else
		{
			// See large comment block at the top of this file for an explanation
			// of how the conversions are worked out.
			if( this.course.code == longCourse.code )
			{
				// Convert long course to short course
				// t25 = t50 - (raceDistance^2 * turnFactor * (1/5000) / t50)
				return raceTime - (this.distance * this.distance * this.turnFactor * 0.0002 / raceTime );
			}
			else
			{
				// Convert short course to long course
				// t50 = (t25 + sqrt(t25^2 + (raceDistance^2 * turnFactor * (4/5000)))) / 2
				return (raceTime + Math.sqrt( (raceTime * raceTime) + (this.distance * this.distance * this.turnFactor * 0.0008))) * 0.5;
			}
		}
	}

	function toLongString()
	{
		var str = "";
		str += this.distance;
		str += "m ";
		str += this.stroke.longName;
		str += " ";
		str += this.course.longName;
		return str;
	}

	function toShortString()
	{
		var str = "";
		str += this.distance;
		str += " ";
		str += this.stroke.shortName;
		str += " ";
		str += this.course.shortName;
		return str;
	}

	function toShortStringWithoutCourse()
	{
		var str = "";
		str += this.distance;
		str += " ";
		str += this.stroke.shortName;
		return str;
	}
}

var shortCourseEvents =
[
	new Event( 0, 50, "Free", 42.245, shortCourse ),
	new Event( 1, 100, "Free", 42.245, shortCourse ),
	new Event( 2, 200, "Free", 43.786, shortCourse ),
	new Event( 3, 400, "Free", 44.233, shortCourse ),
	new Event( 4, 800, "Free", 45.525, shortCourse ),
	new Event( 5, 1500, "Free", 46.221, shortCourse ),
	new Event( 6, 50, "Breast", 63.616, shortCourse ),
	new Event( 7, 100, "Breast", 63.616, shortCourse ),
	new Event( 8, 200, "Breast", 66.598, shortCourse ),
	new Event( 9, 50, "Fly", 38.269, shortCourse ),
	new Event( 10, 100, "Fly", 38.269,shortCourse ),
	new Event( 11, 200, "Fly", 39.76, shortCourse ),
	new Event( 12, 50, "Back", 40.5, shortCourse ),
	new Event( 13, 100, "Back", 40.5, shortCourse ),
	new Event( 14, 200, "Back", 41.98, shortCourse ),
	new Event( 15, 200, "IM", 49.7, shortCourse ),
	new Event( 16, 400, "IM", 55.366, shortCourse ),
	new Event( 17, 100, "IM", 45, shortCourse ), // TurnFactor is arbitrary. Can't convert 100 IM.
];

var longCourseEvents =
[
	new Event( 18, 50, "Free", 42.245, longCourse ),
	new Event( 19, 100, "Free", 42.245, longCourse ),
	new Event( 20, 200, "Free", 43.786, longCourse ),
	new Event( 21, 400, "Free", 44.233, longCourse ),
	new Event( 22, 800, "Free", 45.525, longCourse ),
	new Event( 23, 1500, "Free", 46.221, longCourse ),
	new Event( 24, 50, "Breast", 63.616, longCourse ),
	new Event( 25, 100, "Breast", 63.616, longCourse ),
	new Event( 26, 200, "Breast", 66.598, longCourse ),
	new Event( 27, 50, "Fly", 38.269, longCourse ),
	new Event( 28, 100, "Fly", 38.269,longCourse ),
	new Event( 29, 200, "Fly", 39.76, longCourse ),
	new Event( 30, 50, "Back", 40.5, longCourse ),
	new Event( 31, 100, "Back", 40.5, longCourse ),
	new Event( 32, 200, "Back", 41.98, longCourse ),
	new Event( 33, 200, "IM", 49.7, longCourse ),
	new Event( 34, 400, "IM", 55.366, longCourse ),
	new Event( 35, 100, "IM", 45, longCourse ), // TurnFactor is arbitrary. Can't convert 100 IM.
];

var events = 
[
	shortCourseEvents[0],
	shortCourseEvents[1],
	shortCourseEvents[2],
	shortCourseEvents[3],
	shortCourseEvents[4],
	shortCourseEvents[5],
	shortCourseEvents[6],
	shortCourseEvents[7],
	shortCourseEvents[8],
	shortCourseEvents[9],
	shortCourseEvents[10],
	shortCourseEvents[11],
	shortCourseEvents[12],
	shortCourseEvents[13],
	shortCourseEvents[14],
	shortCourseEvents[15],
	shortCourseEvents[16],
	shortCourseEvents[17],
	longCourseEvents[0],
	longCourseEvents[1],
	longCourseEvents[2],
	longCourseEvents[3],
	longCourseEvents[4],
	longCourseEvents[5],
	longCourseEvents[6],
	longCourseEvents[7],
	longCourseEvents[8],
	longCourseEvents[9],
	longCourseEvents[10],
	longCourseEvents[11],
	longCourseEvents[12],
	longCourseEvents[13],
	longCourseEvents[14],
	longCourseEvents[15],
	longCourseEvents[16],
	longCourseEvents[17],
];

var eventIdxLut = Array
(
	new Array( 0, 6, 9, 12, 15 ),
	new Array( 18, 24, 27, 30, 33 )
);

function GetEvent( event )
{
	if( typeof event === 'string' )
	{
		var tok = event.split( " " );
		var course = GetCourse( tok[2] );
		var stroke = GetStroke( tok[1] );
		var distance = parseInt( tok[0] );
		var i = eventIdxLut[ course.code ][ stroke.code ];
		var end = i + 6;
		if( end > 36 ) { end = 36; }
		for( ; i < end; i++ )
		{
			if( events[i].distance == distance )
			{
				return events[i];
			}
		}
	}
	else if( typeof event === 'number' )
	{
		// From the Python event id
		var idx = event & 0xff;
		if( event & 0x100 )
		{
			idx += 18;
		}
		return events[ idx ];
	}
}

function findEvent( distance, stroke, course )
{
	var i = eventIdxLut[ course.code ][ stroke.code ];
	var end = i + 6;
	if( end > 36 ) { end = 36; }
	for( ; i < end; i++ )
	{
		if( events[i].distance == distance )
		{
			return events[i];
		}
	}
}
