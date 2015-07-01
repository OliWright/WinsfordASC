// Winsford ASC Google AppEngine App
//   event.js
//  Provides the Event class, which encapsulates a particular
//  swimming event (e.g. 50m FreeStyle Long Course)
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

	function convertRaceTime( raceTime, course )
	{
		if( course.code == this.course.code )
		{
			// No conversion required
			return raceTime;
		}
		else
		{
//
// This is taken from https://www.swimmingresults.org/EqvtShare/algorithm.php which tries
// and fails to describe the ASA conversion algorithm.
//
//    Converted Time  = T50 * PoolMeasure – TurnVal * (NumTurnPH – 1)
// Where
//    T50             = Time in a 50m pool
//    PoolMeasure     = Ratio of race distance compared to equivalent distance in a 50m pool.
//                      This is used to convert between events in non-standard length pools.
//    TurnVal         = Time per turn. The time in seconds attributed to execution of a single turn.
//                    = TurnFactor / T50
//    NumTurnPH       = Number of turns per 100m in the length of pool we're converting to.
//
// So far so good.   Unfortunately, reading through the document and trying to follow it,
// we realise there are mistakes and contradictions...
//    (Switching no to lowerCamelCase naming to match my coding style)
//
// turnVal is supposed to be the time [gained] per turn.  But the turnFactor values provided
// in the table look to be normalised per 100m, so it should be....
//    timeGainPerTurn = (raceDistance / 100) * turnFactor / t50
// This is what is used later in the document anyway, and the results match the tables.
//
// If NumTurnsPH is supposed to be the number of turns per 100m in the pool we're converting
// to, then you'd think reasonably that the value would be 4.  (If you swam indefinitely
// then every 100m you'd make 4 turns).
// But actually it should be the number of turns in a 100m race in the pool we're converting
// to, which is 3.
// But more fundamentally, we're actually interested in the number of *additional* turns
// made in a race, compared to the same race in a 50m pool.
//    numExtraTurns25 = The number of additional turns in a 25m pool versus the same race in
//                      a 50m pool
//                    = raceDistance / 50         (Think about it)
//
// So this is the actual conversion from a 50m time to a 25m time.
//                t25 = t50 - (timeGainPerTurn * numExtraTurns25)
//
// This makes a lot more sense.
// Now for some simplifications...
//
// Expanding out
//                t25 = t50 - (((raceDistance / 100) * turnFactor / t50) * (raceDistance / 50))
//                    = t50 - (raceDistance^2 * turnFactor / t50

			
			var turnVal = (this.distance / 100) * this.turnFactor / raceTime;
			var numExtraTurnSC = this.distance / 50;
			
			if( this.course.code == longCourse.code )
			{
				// Convert long course to short course
				var numTurnPH = 4;
				turnVal = this.turnFactor / raceTime;
				return raceTime - ((this.distance / 100) * (turnVal * (numTurnPH-1)));
				//return raceTime - (turnVal * numExtraTurnSC);
			}
			else
			{
				// Convert short course to long course
				// y = x - d.d.tf/100.50.x
				// yx = x2 - d2.tf/5000
				// yx - x2 = -d2.tf/5000
				// x2 - yx - d2.tf/5000 = 0
				// From quadratic... x = (-b +- sqrt(b2 -4ac)) / 2a
				// a = 1,   b = -y (short course time),   c = -d2.tf/5000
				var b = -raceTime;
				var c = this.distance * this.distance * this.turnFactor / -5000;
				return (-b + Math.sqrt( (b * b) - (4 * c) )) / 2;
				//return raceTime + (turnVal * numExtraTurnSC);
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
