var address = "http://localhost:8080/";
var defaultSessionId = 'test';
var products;
var users;
var user_id = "";
var operation_country = "CZ";
var customerDraftId = 0;
var agreementDraftId = 0;

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
        initCustomerType();
        initDraft();
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
    url: address + "drafts2/" + id,
    success: function(jsondata) {
      
      var tmpCustomerId = jsondata.drafts.links["customers"] || jsondata.drafts.links["drafts.customers"];
      var tmpAgreementId = jsondata.drafts.links["agreements"] || jsondata.drafts.links["drafts.agreements"];
      
      $("#contract").val(tmpAgreementId);
      $("#service_id").val(jsondata.drafts.entityId);
      $("#customer_id").val(tmpCustomerId);
      $("#service_title").append(jsondata.drafts.entityId);
      
      if(jsondata.drafts.links["customers"] != null){
        deserializeNewDraft(loadDraftCustomer(tmpCustomerId, "customers/")); 
      }else {
        var tmpCustomerDraft = loadDraftCustomer(tmpCustomerId, "drafts2/customers/");
        customerDraftId = tmpCustomerDraft.drafts.id;
        $("#name").val(tmpCustomerDraft.drafts.entityName.split(' ')[0]);
        $("#surname").val(tmpCustomerDraft.drafts.entityName.split(' ')[1]);
        deserializeDraftDataCustomer(tmpCustomerDraft.drafts);
      }
      if(jsondata.drafts.links["agreements"] != null){
        // TODO load and deserialize agreements 
      }else {
        var tmpAgreementDraft = loadDraftCustomer(tmpAgreementId, "drafts2/agreements/");
        agreementDraftId = tmpAgreementDraft.drafts.id;
        // TODO deserialize agreements 
      }
     
      deserializeDraftDataService(jsondata.drafts);
      
      updateParamProduct(0);        
      setTitleDraft();
      setEditableDraft();      
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
    saveDraft(customerDraftId, agreementDraftId, getURLParameter("draft_id"), "Zákazník byl uložen v pořádku!", $("#service_status").val());
  });
  $("#draft input[name=status]").click(function (event){
    saveDraft(customerDraftId, agreementDraftId, getURLParameter("draft_id"), "Zákazník byl " + $(this).attr('msg') + " v pořádku!", $(this).attr('rel'));
  });
  $("#draft input[name=statusBack]").click(function (event){
    saveDraft(customerDraftId, agreementDraftId, getURLParameter("draft_id"), "Zákazník byl zamítnut v pořádku!", $(this).attr('rel'));
  });
}

/*
  action save draft
  
*/
function saveDraft(idCustomer, idAgreement, idService, message, status){
   if(idCustomer > 0) { 
     $.ajax({
      type: "PUT",
      url: address + "drafts2/" + idCustomer,
      dataType: "json",
      contentType:"application/json",
      data: serializeDraftDataCustomer(status)
      });
   }
   if(idAgreement > 0) {
    $.ajax({
      type: "PUT",
      url: address + "drafts2/" + idAgreement,
      dataType: "json",
      contentType:"application/json",
      data: serializeDraftDataAgreement(status)
      });
   }
   if(idService > 0) { 
     $.ajax({
      type: "PUT",
      url: address + "drafts2/" + idService,
      dataType: "json",
      contentType:"application/json",
      data: serializeDraftDataService(status),
      success: function() {
          localStorage.setItem("infoClass", "success");
          localStorage.setItem("infoData", message);
          location.href = "index.html";
        }
      });
   }     
}

