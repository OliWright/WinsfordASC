// Winsford ASC Google AppEngine App
//   event.js
//  Provides the Event class, which encapsulates a particular
//  swimming event (e.g. 50m FreeStyle Long Course)
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

var data = {
  "xScale": "time",
  "yScale": "linear",
  "type": "line",
  "main": [
    {
      "className": ".pizza",
      "data": [
        {
          "x": "2012-11-05",
          "y": 1
        },
        {
          "x": "2012-11-06",
          "y": 6
        },
        {
          "x": "2012-11-07",
          "y": 13
        },
        {
          "x": "2012-11-08",
          "y": -3
        },
        {
          "x": "2012-11-09",
          "y": -4
        },
        {
          "x": "2012-11-10",
          "y": 9
        },
        {
          "x": "2012-11-11",
          "y": 6
        }
      ]
    }
  ]
};
var opts = {
  "dataFormatX": function (x) { return d3.time.format('%Y-%m-%d').parse(x); },
  "tickFormatX": function (x) { return d3.time.format('%A')(x); }
};
var myChart;

function CreateGraph()
{
	myChart = new xChart('line', data, '#testChart', opts);
}

// When the page is loaded, initialise
AddListener( "onLoad", CreateGraph );

// When the user navigates the history, re-parse the URL
//AddListener( "onPopState", ParseURL );
