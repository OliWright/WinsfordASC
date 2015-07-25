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

var hytekImportFileName;
var hytekImportResults;

function createHtmlTableForMeet( meet )
{
	var table = '<table>';

	var swimmers = meet.swimmers;
	for( var j = 0; j < swimmers.length; j++ )
	{
		var swimmer = swimmers[j];
		table += '<tr ';
		if( swimmer.asaNumber )
		{
			table += 'class="Valid"';
		}
		else
		{
			table += 'class="Invalid"';
		}
		table += '>';
		table += '<th>' + swimmer.name + '</th>';
		table += '</tr>';
		var swims = swimmer.swims;
		for( var k = 0; k < swims.length; k++ )
		{
			var swim = swims[k]
			var event = events[ swim.eventCode ];
			table += '<tr class="' + event.stroke.shortName + '">';
			table += '<td>' + event.distance + ' ' + event.stroke.shortName + '</td>';
			table += '<td class="RaceTime">' + raceTimeToString( swim.raceTime ) + '</td>';
			table += '</tr>';
		}
	}

	table += '</table>';
	return table;
}

function createHtmlForMeets( results )
{
	var html = '';

	var meets = results.meets;
	for( var i = 0; i < meets.length; i++ )
	{
		var meet = meets[i];
		html += '<article>';
		html += '<h2>' + meet.name + '</h2>';
		html += '<p>' + meet.startDate.toLocaleDateString() + " to " + meet.endDate.toLocaleDateString() + '</p>';
		html += createHtmlTableForMeet( meet );
		html += '<p><button onclick="downloadHyTekResults()">Download JSON</button></p>';
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
	
	// Create a new array of results to send up to the server
	var results = {};
	results.meets = [];
	
	// We'll add a 'swimmer' attribute to the ones that we are able
	// to match up, which is the Swimmer object from swimmer.js
	for( var i = 0; i < hy3Meets.length; i++ )
	{
		var hy3Meet = hy3Meets[i];
		var course = hytekCourseCodeToCourse[ hy3Meet.courseCode ];

		var meet = {};
		meet.name = hy3Meet.meetName;
		meet.courseCode = hy3Meet.courseCode;
		meet.startDate = hy3Meet.start;
		meet.endDate = hy3Meet.end;
		meet.swimmers = [];
		results.meets.push( meet );
		
		var hy3Swimmers = hy3Meet.swimmers;
		for( var j = 0; j < hy3Swimmers.length; j++ )
		{
			var hy3Swimmer = hy3Swimmers[j];
			var swimmer = {};

			swimmer.asaNumber = findSwimmerAsaNumberByNameAndDateOfBirth( hy3Swimmer.firstName, hy3Swimmer.lastName, hy3Swimmer.dateOfBirth );
			swimmer.name = hy3Swimmer.getFullName();
			swimmer.swims = [];
			meet.swimmers.push( swimmer );

			// While we're at it, let's match up the event details in the
			// Hy3Swim objects to our Event objects
			var hy3Swims = hy3Swimmer.swims;
			for( var k = 0; k < hy3Swims.length; k++ )
			{
				var hy3Swim = hy3Swims[k];
				var swim = {};
				swim.eventCode = findEvent( hy3Swim.distance, hytekStrokeCodeToStroke[ hy3Swim.stroke ], course ).code;
				swim.raceTime = hy3Swim.time;
				swimmer.swims.push( swim );
			}
		}
	}

	return results;
}

function convertMeetResultsHy3ToJson(evt)
{
	//Retrieve the first (and only!) File from the FileList object
	var f = evt.target.files[0]; 
	console.log( f )
	if (f)
	{
		hytekImportFileName = f.name;
		var r = new FileReader();
		r.onload = function(e)
		{ 
			var hy3Meets = parseMeetResults( e.target.result );
			var results = processHy3Results( hy3Meets );
			// Show the results before we push them to the server
			var meetResultsElement = document.getElementById('importresults')
			meetResultsElement.innerHTML = createHtmlForMeets( results );
			hytekImportResults = results;
		}
		r.readAsText(f);
	}
	else
	{ 
		alert("Failed to load file");
	}
}

function downloadHyTekResults()
{
	var a = document.createElement('a');
	a.href = window.URL.createObjectURL(new Blob([ JSON.stringify( hytekImportResults, null, 2 ) ], {type: 'text/csv;charset=utf-8;'}));
	a.download = hytekImportFileName + '.json';
	a.style.display = 'none';
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
}

function importMeetResultsJson(evt)
{
	//Retrieve the first (and only!) File from the FileList object
	var f = evt.target.files[0]; 
	console.log( f )
	if (f)
	{
		hytekImportFileName = f.name;
		var r = new FileReader();
		r.onload = function(e)
		{ 
			var request = new XMLHttpRequest();
			var url = "admin/post_meet_results";
			var params = e.target.result;
			request.open( "POST", url, true );
			//console.log(params);
			
			request.onreadystatechange = function (e)
			{
				alert(this.responseText);
			};
			request.onerror = function (e)
			{
				alert(this.statusText);
			};	
			request.send( params );
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
	document.getElementById('meetResultsHy3File').addEventListener('change', convertMeetResultsHy3ToJson, false);
	document.getElementById('meetResultsJsonFile').addEventListener('change', importMeetResultsJson, false);
	document.getElementById('importresults').innerHTML = "";
}

AddListener( "onSwimmerListLoaded", activateMeetResultsImport );
