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

// Canvas draw method for the progress graph
function drawProgressGraph( timestamp )
{
	var ctx = this.ctx;
	ctx.globalCompositeOperation = 'destination-over';
	ctx.clearRect( 0, 0, this.width, this.height );
	ctx.strokeStyle="#FF0000";
	ctx.strokeRect( 0, 0, this.width, this.height );
	// ctx.fillStyle = "rgb(200,0,0)";
	// ctx.fillRect (10, 10, 55, 50);

	var halfBlockWidth = 15;
	var normX = Math.sin( timestamp * 0.001 );
	var x = (normX * (this.halfWidth - halfBlockWidth)) + this.halfWidth - halfBlockWidth;
	ctx.fillStyle = "rgba(0, 0, 200, 0.5)";
	ctx.fillRect( x, 30, halfBlockWidth * 2, halfBlockWidth * 2 );
}

function createProgressGraph( swimmer, swims )
{
	var containerElement = document.getElementById( "progressGraphLocation" );
	if( containerElement && (swims.length > 1) )
	{
		// Create a canvas element for the progress graph
		var graph = new Canvas( containerElement, 320, 1024, 16 / 9, drawProgressGraph );
		
		var startDate = swims[0].date;
		var endDate = swims[ swims.length - 1 ].date;
		var fastest = swims[0].raceTime;
		var slowest = fastest;
		
		// Make the data points
		var dataPoints = [];
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
			dataPoints.push( new DataPoint( swim.date, swim.raceTime ) );
		}
		var raceTimeAxisMin = Math.floor( fastest * 0.2 ) * 5;
		var raceTimeAxisMax = Math.ceil( slowest * 0.2 ) * 5;
		
		// Make the canvas a graph.
		// Hmm, not sure if this is the best way to structure this.
		// This means the canvas *is* a graph.  What if we want multiple
		// graphs in one canvas?
		// Actually I think that's ok, we composite canvases in that case
		// which is the preferred way to do it.
		var verticalAxis = new Axis( raceTimeAxisMin, raceTimeAxisMax, 5, raceTimeToString );
		var horizontalAxis = new DateAxis( startDate, endDate );
		graph.createGraph( horizontalAxis, verticalAxis );
		graph.addDataSeries( new DataSeries( dataPoints ) );
	}
}