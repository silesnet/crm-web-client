function initLoadDocumentData(){
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++)
    {
        var sParameterName = sURLVariables[i].split('=');
        $("#" + sParameterName[0]).html(decodeURI(sParameterName[1]));
    }
    initAddEmptyClass();
    initPPPoEDisabled();
}

function initAddEmptyClass(){
  $("p").each(function (){
    if($(this).html().length == 0){
      $(this).addClass("empty");
    }
  });
}

function initPPPoEDisabled(){
  if($(".pppoe .empty").length > 1){
    $(".pppoe").addClass("ds-none");
  }
}