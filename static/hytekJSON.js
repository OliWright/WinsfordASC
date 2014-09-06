var tagsJSON = '
{
	"A1" : {
		"alias" : "File Information"

	},
	"B1" : {
		"alias" : "Meet Information 1",

		"meetName" : [2, 46],
		"facility" : [47, 91],
		"start" : [92, 99],
		"end" :  [100, 107],
		"ageUp" : [108, 115],
		"elevation" : [116, 120]
	},
	"B2" : {
		"alias" : "Meet Information 2",

		"meetType" : [96, 97], 
		"courseCode" : [98, 98],
		"courseCode2" : [106, 106]
	},
	"B3" : {

	},
	"C1" : {
		"alias" : "Swim Team Information",

		"teamAbr" : [2,6],
		"teamNameLong" : [7, 36],
		"teamNameShort" : [37, 52],
		"usaSwimmingLSC" : [53, 54],
		"teamType" : [119, 121]
	},
	"C2" : {
		"alias" : "Swim Team Address Information 1",

		"mailTo" : [2, 31],
		"address" : [32, 61],
		"city" : [62, 91],
		"state" : [92, 93],
		"zip" : [94, 103],
		"country" : [104, 106],
		"teamRegistration" : [108, 111]
		},
	"C3" : {
		"alias" : "Siwm Team Address Information 2",

		"daytimePhone" : [32, 51],
		"eveningPhone" : [52, 71],
		"fax" : [72, 91],
		"email" : [92, 117]
		},
	"D1" : {
		"alias" : "Swimmer Entry",

		"gender" : [2, 2],
		"id" : [3, 7],
		"lastName" : [8, 27],
		"firstName" : [28, 47],
		"nickName" : [48, 67],
		"middleInitial" : [68, 68],
		"USSNUM" : [69, 82],
		"birth" : [88, 95],
		"age" : [97, 98]
		},
	"D2" : {


		},
	"D3" : {

		},
	"D4" : {

		},
	"D5" : {

	},
	"$___E1NOTES___" : {
		"comment" : "distance may start at 15 or 16, check"
	},
	"E1" : {
		"alias" : "Individual Event Entry",

		"gender" : [2, 2],
		"id" : [3, 7],
		"abbreviation" : [8, 12],
		"gender1" : [13, 13],
		"gender2" : [14, 14],
		"distance" : [17, 20],
		"stroke" : [21, 21],
		"ageLower" : [22, 24],
		"ageUpper" : [25, 27],
		"eventFee" : [32, 37],
		"eventNumber" : [38, 41],
		"conversionSeedTime1" : [42, 49],
		"conversionSeedCourse1" : [50, 50],
		"seedTime1" : [52, 58],
		"seedCourse1" : [59, 59],
		"conversionSeedTime2" : [60, 67],
		"conversionSeedCourse2" : [68, 68],
		"seedTime2" : [69, 75],
		"seedCourse2" : [76, 76]
	},
	"E2" : {
		"alias" : "Individual Event Results",

		"type" : [2, 2],
		"time" : [3, 10],
		"unit" : [11, 11],
		"timeCode" : [12, 14],
		"heat" : [20, 22],
		"lane" : [23, 25],
		"placeHeat" : [26, 28],
		"place" : [29, 32],
		"plungerTouchpad1" : [36, 43],
		"plungerTouchpad2" : [44, 51],
		"plungerTouchpad3" : [52, 59],
		"plungerTouchpad4" : [65, 72],
		"plungerTouchpad5" : [74, 81],
		"day" : [102, 109]
		},
	"F1" : {
		"alias" : "Relay Event Entry",

		"teamAbbreviation" : [2, 6],
		"relayTeam" : [7,7],
		"gender" : [12, 12],
		"gender1" : [13, 13],
		"gender2" : [14, 14],
		"distance" : [17, 20],
		"stroke" : [21, 21],
		"ageLower" : [22, 24],
		"ageUpper" : [25, 27],
		"fee" : [32, 37],
		"eventNumber" : [38, 40],
		"seedTime1" : [43, 49],
		"seedCourse1" : [50],
		"seedTime2" : [52, 58],
		"seedCourse2" : [59, 59]
		},
	"F2" : {
		"alias" : "Relay Event Entry 2",

		"resultType" : [2, 2],
		"time" : [3, 10],
		"unit" : [11, 11],
		"timeCode" : [12, 14],
		"heat" : [20, 22],
		"lane" : [23, 25],
		"placeHeat" : [26, 28],
		"place" : [29, 32],
		"plungerTouchpad1" : [36, 43],
		"plungerTouchpad2" : [44, 51],
		"plungerTouchpad3" : [52, 59],
		"plungerTouchpad4" : [65, 72],
		"plungerTouchpad5" : [74, 81],
		"day" : [102, 109]
		},
	"F3" : {
		"alias" : "Relay Event Entry 3",

		"swimmerOneGender" : [2,2],
		"swimmerOneId" : [3,7],
		"swimmerOneAbbreviation" : [8, 12],
		"swimmerOneGender" : [13,13],
		"swimmerOneLeg" : [14, 14],
		"swimmerTwoGender" : [15,15],
		"swimmerTwoId" : [16,20],
		"swimmerTwoAbbreviation" : [21, 25],
		"swimmerTwoGender" : [26,26],
		"swimmerTwoLeg" : [27, 27],
		"swimmerThreeGender" : [28,28],
		"swimmerThreeId" : [29,33],
		"swimmerThreeAbbreviation" : [34, 38],
		"swimmerThreeGender" : [39,39],
		"swimmerThreeLeg" : [40, 40],
		"swimmerFourGender" : [41,41],
		"swimmerFourId" : [42,46],
		"swimmerFourAbbreviation" : [47, 51],
		"swimmerFourGender" : [52,52],
		"swimmerFourLeg" : [53, 53]
	},
	"G" : {
		"alias" : "Splits",

		"resultType" : [2, 2],
		"split1Length" : [3, 4],
		"split1Time" : [5, 12],
		"split2Length" : [14, 15],
		"split2Time" : [16, 23],
		"split3Length" : [25, 26],
		"split3Time" : [27, 34],
		"split4Length" : [36, 37],
		"split4Time" : [38, 45],
		"split5Length" : [47, 48],
		"split5Time" : [49, 56],
		"split6Length" : [58, 59],
		"split6Time" : [60, 67],
		"split7Length" : [69, 70],
		"split7Time" : [71, 78],
		"split8Length" : [80, 81],
		"split8Time" : [82, 89],
		"split9Length" : [91, 92],
		"split9Time" : [93, 100],
		"split10Length" : [102, 103],
		"split10Time" : [104, 111]
	},
	"H1" : {

	}
}'

