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
		containerElement.innerHTML = '<div id="progressGraph" style="width:100%; height:400px;"></div>'

		var chartTitle = swimmer.getFullName() + ' ' + swims[0].event.distance + ' ' + swims[0].event.stroke.shortName + ' Progress'
		
		var raceTimeDateTimeLabelFormats = {
			millisecond:"%M:%S.%H",
			second:"%M:%S.%H",
			minute:"%M:%S.%H"
		}		
		
		var chartDefinition = {
			chart: {
				renderTo: 'progressGraph',
                zoomType: 'x'
            },
            title: {
                text: chartTitle
            },
            subtitle: {
                text: document.ontouchstart === undefined ?
                        'Click and drag in the plot area to zoom in' : 'Pinch the chart to zoom in'
            },
            xAxis: {
                type: 'datetime'
            },
            yAxis: {
                type: 'datetime',
				dateTimeLabelFormats: raceTimeDateTimeLabelFormats,
                title: {
                    text: 'Race Time'
                }
            },
            legend: {
                enabled: false
            },
            plotOptions: {
                area: {
                    fillColor: {
                        linearGradient: {
                            x1: 0,
                            y1: 0,
                            x2: 0,
                            y2: 1
                        },
                        stops: [
                            [0, Highcharts.getOptions().colors[0]],
                            [1, Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
                        ]
                    },
                    marker: {
                        radius: 2
                    },
                    lineWidth: 1,
                    states: {
                        hover: {
                            lineWidth: 1
                        }
                    },
                    threshold: null
                },
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
                name: 'Race Time',
                data: []
            }]
        }
		var dataPoints = chartDefinition.series[0].data
	
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
			//var dataPoint = [ Date.UTC( swim.date.getUTCFullYear(), swim.date.getUTCMonth(), swim.date.getUTCDate() ), swim.raceTime ]
			var raceTime = swim.event.convertRaceTime( swim.raceTime, shortCourse )
			var dataPoint = [ swim.date.getTime(), raceTime * 1000 ]
			dataPoints.push( dataPoint );
		}
		var raceTimeAxisMin = Math.floor( fastest * 0.2 ) * 5;
		var raceTimeAxisMax = Math.ceil( slowest * 0.2 ) * 5;
		
		var chart1 = new Highcharts.Chart(chartDefinition)
	}
}