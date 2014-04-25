var address = "http://localhost:8080/";
var userId = 100;

jQuery(document).ready(function() {
  initLoadPages();    
});

/*
  load pages and include to index.html 
*/
function initLoadPages(){
  if(getURLParameter("action") != null){
    $( "#content" ).load("pages/" + getURLParameter("action") + ".html #data", function(){
      if(getURLParameter("action") == 'draft'){     
        initDraft();
      }
      inicialize();  
    });
  }else {
    loadDrafts();
    searchCustomers();
    inicialize();
  }      
}
/*
  global function inicialize
*/
function inicialize(){
  showInfoAction();
  initTabs();
}
/*
  inicialize draft
*/
function initDraft(){
  $("#product").change(function (){
    updateParamProduct(0);
  });
  // load products
  $.getJSON(address + "products", function(jsondata){
    $.each(jsondata.products,function(key, value) {
      $("#product").append("<option value='" + value.id + "' rel='" + value.is_dedicated + "' dl='" + value.downlink + "' ul='" + value.uplink + "' prc='" + value.price + "' chl='" + value.channel + "'>" + value.name + "</option>");    
    });
    // load routers
    $.getJSON(address + "routers", function(jsondata){
      $.each(jsondata.core_routers,function(key, value) {
        $("#core_router").append("<option value='" + value.id + "'>" + value.name + "</option>");    
      });
      // load draft data
      if(getURLParameter("customer") != null){
        $("#customer_id").val(getURLParameter("customer"));
        $.getJSON(address + "customers/" + getURLParameter("customer"), function(jsondata){deserializeDraft(jsondata, 0);setEditableDraft();setTitleDraft();});
      }
      if(getURLParameter("draft_id") != null){
        $("#draft input[name=delete]").removeClass("ds-none");
        $.getJSON(address + "drafts/" + getURLParameter("draft_id"), function(jsondata){deserializeDraft(jsondata.data); setEditableDraft();setTitleDraft();});
      }
    });
  });
  
  initDraftSubmitAction();
  initDraftAddDeviceAction();
  initDraftDeleteAction();
}
/*
  inicilize draft form submit action 
*/
function initDraftSubmitAction() {
  $("#draft").submit(function (event){     
  event.preventDefault();
    $.ajax({
      type: $("#method").val(),
      url: getUrlDraft(),
      data: serializeDraft(),  
      success: function() {
        localStorage.setItem("infoClass", "success");
        localStorage.setItem("infoData", "Save OK!");
        location.href = "index.html";
      }
    });
  });
}
/*
  inicialize action onclick delete in draft form
*/
function initDraftDeleteAction() {
  $("#draft input[name=delete]").click(function (event){
    $.ajax({
      type: "DELETE",
      url: address + "drafts/" + getURLParameter("draft_id"),
      success: function() {
        localStorage.setItem("infoClass", "success");
        localStorage.setItem("infoData", "Delete OK!");
        location.href = "index.html"
      }
    });
  });
}

/*
  inicilize tabs, show first tab
*/
function initTabs(){
  $("#tabs a:last").tab("show");
}

/*
  search all customer by query
*/
function searchCustomers(){
  $("#searchCustomers").keyup(function (event){  
    if($("#searchCustomers").val().length > 1){       
      $.getJSON(address + 'customers?q=' + $("#searchCustomers").val() , function(jsondata){ $("#customers li").remove(); updateCustomers(jsondata.customers);});  
    }else{       
      $("#customers li").remove();
    }
  });
}                                       

