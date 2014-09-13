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
	if( this.ctx )
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
}

function createProgressGraph()
{
	var containerElement = document.getElementById( "progressGraphLocation" );
	if( containerElement )
	{
		// Create a canvas element for the progress graph
		new Canvas( containerElement, 320, 1024, 16 / 9, drawProgressGraph );
	}
}