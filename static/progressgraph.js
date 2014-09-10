// Winsford ASC Google AppEngine App
//   progress_graph.js
//   Manages a HTML <canvas> showing a graph of a swimmer's progress.
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

var progressGraphContext;

function drawProgressGraph( ctx )
{
	if( ctx )
	{
		ctx.strokeStyle="#FF0000";
		ctx.strokeRect( 10, 10, ctx.width-20, ctx.height-20 );
		ctx.strokeRect (10, 10, 55, 50);
		// ctx.fillStyle = "rgb(200,0,0)";
		// ctx.fillRect (10, 10, 55, 50);

		ctx.fillStyle = "rgba(0, 0, 200, 0.5)";
		ctx.fillRect (30, 30, 55, 50);

	}
}

function createProgressGraph()
{
	var progressGraphLocation = document.getElementById( "progressGraphLocation" );
	if( progressGraphLocation )
	{
		// Add a canvas element
		var width = progressGraphLocation.clientWidth; 
		var height = Math.floor( width * 9 / 16 );
		var html = '<canvas id="progressGraph" width="' + width + '" height="' + height + '"/>';
		progressGraphLocation.innerHTML = html;
		progressGraphContext = document.getElementById( "progressGraph" ).getContext('2d');

		drawProgressGraph( progressGraphContext );
	}
}