/*
  inicialize action onclick delete in draft form
*/
function initDraftDeleteAction() {
  $("#draft input[name=delete]").click(function (event){
    if(customerDraftId > 0){
      $.ajax({
        type: "DELETE",
        url: address + "drafts2/" + customerDraftId
      });
    }
    if(agreementDraftId > 0){
      $.ajax({
        type: "DELETE",
        url: address + "drafts2/" + agreementDraftId
      });
    }
    $.ajax({
      type: "DELETE",
      url: address + "drafts2/" + getURLParameter("draft_id"),
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
    if($("#searchCustomers").val().length > 2){
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
    var li = "<li class='list-group-item'><span class='name'>" + value["name"] + "</span><span class='address'>";
    if(value["street"] !== null){
     li += value["street"];  
    }
    if(value["city"] !== null){
     li += ", " + value["city"];  
    }
    if(value["postal_code"] !== null){
     li +=  ", " + value["postal_code"];  
    }
    li += "</span><div class='pull-right'>";
    if(value["agreements"] !== null){
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
      $.getJSON(address + 'drafts2?entityType=services&owner=' + user , function(data) {
        $.each(data.drafts, function(key, value){
          var tmpName = ""
          var tmpProduct = "";
          if(value.links["drafts.customers"] != null){
            tmpName = loadDraftCustomer(value.links["drafts.customers"], "drafts2/customers/").drafts.entityName;
          }else {
            tmpName = loadDraftCustomer(value.links["customers"], "customers/").customer.name;
          }
          if(value.data.length > 2){
            tmpProduct = getProductName($.parseJSON(value.data).product);
          }
          var tr = "<tr><td><span class='service'>" + value.entityId + "</span><span class='name'>" + tmpName + "</span><span class='product'>" + tmpProduct + "</span><span class='status'>" + value.status + "</span><span class='operator'>" + value.owner + "</span><div class='pull-right'><a href='index.html?action=draft&draft_id=" + value.id + "' class='btn btn-sm btn-success'><span class='glyphicon glyphicon-edit'></span> Editovat</a></div></td></tr>"
          $("#draft_customers").append(tr);
        });
      });
    }
  });
}

/*
  load draft customer
*/
function loadDraftCustomer(customerId, urlParams){
  var ret;
  $.ajax({
    type: "GET",
    async:false,
    url: address + urlParams + customerId,
    success: function(jsondata) {
      ret = jsondata;
    }
  });
  return ret;
}

/*
  load draft agreement
*/
function loadDraftAgreement(agreementId){
  var ret;
  $.ajax({
    type: "GET",
    async:false,
    url: address + "drafts2/agreements/" + agreementId,
    success: function(jsondata) {
      ret = jsondata;
    }
  });
  return ret;
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
  serialize JSON draft data for service
*/
function serializeDraftDataService(status){

  var jsonData = {};        
  jsonData.drafts = {
    status:status
  };
  jsonData.drafts.data = {
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
    info_service:$("#info_service").val(),
    location_street:$("#location_street").val(),
    location_descriptive_number:$("#location_descriptive_number").val(),
    location_orientation_number:$("#location_orientation_number").val(),
    location_town:$("#location_town").val(),
    location_postal_code:$("#location_postal_code").val(),
    location_country:$("#location_country").val(),
    auth_type:$("#auth_type").val(),
    auth_a:$("#auth_a").val(),
    auth_b:$("#auth_b").val(),
    ip:$("#ip").val(),
    is_ip_public:$("#is_ip_public").is(":checked")
  }; 

  jsonData.drafts.data.devices = [];

$(".row.device").each(function (i){
  jsonData.drafts.data.devices[i] = {
    name:$(this).find("input").val(),
    owner:$(this).find("input:radio:checked").val()
  }
}); 

 return JSON.stringify(jsonData, null, 0);
}

/*
  serialize JSON draft data for agreement
*/
function serializeDraftDataAgreement(status){
  var jsonData = {};
  jsonData.drafts = {
    status:status
  };
  return JSON.stringify(jsonData);
}

/*
  serialize JSON draft data for customer
*/
function serializeDraftDataCustomer(status){
  var jsonData = {};
  jsonData.drafts = {
    entityName: $("#name").val() + " " + $("#surname").val(),
    status:status
  };
  jsonData.drafts.data = {
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
    info:$("#info").val(),
    street:$("#street").val(),
    descriptive_number:$("#descriptive_number").val(),
    orientation_number:$("#orientation_number").val(),
    town:$("#town").val(),
    postal_code:$("#postal_code").val(),
    country:$("#country").val()
  };
  return JSON.stringify(jsonData);
}
/*
  deserialize JSON draft data for customer
*/
function deserializeDraftDataCustomer(jsonData){
  var data = jsonData.data;
  if(data.name != null){
  $(".customer-type input:radio[value=" + data.customer_type + "]").click();
  $("#name").val(data.name);
  $("#surname").val(data.surname);
  $("#supplementary_name").val(data.supplementary_name);
  $("#public_id").val(data.public_id);
  $("#dic").val(data.dic);
  $("#representative").val(data.representative);
  $("#email").val(data.email);
  $("#phone").val(data.phone);
  $("#street").val(data.street);
  $("#descriptive_number").val(data.descriptive_number);
  $("#orientation_number").val(data.orientation_number);
  $("#town").val(data.town);
  $("#postal_code").val(data.postal_code);
  $("#country").val(data.country);
  $("#contact_name").val(data.contact_name);
  $("#info").val(data.info);
  }
}

function deserializeDraftDataService(jsonData){
  var data = jsonData.data;
  if(data.contract_no != null){
    $("#contract").val(data.contract_no);
    $("#service_id").val(data.service_id);
    $("#service_title").append(data.service_id);
    $("#product").val(data.product);
    $("#downlink").val(data.downlink);
    $("#uplink").val(data.uplink);
    $("#price").val(data.price);
    $("#ssid").val(data.ssid);
    $("#mac_address").val(data.mac_address);
    $("#core_router").val(data.core_router);
    $("#location_street").val(data.location_street);
    $("#location_descriptive_number").val(data.location_descriptive_number);
    $("#location_orientation_number").val(data.location_orientation_number);
    $("#location_town").val(data.location_town);
    $("#location_postal_code").val(data.location_postal_code);
    $("#location_country").val(data.location_country);
    $("#config").val(data.config);
    $("#activate_on").val(data.activate_on);
    $("#activation_fee").val(data.activation_fee);
    $("#operator").val(data.operator);
    $("#info_service").val(data.info_service);
    for(i = 2; i<=data.devices.length; i++){
        addDevice();
    }
    $(".row.device").each(function (i){
      $(this).find("input:text").val(data.devices[i].name);
      $(this).find("input:radio[value=" + data.devices[i].owner + "]").attr('checked',true);
    });
    $("#auth_type").val(data.auth_type);
    $("#auth_a").val(data.auth_a);
    $("#auth_b").val(data.auth_b);
    $("#ip").val(data.ip);
    if(data.is_ip_public){
     $("#is_ip_public").prop("checked", true);
    }                                
    $("#service_status").val(jsonData.status);
  }
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

function initSelectSsid(){
 $("#ssid").change(function(){
    var selectedSsid = $(this).find("option:selected").attr("master");
    var selectedCoreRouter = $("#core_router option[name='" + selectedSsid + "']").val();
    $("#core_router").val(selectedCoreRouter);
 });
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
  if($("#service_status").val() == "SUBMITTED"){
    $("#draft input[name=status]").val('Akceptovat');
    $("#draft input[name=status]").attr('rel', 'APPROVED');
    $("#draft input[name=status]").attr('msg', 'akceptován');
    $("#draft input[name=statusBack]").removeClass("ds-none");
  } else if($("#service_status").val() == "APPROVED"){
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
  var customer_ID = customerID;
  var contract_ID = contractID;
  var customerLink = "customers";
  var agreementLink = "agreements";
  if(customerID == null){
    customer_ID = createCustomer(name);
    customerLink = "drafts.customers";
  }
  if(contractID == null){
    contract_ID = createAgreement(customer_ID, customerLink);
    agreementLink = "drafts.agreements";     
  }
    
  createService(customer_ID, contract_ID, customerLink, agreementLink);

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
      url: address + "drafts2",
      statusCode: {
        201: function (data){
          ret = data.drafts.entityId;
        }
      }
    });
    return ret;
}

/*
  2. create or exist agreement
*/
function createAgreement(customerId, customerLink){
    var ret = 0;
    $.ajax({
      type: "POST",
      async: false,
      data: serializeAgreement(customerId, customerLink),
      dataType: "json",
      contentType:"application/json",
      url: address + "drafts2",
      statusCode: {
        201: function (data){
          ret = data.drafts.entityId;
        }
      }
    });
    return ret;
}

/*
  3. create service
*/
function createService(customerID, agreementId, customerLink, agreementLink){
   $.ajax({
      type: "POST",
      async: false,
      data: serializeService(customerID, agreementId, customerLink, agreementLink),
      dataType: "json",
      contentType:"application/json",
      url: address + "drafts2",
      statusCode: {
        201: function (data){
          location.href = "index.html?action=draft&draft_id=" + data.drafts.id;
        }
      }
    }); 
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
  data.drafts = {
      entityType: "customers",
      entitySpate: "",
      entityName: customerName,
      owner:user_id,
      status: "DRAFT"      
  };
  return JSON.stringify(data, null, 0);
}

/*
  serialize JSON agreement
*/
function serializeAgreement(customerId, customerLink){

  var data = {};
  var links = {};
  data.drafts = {
      entityType: "agreements",
      entitySpate: operation_country,
      entityName: "",
      owner:user_id,
      status: "DRAFT"      
  };
  
  links[customerLink] = customerId;
  data.drafts.links = links;
  
  return JSON.stringify(data, null, 0);
}

/*
  serialize JSON service
*/
function serializeService(customerId, agreementId, customerLink, agreementLink){

  var data = {}; 
  var links = {};      
  data.drafts = {
      entityType: "services",
      entitySpate: agreementId.toString(),
      entityName: "",
      owner:user_id,
      status: "DRAFT"      
  };      
  
  links[customerLink] = customerId;
  links[agreementLink] = agreementId;
  data.drafts.links = links;
  
  return JSON.stringify(data, null, 0); 
}

function deserializeNewDraft(data){
  $("#name").val(data.customer.name.split(' ')[0]);
  $("#surname").val(data.customer.name.split(' ')[1]);
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