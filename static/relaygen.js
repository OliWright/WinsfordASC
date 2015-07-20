// Winsford ASC Google AppEngine App
//   relaygen.js
//   Calculates optimal relay teams based on individual PBs and populates
//   HTML tables.
//   This is brute force and inelegant at the moment.  It would be
//   quite straight-forward to cut the search space massively and I
//   hope to get around to doing it at some point, but it's not a priority.
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

var relayGender = "M";
var relayMinAge = 9;
var relayMaxAge = 200;
var relayEvent = 0;
var relayDate = new Date();

var relayCandidatesPerStroke;
var allCandidates = new Object();

var bestImTime;
var bestImCandidatesPerStroke = new Array(4);
var imRelayATeam;
var imRelayBTeam;

// Back, fly, breast, free
var imLegToStroke = new Array( 3, 1, 2, 0 );

// Called when the various list-boxes are changed
function relayGenderChange( val ) { relayGender = val; }
function relayMinAgeChange( val ) { relayMinAge = parseInt( val ); }
function relayMaxAgeChange( val ) { relayMaxAge = parseInt( val ); }
function relayEventChange( val )  { relayEvent = parseInt( val ); }
function relayDateChange( val )
{
	relayDate = new Date( val );
}

function twoDigitString( val )
{
	if( val < 10 )
	{
		return "0" + val;
	}
	return val;
}

// Called on page load
function relayInit()
{
	// Set the relay date to be today's date
	var dateElement = document.getElementById( "relayDate" );
	var dateValue = "";
	dateValue += relayDate.getFullYear() + "-" + twoDigitString(relayDate.getMonth() + 1) + "-" + twoDigitString(relayDate.getDate());
	dateElement.value = dateValue;
}

function makeFreestyleTable( candidates )
{
	var table = "<table><tr><th>Swimmer</th><th>PB</th></tr>";
	var candidates = relayCandidatesPerStroke[0];
	var numCandidates = candidates.length;
	for( var i = 0; i < numCandidates; i++ )
	{
		swimmer = candidates[i];
		table += '<tr class="Free"><td>' + swimmer.first_name + " " + swimmer.last_name + '</td><td>' + raceTimeToString( swimmer.stroke_times[0] ) + '</td></tr>';
	}
	table += '</table>';
	return table;
}

function makeBestImTable( bestCandidatesPerStroke )
{
	if( bestCandidatesPerStroke === undefined )
	{
		return "<article><h2>Not enough eligible swimmers to create a relay team.</h2></article>";
	}
	else
	{
		var table = '<table><tr><th class="Back">Back</th><th class="Breast">Breast</th><th class="Fly">Fly</th><th class="Free">Free</th></tr>';
		table += '<tr>';
		for( var leg = 0; leg < 4; leg++ )
		{
			var stroke = imLegToStroke[ leg ];
			table += '<td class="' + strokes[stroke].shortName + '">';
			candidate = bestCandidatesPerStroke[stroke];
			if( candidate !== undefined )
			{
				table += candidate.first_name + " " + candidate.last_name;
				table += " " + raceTimeToString( candidate.stroke_times[stroke] );
			}
			table += '</td>';
		}
		table += '</tr></table>';
		return table;
	}
}

function setSwimmerStrokeEligibility( asa_number, stroke, eligible )
{
	var swimmer = allCandidates[ asa_number ];
	swimmer.eligibility_per_stroke[ stroke ] = eligible;
	updateCandidatesTable();
}

function makeImCandidatesTable()
{
	var table = '<table><tr><th class="Back">Back</th><th class="Breast">Breast</th><th class="Fly">Fly</th><th class="Free">Free</th></tr>';
	for( rowIdx = 0; rowIdx < 8; rowIdx++ )
	{
		var row = '<tr>';
		var anyInRow = false;
		for( var leg = 0; leg < 4; leg++ )
		{
			var stroke = imLegToStroke[ leg ];
			candidate = relayCandidatesPerStroke[stroke][rowIdx];
			if( candidate === undefined )
			{
				row += '<td></td>';
			}
			else
			{
				row += '<td';
				var makeEligible = 'false';
				var buttonChar = '&#x2717;'; // Unicode cross
				if( !candidate.eligibility_per_stroke[stroke] )
				{
					makeEligible = 'true';
					buttonChar = '&#x2713;' // Unicode tick
					row += ' class="NotEligible"';
				}
				else
				{
					row += ' class="' + strokes[stroke].shortName + '"';
				}
				row += '>';
				row += candidate.first_name + " " + candidate.last_name;
				row += " " + raceTimeToString( candidate.stroke_times[stroke] );
				row += '<button onclick="setSwimmerStrokeEligibility(this.value, ' + stroke + ', ' + makeEligible + ')" value="' + candidate.asa_number + '">' + buttonChar + '</button>';
				anyInRow = true;
				row += "</td>";
			}
		}
		row += "</tr>";
		if( anyInRow )
		{
			table += row;
		}
	}
	table += '</table>';
	return table;
}

function imPermute( strokeSwimmersSoFar, stroke, timeSoFar )
{
	var candidates = relayCandidatesPerStroke[ stroke ];
	// Consider each candidate in turn
	var numCandidatesForStroke = candidates.length;
	for( var i = 0; i < numCandidatesForStroke; i++ )
	{
		// Is this candidate eligible?
		var candidate = candidates[i];
		var eligible = candidate.eligibility_per_stroke[ stroke ];
		if( eligible )
		{
			eligible = !candidate.placed_in_a_team;
		}
		if( eligible )
		{
			for( var s = 0; s < stroke; s++ )
			{
				if( strokeSwimmersSoFar[s] == candidate )
				{
					// Not eligible bacause they're swimming another leg
					eligible = false;
					break;
				}
			}
		}
		if( eligible )
		{
			strokeSwimmersSoFar[stroke] = candidate;
			var time = timeSoFar + candidate.stroke_times[stroke]
			if( stroke == 3 )
			{
				// We have pupulated all the strokes.
				// Is this the best time so far?
				if( (bestImTime === undefined) || ( time < bestImTime) )
				{
					bestImTime = time;
					bestImCandidatesPerStroke = strokeSwimmersSoFar.slice(0); // This clones the array
				}
			}
			else
			{
				// Recurse to fill-in further strokes
				imPermute( strokeSwimmersSoFar, stroke+1, time );
			}
		}
	}
}

