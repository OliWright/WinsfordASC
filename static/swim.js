// Winsford ASC Google AppEngine App
//   swim.js
//   Provides 'Swim' class to represent an individual swimmer's performance
//   in an individual swim (race).
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

// Requirements:
//    events.js
//    event.js
//    swimmer.js
//    swimmer_list.js
//    helpers.js

// Constructor of a Swim object from a string passed from the server.
// This string is encoded in a hard-coded tokenised style (not JSON), so the
// code here always has to match the corresponding server-side encoding code.
function Swim( serverString )
{
	var fields = serverString.split("|");
	this.asaNumber = parseInt( fields[0] );
	this.event = GetEvent( parseInt( fields[1] ) );
	this.date = parseDate( fields[2] );
	this.meet = fields[3];
	this.asaSwimId = parseInt( fields[4] );
	var splits = fields[5].split(",");
	var numSplits = splits.length;
	if( numSplits != 0 )
	{
		this.splits = new Array();
		for( i = 0; i < numSplits; i++ )
		{
			this.splits.push( parseFloat( splits[i] ) );
		}
	}
	this.raceTime = parseFloat( fields[6] );
}

// Create a html table of the specified swim's splits, with the times multiplied
// by timeMultiplier (for conversion purposes)
Swim.prototype.createSplitsTable = function( timeMultiplier )
{
	var table = '<table><tr><th>Distance</th><th>Time</th><th>Interval</th><th>Speed (m/s)</th></tr>';
	var numSplits = this.splits.length;
	var distancePerSplit = Math.round( this.event.distance / numSplits );
	var cumulativeTime = 0;
	for( i = 0; i < numSplits; i++ )
	{
		var row = '<tr class="' + this.event.stroke.shortName + '"><td>';
		row += Math.round(distancePerSplit * (i + 1));
		row += '</td><td>';
		cumulativeTime += this.splits[i];
		row += raceTimeToString( cumulativeTime * timeMultiplier );
		row += '</td><td>';
		var convertedInterval = this.splits[i] * timeMultiplier;
		row += raceTimeToString( convertedInterval );
		row += '</td><td>';
		row += (distancePerSplit / convertedInterval).toFixed(2);
		row += '</td></tr>';
		table += row;
	}
	table += '</table>';
	return table;
}

// Create html for a swim
Swim.prototype.createHtml = function()
{
	var swimmer = asaNumberToSwimmer[ this.asaNumber ];

	var html = '<article>';
	html += '<h2>' + swimmer.createNameLink() + '</a></h2>';
	html += '<h3>' + this.meet + '</h3>';
	html += '<p>' + this.date.toDateString() + '</p>';
	html += '<p>' + this.event.toLongString() + '</p>';
	html += '<h2>' + raceTimeToString( this.raceTime ) + '</h2>';
	html += '<p>Converted ';
	var convertedTime;
	if( this.event.course.code === shortCourse.code )
	{
		convertedTime = this.event.convertRaceTime( this.raceTime, longCourse );
		html += longCourse.longName;
	}
	else
	{
		convertedTime = this.event.convertRaceTime( this.raceTime, shortCourse );
		html += shortCourse.longName;
	}
	html += ' time: ' + raceTimeToString(convertedTime) + '</p>'
	html += '</article>';

	if( this.splits !== undefined )
	{
		var numSplits = this.splits.length;
		if( numSplits > 1 )
		{
			html += '<article>';
			html += '<h2>Original ' + this.event.course.longName + ' Splits</h2>';
			html += this.createSplitsTable( 1 );
			html += '</article>';
			
			html += '<article>';
			html += '<h2>Converted ';
			if( this.event.course.code === shortCourse.code )
			{
				html += longCourse.longName;
			}
			else
			{
				html += shortCourse.longName;
			}
			html += ' Splits</h2>';
			html += this.createSplitsTable( convertedTime / this.raceTime );
			html += '</article>';
		}
	}

	return html;
}

// This will issue an asynchronous request to the server for the swim specified
// in the global options object (helpers.js) and populate the "swim_data" page
// element with html corresponding to the results
function getSwimDataAndPopulatePage()
{
	if( options.swim !== undefined )
	{
		var request = null;
		request = new XMLHttpRequest();
		
		// This will be called when the data comes back from the server...
		request.onload = function (e)
		{
			// Did it work?
			if( this.status == 200 )
			{
				// Yes.  Parse the server string into a Swim object.
				var swim = new Swim( this.responseText );
				// Populate the "swim_data" html element with html for the specified swim
				var swimDataElement = document.getElementById( "swim_data" );
				swimDataElement.innerHTML = swim.createHtml();
			}
			else
			{
				// No.  Boo.
				var swimDataElement = document.getElementById( "swim_data" );
				var html = '<p>Unexpected server response</p><p>"' + this.statusText + '"</p>';
				html += this.responseText;
				swimDataElement.innerHTML = html;
			}
		};
		
		// This will be called when things go wrong...
		request.onerror = function (e)
		{
			console.error(this.statusText);
		};

		// Issue the request
		request.open( "GET", "/swim_details?swim=" + options.swim, true );
		request.send();
	}
}

// Make 'getSwimData' get called when the swimmer list has been loaded.
// We need to wait for the swimmer list to be loaded, because we get some of our
// data from there when populating the HTML.
AddListener( "onSwimmerListLoaded", getSwimDataAndPopulatePage );
