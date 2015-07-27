// Winsford ASC Google AppEngine App
//   personalbests.js
//   Code for getting PB data from the server and populating HTML tables.
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

var pbCache = {}

function deletePBsTable()
{
	var pbsElement = document.getElementById( "personal_bests" );
	pbsElement.innerHTML = "";
}

// When this is true, it means that we're looking at a swimmer's personal
// page.  So the PBs table is only for that single swimmer.
// In this mode, we add additional columns for venue and date.
var pbTableSingleSwimmerMode = false;

function populatePBsTable()
{
	var table = '<table><tr><th class="StickyColumn">Event</th>';
	var cacheEntries = new Array();
	var numSelected = selectedSwimmersList.length;
	if( pbTableSingleSwimmerMode )
	{
		var swimmer = selectedSwimmersList[0];
		var cacheEntry = pbCache[ swimmer.asa_number ];
		if( cacheEntry !== undefined )
		{
			cacheEntries.push( cacheEntry );
		}
		table += '<th>Time</th><th>Meet</th><th>Date</th>';
	}
	else
	{
		for( i = 0; i < numSelected; i++ )
		{
			var swimmer = selectedSwimmersList[i];
			var cacheEntry = pbCache[ swimmer.asa_number ];
			if( cacheEntry !== undefined )
			{
				table += "<th>" + swimmer.createNameLink() + '<button onclick="swimmerDeselected(this)" value="' + swimmer.asa_number + '">X</button></th>';
				cacheEntries.push( cacheEntry );
			}
		}
	}
	table += "</tr>";
	var numEvents;
	if( timeDisplayMode == 0 )
	{
		numEvents = events.length;
	}
	else
	{
		// We know there are the same number of long and short course events and that
		// their indices in each array are equivalent.
		numEvents = shortCourseEvents.length;
	}
	var numColumns = cacheEntries.length;
	var anyConvertedTimes = false;
	for( i = 0; i < numEvents; i++ )
	{
		var event;
		var comparibleEvent;
		var targetCourse;
		switch( timeDisplayMode )
		{
			case 0:
				event = events[i];
				break;
			case 1:
				event = shortCourseEvents[i];
				comparibleEvent = longCourseEvents[i];
				targetCourse = shortCourse;
				break;
			case 2:
				event = longCourseEvents[i];
				comparibleEvent = shortCourseEvents[i];
				targetCourse = longCourse;
				break;
		}
		var row = '<tr class="' + event.stroke.shortName + '"><td';
		if( pbTableSingleSwimmerMode )
		{
			row += ' onclick="eventSelected(strokes[' + event.stroke.code + '], ' + event.distance + ')"';
		}
		row += '>';
		row += event.distance + " " + event.stroke.shortName;
		if( timeDisplayMode == 0 )
		{
			row += " " + event.course.shortName;
		}
		row += '</td>';
		var anyTimesForThisEvent = false;
		for( j = 0; j < numColumns; j++ )
		{
			var contents = "";
			var attributes = ' class="RaceTime"';
			var cacheEntry = cacheEntries[j];
			var timeIsConverted = false;
			var swim;
			var raceEvent = event;
			if( !cacheEntry.isPopulated )
			{
				contents = "...";
			}
			else
			{
				// Do we have an entry for this event 
				swim = cacheEntry[ event.code ];
				switch( timeDisplayMode )
				{
					case 0:
						break;
					case 1:
					case 2:
						// Is the converted time for a comparible event faster?
						var comparibleSwim = cacheEntry[ comparibleEvent.code ];
						if( comparibleSwim !== undefined )
						{
							var convertedRaceTime = comparibleEvent.convertRaceTime( comparibleSwim.raceTime, targetCourse );
							if( (swim === undefined) || ( convertedRaceTime < swim.raceTime ) )
							{
								// Use the converted time as the PB
								timeIsConverted = true;
								anyConvertedTimes = true;
								swim = comparibleSwim;
								raceEvent = comparibleEvent;
							}
						}
						break;
				}
			}
			if( swim === undefined )
			{
				row += '<td/>';
			}
			else
			{
				row += createRaceTimeTdElement( raceEvent, swim.raceTime, swim.key, targetCourse );
				anyTimesForThisEvent = true;
			}

			if( pbTableSingleSwimmerMode && anyTimesForThisEvent )
			{
				// Add additional td elements for meet venue and date
				row += '<td>' + swim.meet + '</td>'; 
				row += '<td>' + swim.date.toLocaleDateString() + '</td>'; 
			}
			
		}
		if( anyTimesForThisEvent )
		{
			row += "</tr>";
			table += row;
		}
	}
	table += "</table>";

	if( anyConvertedTimes )
	{
		switch( timeDisplayMode )
		{
			case 1:
				table += '<footer><sup>*</sup>Times converted from long course.</footer>';
				break;
			case 2:
				table += '<footer><sup>*</sup>Times converted from short course.</footer>';
				break;
		}
	}
	var pbsElement = document.getElementById( "personal_bests" );
	pbsElement.innerHTML = table;
}

