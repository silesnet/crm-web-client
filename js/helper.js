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