// Winsford ASC Google AppEngine App
//
//   signin.js
//
//   Module to manage the signing in of users.
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

function getUser()
{
	var request = null;
	request = new XMLHttpRequest();
	request.onload = function (e)
	{
		signInElement = document.getElementById( "SignIn" );
		signInElement.hidden = false;
		html = "";
		if( this.responseText.length > 0 )
		{
			html += '<p>Signed in as ' + this.responseText + '</p>';
		}
		else
		{
			html += '<p>Sign in with ';
			html += '<a href="login/google">Google</a>'
			html += ' or <a href="login/facebook">Facebook</a>'
			html += ' or <a href="login/twitter">Twitter</a>'
			html += '</p>';
		}
		signInElement.innerHTML = html;
	};
	request.onerror = function (e)
	{
	  console.error(this.statusText);
	};	
	request.open( "GET", "/user", true );
	request.send();
}

// When the page is loaded, async get the logged in user
AddListener( "onLoad", getUser );
