function normalizeGps(gps) {
  return (gps && gps.length === 2) ? [roundTo5Dec(gps[0]), roundTo5Dec(gps[1])] : [];
}

function roundTo5Dec(num) {
  return Math.round(num * 100000) / 100000;
}

function parseDmsLocation(input) {
  var coors = String(input).trim().split(/[^\dNSEW.'"°*-]+/i);
  var lat, lon;
  switch (coors.length) {
    case 2:
      lat = coors[0];
      lon = coors[1];
      break;
    case 4:
      if (/[NSEW]{2}/i.test(coors[0]+coors[2])) {
        lat = coors[1] + coors[0];
        lon = coors[3] + coors[2];
      }
      break;
  }
  return [parseDms(lat), parseDms(lon)];

  function parseDms(dmsInput) {
    if (dmsInput === null || dmsInput === undefined) {
      return NaN;
    }
    if (typeof dmsInput === 'number' && isFinite(dmsInput)) {
      return Number(dmsInput);
    }
    var dms = String(dmsInput).trim()
                .replace(/^-/, '')
                .replace(/[NSEW]$/i, '')
                .split(/[^\d.]+/);
    if (dms[dms.length - 1] === '') {
      dms.splice(dms.length - 1);
    }
    var deg = null;
    switch (dms.length) {
      case 3:
        deg = dms[0]/1 + dms[1]/60 + dms[2]/3600;
        break;
      case 2:
        deg = dms[0]/1 + dms[1]/60;
        break;
      case 1:
        deg = dms[0];
        break;
      default:
        return NaN;
    }
    if (/^-|[WS]$/i.test(dmsInput.trim())) {
      deg = -deg;
    }
    return Number(deg);
  }
}

/*
  get URL parameter
  @sParam name parameter
*/
function getURLParameter(sParam)
{
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++)
    {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam)
        {
            return sParameterName[1];
        }
    }
}

/*
  generate random password
  @param lenght password
*/
function generatePassword(length){
    var iteration = 0;
    var password = "";
    var randomNumber;
    while(iteration < length){
        randomNumber = (Math.floor((Math.random() * 100)) % 94) + 33;
            if ((randomNumber >=33) && (randomNumber <=47)) { continue; }
            if ((randomNumber >=58) && (randomNumber <=64)) { continue; }
            if ((randomNumber >=91) && (randomNumber <=96)) { continue; }
            if ((randomNumber >=123) && (randomNumber <=126)) { continue; }
        iteration++;
        password += String.fromCharCode(randomNumber);
    }
  return password;
}

/* inicialize input type number, set only numbers */
function initInputNumber(){
  $("input[type=number]").keypress(function(e){
	  if (e.which != 44 && e.which != 46 && e.which != 8 && e.which != 0 && (e.which < 48 || e.which > 57)) {
      return false;
    }
  });
}

/* inicialize input date */
function initDatePicker(){
  $(".date-picker").datepicker({ dateFormat: 'dd.mm.yy', numberOfMonths: 2 });
  $(".date-picker").datepicker('setDate', 'today');
}