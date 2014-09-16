// Winsford ASC Google AppEngine App
//   graph.js
//   Graph class. Extends Canvas with graph-related nonsense
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

function defaultLabelFunction( val )
{
	return val.toString(); 
}

function Tick( normalisedPos, label )
{
	this.normalisedPos = normalisedPos;
	this.label = label;
}

function Axis( min, max, step, labelFunction )
{
	this.min = min;
	this.max = max;
	this.step = step;
	this.recipRange = 1 / (max - min);
	if( labelFunction )
	{
		this.labelFunction = labelFunction;
	}
	else
	{
		this.labelFunction = defaultLabelFunction;
	}
	this.ticks = [];
	
	for( var val = this.min; val < this.max; val += this.step )
	{
		var tick = new Tick( (val - this.min) * this.recipRange, this.labelFunction( val ) );
		this.ticks.push( tick );
	}
}

function DateAxis( min, max )
{
	this.min = min;
	this.max = max;
	// Look at the span of dates to determine a good step
	var spanMS = max.getTime() - min.getTime();
	// 86400000 ms in a day
	// 31536000000ms (roughly) in a year
	var spanYears = spanMS / 31536000000;
	if( spanYears > 8 )
	{
		// Step every year
	}
	else if( spanYears > 5 )
	{
		// Step every 6 months
	}
	else if( spanYears > 3 )
	{
		// Step every 3 months
	}
	else if( spanYears > 1 )
	{
		// Step every 2 months
	}
	else if( spanYears > 0.3 )
	{
		// Step every month
	}
	else
	{
		// Step every week
	}
}

Canvas.prototype.drawAxis = function( axis, length, depth, isVertical )
{
	var ctx = this.ctx;
	ctx.save();
	if( isVertical )
	{
		ctx.rotate( Math.PI * -0.5 );
	}
	ctx.strokeStyle="#FF0000";
	ctx.beginPath();
	ctx.moveTo( 0, 0 );
	ctx.lineTo( length, 0 );

	var tickDepth = depth * 0.5;
	for( var i = 0; i < axis.ticks.length; i++ )
	{
		var x = axis.ticks[i].normalisedPos * length;
		ctx.moveTo( x, 0 );
		ctx.lineTo( x, tickDepth );
	}
	ctx.stroke();

	ctx.textAlign = 'center';
	ctx.textBaseline = 'top';
	for( var i = 0; i < axis.ticks.length; i++ )
	{
		var tick = axis.ticks[i];
		var x = tick.normalisedPos * length;
		ctx.fillText( tick.label, x, tickDepth );
	}

	ctx.restore();
}

function drawGraph( timestamp )
{
	//if( this.requireFullRedraw )
	{
		var ctx = this.ctx;
		ctx.globalCompositeOperation = 'destination-over';
		ctx.setTransform(1,0,0,1,0,0);
		ctx.clearRect( 0, 0, this.width, this.height );
		// Move to the graph origin
		ctx.translate( this.axisDepth, this.height - this.axisDepth );
		// Draw the axes
		this.drawAxis( this.axisH, this.width - this.axisDepth, this.axisDepth, false );
		this.drawAxis( this.axisV, this.width - this.axisDepth, -this.axisDepth, true );
	}
}

// Extend Canvas with a createGraph method
Canvas.prototype.createGraph = function( horizontalAxis, verticalAxis )
{
	this.axisH = horizontalAxis;
	this.axisV = verticalAxis;
	this.draw = drawGraph;
	this.axisDepth = 50;
}