function clearTeam( team )
{
	if( team !== undefined )
	{
		for( var i = 0; i < 4; i++ )
		{
			team[i].placed_in_a_team = false;
		}
	}
}

function findOptimumIm()
{
	clearTeam( imRelayATeam );
	imRelayATeam = undefined;
	clearTeam( imRelayBTeam );
	imRelayBTeam = undefined;
	
	// First find the A team
	var strokeSwimmers = new Array(4);
	bestImTime = undefined;
	bestImCandidatesPerStroke = undefined;
	imPermute( strokeSwimmers, 0, 0 );
	imRelayATeam = bestImCandidatesPerStroke;

	if( imRelayATeam !== undefined )
	{
		// Make the A team not eligible for the B team
		for( var i = 0; i < 4; i++ )
		{
			if( bestImCandidatesPerStroke[i] !== undefined )
			{
				bestImCandidatesPerStroke[i].placed_in_a_team = true;
			}
		}

		// Now find the B team
		strokeSwimmers = new Array(4);
		bestImTime = undefined;
		bestImCandidatesPerStroke = undefined;
		imPermute( strokeSwimmers, 0, 0 );
		imRelayBTeam = bestImCandidatesPerStroke;
	}
}

function updateCandidatesTable()
{
	var html = "";
	var numStrokes = 1;
	if( relayEvent >= 3 )
	{
		// IM
		findOptimumIm();
		html = '<article>';
		if( imRelayATeam === undefined )
		{
			html += '<h2>Not enough eligible swimmers to create a relay team.</h2>';
		}
		else
		{
			html += '<h2>Ultimate Relay Team.</h2>';
			html += makeBestImTable( imRelayATeam );
			html += '</article><article>';
			
			if( imRelayBTeam === undefined )
			{
				html += '<h2>Not enough eligible swimmers to create a second team.</h2>';
			}
			else
			{
				html += '<h2>Second Relay Team.</h2>';
				html += makeBestImTable( imRelayBTeam );
			}
			
		}
		html += '</article>';
		html += '<article><h2>Candidates.</h2>';
		html += makeImCandidatesTable();
		html += '</article>';
	}
	else
	{
		// Freestyle
		html += '<article><h2>Candidates.</h2>';
		html += makeFreestyleTable( relayCandidatesPerStroke[0] );
		html += '</article>';
	}
	var candidatesElement = document.getElementById( "candidates" );
	candidatesElement.innerHTML = html;
}

function getCandidates()
{
	var candidatesElement = document.getElementById( "candidates" );
	candidatesElement.innerHTML = "<h2>Getting list of candidates from server...</h2>";

	relayCandidatesPerStroke = new Array();
	allCandidates = new Object();
	var request = null;
	request = new XMLHttpRequest();
	request.onload = function (e)
	{
		var rows = this.responseText.split("\n");
		var numRows = rows.length;
		var i;
		var today = new Date();
		var numStrokes = 1;
		if( relayEvent >= 3 )
		{
			numStrokes = 4;
		}
		var rowIdx = 0;
		for( stroke = 0; stroke < numStrokes; stroke++ )
		{
			var numCandidates = parseInt(rows[ rowIdx ] );
			var strokeCandidates = new Array();
			rowIdx++;
			for (i = 0; i < numCandidates; i++ )
			{
				var tok = rows[ rowIdx ].split("#");
				swimmer = new Swimmer( tok[0], today );
				var existingSwimmer = allCandidates[ swimmer.asa_number ];
				if( existingSwimmer === undefined )
				{
					// This is a new candidate
					allCandidates[ swimmer.asa_number ] = swimmer;
					swimmer.stroke_times = new Object();
					swimmer.eligibility_per_stroke = new Array( true, true, true, true );
					swimmer.placed_in_a_team = false;
				}
				else
				{
					swimmer = existingSwimmer;
				}
				swimmer.stroke_times[ stroke ] = parseFloat( tok[1] );
				strokeCandidates.push( swimmer );
				rowIdx++;
			}
			relayCandidatesPerStroke.push( strokeCandidates );
		}
		updateCandidatesTable();
		//Broadcast( "GotCandidates" );
	};
	request.onerror = function (e)
	{
	  console.error(this.statusText);
	};
	
	// Construct the URL to get the candidate list from the server app
	var url = "relay/";
	if( relayEvent < 3 )
	{
		url += "free?";
	}
	else
	{
		url += "im?";
	}
	url += "distance=";
	switch( relayEvent % 3 )
	{
		case 0:
			url += "50&";
			break;
		case 1:
			url += "100&";
			break;
		case 2:
			url += "200&";
			break;
	}
	url += "gender=" + relayGender + "&";
	url += "min_age=" + relayMinAge + "&";
	url += "max_age=" + relayMaxAge + "&";
	url += "date=" + relayDate.getDate() + "/" + (relayDate.getMonth() + 1) + "/" + relayDate.getFullYear();
	
	request.open( "GET", url, true );
	request.send();
}


// When the page is loaded, initialise
AddListener( "onLoad", relayInit );