// Winsford ASC Google AppEngine App
//   hytek_meet_results_import.js
//   Parsing of a 'meet results' HY3 file
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

// Class to encapsulate information about a swimmer from a HY3 file.
// Constructor takes a parsed "D1" line from hytek.js
var Hy3Swimmer = function( d1 )
{
	this.firstName = d1.firstName;
	this.lastName = d1.lastName;
	this.dateOfBirth = d1.dateOfBirth;
	this.swims = [];
}

// Class to encapsulate information about a meet from a HY3 file.
// Constructor takes parsed "B1" and "B2" lines from hytek.js
var Hy3Meet = function( b1, b2 )
{
	this.meetName = b1.meetName;
	this.facility = b1.facility;
	this.start = b1.start;
	this.end = b1.end;
	this.ageUp = b1.ageUp;
	this.elevation = b1.elevation;
	this.meetType = b2.meetType;
	this.courseCode = b2.courseCode;
}

// Class to encapsulate information about an individual's performance
// in a swim from a HY3 file.
// Constructor takes parsed "E1" and "E2" lines from hytek.js
// along with the Hy3Meet.
var Hy3Swim = function( e1, e2, hy3Meet )
{
	this.distance = e1.distance;
	this.stroke = e1.stroke;

	this.type = e2.type;
	this.time = e2.time;
	this.unit = e2.unit;
	this.timeCode = e2.timeCode;
	this.heat = e2.heat;
	this.lane = e2.lane;
	this.placeHeat = e2.placeHeat;
	this.place = e2.place;
	this.plungerTouchpad1 = e2.plungerTouchpad1;
	this.plungerTouchpad2 = e2.plungerTouchpad2;
	this.plungerTouchpad3 = e2.plungerTouchpad3;
	this.plungerTouchpad4 = e2.plungerTouchpad4;
	this.plungerTouchpad5 = e2.plungerTouchpad5;
	this.day = e2.day;

	this.meet = hy3Meet;
}

function parseMeetResults( hy3Contents )
{
	var hytek = new Hytek;
	var hy3lines = hytek.parseContents( hy3Contents );
	var swimmers = [];

	// 'Current' state variables
	var swimmer;
	var meet;
	var b1, e1;

	for( i = 0; i < hy3lines.length; i++ )
	{
		var hy3line = hy3lines[i];
		switch( hy3line.tagId )
		{
			case "D1": // Swimmer information
				swimmer = new Hy3Swimmer( hy3line );
				swimmers.push( swimmer );
				break;
			case "B1": // Part 1 of meet information
				b1 = hy3line;
				break;
			case "B2": // Part 2 of meet information
				meet = new Hy3Meet( b1, hy3line );
				break;
			case "E1": // Individual entry
				e1 = hy3line;
				break;
			case "E2": // Individual result
				swim = new Hy3Swim( e1, hy3line, meet );
				swimmer.swims.push( swim );
				break;
		}
	}
	return swimmers;
}