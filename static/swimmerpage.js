// Winsford ASC Google AppEngine App
//   swimmerpage.js
//   Support for an individual swimmer's page
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

function populateSwimmerPage()
{
	if( options.asa_number !== undefined )
	{
		setIndividualSelectedSwimmer( parseInt( options.asa_number ) );
		var swimmer = asaNumberToSwimmer[ options.asa_number ];
		if( swimmer != null )
		{
			var swimmerDataElement = document.getElementById( "swimmer_data" );
			swimmerDataElement.innerHTML = swimmer.createHtml();
		}

		// Put the personal_bests module into 'single swimmer' mode, so that it
		// displays meet venue and dates for each PB, and ask it to grab the PBs
		// and populate the table.
		pbTableSingleSwimmerMode = true;
		updatePBs();
	}
}

function createSwimHistoryTable( swims )
{
	var table = '<table>';
	table += '<tr><th>Date</th><th>Meet</th><th>Time</th></tr>';
	
	var targetCourse;
	switch( timeDisplayMode )
	{
		case 0:
			break;
		case 1:
			targetCourse = shortCourse;
			break;
		case 2:
			targetCourse = longCourse;
			break;
	}
	
	for( var i = 0; i < swims.length; i++ )
	{
		var swim = swims[i];
		var row = '<tr class="' + swim.event.stroke.shortName + '">';
		row += '<td>' + swim.date.toLocaleDateString() + '</td>';
		row += '<td>' + swim.meet + '</td>';
		row += createRaceTimeTdElement( swim.event, swim.raceTime, swim.key, targetCourse );
		row += '</tr>'
		table += row;
	}
	table += '</table>';
	return table;
}

// This is called when an event name is clicked in the swimmer's list of PBs.
// Now we go and fetch data about *all* the swimmer's races in that event.
function eventSelected( stroke, distance )
{
	// Populate the extra_content section of the page with a loading notice
	var extraContentElement = document.getElementById( "extra_content" );
	var eventName = distance + 'm ' + stroke.longName;
	extraContentElement.innerHTML = '<article><h2>Getting swim data for ' + eventName + '...</h2></article>';
	extraContentElement.scrollIntoView();

	var request = new XMLHttpRequest();

	// Asynchronous onload function that's called when swims are returned from the server
	request.onload = function(e)
	{
		// Convert the packed text swims into an array of Swim objects
		var swimLines = this.responseText.split("\n");
		var swims = [];
		for( var i = 0; i < swimLines.length; i++ )
		{
			if( swimLines[i] != "" )
			{
				swims.push( new Swim( swimLines[i] ) );
			}
		}

		// Sort them by date
		function compareSwimDates(a,b)
		{
			if( a.date < b.date ) return -1;
			if (a.date > b.date) return 1;
			return 0;
		}
		swims.sort( compareSwimDates );		
		
		// List them
		html = '<article><h2>' + eventName + ' History</h2>'
		html += createSwimHistoryTable( swims );
		html += '</article>';
		html += '<article class="Canvas"><h2>Progress</h2><div id="progressGraphLocation"/></article>';
		extraContentElement.innerHTML = html;
		extraContentElement.scrollIntoView();
		createProgressGraph( swims );
	}

	request.onerror = function(e)
	{
		html = '<article><h2>Error getting swim data from the server</h2>'
		html += "<p>For what it's worth here's what the server said</p>";
		html += '<p>' + this.statusText + '</p>';
		html += '</article>';
		extraContentElement.innerHTML = html;
		extraContentElement.scrollIntoView();
	}
	
	var url = "/swim_history?asa_number=" + options.asa_number + "&stroke_code=" + stroke.code + "&distance=" + distance;
	request.open( "GET", url, true );
	request.send();
}

// Make 'populateSwimmerPage' get called when the swimmer list has been loaded.
// We need to wait for the swimmer list to be loaded, because we get some of our
// data from there when populating the HTML.
AddListener( "onSwimmerListLoaded", populateSwimmerPage );
