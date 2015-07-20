// Winsford ASC Google AppEngine App
//
//   swimmerlist.js
//
//   Module to manage the full list of Winsford swimmers, along with a subset
//   list of 'selected' swimmers.
//  
//   The full list of available swimmers is async requested from the server and
//   populates the 'swimmers' array with Swimmer objects (from swimmer.js)
//  
//   HTML selectors are presented (if their placeholders exist in the HTML), to allow the
//   user to filter on gender and age to be given a list of swimmers to select from.
//   The selected swimmers are then added to the 'selectedSwimmersList' array. 
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



var swimmers = new Array();
var numSwimmers = 0;

var swimmerList =
{
	selectionHtmlElement:null, // Where to inject the selectors
	selectedHtmlElement:null, // Where to inject the current list of selected swimmers
	multi_select:true,
	gender:"", // Gender filter mode
	age:0 // Age filter mode
};
var selectedSwimmersList = new Array();

var asaNumberToSwimmer = new Array();

// Repopulates the swimmer selector according to the current filter.
function repopulateSwimmerList()
{
	if( swimmerList.selectionHtmlElement != null )
	{
		var selector = "";
		var acceptMale = !(swimmerList.gender == "F");
		var acceptFemale = !(swimmerList.gender == "M");
		var minAge = 0;
		var maxAge = 99;
		if( (typeof(swimmerList.age) == "string") && (swimmerList.age.substr(0, 4) == "Over") )
		{
			minAge = parseInt( swimmerList.age.substr(4) );
		}
		else
		{
			minAge = parseInt( swimmerList.age );
			if( minAge != 0 )
			{
				maxAge = minAge;
			}
		}

		selector += '<option value="0">Choose swimmers</option>'
		for (i = 0; i < numSwimmers; i++)
		{
			var swimmer = swimmers[i];
			var is_male = swimmer.is_male;
			var accept = (is_male && acceptMale) || (!is_male && acceptFemale);
			if( accept )
			{
				accept = (swimmer.age >= minAge) && (swimmer.age <= maxAge);
			}
			if( accept )
			{
				//selector += '<p class="draggable_swimmer" draggable="true" ondragstart="startDraggingSwimmer(event)" data-asa-number="' + swimmer.asa_number + '">' + swimmer.first_name + ' ' + swimmer.last_name + '</p>'
				selector += '<option value="' + swimmer.asa_number + '">' + swimmer.first_name + ' ' + swimmer.last_name + '</option>'
			}
		}
		swimmerList.selectionHtmlElement.innerHTML = selector;    // Change the content of the selection list
	}
}

function repopulateSelectedSwimmers()
{
	if( swimmerList.selectedHtmlElement != null )
	{
		var selector = "";
		var numSelected = selectedSwimmersList.length;
		if( numSelected == 0 )
		{
			selector += "Drag the swimmers that you're interested in into here.";
		}
		else
		{
			for( i = 0; i < numSelected; i++ )
			{
				swimmer = selectedSwimmersList[i];
				selector += '<p class="draggable_swimmer" draggable="true" ondragstart="startDraggingSwimmer(event)" data-asa-number="' + swimmer.asa_number + '">' + swimmer.first_name + ' ' + swimmer.last_name + '</p>'
			}
		}
		swimmerList.selectedHtmlElement.innerHTML = selector;
	}
}

// Called when the 'gender' drop down filter is changed.
function genderChange( gender )
{
	swimmerList.gender = gender;
	localStorage.genderSelect = gender;
	repopulateSwimmerList();
}

// Called when the 'age' drop down filter is changed.
function ageChange( age )
{
	swimmerList.age = age;
	localStorage.ageSelect = age;
	repopulateSwimmerList();
}

function addSwimmerToSelectedList( asa_number )
{
	// Find the selected swimmer.  Linear search, but there are only a couple of hundred.
	// If it's a problem we can create a swimmer list sorted on ASA number and binary search.
	for (i = 0; i < numSwimmers; i++)
	{
		if( swimmers[i].asa_number == asa_number )
		{
			// Make sure this swimmer isn't already selected..
			var numSelected = selectedSwimmersList.length;
			var alreadyInList = false;
			for( j = 0; j < numSelected; j++ )
			{
				if( selectedSwimmersList[j].asa_number == asa_number )
				{
					alreadyInList = true;
					break;
				}
			}
			// And if they're not, then add them to the selection
			if( !alreadyInList )
			{
				selectedSwimmersList.push( swimmers[i] );
				repopulateSelectedSwimmers();
				Broadcast( "onSwimmerListChanged" );
				break;
			}
		}
	}
}

function removeSwimmerFromSelectedList( asa_number )
{
	// Find the swimmer in the selected list
	var numSelected = selectedSwimmersList.length;
	for( var j = 0; j < numSelected; j++ )
	{
		if( selectedSwimmersList[j].asa_number == asa_number )
		{
			selectedSwimmersList.splice( j, 1 );
			repopulateSelectedSwimmers();
			Broadcast( "onSwimmerListChanged" );
			break;
		}
	}
}

function swimmerDroppedInSelection( ev ) { addSwimmerToSelectedList( parseInt(ev.dataTransfer.getData("asa_number")) ); }
function swimmerDiscarded( ev ) { removeSwimmerFromSelectedList( parseInt(ev.dataTransfer.getData("asa_number")) ); }

// Set ondragover="allowDrop(event)" in elements that we want to use as drop targets.  This lets them be dropped on.
function allowDrop(ev) { ev.preventDefault(); }

// Get the ASA number of the swimmer that we're dragging and store it into the drag event
function startDraggingSwimmer(ev) { ev.dataTransfer.setData("asa_number",ev.target.getAttribute("data-asa-number")); }

