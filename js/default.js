$(document).ready(function() {
  searchCustomers();
});

function searchCustomers(){
  $("#searchCustomers").keyup(function (event){
    if($("#searchCustomers").val().length > 1){
      $.getJSON('http://localhost:8080/customers?q=' + $("#searchCustomers").val() , function(jsondata){ $("#customers li").remove(); updateCustomers(jsondata.customers);});
    }else{
      $("#customers li").remove();
    }
  });
}

function updateCustomers(dempawObj){
  $("#customers").append("<li class='list-group-item'><span class='name'>" + $("#searchCustomers").val() + "</span><div class='pull-right'><a href='#' class='btn btn-sm btn-primary'><span class='glyphicon glyphicon-plus'></span> Nový zákazník</a></div></li>");
  $.each(dempawObj,function(key, value) {
    var li = "<li class='list-group-item'><span class='name'>" + value["name"] + "</span>";
    li += "<div class='pull-right'><a href='#' class='btn btn-sm btn-primary'><span class='glyphicon glyphicon-plus'></span> Nová smlouva</a>";
    
    if(value["contracts"] != null){
      for (var i=0, len = value["contracts"].length; i < len; i++) {
         li += "<a href='#' class='btn btn-sm btn-success'><span class='glyphicon glyphicon-edit'></span> " + value["contracts"][i] + "</a>";
      }
    }
    
    li += "</div></li>"
                     
    $("#customers").append(li);
    
  });
}
