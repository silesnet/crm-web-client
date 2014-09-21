var address = "http://localhost:8080/";
var defaultSessionId = 'test';

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
    loadUserName();
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
  initCustomerType();
  initInputNumber();
  initDatePicker();
  initSelectSsid();
  initAuthentification();
  initCustomerAddressCopy();
}
/*
  inicialize draft
*/
function initDraft(){
  $("#product").change(function (){
    updateParamProduct(0);
  });
  loadUserName();

  // load products
  $.getJSON(address + "products", function(jsondata){
    $.each(jsondata.products,function(key, value) {
      $("#product").append("<option value='" + value.id + "' rel='" + value.is_dedicated + "' dl='" + value.downlink + "' ul='" + value.uplink + "' prc='" + value.price + "' chl='" + value.channel + "'>" + value.name + "</option>");
    });

    // load ssids
    $.getJSON(address + "networks/ssids", function(jsondata){
      $.each(jsondata.ssids,function(key, value) {
        $("#ssid").append("<option value='" + value.id + "' master='" + value.master + "'>" + value.ssid + " (" + value.master + ")</option>");
      });

      // load routers
      $.getJSON(address + "networks/routers", function(jsondata){
        $.each(jsondata.core_routers,function(key, value) {
          $("#core_router").append("<option value='" + value.id + "' name='" + value.name + "'>" + value.name + "</option>");
        });

        // load users
        $.getJSON(address + "users", function(jsondata){
          $.each(jsondata.users,function(key, value) {
            $("#operator").append("<option value='" + value.id + "' login='" + value.login + "'>" + value.name + "</option>");
          });

          // set logged operator
          var selectedOperator = $("#operator option[login='" + $("#user_id").val() + "']").val();
          $("#operator").val(selectedOperator);

          // load draft data
          if(getURLParameter("customer") != null){
            $("#customer_id").val(getURLParameter("customer"));
            $.getJSON(address + "customers/" + getURLParameter("customer"), function(jsondata){deserializeDraft(jsondata, 0);setEditableDraft();setTitleDraft();});
            updateParamProduct(0);
          }
          else if(getURLParameter("draft_id") != null){
            $("#draft input[name=delete]").removeClass("ds-none");
            $.getJSON(address + "drafts/" + getURLParameter("draft_id"), function(jsondata){deserializeDraft(jsondata.data); setEditableDraft();setTitleDraft();});
          }
          else if(getURLParameter("name") != null){
            setTitleNewDraft(decodeURIComponent(getURLParameter("name")));
            updateParamProduct(0);
          }
       });
      });
    });
  });

  initDraftSubmitAction();
  initDraftAddDeviceAction();
  initDraftDeleteAction();
  initDraftActivationAction();
  initPrintDraft();
}
/*
  inicilize draft form submit action
*/
function initDraftSubmitAction() {
  $("#draft").submit(function (event){
  event.preventDefault();
     saveDraft("Zákazník byl uložen v pořádku!");
  });
}

/*
  action save draft
*/
function saveDraft(message){
   $.ajax({
    type: $("#method").val(),
    url: getUrlDraft(),
    data: serializeDraft(),
    success: function() {
        localStorage.setItem("infoClass", "success");
        localStorage.setItem("infoData", message);
        location.href = "index.html";
    }
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
        localStorage.setItem("infoData", "Zákazník byl smazán v pořádku!");
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
      $.getJSON(address + 'customers?q=' + $("#searchCustomers").val().toLowerCase() , function(jsondata){ $("#customers li").remove(); updateCustomers(jsondata.customers);});
    }else{
      $("#customers li").remove();
    }
  });
}

/*
  add all customer into search result
*/
function updateCustomers(jsondata){
  $("#customers").append("<li class='list-group-item'><span class='name'>" + $("#searchCustomers").val() + "</span><div class='pull-right'><a href='index.html?action=draft&name=" + encodeURIComponent($("#searchCustomers").val()) + "' class='btn btn-sm btn-primary'><span class='glyphicon glyphicon-plus'></span> Nový zákazník</a></div></li>");
  $.each(jsondata,function(key, value) {
    var li = "<li class='list-group-item'><span class='name'>" + value["name"] + "</span>";
    li += "<div class='pull-right'><a href='index.html?action=draft&customer=" + value["id"] + "' class='btn btn-sm btn-primary'><span class='glyphicon glyphicon-plus'></span> Nová služba</a></div></li>";
    $("#customers").append(li);
  });
}

