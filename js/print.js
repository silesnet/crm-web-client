function initLoadDocumentData(){
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++)
    {
        var sParameterName = sURLVariables[i].split('=');
        $("#" + sParameterName[0]).html(decodeURI(sParameterName[1]));
    }
}