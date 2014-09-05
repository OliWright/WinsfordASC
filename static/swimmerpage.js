// Winsford ASC Google AppEngine App
//   swimmerpage.js
//   Support for an individual swimmer's page
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

function populateSwimmerPage()
{
	if( options.asa_number !== undefined )
	{
		setIndividualSelectedSwimmer( parseInt( options.asa_number ) );
		var swimmer = asaNumberToSwimmer[ options.asa_number ];
		if( swimmer != null )
		{
			var swimmerDataElement = document.getElementById( "swimmer_data" );
			swimmerDataElement.innerHTML = swimmer.createHtml();
		}

		// Put the personal_bests module into 'single swimmer' mode, so that it
		// displays meet venue and dates for each PB, and ask it to grab the PBs
		// and populate the table.
		pbTableSingleSwimmerMode = true;
		updatePBs();
	}
}

// Make 'populateSwimmerPage' get called when the swimmer list has been loaded.
// We need to wait for the swimmer list to be loaded, because we get some of our
// data from there when populating the HTML.
AddListener( "onSwimmerListLoaded", populateSwimmerPage );
