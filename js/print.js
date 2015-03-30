function initLoadDocumentData(){
    for (var key in localStorage){
      if(key.indexOf("_" + getURLParameter("draft_id")) > -1 ){
        tmpKey = key.replace("_" + getURLParameter("draft_id"),"");
        if($("." + tmpKey).is(":checkbox")){
          $("#" + tmpKey + "_" + localStorage.getItem(key)).prop("checked", true);
        }else{
          $("#" + tmpKey).html(localStorage.getItem(key));
        }  
      }
    }
    initAddEmptyClass();
    initPPPoEDisabled();
    disablePlPppoe();
}

function initAddEmptyClass(){
  $(".cz p").each(function (){
    if($(this).html().length == 0){
      $(this).addClass("empty");
    }
  });
}

function initPPPoEDisabled() {
  if($(".cz .pppoe .empty").length > 1) {
    $(".cz .pppoe").addClass("ds-none");
  }
}

function disablePlPppoe() {
  if ($('table#pppoe_table p#auth_a').text().length === 0) {
    $('#pppoe_table').addClass('ds-none');
    $('#tech_spec_header').addClass('ds-none');
  }
}