var CacheEntry = function( swimmer )
{
	this.swimmer = swimmer;
	this.isPopulated = false;
}

var loadingPbSwimmerList = false;

function getSelectedSwimmersFromLocalStorage()
{
	loadingPbSwimmerList = true;
	loadSelectedSwimmers( "PBs" );
	loadingPbSwimmerList = false;
}

function storeSelectedSwimmersToLocalStorage()
{
	if( !loadingPbSwimmerList )
	{
		saveSelectedSwimmers( "PBs" );
	}
}

function updatePBs()
{
	var numSelected = selectedSwimmersList.length;
	if( numSelected == 0 )
	{
		deletePBsTable();
	}
	else
	{
		// Figure out if we need to do a XMLHttpRequest to get any PBs that
		// we haven't got cached.
		var get_params = "";
		var numToGet = 0;
		var newCacheEntries = new Array();
		for( i = 0; i < numSelected; i++ )
		{
			swimmer = selectedSwimmersList[i];
			if( pbCache[ swimmer.asa_number ] === undefined )
			{
				if( numToGet != 0 )
				{
					get_params += "&";
				}
				get_params += "asa_numbers=" + swimmer.asa_number;
				var cacheEntry = new CacheEntry( swimmer );
				newCacheEntries.push( cacheEntry );
				pbCache[ swimmer.asa_number ] = cacheEntry;
				numToGet++;
			}
		}
		// Update the table straight away, so we get the new column added
		populatePBsTable();
		if( numToGet != 0 )
		{
			// We need PBs for swimmers that aren't in the cache.
			// Fire off a XMLHttpRequest to get that data....
			var request = new XMLHttpRequest();
			var url = "personal_bests?" + get_params;
			request.onload = function (e)
			{
				// Parse the data that comes back.
				// It should be a comma separated list with one event per row
				// and then the times for the swimmers that we asked for in order.
				var rows = this.responseText.split("\n");
				var numRows = rows.length;
				var i;
				for (i = 0; i < numRows; i++)
				{
					if( rows[i] != "" )
					{
						var tok = rows[i].split("^");
						var event = GetEvent( tok[0] );
						for( var j = 0; j < numToGet; j++ )
						{
							var swimStr = tok[(j*4)+1];
							if( swimStr != "" )
							{
								newCacheEntries[ j ][ event.code ] = new Swim( swimStr );
							}
						}
					}
				}
				for( var j = 0; j < numToGet; j++ )
				{
					newCacheEntries[ j ].isPopulated = true;
				}
				populatePBsTable();
			};
			request.onerror = function (e)
			{
				console.error(this.statusText);
				
				// Remove the swimmers that we'd asked for from the cache
				for( var j = 0; j < numToGet; j++ )
				{
					swimmer = newCacheEntries[ j ].swimmer;
					pbCache[ swimmer.asa_number ] = undefined;
					populatePBsTable();
				}
			};	
			request.open( "GET", url, true );
			request.send();
		}
	}
}

function saveSelectedSwimmersAndUpdatePBs()
{
	storeSelectedSwimmersToLocalStorage();
	updatePBs();
}

AddListener( "TimeDisplayModeChanged", populatePBsTable );
