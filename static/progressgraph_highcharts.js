// Winsford ASC Google AppEngine App
//   progressgraph_highcharts.js
//   Swim progress graph using HighCharts
//   http://www.highcharts.com/
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
		// Insert another container div, using the Graph class, which contains
		// some CSS voodoo for making the height a proportion of the width
		containerElement.innerHTML = '<div id="progressGraph" class="Graph"></div>'
		
		// HighCharts chart definition
		var chartDefinition =
		{
			chart:
			{
				renderTo: 'progressGraph',
                zoomType: 'x',
				backgroundColor: null, // Make the graph transparent
				style:
				{
					fontFamily: '"Open Sans", sans-serif',
					fontSize: '100%'
				}
            },
			// Orange first
			colors: ['#E68A2E', '#7cb5ec', '#434348', '#90ed7d', '#f7a35c', '#8085e9', '#f15c80', '#e4d354', '#2b908f', '#f45b5b', '#91e8e1'],
			title: null, // We put the title in the HTML, so the graph doesn't need to
            xAxis: { type: 'datetime' },
            yAxis:
			{
				// Data is race time in seconds
                type: 'linear',
				title: null,
				labels:
				{
					// Display as race time
					formatter: function()
					{
						return raceTimeToString( this.value )
					}
				}
            },
            legend: { enabled: false },
            plotOptions: {
				spline: {
					marker: {
						enabled: true
					}
				}
            },
			tooltip: {
				formatter: function()
				{
					// Look-up the index of the data point
					var dataPoints = this.series.data
					var swimIndex = -1
					for( var i = 0; i < dataPoints.length; i++ )
					{
						if( dataPoints[i].x == this.x )
						{
							swimIndex = i
							break
						}
					}
					var html = ''
					if( swimIndex == -1 )
					{
						html += 'Failed to look-up swim<br/>'
					}
					else
					{
						html += swims[swimIndex].date.toLocaleDateString() + ' ' + swims[swimIndex].meet + '<br/>'
					}
					html += 'Race Time: ' + raceTimeToString( this.y * 0.001 )
					return html
				}
			},

            series: [{
                type: 'spline',
                name: swimmer.getFullName(),
                data: []
            }]
        }
	
		// Make the data points
		var dataPoints = chartDefinition.series[0].data
		for( var i = 0; i < swims.length; i++ )
		{
			var swim = swims[i];
			var raceTime = swim.event.convertRaceTime( swim.raceTime, shortCourse )
			var dataPoint = [ swim.date.getTime(), raceTime ]
			dataPoints.push( dataPoint );
		}

		// Create the chart
		var chart1 = new Highcharts.Chart(chartDefinition)
	}
}