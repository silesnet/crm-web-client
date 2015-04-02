function initLoadDocumentData(){
  var draftId = getURLParameter("draft_id");
  for (var key in localStorage){
    if(key.indexOf("_" + draftId) > -1 ){
      tmpKey = key.replace("_" + draftId, "");
      if($("." + tmpKey).is(":checkbox")){
        $("#" + tmpKey + "_" + localStorage.getItem(key)).prop("checked", true);
      }else{
        $("#" + tmpKey).html(localStorage.getItem(key));
      }  
    }
  }
  // when no town is provided leave some fields blank so it can be added by hand
  if (localStorage.getItem('town_' + draftId) === '') {
    $('p#town').parent().html('');
    $('p#descriptive_number').parent().html('');
  }
  // when no location town is provided leave some fields blank so it can be added by hand
  if (localStorage.getItem('location_town_' + draftId) === '') {
    $('p#location_town').parent().html('');
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