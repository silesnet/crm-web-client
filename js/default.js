var address = "http://localhost:8080/";
var defaultSessionId = 'test';
var products;
var users;
var user_id = "";
var operation_country = "CZ";

jQuery(document).ready(function() {
  initLoadPages();
});

/*
  load pages and include to index.html
*/
function initLoadPages(){
  // load user name
  loadUserName();
  
  if(getURLParameter("action") != null){
    // import pages
    $( "#content" ).load("pages/" + getURLParameter("action") + ".html #data", function(){
      if(getURLParameter("action") == 'draft'){
        inicialize();
        initDraft();
        initCustomerType();
        initSelectSsid();
        initAuthentification();
        initCustomerAddressCopy();
        initTabs();
      }
    });
  }else {
    // inicialize index.html
    inicialize();
    loadDrafts();
    searchCustomers();
  }
}
/*
  global function inicialize
*/
function inicialize(){
  showInfoAction();  
  initInputNumber();
  initDatePicker();
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
  loadProducts();
  // load ssids
  loadNetworks();
  // load routers
  loadRouters();
  // load users
  loadUsers();
  // load draft
  loadDraft(getURLParameter("draft_id"));
  
  // inicialize click action button
  initDraftSaveAction();
  initDraftAddDeviceAction();
  initDraftDeleteAction();
  initPrintDraft();
}

function loadDraft(id){
   $.ajax({
    type: "GET",
    async:false,
    url: address + "drafts/" + id,
    success: function(jsondata) {
      var data = JSON.parse(jsondata.data)
      if(data.status == "NEW"){
        $("#contract").val(data.service.contract_no);
        $("#name").val(data.customer.name);
        $("#surname").val(data.customer.surname);
        $("#service_id").val(data.service.service_id);
        $("#customer_id").val(data.customer.id);
        $("#service_title").append(data.service.service_id);
        updateParamProduct(0);        
        loadCustomer(data.customer.id);        
      }else{
         deserializeDraft(jsondata);
      }
      setTitleDraft();
      setEditableDraft();      
    }
  });
}

function loadCustomer(id){
  $.ajax({
    type: "GET",
    async:false,
    url: address + "customers/" + id,
    success: function(jsondata) {
      deserializeNewDraft(jsondata);      
    }
  }); 
}

function loadProducts(){
   $.ajax({
    type: "GET",
    url: address + "products",
    success: function(data) {
      $.each(data.products,function(key, value) {
        $("#product").append("<option value='" + value.id + "' rel='" + value.is_dedicated + "' dl='" + value.downlink + "' ul='" + value.uplink + "' prc='" + value.price + "' chl='" + value.channel + "'>" + value.name + "</option>");
      });
    }
  });  
}

function loadNetworks(){
   $.ajax({
    type: "GET",
    url: address + "networks/ssids",
    success: function(data) {
      $.each(data.ssids,function(key, value) {
        $("#ssid").append("<option value='" + value.id + "' master='" + value.master + "'>" + value.ssid + " (" + value.master + ")</option>");
      });
    }
  });
}

function loadRouters(){
   $.ajax({
    type: "GET",
    url: address + "networks/routers",
    success: function(data) {
        $.each(data.core_routers,function(key, value) {
          $("#core_router").append("<option value='" + value.id + "' name='" + value.name + "'>" + value.name + "</option>");
        });
    }
  });
}

function loadUsers(){
   $.ajax({
    type: "GET",
    url: address + "users",
    success: function(data) {
          $.each(data.users,function(key, value) {
            $("#operator").append("<option value='" + value.id + "' login='" + value.login + "'>" + value.name + "</option>");
          });
          // set logged operator
          var selectedOperator = $("#operator option[login='" + user_id + "']").val();
          $("#operator").val(selectedOperator);
    }
  });
}

