// Winsford ASC Google AppEngine App
//   hytek_import.js
//   Support for the hytek_import page and glue from hytek import
//   code to the rest of the app.
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


// Associative array to convert from Hy-Tek stroke code, to our
// Stroke objects.
// An associative array is overkill for this, because the Hy-Tek codes
// go A,B,C,D,E, but it keeps the code pretty(ish) and it's not
// exactly a perfomance issue.
var hytekStrokeCodeToStroke = [];
hytekStrokeCodeToStroke[ "A" ] = GetStroke( "Free" );
hytekStrokeCodeToStroke[ "B" ] = GetStroke( "Back" );
hytekStrokeCodeToStroke[ "C" ] = GetStroke( "Breast" );
hytekStrokeCodeToStroke[ "D" ] = GetStroke( "Fly" );
hytekStrokeCodeToStroke[ "E" ] = GetStroke( "IM" );

var hytekCourseCodeToCourse = [];
hytekCourseCodeToCourse[ "L" ] = longCourse;
hytekCourseCodeToCourse[ "S" ] = shortCourse;

function createHtmlTableForMeet( hy3Meet )
{
	var table = '<table>';

	var hy3Swimmers = hy3Meet.swimmers;
	for( var j = 0; j < hy3Swimmers.length; j++ )
	{
		var hy3Swimmer = hy3Swimmers[j];
		table += '<tr ';
		if( hy3Swimmer.asaNumber )
		{
			table += 'class="Valid"';
		}
		else
		{
			table += 'class="Invalid"';
		}
		table += '>';
		table += '<th>' + hy3Swimmer.getFullName() + '</th>';
		table += '</tr>';
		var hy3Swims = hy3Swimmer.swims;
		for( var k = 0; k < hy3Swims.length; k++ )
		{
			var hy3Swim = hy3Swims[k]
			table += '<tr class="' + hy3Swim.event.stroke.shortName + '">';
			table += '<td>' + hy3Swim.event.distance + ' ' + hy3Swim.event.stroke.shortName + '</td>';
			table += '<td class="RaceTime">' + raceTimeToString( hy3Swim.time ) + '</td>';
			table += '</tr>';
		}
	}

	table += '</table>';
	return table;
}

function createHtmlForMeets( hy3Meets )
{
	var html = '';

	for( var i = 0; i < hy3Meets.length; i++ )
	{
		var hy3Meet = hy3Meets[i];
		html += '<article>';
		html += '<h2>' + hy3Meet.meetName + '</h2>';
		html += '<p>' + hy3Meet.start.toLocaleDateString() + " to " + hy3Meet.end.toLocaleDateString() + '</p>';
		html += createHtmlTableForMeet( hy3Meet );
		html += '</article>';
	}
	return html;
}

function processHy3Results( hy3Meets )
{
	// hy3Meets is an array of Hy3Meet objects, each of which contains
	// an array of Hy3Swimmer objects, each of which contains an array
	// of Hy3Swim objects.

	// The Hy3 data does *not* include swimmer ASA numbers, so the first
	// thing we need to do is match up the swimmers with this in our
	// database in swimmerlist.js.   We have to match up by name first
	// and then date-of-birth where possible.
	// We'll add a 'swimmer' attribute to the ones that we are able
	// to match up, which is the Swimmer object from swimmer.js
	for( var i = 0; i < hy3Meets.length; i++ )
	{
		var hy3Meet = hy3Meets[i];
		var course = hytekCourseCodeToCourse[ hy3Meet.courseCode ];
		var hy3Swimmers = hy3Meet.swimmers;
		for( var j = 0; j < hy3Swimmers.length; j++ )
		{
			var hy3Swimmer = hy3Swimmers[j];
			hy3Swimmer.asaNumber = findSwimmerAsaNumberByNameAndDateOfBirth( hy3Swimmer.firstName, hy3Swimmer.lastName, hy3Swimmer.dateOfBirth );

			// While we're at it, let's match up the event details in the
			// Hy3Swim objects to our Event objects
			var hy3Swims = hy3Swimmer.swims;
			for( var k = 0; k < hy3Swims.length; k++ )
			{
				var hy3Swim = hy3Swims[k];
				hy3Swim.event = findEvent( hy3Swim.distance, hytekStrokeCodeToStroke[ hy3Swim.stroke ], course );
			}
		}
	}

	//JSON.stringify( hy3Meets );
}



function importMeetResultsHy3(evt)
{
	//Retrieve the first (and only!) File from the FileList object
	var f = evt.target.files[0]; 

	if (f)
	{
		var r = new FileReader();
		r.onload = function(e)
		{ 
			var hy3Meets = parseMeetResults( e.target.result );
			processHy3Results( hy3Meets );
			// Show the results before we push them to the server
			var meetResultsElement = document.getElementById('meetresults')
			meetResultsElement.innerHTML = createHtmlForMeets( hy3Meets );
		}
		r.readAsText(f);
	}
	else
	{ 
		alert("Failed to load file");
	}
}

function activateMeetResultsImport()
{
	document.getElementById('meetresultsfile').addEventListener('change', importMeetResultsHy3, false);
}

AddListener( "onSwimmerListLoaded", activateMeetResultsImport );
