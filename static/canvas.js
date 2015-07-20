// Winsford ASC Google AppEngine App
//   canvas.js
//   Provides a Canvas class that creates and manages a HTML <canvas>
//   including boring stuff like handling resizing.
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

// All the active canvases, indexed by their containing element
var canvases = {};

// Call resized on all Canvases
function handleResize()
{
	for( var key in canvases )
	{
		canvases[ key ].resized();
	}
}
window.addEventListener( 'resize', handleResize, false );

// Call draw on all canvases
function updateAnimation( timestamp )
{
	for( var key in canvases )
	{
		var canvas = canvases[ key ];
		if( canvas.draw && canvas.ctx )
		{
			canvas.draw( timestamp );
			canvas.requireFullRedraw = false;
		}
	}
	requestAnimationFrame( updateAnimation );
}
requestAnimationFrame( updateAnimation );

// Canvas constructor
function Canvas( containerElement, minWidth, maxWidth, aspectRatio, drawMethod )
{
	this.containerElement = containerElement;
	this.minWidth = minWidth;
	this.maxWidth = maxWidth;
	this.aspectRatio = aspectRatio;
	if( drawMethod )
	{
		this.draw = drawMethod
	};

	// Resize does all the creation if it needs to
	this.resized();

	canvases[ containerElement ] = this;
}

Canvas.prototype.resized = function()
{
	width = this.maxWidth;
	if( this.containerElement.clientWidth < width )
	{
		width = this.containerElement.clientWidth;
		if( width < this.minWidth )
		{
			width = this.minWidth;
		}
	}
	if( !this.width || (this.width != width) )
	{
		// [Re]create the <canvas>
		this.width = width;
		this.height = Math.floor( this.width / this.aspectRatio );
		var html = '<canvas id="progressGraph" width="' + this.width + '" height="' + this.height + '"/>';
		this.containerElement.innerHTML = html;
		this.ctx = document.getElementById( "progressGraph" ).getContext('2d');
		this.halfWidth = this.width * 0.5;
		this.halfHeight = this.height * 0.5;
		this.requireFullRedraw = true;
	}
}
