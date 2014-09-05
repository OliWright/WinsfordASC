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
