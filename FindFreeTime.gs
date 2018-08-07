// Free Time Finder : Google App Script
// This script finds empty schedule of specified user with Google Calender
// This can be used as Slack slash command.
// Written by Akira Fujita, 2018.

function doPost(e) {

  var ret = e.parameter.text.split(" ")
  var tID = ret[0];
  //tID = e.g. "hogehoge@gmail.com"


  var ret = "You need to specify e-mail address" + "\n" + "Usage: /c2 hogehoge@google.com" + "\n"

  if (tID != "") {
    ret = getCalendar(tID, "today")
    ret += getCalendar(tID, "tomorrow")
  }
  var res = {response_type: "in_channel", text: ret};
  return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
}

function getCalendar(inID, inDate) {
  var arrCals = get_Calendar(inID);   //Calendar ID
  var date = new Date()
  var tomorrow = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)

  //Today and Tomorrow
  var tDate = date
  if (inDate != "today") {
    tDate = tomorrow
  }

  var pDate = Utilities.formatDate( tDate, 'Asia/Tokyo', 'yyyy年M月d日')
  var strIntro = pDate + "：" + inID + "の空き予定" + "\n" ;
  var strBody = strIntro;

  //Get event of day
  for (var i = 0 ; i< arrCals.length ; i++){
    strBody = strBody + getEvents(inID, arrCals[i], tDate);
  }

  if (strBody == strIntro){
    strBody = "No event \n" ;
  }

  Logger.log(strBody); //4debug

  return strBody
}

function get_Calendar(inID) {
  var arrCals=[];
  arrCals.push(CalendarApp.getCalendarById(inID));

  return arrCals;
}

//Array for start/end time
var startArray = []
var endArray = []

//main funciton
function getEvents(inID, Cals,getDate){
  var pos = 0  //index of array
  var strEvents ="";   //予定
  var empEvents ="";   //空き予定

  try {
    var arrEvents = Cals.getEventsForDay(getDate);
  } catch(e) {
    return "Can not get events of " + inID + " due to some reasons.\n\n"
  }

  var strName = Cals.getName(); //Calender naem

  for (var i=0; i<arrEvents.length; i++){
    var strTitle = arrEvents[i].getTitle();
    var strStart = _HHmm(arrEvents[i].getStartTime());  //Event start time
    var strEnd = _HHmm(arrEvents[i].getEndTime());  //Event end time

    startArray[pos] = strStart
    endArray[pos] = strEnd

    if (strStart == strEnd){
      strEvents = strEvents + '終日イベント：' + strTitle + ' (' + strName + ')' + '\n';
    }else{
      strEvents = strEvents + strStart + '～' + strEnd+ '：'  + strTitle + ' (' + strName + ')' + '\n';
    }
      pos++
  }　

  if (pos == 0) {
    empEvents += '終日予定なし' + '\n';
    return empEvents
  }

  //Search free time
  empEvents += '予定なし: ' + 'undefined' + '～' + startArray[0] + '\n';
  for(var i=0; i<pos; i++) {
    if (endArray[i] != startArray[i+1]) {
      empEvents += '予定なし: ' + endArray[i] + '～' + startArray[i+1] + '\n';
    }
  }
  empEvents += '\n';
  return empEvents
}

//Adjust time expression
function _HHmm(str){
  return Utilities.formatDate(str,'JST','HH:mm');
}
