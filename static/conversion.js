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

var inputTimeElement;
var inputTimeTextElement;
var inputEventElement;
var shortToLongModeElement;
var resultElement;
var inputTimeInSeconds = 0;

function UpdateURL()
{
	var url = urlBase + '?';
	if( inputTimeInSeconds != 0 )
	{
		url += 'time=' + raceTimeToString( inputTimeInSeconds ) + '&';
	}
	url += 'event=' + inputEventElement.value;
	if( shortToLongModeElement.checked )
	{
		url += '&mode=0';
	}
	else
	{
		url += '&mode=1';
	}
	window.history.pushState( '', '', url );
}

function CalculateConversion()
{
	
	// Look-up the short-course event
	var event;
	var courseToConverTo;
	if( shortToLongModeElement.checked )
	{
		event = shortCourseEvents[ parseInt(inputEventElement.value) ];
		courseToConvertTo = longCourse;
	}
	else
	{
		event = longCourseEvents[ parseInt(inputEventElement.value) ];
		courseToConvertTo = shortCourse;
	}
	var html = '';
	if( inputTimeInSeconds == 0 )
	{
		html = '<h2>Results</h2><p>Will appear here when you enter a time...</p>';
	}
	else
	{
		var convertedTime = event.convertRaceTime( inputTimeInSeconds, courseToConvertTo );
		html += '<h2>' + event.distance + ' ' + event.stroke.shortName + '</h2>';
		html += '<table>';
		html += '<tr class="' + event.stroke.shortName + '"><td>' + event.course.longName + '</td><td>' + raceTimeToString( inputTimeInSeconds ) + '</td></tr>';
		html += '<tr class="' + event.stroke.shortName + '"><td>' + courseToConvertTo.longName + '</td><td>' + raceTimeToString( convertedTime ) + '</td></tr>';
		html += '</table>';
	}
	
	resultElement.innerHTML = html;

	// Poke the time back into the input elements, so they both stay in sync with each other.
	if( inputTimeTextElement !== null )
	{
		inputTimeTextElement.value = raceTimeToString( inputTimeInSeconds );
	}
	if( inputTimeElement !== null )
	{
		inputTimeElement.valueAsNumber = inputTimeInSeconds * 1000;
	}
}

function TimeChanged()
{
	// Time input valueAsNumber appears to return the time in milliseconds.
	inputTimeInSeconds = inputTimeElement.valueAsNumber / 1000;
	CalculateConversion();
}

function TimeTextChanged()
{
	// Time input valueAsNumber appears to return the time in milliseconds.
	inputTimeInSeconds = parseRaceTime( inputTimeTextElement.value );
	CalculateConversion();
	UpdateURL();
}

function EventOrModeChanged()
{
	CalculateConversion();
	UpdateURL();
}

function ParseURL()
{
	if( options.time !== undefined )
	{
		inputTimeInSeconds = parseRaceTime( options.time );
	}
	if( options.event !== undefined )
	{
		inputEventElement.value = options.event;
	}
	if( options.mode !== undefined )
	{
		longToShortModeElement = document.getElementById( "long_to_short" );
		if( options.mode == "0" )
		{
			shortToLongModeElement.checked = true;
			longToShortModeElement.checked = false;
		}
		else
		{
			longToShortModeElement.checked = true;
			shortToLongModeElement.checked = false;
		}
	}
	if( inputTimeInSeconds != 0 )
	{
		CalculateConversion();
	}
}

function InitConversion()
{
	// Find all our elephants
	inputTimeElement = document.getElementById( "input_time" );
	inputTimeTextElement = document.getElementById( "input_time_text" );
	inputEventElement = document.getElementById( "event_select" );
	shortToLongModeElement = document.getElementById( "short_to_long" );
	resultElement = document.getElementById( "conversion_results" );
	document.title = 'Swim time conversion';

	ParseURL();
}

// When the page is loaded, initialise
AddListener( "onLoad", InitConversion );

// When the user navigates the history, re-parse the URL
AddListener( "onPopState", ParseURL );
