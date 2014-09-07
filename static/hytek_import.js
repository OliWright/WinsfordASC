// Winsford ASC Google AppEngine App
//   hytek_import.js
//   Support for the hytek_import page and glue from hytek import
//   code to the rest of the app.
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


// Associative array to convert from Hy-Tek stroke code, to our
// Stroke objects.
// An associative array is overkill for this, because the Hy-Tek codes
// go A,B,C,D,E, but it keeps the code pretty(ish) and it's not
// exactly a perfomance issue.
var hytekStrokeCodeToStroke = new Array();
hytekStrokeCodeToStroke[ "A" ] = GetStroke( "Free" );
hytekStrokeCodeToStroke[ "B" ] = GetStroke( "Back" );
hytekStrokeCodeToStroke[ "C" ] = GetStroke( "Breast" );
hytekStrokeCodeToStroke[ "D" ] = GetStroke( "Fly" );
hytekStrokeCodeToStroke[ "E" ] = GetStroke( "IM" );

function processHy3Results( hy3Swimmers )
{
	var jsonResultsElement = document.getElementById('jsonresults')
	jsonResultsElement.innerHTML = JSON.stringify( hy3Swimmers );
}


// event = GetEvent( parseInt( hyLine.distance ), hytekStrokeCodeToStroke[ hyLine.stroke ], course );
// eventDate = hyLine.date;
// if( eventDate == "        " )
// {
// // The HY3 documentation says there should be a date here, but there doesn't appear to be
// eventDate = meetDate;
// }

function importMeetResultsHy3(evt)
{
	//Retrieve the first (and only!) File from the FileList object
	var f = evt.target.files[0]; 

	if (f)
	{
		var r = new FileReader();
		r.onload = function(e)
		{ 
			var hy3Swimmers = parseMeetResults( e.target.result );
			processHy3Results( hy3Swimmers );
		}
		r.readAsText(f);
	}
	else
	{ 
		alert("Failed to load file");
	}
}

function activateMeetResultsImport()
{
	document.getElementById('meetresultsfile').addEventListener('change', importMeetResultsHy3, false);
}

AddListener( "onLoad", activateMeetResultsImport );
