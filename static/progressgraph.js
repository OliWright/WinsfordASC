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

function ProgressGraph( containerElement )
{
	this.resized( containerElement );
}

ProgressGraph.prototype.draw = function( timestamp )
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

var progressGraph;
function updateAnimation( timestamp )
{
	progressGraph.draw( timestamp );
	requestAnimationFrame( updateAnimation );
}

ProgressGraph.prototype.resized = function( containerElement )
{
	if( !this.containerElement )
	{
		this.containerElement = containerElement;
	}
	width = 1024;
	if( this.containerElement.clientWidth < width )
	{
		width = this.containerElement.clientWidth;
	}
	if( !this.width || (this.width != width) )
	{
		this.width = width;
		this.height = Math.floor( this.width * 9 / 16 );
		var html = '<canvas id="progressGraph" width="' + this.width + '" height="' + this.height + '"/>';
		this.containerElement.innerHTML = html;
		this.ctx = document.getElementById( "progressGraph" ).getContext('2d');
		this.halfWidth = this.width * 0.5;
		this.halfHeight = this.height * 0.5;
	}
}

function createProgressGraph()
{
	var containerElement = document.getElementById( "progressGraphLocation" );
	if( containerElement )
	{
		// Add a canvas element
		progressGraph = new ProgressGraph( containerElement );
	
		// This doesn't work.  Don't know why.
		//containerElement.onresize = function(){ progressGraph.resized( this ); };

		// This doesn't work either.  Don't know why.
		//containerElement.addEventListener( 'onresize', function(){ progressGraph.resized( this ); } );

		// Have to do this.  But this seems wrong.
		window.addEventListener('resize', function(){ progressGraph.resized( this ); }, false);

		requestAnimationFrame( updateAnimation );
	}
}