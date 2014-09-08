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

var Race = function( time, meet, date, key )
{
	this.time = time;
	this.meet = meet;
	this.date = date;
	if( key.length != 0 )
	{
		this.key = key;
	}
}

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
		switch( timeDisplayMode )
		{
			case 0:
				event = events[i];
				break;
			case 1:
				event = shortCourseEvents[i];
				comparibleEvent = longCourseEvents[i];
				break;
			case 2:
				event = longCourseEvents[i];
				comparibleEvent = shortCourseEvents[i];
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
			if( !cacheEntry.isPopulated )
			{
				contents = "...";
			}
			else
			{
				// Do we have an entry for this event 
				var race = cacheEntry[ event.code ];
				var raceTime = undefined;
				var raceKey = undefined;
				var raceVenue = undefined;
				var raceDate = undefined;
				if( race !== undefined )
				{
					raceTime = race.time;
					raceKey = race.key;
					raceVenue = race.meet;
					raceDate = race.date;
				}
				switch( timeDisplayMode )
				{
					case 0:
						break;
					case 1:
					case 2:
						var comparibleRace = cacheEntry[ comparibleEvent.code ];
						if( comparibleRace !== undefined )
						{
							var comparibleRaceTime = comparibleRace.time;
							// Convert
							var convertedRaceTime = comparibleEvent.convertRaceTime( comparibleRaceTime, event.course );
							if( (raceTime === undefined) || ( convertedRaceTime < raceTime ) )
							{
								// Use the converted time as the PB
								timeIsConverted = true;
								anyConvertedTimes = true;
								raceTime = convertedRaceTime;
								raceKey = comparibleRace.key;
								raceVenue = comparibleRace.meet;
								raceDate = comparibleRace.date;
								attributes += ' title="Original ' + comparibleEvent.course.longName + ' Time: ' + raceTimeToString( comparibleRaceTime ) + '"';
							}
						}
						break;
				}
				if( raceTime !== undefined )
				{
					if( raceKey !== undefined )
					{
						contents = '<a href="swim.html?swim=' + raceKey + '">' + raceTimeToString( raceTime ) + '</a>';
					}
					else
					{
						contents = raceTimeToString( raceTime );
					}
					anyTimesForThisEvent = true;
				}
			}
			row += '<td' + attributes + '>' + contents;
			if( timeIsConverted )
			{
				row += '<sup>*</sup>';
			}
			row += '</td>';

			if( pbTableSingleSwimmerMode && anyTimesForThisEvent )
			{
				// Add additional td elements for meet venue and date
				row += '<td>' + raceVenue + '</td>'; 
				row += '<td>' + raceDate.toLocaleDateString() + '</td>'; 
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
						var tok = rows[i].split(",");
						var event = GetEvent( tok[0] );
						for( var j = 0; j < numToGet; j++ )
						{
							var raceTime = tok[(j*4)+1];
							if( raceTime != "" )
							{
								var meet = tok[(j*4)+2];
								var date = parseDate( tok[(j*4)+3] );
								var swimKey = tok[(j*4)+4];
								newCacheEntries[ j ][ event.code ] = new Race( parseFloat(raceTime), meet, date, swimKey );
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
