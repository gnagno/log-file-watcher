$(function() {
    partials = {
        form: '<form class="filters"><input type="checkbox" name="filter-regex" id="filter-regex" /><label for="filter-regex">regex</label><span class="error"></span><br /><input type="text" name="filter" /></form>'
    };

    var loggers = $('#loggers')[0];
    var filterForm = $(partials.form)[0];
    console.log(filterForm);

    function openLog (file) {
        
    }

    function hijack_click(e) {
        if(e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) return;
        e.preventDefault(); // prevent leaving this page
        console.log(e)
        //openLog(this.href);
    }
    var list = $("#watchable li a").each(function(e) {
        $(this).click(hijack_click);
    })
    console.log(list)
})
