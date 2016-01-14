// Winsford ASC Google AppEngine App
//   admin.js
//   Support for the admin page(s)
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

var adminRequestInProgress = false;

function doAdminPost( url, params )
{
	if( !adminRequestInProgress )
	{
		adminRequestInProgress = true;
		var request = new XMLHttpRequest();
		var responseElement = document.getElementById( "server_response" );
		responseElement.scrollIntoView();
		responseElement.innerHTML = "<p>Request pending...</p>";
		request.onload = function (e)
		{
			responseElement.innerHTML = this.responseText;
			adminRequestInProgress = false;
		};
		request.onerror = function (e)
		{
			console.error(this.statusText);
			responseElement.innerHTML = this.statusText;
			adminRequestInProgress = false;
		};
		request.open( "POST", url + "?" + params, true );
		request.send();
	}
}

// Returns a string in the form asa_number=xxx&asa_number=yyy etc.
// for all the selected swimmers
function getSelectedSwimmersAsHtmlParams()
{
	var numSelected = selectedSwimmersList.length;
	var get_params = "";
	for( i = 0; i < numSelected; i++ )
	{
		swimmer = selectedSwimmersList[i];
		if( i != 0 )
		{
			get_params += "&";
		}
		get_params += "asa_number=" + swimmer.asa_number;
	}
	return get_params;
}

function updateSwimsForSelected()
{
	if( selectedSwimmersList.length > 0 )
	{
		doAdminPost( "/admin/queue_update_swims", getSelectedSwimmersAsHtmlParams() );
	}
}

function updatePBsForSelected()
{
	if( selectedSwimmersList.length > 0 )
	{
		doAdminPost( "/admin/update_personal_bests", getSelectedSwimmersAsHtmlParams() );
	}
}

function updateSwimmers()
{
	var searchInputElement = document.getElementById( "update_swimmers_input" );
	doAdminPost( "/admin/update_swimmers", "name_search=" + searchInputElement.value );
}

function updateSwims()
{
	var searchInputElement = document.getElementById( "update_swims_input" );
	doAdminPost( "/admin/queue_update_swims", "name_search=" + searchInputElement.value );
}

function updateSwimLists()
{
	var searchInputElement = document.getElementById( "update_swim_lists_input" );
	doAdminPost( "/admin/update_swim_lists", "name_search=" + searchInputElement.value );
}

function nukeSwimmer()
{
	var nukeInputElement = document.getElementById( "nuke_swimmer_input" );
	doAdminPost( "/admin/nuke_swimmer", "asa_number=" + nukeInputElement.value );
}

function downloadSwimLists()
{
	var allSwimLists = "";
	
	var responseElement = document.getElementById( "server_response" );
	responseElement.scrollIntoView();
	responseElement.innerHTML = "<p>Request pending...</p>";
	
	for (i = 0; i < numSwimmers; i++)
	{
		var swimmer = swimmers[i];
	
		// Async request to server for swimmer list
		var request = null;
		request = new XMLHttpRequest();
		request.onload = function (e)
		{
			console.log( 'Got swim list for ' + swimmer.getFullName() );
			if( i != 0 )
			{
				// Add a blank line between swimmers
				allSwimLists += '\n';
			}
			// Then the swimmer
			allSwimLists += swimmer.toString();
			allSwimLists += '\n';
			// Then the swim list
			if( this.responseText != '' )
			{
				allSwimLists += this.responseText;
				if( i < (numSwimmers - 1) )
				{
					allSwimLists += '\n';
				}
			}
		};
		request.onerror = function (e)
		{
		  console.error(this.statusText);
		};	
		request.open( 'GET', '/swim_history?asa_number=' + swimmer.asa_number, false );
		request.send();
	}
	
	responseElement.innerHTML = '<p>' + allSwimLists + '</p>';
}

function rescrapeMeet()
{
	var urlElement = document.getElementById( "rescrape_meet_url" );
	var meetCodeElement = document.getElementById( "rescrape_meet_code" );
	var encodedUrl = encodeURIComponent(urlElement.value);
	doAdminPost( "/admin/rescrape_meet", "url=" + encodedUrl + "&meet_code=" + meetCodeElement.value );
}