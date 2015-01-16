function initLoadDocumentData(){
    for (var key in localStorage){
      if(key.indexOf("_" + getURLParameter("draft_id")) > -1 ){
        tmpKey = key.replace("_" + getURLParameter("draft_id"),"");
        $("#" + tmpKey).html(localStorage.getItem(key));
      }
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