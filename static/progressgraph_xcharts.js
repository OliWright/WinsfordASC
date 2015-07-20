// Winsford ASC Google AppEngine App
//   progress_graph.js
//   Manages a Canvas showing a graph of a swimmer's progress.
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

function createProgressGraph( swimmer, swims )
{
	var containerElement = document.getElementById( "progressGraphLocation" );
	if( containerElement && (swims.length > 1) )
	{
		containerElement.innerHTML = '<figure style="width: 400px; height: 300px;" id="progressGraph"></figure>'
	
		var data = {
		  "xScale": "time",
		  "yScale": "linear",
		  "type": "line",
		  "main": [
			{
			  "className": ".pizza",
			  "data": []
			}
		  ]
		};
		var opts = {
		  "dataFormatX": function (x) { return d3.time.format('%Y-%m-%d').parse(x); },
		  "tickFormatX": function (x) { return d3.time.format('%m/%Y')(x); }
		};
	
		var dataPoints = data["main"][0]["data"];
	
		// Create a canvas element for the progress graph
		//var graph = new Canvas( containerElement, 320, 1024, 16 / 9, drawProgressGraph );
		
		var startDate = swims[0].date;
		var endDate = swims[ swims.length - 1 ].date;
		var fastest = swims[0].raceTime;
		var slowest = fastest;
		
		// Make the data points
		for( var i = 0; i < swims.length; i++ )
		{
			var swim = swims[i];
			if( swim.raceTime < fastest )
			{
				fastest = swim.raceTime;
			}
			if( swim.raceTime > slowest )
			{
				slowest = swim.raceTime;
			}
		//		  "x": "2012-11-05",
			var dateString = swim.date.getFullYear().toString() + "-" + (swim.date.getMonth() + 1).toString() + "-" + swim.date.getDate().toString()
			var dataPoint = { "x": dateString, "y": swim.raceTime }
			dataPoints.push( dataPoint );
		}
		var raceTimeAxisMin = Math.floor( fastest * 0.2 ) * 5;
		var raceTimeAxisMax = Math.ceil( slowest * 0.2 ) * 5;
		
		var myChart = new xChart('line', data, '#progressGraph', opts);
	}
}