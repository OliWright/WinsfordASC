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
		var tick = new Tick( this.getNormalisedPos( val ), this.labelFunction( val ) );
		this.ticks.push( tick );
	}
}

Axis.prototype.getNormalisedPos = function( val )
{
	return (val - this.min) * this.recipRange;
}

function DateAxis( min, max )
{
	this.min = min.getTime();
	this.max = max.getTime();
	this.recipRange = 1 / (this.max - this.min);
	// Look at the span of dates to determine a good step
	var spanMS = this.max - this.min;
	// 86400000 ms in a day
	// 31536000000ms (roughly) in a year
	var spanYears = spanMS / 31536000000;
	var day = min.getDate();
	var month = min.getMonth();
	var year = min.getFullYear();
	var monthStep = 0;
	var weekStep = 0;
	if( spanYears > 8 )
	{
		// Step every year
		monthStep = 12;
	}
	else if( spanYears > 5 )
	{
		// Step every 6 months
		monthStep = 6;
	}
	else if( spanYears > 3 )
	{
		// Step every 3 months
		monthStep = 3;
	}
	else if( spanYears > 1 )
	{
		// Step every 2 months
		monthStep = 2;
	}
	else if( spanYears > 0.3 )
	{
		// Step every month
		monthStep = 1;
	}
	else
	{
		// Step every week
		monthStep = 1;
		weekStep = 0;
	}
	stepMonths = function( step )
	{
		month += step;
		year += Math.floor( month / 12 );
		month = month % 12;
	}
	if( monthStep > 0 )
	{
		// Round up the first tick to the nearest month.
		if( day != 1 )
		{
			day = 1;
			stepMonths( 1 );
		}
	}
	this.ticks = [];
	var date = new Date( year, month, day );
	while( date < max )
	{
		var val = date.getTime();
		var tick = new Tick( (val - this.min) * this.recipRange, date.toLocaleDateString() );
		this.ticks.push( tick );
		
		stepMonths( monthStep );
		date = new Date( year, month, day );
	}
}

DateAxis.prototype.getNormalisedPos = function( val )
{
	return (val.getTime() - this.min) * this.recipRange;
}

function DataPoint( x, y )
{
	this.x = x;
	this.y = y;
}

function DataSeries( dataPoints )
{
	this.dataPoints = dataPoints;
}

Canvas.prototype.drawAxis = function( axis, length, depth, gridLength, isVertical )
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

	var tickDepth = depth * 0.3;
	var labelDepth = depth * 0.5;
	for( var i = 0; i < axis.ticks.length; i++ )
	{
		var x = axis.ticks[i].normalisedPos * length;
		ctx.moveTo( x, 0 );
		ctx.lineTo( x, tickDepth );
	}
	ctx.stroke();
	
	ctx.strokeStyle="#F0F0F0";
	ctx.beginPath();
	for( var i = 0; i < axis.ticks.length; i++ )
	{
		var x = axis.ticks[i].normalisedPos * length;
		ctx.moveTo( x, 0 );
		ctx.lineTo( x, gridLength );
	}
	ctx.stroke();
	
	ctx.restore();

	if( isVertical )
	{
		ctx.textAlign = 'right';
		ctx.textBaseline = 'middle';
		for( var i = 0; i < axis.ticks.length; i++ )
		{
			var tick = axis.ticks[i];
			var y = tick.normalisedPos * length;
			ctx.fillText( tick.label, labelDepth, -y );
		}
	}
	else
	{
		ctx.textAlign = 'center';
		ctx.textBaseline = 'top';
		for( var i = 0; i < axis.ticks.length; i++ )
		{
			var tick = axis.ticks[i];
			var x = tick.normalisedPos * length;
			ctx.fillText( tick.label, x, labelDepth );
		}
	}
}

function drawGraph( timestamp )
{
	if( this.requireFullRedraw )
	{
		var ctx = this.ctx;
		//ctx.globalCompositeOperation = 'destination-over';
		ctx.setTransform(1,0,0,1,0,0);
		ctx.clearRect( 0, 0, this.width, this.height );
		// Move to the graph origin
		ctx.translate( this.axisDepth, this.height - this.axisDepth );
		// Draw the axes
		var width = this.width - this.axisDepth;
		var height = this.height - this.axisDepth;
		this.drawAxis( this.axisH, width, this.axisDepth, -height, false );
		this.drawAxis( this.axisV, height, -this.axisDepth, width, true );
		// Draw the data series
		for( var i = 0; i < this.dataSeries.length; ++i )
		{
			var dataSeries = this.dataSeries[i];
			var dataPoints = dataSeries.dataPoints;
			ctx.strokeStyle="#202080";
			ctx.beginPath();
			ctx.moveTo( 50, 50 );
			ctx.lineTo( 100, 100 );
			ctx.moveTo( this.axisH.getNormalisedPos( dataPoints[0].x ) * width, this.axisV.getNormalisedPos( dataPoints[0].y ) * -height );
			for( var j = 1; j < dataPoints.length; ++j )
			{
				ctx.lineTo( this.axisH.getNormalisedPos( dataPoints[j].x ) * width, this.axisV.getNormalisedPos( dataPoints[j].y ) * -height );
			}
			ctx.stroke();
		}
	}
}

// Extend Canvas with a createGraph method
Canvas.prototype.createGraph = function( horizontalAxis, verticalAxis )
{
	this.axisH = horizontalAxis;
	this.axisV = verticalAxis;
	this.draw = drawGraph;
	this.axisDepth = 50;
	this.dataSeries = [];
}

Canvas.prototype.addDataSeries = function( dataSeries )
{
	this.dataSeries.push( dataSeries );
}