/*
  load user and when logged in then load all his draft
*/
function loadDrafts(){
  currentUser().done(function(userData) {
    if(userData.users != null && userData.users.user != null) {
      var user = userData.users.user;
      $.getJSON(address + 'drafts?user_id=' + user , function(data) {
        $.each(data.drafts, function(key, value) {
          var data = JSON.parse(value.data);
          var tr = "<tr><td><span class='name'>" + data.customer.name + " " + data.customer.surname + "</span><div class='pull-right'><a href='index.html?action=draft&draft_id=" + value.id + "' class='btn btn-sm btn-success'><span class='glyphicon glyphicon-edit'></span> Editovat</a></div></td></tr>"
          $("#draft_customers").append(tr);
        });
      });
    }
  });
}

/*
  get current user, it returns promise
*/
function currentUser() {
  var sessionId = $.cookie('JSESSIONID') || defaultSessionId;
  return $.getJSON(address + 'users/current?session=' + sessionId);
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
  $("#draft input").prop("required", false);
}

/*
  inicialize action onclick activation in draft form
  1. create or exist customer
*/
function initDraftActivationAction() {
  $("#draft input[name=activation]").click(function (event){
    if($("#customer_id").val() == 0){
      $.ajax({
        type: "POST",
        data: serializeCustomer(),
        dataType: "json",
        contentType:"application/json",
        url: address + "customers",
        statusCode: {
          201: function (data){
            $("#customer_id").val(data.customers.id);
            createAgreement(data.customers.id);
          }
        }
      });
    }else{
      createAgreement($("#customer_id").val());
    }
  });
}

/*
  2. create or exist agreement
*/
function createAgreement(customerId){
  // bug
  if($("#contract").val() == 0 && $("#agreement_id").val() == 0){
    $.ajax({
      type: "POST",
      data: serializeAgreement(),
      dataType: "json",
      contentType:"application/json",
      url: address + "customers/" + customerId + "/agreements",
      statusCode: {
        201: function (data){
          $("#agreement_id").val(data.agreements.id);
          createService(data.agreements.id);
        }
      }
    });
  }else{
      createService(100000 + parseInt($("#contract").val()));
  }
}

/*
  3. create service
*/
function createService(agreementId){
  if($("#service_id").val() == 0){
    $.ajax({
      type: "POST",
      data: {},
      dataType: "json",
      contentType:"application/json",
      url: address + "agreements/" + agreementId + "/services",
      statusCode: {
        201: function (data){
          $("#service_id").val(data.services.id);
          createConnection(data.services.id);
        }
      }
    });
   }
   else{
     createConnection($("#service_id").val());
   }
}

