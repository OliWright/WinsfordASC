// Winsford ASC Google AppEngine App
//   swimmer.js
//   Provides 'Swimmer' class to represent an individual swimmer
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

// Constructor of a Swimmer object from a string in the swimmer list data
// from the server.
// Pass today's date in also, so we can calculate the swimmer's age.
function Swimmer( row, today )
{
	var tok = row.split("|");
	this.is_male = false;
	if( tok[4]=="M" ) { this.is_male = true; }
	var dob_fields = tok[5].split("/");
	this.date_of_birth = new Date( dob_fields[2], dob_fields[1], dob_fields[0] );
	this.asa_number = parseInt( tok[0] );
	this.last_name = tok[1];
	this.first_name = tok[2];
	this.known_as = tok[3];
	
	this.calculateAgeAtDate = function ( date )
	{
		var age = date.getFullYear() - this.date_of_birth.getFullYear();
		if(date.getMonth() < this.date_of_birth.getMonth() || (date.getMonth()==this.date_of_birth.getMonth() && date.getDate()<this.date_of_birth.getDate())){age--;}
		return age
	}

	this.age = this.calculateAgeAtDate( today )
}

Swimmer.prototype.getFullName = function()
{
	return this.known_as + " " + this.last_name;
}

Swimmer.prototype.createNameLink = function()
{
	return '<a href="swimmer.html?asa_number=' + this.asa_number + '">' + this.getFullName() + '</a>';
}

Swimmer.prototype.createAsaNumberLink = function()
{
	return '<a href="http://www.swimmingresults.org/individualbest/personal_best.php?mode=A&tiref=' + this.asa_number + '">' + this.asa_number + '</a>';
}

Swimmer.prototype.createHtml = function()
{
	var html = '';
	html += '<h2>' + this.getFullName() + '</h2>';
	html += '<p>ASA Number: ' + this.createAsaNumberLink() + '</p>';
	html += '<p>Date-of-Birth: ' + this.date_of_birth.toLocaleDateString() + '</p>';
	html += '<p>Age: ' + this.age + '</p>';
	return html;
}