var dqcodesJSON = '
{
   "3A":{
      "description":"10 Alternating Kick",
      "stroke":"Breast"
   },
   "3B":{
      "description":"10 Downward Butterfly Kick",
      "stroke":"Breast"
   },
   "3C":{
      "description":"10 Scissors Kick",
      "stroke":"Breast"
   },
   "3D":{
      "description":"11 Non-simultaneous Arms",
      "stroke":"Breast"
   },
   "3E":{
      "description":"11 Two Strokes Underwater",
      "stroke":"Breast"
   },
   "3F":{
      "description":"11 Arms not in Same Horizontal Plane",
      "stroke":"Breast"
   },
   "3G":{
      "description":"11 Hands Beyond the Hipline During Stroke",
      "stroke":"Breast"
   },
   "3H":{
      "description":"12 Elbows Recovered over the Water",
      "stroke":"Breast"
   },
   "3I":{
      "description":"14 Head not up during Cycle of Pull and Kick",
      "stroke":"Breast"
   },
   "3J":{
      "description":"14 Double Pulls or Kicks",
      "stroke":"Breast"
   },
   "3K":{
      "description":"15 One Hand Touch",
      "stroke":"Breast"
   },
   "3L":{
      "description":"15 Non-simultaneous Touch",
      "stroke":"Breast"
   },
   "3M":{
      "description":"16 Shoulders not at or Past Vertical Towards Breast off the Wall",
      "stroke":"Breast"
   },
   "3N":{
      "description":"19 Multiple Butterfly Kicks on Pull Out",
      "stroke":"Breast"
   },
   "3O":{
      "description":"19 Non-simultaneous Kick",
      "stroke":"Breast"
   },
   "3P":{
      "description":"19 Fly Kick Prior to Pull",
      "stroke":"Breast"
   },
   "3Q":{
      "description":"19 Legs not in the Same Horizontal Plane",
      "stroke":"Breast"
   },
   "3R":{
      "description":"19 Feet not Pointed Outward during Propulsive Part of Kick",
      "stroke":"Breast"
   },
   "3S":{
      "description":"19 Hands not Separated at Touch"
   },
   "1A":{
      "description":"20 Alternating Kick",
      "stroke":"Fly"
   },
   "1B":{
      "description":"20 Breaststroke Kick",
      "stroke":"Fly"
   },
   "1C":{
      "description":"20 Scissors Kick",
      "stroke":"Fly"
   },
   "1D":{
      "description":"21 Non-simultaneous Arms",
      "stroke":"Fly"
   },
   "1E":{
      "description":"21 Underwater Recovery",
      "stroke":"Fly"
   },
   "1F":{
      "description":"23 One Hand Touch",
      "stroke":"Fly"
   },
   "1G":{
      "description":"23 Non-simultaneous Touch",
      "stroke":"Fly"
   },
   "1H":{
      "description":"24 Shoulders not at or Past Vertical Towards Breast off the Wall",
      "stroke":"Fly"
   },
   "1I":{
      "description":"25 Head did not Break the Surface by 15 Meters",
      "stroke":"Fly"
   },
   "1J":{
      "description":"29 Compeletely Submerged during the Swim",
      "stroke":"Fly"
   },
   "1K":{
      "description":"29 Compeletely Submerged prior to Turn or Finish",
      "stroke":"Fly"
   },
   "1S":{
      "description":"29 Hands not Separated at Touch"
   },
   "2A":{
      "description":"30 Toes Curled over Gutter after the Start",
      "stroke":"Back"
   },
   "2B":{
      "description":"31 Head did not Break the Surface by 15 Meters",
      "stroke":"Back"
   },
   "2C":{
      "description":"32 Shoulders not at or Past Vertical Towards Back off the Wall",
      "stroke":"Back"
   },
   "2D":{
      "description":"33 No Touch at Turn",
      "stroke":"Back"
   },
   "2E":{
      "description":"34 Delay Initiating Arm Pull",
      "stroke":"Back"
   },
   "2F":{
      "description":"34 Delay Initiating Turn",
      "stroke":"Back"
   },
   "2G":{
      "description":"34 Multiple Strokes",
      "stroke":"Back"
   },
   "2H":{
      "description":"35 Shoulders Past Vertical Toward Breast during Swim",
      "stroke":"Back"
   },
   "2I":{
      "description":"36 Shoulders Past Vertical at Finish",
      "stroke":"Back"
   },
   "2J":{
      "description":"39 Compeletely Submerged during the Swim",
      "stroke":"Back"
   },
   "2K":{
      "description":"39 Compeletely Submerged prior to Turn or Finish",
      "stroke":"Back"
   },
   "5P":{
      "description":"42 Strokes out of Sequence",
      "stroke":"IM"
   },
   "4K":{
      "description":"50 No Touch on Turn",
      "stroke":"Free"
   },
   "4N":{
      "description":"51 Head did not Break the Surface by 15 Meters",
      "stroke":"Free"
   },
   "4M":{
      "description":"52 Compeletely Submerged during the Swim",
      "stroke":"Free"
   },
   "4O":{
      "description":"52 Compeletely Submerged prior to Turn or Finish",
      "stroke":"Free"
   },
   "7A":{
      "description":"60 False Start",
      "stroke":"Misc"
   },
   "7B":{
      "description":"61 Delay of Meet",
      "stroke":"Misc"
   },
   "7C":{
      "description":"62 Did not Finish",
      "stroke":"Misc"
   },
   "7D":{
      "description":"63 Declared False Start",
      "stroke":"Misc"
   },
   "7E":{
      "description":"69 Entered Water without Permission",
      "stroke":"Misc"
   },
   "7F":{
      "description":"69 Interfered with Another Swimmer",
      "stroke":"Misc"
   },
   "7G":{
      "description":"69 Walking on or Springing from Bottom",
      "stroke":"Misc"
   },
   "7H":{
      "description":"69 Standing on Bottom",
      "stroke":"Misc"
   },
   "7I":{
      "description":"69 Pulling on Lane Line",
      "stroke":"Misc"
   },
   "7J":{
      "description":"69 Finished in Wrong Lane",
      "stroke":"Misc"
   },
   "7K":{
      "description":"69 Unsportsmanlike Conduct",
      "stroke":"Misc"
   },
   "7L":{
      "description":"69 No Show Prelim Event",
      "stroke":"Misc"
   },
   "7M":{
      "description":"69 No Show Final Event",
      "stroke":"Misc"
   },
   "61":{
      "description":"70 Stroke Infraction swimmer #1",
      "stroke":"Relay"
   },
   "62":{
      "description":"70 Stroke Infraction swimmer #2",
      "stroke":"Relay"
   },
   "63":{
      "description":"70 Stroke Infraction swimmer #3",
      "stroke":"Relay"
   },
   "64":{
      "description":"70 Stroke Infraction swimmer #4",
      "stroke":"Relay"
   },
   "66":{
      "description":"71 Early take-off swimmer #2",
      "stroke":"Relay"
   },
   "67":{
      "description":"71 Early take-off swimmer #3",
      "stroke":"Relay"
   },
   "68":{
      "description":"71 Early take-off swimmer #4",
      "stroke":"Relay"
   },
   "6P":{
      "description":"72 Changed Order of Swimmers",
      "stroke":"Relay"
   },
   "6Q":{
      "description":"79 Not Enough Swimmers",
      "stroke":"Relay"
   },
   "6R":{
      "description":"79 Inelligible Swimmer(s)",
      "stroke":"Relay"
   }
}'

var configJSON = '
{
	"teamTypes" : {
		"AGE" : "Age Group",
		"HS" : "High School",
		"COL" : "College",
		"MAS" : "Masters",
		"OTH" : "Other",
		"REC" : "Recreation"
	},
	"teamRegistration" : {
		"AUST" : "Australia",
		"BCSS" : "Canada",
		"NZSF" : "New Zealand",
		"OTH" : "Other",
		"SSA" : "South Africa",
		"UK" : "United Kingdom",
		"USS" : "United States"//USA Swimming
	},
	"strokes" : {
		"A" : "Freestyle",
		"B" : "Backstroke",
		"C" : "Breaststroke",
		"D" : "Butterfly",
		"E" : "Medley"
	},
	//extract to program:
	"ageCodes" : {
		"0" : "Under",
		"109" : "Over",
		"both" : "Open/Senior"
	},

	"courses" : {
		"L" : "Long Course Meters",
		"S" : "Short Course Meters",
		"Y" : "Short Course Yards"
	},

	"timeCodes" : {
		"Q" : "Disqualified",
		"R" : "No Show",
		"S" : "Scratch",
		"F" : "False Start"
	}
}'