/*
  inicilize draft form submit action
*/
function initDraftSaveAction() {
  $("#draft input[name=save]").click(function (event){
    saveDraft("Zákazník byl uložen v pořádku!");
  });
  $("#draft input[name=status]").click(function (event){
    saveDraft("Zákazník byl " + $(this).attr('msg') + " v pořádku!", $(this).attr('rel'));
  });
  $("#draft input[name=statusBack]").click(function (event){
    saveDraft("Zákazník byl zamítnut v pořádku!", $(this).attr('rel'));
  });
}

/*
  action save draft
*/
function saveDraft(message, status){
   $.ajax({
    type: "PUT",
    url: address + "drafts/new/" + getURLParameter("draft_id"),
    dataType: "json",
    contentType:"application/json",
    data: serializeDraft(status),
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
  inicilize tabs, show last tab
*/
function initTabs(){
  $("#tabs li:nth-child(2) a").tab("show");
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
  $("#customers").append("<li class='list-group-item'><span class='name'>" + $("#searchCustomers").val() + "</span><div class='pull-right'><a onclick='createDraft(\"" + $("#searchCustomers").val() + "\")' href='#' class='btn btn-sm btn-primary'><span class='glyphicon glyphicon-plus'></span> Nový zákazník</a></div></li>");
  $.each(jsondata,function(key, value) {
    var customerId = value["id"];
    var li = "<li class='list-group-item'><span class='name'>" + value["name"] + "</span>";
    li += "<div class='pull-right'>";
    if(value["agreements"] != null){
      for (var i=0, len = value["agreements"].length; i < len; i++) {
        li += "<a onclick='createDraft(\"" + value["name"] + "\", " + customerId +", " + value["agreements"][i] +  ")' href='#' class='btn btn-sm btn-success'><span class='glyphicon glyphicon-edit'></span> " + value["agreements"][i] + "</a>";
      }
    }
    li += "<a onclick='createDraft(\"" + value["name"] + "\", " + customerId + ")' href='#' class='btn btn-sm btn-primary'><span class='glyphicon glyphicon-plus'></span> Nová smlouva</a></div></li>";
    $("#customers").append(li);
  });
}

/*
  load user and when logged in then load all his draft
*/
function loadDrafts(){
  getProductName();
  getOperatorName();
  currentUser().done(function(userData) {
    if(userData.users != null && userData.users.user != null) {
      var user = userData.users.user;
      $.getJSON(address + 'drafts?user_id=' + user , function(data) {
        $.each(data.drafts, function(key, value) {
          var data = JSON.parse(value.data);
          var status = value.status;
          var tr = "<tr><td><span class='service'>" + data.service.service_id + "</span><span class='name'>" + data.customer.name + " " + data.customer.surname + "</span><span class='product'>" + getProductName(data.service.product) + "</span><span class='status'>" + status + "</span><span class='operator'>" + getOperatorName(data.service.operator) +"</span><div class='pull-right'><a href='index.html?action=draft&draft_id=" + value.id + "' class='btn btn-sm btn-success'><span class='glyphicon glyphicon-edit'></span> Editovat</a></div></td></tr>"
          $("#draft_customers").append(tr);
        });
      });
    }
  });
}

/*
  get product name by ID
*/
function getProductName(id){
  var ret = "";
  if(products == null){
    $.getJSON(address + 'products', function(data){
      products = data.products;
    });
  }else { 
    $.each(products, function (key, value){
      if(value.id == id){
        ret = value.name;
      }
    });
  }
  return ret;
}

/*
  get user name by ID
*/
function getOperatorName(id){
  var ret = "";
  if(users == null){
    $.getJSON(address + 'users', function(data){
      users = data.users;
    });
  }else { 
    $.each(users, function (key, value){
      if(value.id == id){
        ret = value.name;
      }
    });
  }
  return ret;
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
  serialize JSON draft
*/
function serializeDraft(status){
  var serializeData = {};
  serializeData.drafts = {  
    id:getURLParameter("draft_id"),
    data:serializeDraftData(),
    status:status
  }
  return JSON.stringify(serializeData, null, 0);
}
/*
  serialize JSON draft data
*/
function serializeDraftData(){

var data = {};

data.customer = {
  id:$("#customer_id").val(),
  //connection_id:$("#connection_id").val(),
  customer_type:$(".customer-type input:checked").val(),
  name:$("#name").val(),
  surname:$("#surname").val(),
  supplementary_name:$("#supplementary_name").val(),
  public_id:$("#public_id").val(),
  dic:$("#dic").val(),
  representative:$("#representative").val(),
  email:$("#email").val(),
  phone:$("#phone").val(),
  customer_status:$("#customer_status").val(),
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
  service_id:$("#service_id").val(),
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
data.status = "UPDATE"   

 return JSON.stringify(data, null, 0);
}

function deserializeDraft(jsondata){
  var data = JSON.parse(jsondata.data);
  $("#customer_id").val(data.customer.id);
  //$("#connection_id").val(data.customer.connection_id);
  $(".customer-type input:radio[value=" + data.customer.customer_type + "]").click();
  $("#name").val(data.customer.name);
  $("#surname").val(data.customer.surname);
  $("#supplementary_name").val(data.customer.supplementary_name);
  $("#public_id").val(data.customer.public_id);
  $("#dic").val(data.customer.dic);
  $("#representative").val(data.customer.representative);
  $("#email").val(data.customer.email);
  $("#phone").val(data.customer.phone);
  $("#customer_status").val(data.customer.customer_status);
  $("#street").val(data.customer.address.street);
  $("#descriptive_number").val(data.customer.address.descriptive_number);
  $("#orientation_number").val(data.customer.address.orientation_number);
  $("#town").val(data.customer.address.town);
  $("#postal_code").val(data.customer.address.postal_code);
  $("#country").val(data.customer.address.country);
  $("#contact_name").val(data.customer.contact_name);
  $("#info").val(data.customer.info);
  $("#contract").val(data.service.contract_no);
  $("#service_id").val(data.service.service_id);
  $("#service_title").append(data.service.service_id);
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
  $("#auth_type").val(data.connections.auth_type);
  $("#auth_a").val(data.connections.auth_a);
  $("#auth_b").val(data.connections.auth_b);
  $("#ip").val(data.connections.ip);
  if(data.connections.is_ip_public){
   $("#is_ip_public").prop("checked", true);
  }
  $("#status").val(jsondata.status);
  
  updateParamProduct();
  updateStatusButton();
  initAuthentification();
}

/*
  set editable field customer on draft
*/
function setEditableDraft(){
  if($("#customer_status").val() == "ACTIVE"){
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
  load user name
*/
function loadUserName() {
  currentUser().done(function(data) {
    if (data.users != null && data.users.user != null) {
      user_id = data.users.user;
      operation_country = data.users.operation_country;
      $("#user_name").html("<span class='glyphicon glyphicon-user'></span>&#160;" + data.users.name);
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

function updateStatusButton(){
  if($("#status").val() == "SUBMITTED"){
    $("#draft input[name=status]").val('Akceptovat');
    $("#draft input[name=status]").attr('rel', 'APPROVED');
    $("#draft input[name=status]").attr('msg', 'akceptován');
    $("#draft input[name=statusBack]").removeClass("ds-none");
  } else if($("#status").val() == "APPROVED"){
    $("#draft input[name=status]").val('Importovat');
    $("#draft input[name=status]").attr('rel', 'IMPORTED');
    $("#draft input[name=status]").attr('msg', 'importován');    
  }
}

/*
  create draft with create customer, agreement, service
  @name - customer name (name surname)
  @customerID - id customer
  @contractID - id contract (agreement)
*/
function createDraft(name, customerID, contractID){

  var customer_ID = customerID || createCustomer(name);
  
  var contract_ID = contractID || createAgreement(customer_ID);
    
  var service_ID = createService(contract_ID);
  
  $.ajax({
    type: "POST",
    async: false,
    url: address + "drafts?user_id=test",
    data: serializeNewDraft(name, customer_ID, contract_ID, service_ID),
    success: function(data) {
        location.href = "index.html?action=draft&draft_id=" + data;
    }
  }); 
}

/*
  1. create or exist customer  
*/
function createCustomer(name){
    var ret = 0;
    $.ajax({
      type: "POST",
      async: false,
      data: serializeCustomer(name),
      dataType: "json",
      contentType:"application/json",
      url: address + "customers",
      statusCode: {
        201: function (data){
          ret = data.customers.id;
        }
      }
    });
    return ret;
}

/*
  2. create or exist agreement
*/
function createAgreement(customerId){
    var ret = 0;
    $.ajax({
      type: "POST",
      async: false,
      data: serializeAgreement(),
      dataType: "json",
      contentType:"application/json",
      url: address + "customers/" + customerId + "/agreements",
      statusCode: {
        201: function (data){
          ret = data.agreements.id;
        }
      }
    });
    return ret;
}

/*
  3. create service
*/
function createService(agreementId){
   var ret = 0;
   $.ajax({
      type: "POST",
      async: false,
      data: {},
      dataType: "json",
      contentType:"application/json",
      url: address + "agreements/" + agreementId + "/services",
      statusCode: {
        201: function (data){
          ret = data.services.id;
        }
      }
    }); 
   return ret;  
}
/*
  4. create connection
*/
/*
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
            saveDraft("Zákazník byl reaktivován!");
          }
        }
      });
   }
}
*/

/*
  serialize JSON customer
*/
function serializeCustomer(customerName){

  var data = {};
  data.customers = {
      name:customerName                     
  };
  return JSON.stringify(data, null, 0);
}

/*
  serialize JSON agreement
*/
function serializeAgreement(){

  var data = {};
  data.agreements = {
      country:operation_country
  };
  return JSON.stringify(data, null, 0);
}

/*
  serialize JSON connection
*/
/*
function serializeConnection(){

  var data = {};
  data.connections = {
    service_id:$("#service_id").val(),
    auth_type:$("#auth_type").val(),
    auth_name:$("#auth_a").val(),
    auth_value:$("#auth_b").val(),
    downlink:parseInt($("#downlink").val()),
    uplink:parseInt($("#uplink").val()),
    is_public_ip:$("#is_ip_public").is(":checked"),
    ip:$("#ip").val(),
    master_router:$("#core_router").val(),
    ssid:$("#ssid").val(),
    sa_mac:$("#mac_address").val()
  };

  return JSON.stringify(data, null, 0);
}
*/

function serializeNewDraft(name, customer, contract, service){
  var tmpName = name.split(" ");
  var data = {};
  data.customer = {
    id:customer,
    name:tmpName[0],
    surname:tmpName[1]
  }
  data.service = {
     contract_no:contract,
     service_id:service
  }
  data.status = "NEW"
           
  return (JSON.stringify(data, null, 0));    
}

function deserializeNewDraft(data){
  $("#customer_id").val(data.customer.id);
  //$("#name").val(data.customer.name);
  $("#supplementary_name").val(data.customer.supplementary_name);
  $("#public_id").val(data.customer.public_id);
  $("#dic").val(data.customer.dic);
  $("#email").val(data.customer.email);
  $("#phone").val(data.customer.phone);
  $("#street").val(data.customer.street);
  $("#town").val(data.customer.city);
  if(data.customer.postal_code) $("#postal_code").val(data.customer.postal_code.replace(" ", ""));
  $("#country").val(data.customer.country);
  $("#contact_name").val(data.customer.contact_name);
  $("#info").val(data.customer.info);
  $("#customer_status").val(data.customer.customer_status);  
  
  initAuthentification();
  
}