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


function loadClubRecords()
{
	// Populate the extra_content section of the page with a loading notice
	var extraContentElement = document.getElementById( "clubRecords" );
	var html = '';

	var request = new XMLHttpRequest();
	var swimmer = selectedSwimmersList[0];
	var today = new Date();

	// Asynchronous onload function that's called when swims are returned from the server
	request.onload = function(e)
	{
		// Convert the packed text swims into an array of Swim objects
		var recordLines = this.responseText.split("\n");
		var maleRecords = [];
		for( var i = 0; i < recordLines.length; i++ )
		{
			if( recordLines[i] != "" )
			{
				var recordTokens = recordLines[i].split("^");
				if( recordTokens.length != 5 )
				{
					alert( "Unexpected number of tokens in club record" );
				}
				else
				{
					var record = {};
					var age = parseInt( recordTokens[1] );
					var eventCode = parseInt( recordTokens[2] );
					record.swim = new Swim( recordTokens[4], today );
					record.swimmer = asaNumberToSwimmer[ record.swim.asaNumber ];
					var genderCode = 0;
					if( recordTokens[0] == "F" )
					{
						genderCode = 1;
					}
				}
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
		html = '<article><h2>' + eventName + ' Progress</h2><div class="GraphHolder" id="progressGraphLocation"/></article>';
		html += '<article><h2>' + eventName + ' History</h2>'
		html += createSwimHistoryTable( swims );
		html += '</article>';
		extraContentElement.innerHTML = html;
		extraContentElement.scrollIntoView();
		createProgressGraph( swimmer, swims );
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
	
	request.open( 'GET', '/get_club_records', true );
	request.send();
}

// Make 'loadClubRecords' get called when the swimmer list has been loaded.
// We need to wait for the swimmer list to be loaded, because we get some of our
// data from there when populating the HTML.
AddListener( "onSwimmerListLoaded", loadClubRecords );