function swimmerSelected(sel)
{
	var asaNumber = parseInt( sel.options[sel.selectedIndex].value );
	if( asaNumber != 0 )
	{
		addSwimmerToSelectedList( asaNumber );
	}
	sel.selectedIndex = 0;
}

function swimmerDeselected( button )
{
	var asaNumber = parseInt( button.value );
	removeSwimmerFromSelectedList( asaNumber );
}

// Called when a swimmer is dropped into the selection list
function swimmerDroppedInSelectedList(ev)
{
	ev.preventDefault();
	var asa_number = parseInt( ev.dataTransfer.getData("asa_number") );
	addSwimmerToSelectedList( asa_number );
}

// Called when a swimmer is dropped into the selection list
function swimmerDiscarded(ev)
{
	ev.preventDefault();
	var asa_number = parseInt( ev.dataTransfer.getData("asa_number") );
	removeSwimmerFromSelectedList( asa_number );
}

function populateSwimmerList()
{
	swimmerList.selectionHtmlElement = document.getElementById( "swimmer_choice_list" );
	swimmerList.selectedHtmlElement = document.getElementById( "selected_swimmers" );
	repopulateSwimmerList();
	repopulateSelectedSwimmers();
}

function loadSwimmerList()
{
	// Get local storage values for saved settings of the gender and age selectors
	// Get initial values of the gender and age selectors
	var genderElement = document.getElementById( "gender_select" );
	if( genderElement !== null )
	{
		if( localStorage.genderSelect !== undefined )
		{
			genderElement.value = localStorage.genderSelect;
		}
		swimmerList.gender = genderElement.value;
	}
	var ageElement = document.getElementById( "age_select" );
	if( ageElement !== null )
	{
		if( localStorage.ageSelect !== undefined )
		{
			ageElement.value = localStorage.ageSelect;
		}
		swimmerList.age = ageElement.value;
	}
	var timeDisplayModeElement = document.getElementById( "time_display_mode" );
	if( timeDisplayModeElement !== null )
	{
		if( localStorage.timeDisplayMode !== undefined )
		{
			timeDisplayModeElement.value = localStorage.timeDisplayMode;
		}
		timeDisplayMode = parseInt( timeDisplayModeElement.value );
	}

	// Async request to server for swimmer list
	var request = null;
	request = new XMLHttpRequest();
	request.onload = function (e)
	{
		var rows = this.responseText.split("\n");
		var numRows = rows.length;
		var i;
		var today = new Date();
		numSwimmers = 0;
		for (i = 0; i < numRows; i++)
		{
			if( rows[i] != "" )
			{
				swimmer = new Swimmer( rows[i], today );
				swimmers.push( swimmer );
				asaNumberToSwimmer[ swimmer.asa_number ] = swimmer;
				numSwimmers++;
			}
		}
		Broadcast( "onSwimmerListLoaded" );
	};
	request.onerror = function (e)
	{
	  console.error(this.statusText);
	};	
	request.open( "GET", "/swimmer_list", true );
	request.send();
}

// 0: Show long and short course times separately
// 1: Show all times converted to short course
// 2: Show all times converted to long course
var timeDisplayMode = 0;
function changeTimeDisplayMode( mode )
{
	timeDisplayMode = parseInt( mode );
	Broadcast( "TimeDisplayModeChanged" );
	localStorage.timeDisplayMode = timeDisplayMode;
}

// Use local storage to save which swimmers are selected for a given module (page) e.g. "PBs"
function saveSelectedSwimmers( moduleName )
{
	var numSelected = selectedSwimmersList.length;
	var selectedStr = "";
	for( var i = 0; i < numSelected; i++ )
	{
		swimmer = selectedSwimmersList[i];
		if( i != 0 )
		{
			selectedStr += ",";
		}
		selectedStr += swimmer.asa_number;
	}
	localStorage.setItem( "Swimmers_" + moduleName, selectedStr );
}

function loadSelectedSwimmers( moduleName )
{
	var selectedStr = localStorage.getItem( "Swimmers_" + moduleName );
	if( (selectedStr === undefined) || (selectedStr === null) )
	{
		selectedSwimmersList = new Array();
	}
	else
	{
		var asaNumbers = selectedStr.split(",");
		var numSwimmers = asaNumbers.length;
		for( var i = 0; i < numSwimmers; i++ )
		{
			addSwimmerToSelectedList( parseInt( asaNumbers[i] ) );
		}
	}
}

function setIndividualSelectedSwimmer( asaNumber )
{
	selectedSwimmersList = new Array();
	addSwimmerToSelectedList( asaNumber );
}

// TODO: Make this look through the Cat1 swimmers too.
// We'll need to add a Cat1 swimmer list, and add date-of-birth to
// the Cat1 swimmer.  But we probably need to think about keeping
// date-of-birth for Cat1 swimmers entirely server-side for legal issues.
// Which in turn means pushing this function server-side and making
// it asynchronous.
function findSwimmerAsaNumberByNameAndDateOfBirth( firstName, lastName, dateOfBirth )
{
	var firstNameLower = firstName.toLowerCase();
	var lastNameLower = lastName.toLowerCase();
	var dateOfBirthValue = dateOfBirth.valueOf();
	for (i = 0; i < numSwimmers; i++)
	{
		var swimmer = swimmers[i];
		if(
			(swimmer.date_of_birth.valueOf() == dateOfBirthValue) &&
			(swimmer.first_name.toLowerCase() == firstNameLower) &&
			(swimmer.last_name.toLowerCase() == lastNameLower))
		{
			return swimmer.asa_number;
		}
	}
}

// When the page is loaded, async get the swimmer list
AddListener( "onLoad", loadSwimmerList );
// When the list of swimmers is loaded, then populate the list
AddListener( "onSwimmerListLoaded", populateSwimmerList );