/*
  add all customer into search result
*/
function updateCustomers(jsondata){        
  $("#customers").append("<li class='list-group-item'><span class='name'>" + $("#searchCustomers").val() + "</span><div class='pull-right'><a href='index.html?action=draft' class='btn btn-sm btn-primary'><span class='glyphicon glyphicon-plus'></span> Nový zákazník</a></div></li>");
  $.each(jsondata,function(key, value) {
    var li = "<li class='list-group-item'><span class='name'>" + value["name"] + "</span>";
    li += "<div class='pull-right'><a href='index.html?action=draft&customer=" + value["id"] + "' class='btn btn-sm btn-primary'><span class='glyphicon glyphicon-plus'></span> Nová služba</a>";
    
    /*
    if(value["contracts"] != null){
      for (var i=0, len = value["contracts"].length; i < len; i++) {
         li += "<a href='index.html?action=draft&contract=" + value["contracts"][i] + "' class='btn btn-sm btn-success'><span class='glyphicon glyphicon-edit'></span> " + value["contracts"][i] + "</a>";
      }
    }
    */
    
    li += "</div></li>"
                     
    $("#customers").append(li);
    
  });
}

/*
  load all draft for user
*/
function loadDrafts(){
  $.getJSON(address + 'drafts?user_id=' + userId , function(jsondata){  
     $.each(jsondata.drafts,function(key, value) {
      var data = JSON.parse(value.data);
      var tr = "<tr><td><span class='name'>" + data.customer.name + "</span><div class='pull-right'><a href='index.html?action=draft&draft_id=" + value.id + "' class='btn btn-sm btn-success'><span class='glyphicon glyphicon-edit'></span> Edit</a></div></td></tr>"
      $("#draft_customers").append(tr);
     });
  });
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
  show info action
*/
function showInfoAction(){
  if(localStorage.getItem("infoData") != null){
    $("#content").append("<div class='container'><div class='alert alert-" + localStorage.getItem("infoClass") + "' alert-dismissable'><button type='button' class='close' data-dismiss='alert' aria-hidden='true'>&times;</button>" + localStorage.getItem("infoData") + "</div></div>");    
    localStorage.removeItem("infoClass");
    localStorage.removeItem("infoData");
    setTimeout(function(){$(".alert").slideUp("slow");}, 1000);
  }
}

/*
  onclick action SAVE draft (change method POST / PUT)
*/
function actionSaveDraft(){
  if(getURLParameter("draft_id") != null){
    $("#method").val("PUT");
  }else{
    $("#method").val("POST");
  }
}

/*
  url param POST / PUT send
  POST domain/drafts?user_id={userId}
  PUT  domain/drafts/{draftID}
*/
function getUrlDraft(){
  var tmpUrl = address + $("#url").val();
  if(getURLParameter("draft_id") != null) {
    tmpUrl += "/" + getURLParameter("draft_id");
  }else {
    tmpUrl += "?user_id=" + $("#user_id").val(); 
  } 
  return tmpUrl;
}

function serializeDraft(){

var data = {};

data.customer = {
  id:$("#customer_id").val(),
  name:$("#name").val(),
  supplementary_name:$("#supplementary_name").val(),
  public_id:$("#public_id").val(),
  dic:$("#dic").val(),
  email:$("#email").val(),
  phone:$("#phone").val(),
  street:$("#street").val(),
  city:$("#city").val(),
  postal_code:$("#postal_code").val(),
  country:$("#country").val(),
  contact_name:$("#contact_name").val(),
  info:$("#info").val()
};

data.service = {
  contract_no:$("#contract").val(),
  product:$("#product").val(),
  downlink:$("#downlink").val(),
  uplink:$("#uplink").val(),
  price:$("#price").val(),
  ssid:$("#ssid").val(),
  core_router:$("#core_router").val(),
  location:$("#location").val(),
  config:$("#config").val(),
  activation_fee:$("#activation_fee").val()
};

data.service.devices = [];

$(".row.device").each(function (i){
  data.service.devices[i] = {
    name:$(this).find("input").val(),
    owner:$(this).find("input:radio:checked").val()
  }  
});

 return JSON.stringify(data, null, 0);
  
}

function deserializeDraft(jsondata, mode){
  var data;
  var contract = 0;
  if(mode == 0){
    data = jsondata;
  }
  else{
    data = JSON.parse(jsondata);
  }
  $("#customer_id").val(data.customer.id);
  $("#name").val(data.customer.name);
  $("#supplementary_name").val(data.customer.supplementary_name);
  $("#public_id").val(data.customer.public_id);
  $("#dic").val(data.customer.dic);
  $("#email").val(data.customer.email);
  $("#phone").val(data.customer.phone);
  $("#street").val(data.customer.street);
  $("#city").val(data.customer.city);
  $("#postal_code").val(data.customer.postal_code);
  $("#country").val(data.customer.country);
  $("#contact_name").val(data.customer.contact_name);
  $("#info").val(data.customer.info);
  if(data.service != null){
    contract = data.service.contract_no;
    $("#product").val(data.service.product);
    $("#downlink").val(data.service.downlink);
    $("#uplink").val(data.service.uplink);
    $("#price").val(data.service.price);
    $("#ssid").val(data.service.ssid);
    $("#core_router").val(data.service.core_router);
    $("#location").val(data.service.location);
    $("#config").val(data.service.config);
    $("#activation_fee").val(data.service.activation_fee);
    for(i = 2; i<=data.service.devices.length; i++){
        addDevice();
    }
    $(".row.device").each(function (i){
      $(this).find("input:text").val(data.service.devices[i].name);
      $(this).find("input:radio[value=" + data.service.devices[i].owner + "]").attr('checked',true);
    });
    updateParamProduct();
  } 
  updateContract(contract);
}

/*
  set editable field customer on draft
*/
function setEditableDraft(){
  if($("#customer_id").val() > 0){
    $("#customer input, #customer textarea, #customer select").attr('disabled', true);
  }
}

/*
  set title draft (Cusomer name, address, city) 
*/
function setTitleDraft(){
  $("#customer_title").text($("#name").val() + ", " + $("#street").val() + ", " + $("#city").val());
}

/*
  inicilize button action Add device
*/
function initDraftAddDeviceAction(){
  $("#draft .btn.add-device").click(function (){
    if($(".row.device:last input:text").val().length > 0){
      addDevice();
    }   
  });
}

/*
  add device action
*/
function addDevice(){
  var deviceId = $("#draft .row.device").length + 1;
  var row = "<div class='row device'><div class='col-xs-6'><input type='text' placeholder='Device' maxlength='50' class='form-control' name='device_" + deviceId + "'></div><div class='col-xs-1'><label class='radio'><input type='radio' checked='' value='silesnet' name='owner_" + deviceId +"'>SilesNet</label></div>  <div class='col-xs-1'><label class='radio'><input type='radio' value='customer' name='owner_" + deviceId + "'>Customer</label></div></div>"
  $("#draft .row.device:last").after(row);
}

/*
  update parameters product
*/
function updateParamProduct(mode){
  if($("#product option:selected").attr("rel") == "false"){
    $("#downlink, #uplink, #price").prop("readonly", true);
  }else{
    $("#downlink, #uplink, #price").prop("readonly", false);
  }
  if(mode == 0){
    $("#downlink").val($("#product option:selected").attr("dl"));
    $("#uplink").val($("#product option:selected").attr("ul"));
    $("#price").val($("#product option:selected").attr("prc"));
  }
  if($("#product option:selected").attr("chl") == 'wireless'){
    $("#ssid").prop("disabled", false);
    $("#core_router").prop("disabled", true);
  }else{
    $("#ssid").prop("disabled", true);
    $("#core_router").prop("disabled", false);
  }
}

/*
  update parameter contract
*/
function updateContract(contractId){
  if($("#customer_id").val() != 0){
    $.getJSON(address + 'contracts/' + $("#customer_id").val() , function(jsondata){
      $.each(jsondata.contracts,function(key, value) {
        $("#contract").append("<option value='" + value + "'>" + value + "</option>");    
      });
      $("#contract").val(contractId);    
    });
  }   
}