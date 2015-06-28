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

function CalculateConversion()
{
	// Find all our elephants
	var inputTimeElement = document.getElementById( "input_time" );
	var inputEventElement = document.getElementById( "event_select" );
	var shortToLongModeElement = document.getElementById( "short_to_long" );
	var resultElement = document.getElementById( "conversion_results" );
	
	
	// Time input valueAsNumber appears to return the time in milliseconds.
	var timeInSeconds = inputTimeElement.valueAsNumber / 1000;
	
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
	var convertedTime = event.convertRaceTime( timeInSeconds, courseToConvertTo );
	var html = '';
	html += '<h2>' + event.distance + ' ' + event.stroke.shortName + '</h2>';
	html += '<table>';
	html += '<tr class="' + event.stroke.shortName + '"><td>' + event.course.longName + '</td><td>' + raceTimeToString( timeInSeconds ) + '</td></tr>';
	html += '<tr class="' + event.stroke.shortName + '"><td>' + courseToConvertTo.longName + '</td><td>' + raceTimeToString( convertedTime ) + '</td></tr>';
	html += '</table>';
	
	resultElement.innerHTML = html;
}