/*
  4. create connection
*/
function createConnection(serviceId){
  if($("#connection_id").val() == 0){
    $.ajax({
      type: "POST",
      data: serializeConnection(),
      dataType: "json",
      contentType:"application/json",
      url: address + "services/" + serviceId + "/connections",
      statusCode: {
        201: function (data){
          $("#connection_id").val(data.connections.service_id);
          if($("#auth_type").val() == 2){
            $("#auth_a").val(data.connections.service_id);
          }
          actionSaveDraft();
          saveDraft("Zákazník byl aktivován!");
        }
      }
    });
   }else{
      $.ajax({
        type: "PUT",
        data: serializeConnection(),
        dataType: "json",
        contentType:"application/json",
        url: address + "connections/" + serviceId,
        statusCode: {
          //bug
          200: function (data){
            if($("#auth_type").val() == 2){
              $("#auth_a").val(data.connections.service_id);
            }
            // save draft
            actionSaveDraft();
            saveDraft("Zákazník byl reaktivován!");
          }
        }
      });
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

/*
  serialize JSON connection
*/
function serializeConnection(){

  var data = {};
  data.connections = {
    service_id:$("#service_id").val(),
    auth_type:$("#auth_type").val(),
    auth_name:$("#auth_a").val(),
    auth_value:$("#auth_b").val(),
    downlink:parseInt($("#downlink").val()),
    uplink:parseInt($("#uplink").val()),
    //area:$("#area").val(),
    is_public_ip:$("#is_ip_public").is(":checked"),
    ip:$("#ip").val(),
    master_router:$("#core_router").val(),
    ssid:$("#ssid").val(),
    sa_mac:$("#mac_address").val()
  };

  return JSON.stringify(data, null, 0);
}

/*
  serialize JSON agreement
*/
function serializeAgreement(){

  var data = {};
  data.agreements = {
      country:$("#location_country option:selected").attr("code")
  };
  return JSON.stringify(data, null, 0);
}

/*
  serialize JSON customer
*/
function serializeCustomer(){

  var data = {};
  data.customers = {
      name:$("#name").val() + " " + $("#surname").val()
  };
  return JSON.stringify(data, null, 0);
}

/*
  serialize JSON draft
*/
function serializeDraft(){

var data = {};

data.customer = {
  id:$("#customer_id").val(),
  agreement_id:$("#agreement_id").val(),
  service_id:$("#service_id").val(),
  connection_id:$("#connection_id").val(),
  customer_type:$(".customer-type input:checked").val(),
  name:$("#name").val(),
  surname:$("#surname").val(),
  supplementary_name:$("#supplementary_name").val(),
  public_id:$("#public_id").val(),
  dic:$("#dic").val(),
  representative:$("#representative").val(),
  email:$("#email").val(),
  phone:$("#phone").val(),
  contact_name:$("#contact_name").val(),
  info:$("#info").val()
};

data.customer.address = {
  street:$("#street").val(),
  descriptive_number:$("#descriptive_number").val(),
  orientation_number:$("#orientation_number").val(),
  town:$("#town").val(),
  postal_code:$("#postal_code").val(),
  country:$("#country").val()
};

data.service = {
  contract_no:$("#contract").val(),
  product:$("#product").val(),
  downlink:$("#downlink").val(),
  uplink:$("#uplink").val(),
  price:$("#price").val(),
  ssid:$("#ssid").val(),
  mac_address:$("#mac_address").val(),
  core_router:$("#core_router").val(),
  config:$("#config").val(),
  activate_on:$("#activate_on").val(),
  activation_fee:$("#activation_fee").val(),
  operator:$("#operator").val(),
  info_service:$("#info_service").val()
};

data.service.location_address = {
  location_street:$("#location_street").val(),
  location_descriptive_number:$("#location_descriptive_number").val(),
  location_orientation_number:$("#location_orientation_number").val(),
  location_town:$("#location_town").val(),
  location_postal_code:$("#location_postal_code").val(),
  location_country:$("#location_country").val()
};

data.service.devices = [];

$(".row.device").each(function (i){
  data.service.devices[i] = {
    name:$(this).find("input").val(),
    owner:$(this).find("input:radio:checked").val()
  }
});

data.connections = {
  auth_type:$("#auth_type").val(),
  auth_a:$("#auth_a").val(),
  auth_b:$("#auth_b").val(),
  ip:$("#ip").val(),
  is_ip_public:$("#is_ip_public").is(":checked")
}
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
  $("#agreement_id").val(data.customer.agreement_id);
  $("#service_id").val(data.customer.service_id);
  $("#connection_id").val(data.customer.connection_id);
  $(".customer-type input:radio[value=" + data.customer.customer_type + "]").click();
  $("#name").val(data.customer.name);
  $("#surname").val(data.customer.surname);
  $("#supplementary_name").val(data.customer.supplementary_name);
  $("#public_id").val(data.customer.public_id);
  $("#dic").val(data.customer.dic);
  $("#representative").val(data.customer.representative);
  $("#email").val(data.customer.email);
  $("#phone").val(data.customer.phone);
  if(data.customer.address != null){
    $("#street").val(data.customer.address.street);
    $("#descriptive_number").val(data.customer.address.descriptive_number);
    $("#orientation_number").val(data.customer.address.orientation_number);
    $("#town").val(data.customer.address.town);
    $("#postal_code").val(data.customer.address.postal_code);
    $("#country").val(data.customer.address.country);
  }else{
    $("#street").val(data.customer.street);
    $("#town").val(data.customer.city);
    $("#postal_code").val(data.customer.postal_code.replace(" ", ""));
    $("#country").val(data.customer.country);
  }
  $("#contact_name").val(data.customer.contact_name);
  $("#info").val(data.customer.info);
  if(data.service != null){
    contract = data.service.contract_no;
    $("#product").val(data.service.product);
    $("#downlink").val(data.service.downlink);
    $("#uplink").val(data.service.uplink);
    $("#price").val(data.service.price);
    $("#ssid").val(data.service.ssid);
    $("#mac_address").val(data.service.mac_address);
    $("#core_router").val(data.service.core_router);
    $("#location_street").val(data.service.location_address.location_street);
    $("#location_descriptive_number").val(data.service.location_address.location_descriptive_number);
    $("#location_orientation_number").val(data.service.location_address.location_orientation_number);
    $("#location_town").val(data.service.location_address.location_town);
    $("#location_postal_code").val(data.service.location_address.location_postal_code);
    $("#location_country").val(data.service.location_address.location_country);
    $("#config").val(data.service.config);
    $("#activate_on").val(data.service.activate_on);
    $("#activation_fee").val(data.service.activation_fee);
    $("#operator").val(data.service.operator);
    $("#info_service").val(data.service.info_service);
    for(i = 2; i<=data.service.devices.length; i++){
        addDevice();
    }
    $(".row.device").each(function (i){
      $(this).find("input:text").val(data.service.devices[i].name);
      $(this).find("input:radio[value=" + data.service.devices[i].owner + "]").attr('checked',true);
    });
  }
  if(data.connections != null){
    $("#auth_type").val(data.connections.auth_type);
    $("#auth_a").val(data.connections.auth_a);
    $("#auth_b").val(data.connections.auth_b);
    $("#ip").val(data.connections.ip);
    if(data.connections.is_ip_public){
     $("#is_ip_public").prop("checked", true);
    }
  }
  updateParamProduct();
  updateContract(contract);
  updateActivation();
  initAuthentification();
}

/*
  set editable field customer on draft
*/
function setEditableDraft(){
  if($("#customer_id").val() > 0){
    $("#customer input, #customer textarea, #customer select").attr('disabled', true);
    $("#customer .customer-type").addClass("ds-none");
  }
}

/*
  set title draft (Cusomer name, address, city)
*/
function setTitleDraft(){
  $("#customer_title").text($("#name").val() + " " + $("#surname").val() + ", " + $("#street").val() + ", " + $("#town").val());
}

/*
  set title new draft (Cusomer name)
*/
function setTitleNewDraft(name){
  $("#customer_title").text(name);
  var tmpName = name.split(" ");
  $("#name").val(tmpName[0]);
  $("#surname").val(tmpName[1]);
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
  var row = "<div class='row device'><div class='col-xs-6'><input type='text' placeholder='Zařízení' maxlength='50' class='form-control' id='device_" + deviceId + "' name='device_" + deviceId + "'></div><div class='col-xs-1'><label class='radio'><input type='radio' checked='' value='silesnet' id='owner_" + deviceId +"_1' name='owner_" + deviceId +"'>SilesNet</label></div>  <div class='col-xs-1'><label class='radio'><input type='radio' value='customer' id='owner_" + deviceId +"_2' name='owner_" + deviceId + "'>Zákazník</label></div></div>"
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
    $("#mac_address").prop("disabled", false);
    $("#core_router").prop("disabled", true);
  }else{
    $("#ssid").prop("disabled", true);
    $("#mac_address").prop("disabled", true);
    $("#core_router").prop("disabled", false);
  }
}

/*
  update parameter contract
*/
function updateContract(contractId){
  if($("#customer_id").val() != 0 && $("#agreement_id").val() == 0) {
    $.getJSON(address + 'contracts/' + $("#customer_id").val() , function(jsondata){
      $.each(jsondata.contracts,function(key, value) {
        $("#contract").append("<option value='" + value + "'>" + value + "</option>");
      });
      $("#contract").val(contractId);
    });
  }
}

/*
  load user name
*/
function loadUserName() {
  currentUser().done(function(data) {
    if (data.users != null && data.users.user != null) {
      $("#user_id").val(data.users.user);
      $("#user_name").text(data.users.user);
    }
  });
}

function initCustomerType(){
  $(".customer-type input").change(function() {
    if($(this).val() == 1){
      $("#supplementary_name").prop("disabled", true);
      $("#public_id").prop("placeholder", "Číslo OP / Rod. číslo / Datum narození");
      $("#dic").prop("disabled", true);
      $("#representative").prop("disabled", true);
    }else{
      $("#supplementary_name").prop("disabled", false);
      $("#dic").prop("disabled", false);
      $("#public_id").prop("placeholder", "IČO");
      $("#representative").prop("disabled", false);
    }
  });
}

function initInputNumber(){
  $("input[type=number]").keypress(function(e){
	  if (e.which != 44 && e.which != 46 && e.which != 8 && e.which != 0 && (e.which < 48 || e.which > 57)) {
      return false;
    }
  });
}

function initDatePicker(){
  $(".date-picker").datepicker({ dateFormat: 'dd.mm.yy', numberOfMonths: 2 });
  $(".date-picker").datepicker('setDate', 'today');
}

function initSelectSsid(){
 $("#ssid").change(function(){
    var selectedSsid = $(this).find("option:selected").attr("master");
    var selectedCoreRouter = $("#core_router option[name='" + selectedSsid + "']").val();
    $("#core_router").val(selectedCoreRouter);
 });
}

function updateActivation(){
  if($("#connection_id").val() != 0){
    $("#draft input[name=activation]").val('Upravit');
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

function initAuthentification(){
  if($("#auth_type").val() == 2){
    $("#auth_a").prop("disabled", true);
  }
  $("#auth_type").change(function (){
    if($(this).val() == 2){
      $("#auth_a").prop("disabled", true);
      if($("#auth_b").val() == ''){
        $("#auth_b").val(generatePassword(8));
      }
    }else{
      $("#auth_a").prop("disabled", false);
      $("#auth_b").val("");
    }
  });
}

function initCustomerAddressCopy(){
  $(".copy-address").click(function (){
        $("#location_street").val($("#street").val());
        $("#location_orientation_number").val($("#orientation_number").val());
        $("#location_descriptive_number").val($("#descriptive_number").val());
        $("#location_town").val($("#town").val());
        $("#location_postal_code").val($("#postal_code").val());
        $("#location_country").val($("#country").val());
    }
  );
}

function initPrintDraft(){
  $("#print_protocol").click(function (event){
      window.open("/pages/protokol.html?" + serializeToPrint($("#draft")));
  });
  $("#print_contract").click(function (event){
      window.open("/pages/smlouva.html?" + serializeToPrint($("#draft")));
  });  
}

function serializeToPrint(form){
   var params = ""
   
   $(form).find("input[type=text], input[type=number], input[type=hidden], input[type=email]").each(function(){
      params +=  $(this).attr("name") + "=" + $(this).val() + "&";
   });
   $(form).find("select").each(function(){
      params +=  $(this).attr("name") + "=" + $(this).find("option:selected").text()  + "&";
   });
   $(form).find("input[type=checkbox]").each(function(){
      if($(this).is(":checked")){
        params +=  $(this).attr("name") + "=X&";
      }
   });
   $(form).find("input[type=radio]").each(function(){
      if($(this).is(":checked") && $(this).attr("id")){
        params +=  $(this).attr("id") + "=X&";
      }
   });
   return params;
}