$(document).ready(function() {
    $('.menu').click(function() {
        $('.responsive-menu').toggle();
    });
    $(window).resize(function (){
        $('.responsive-menu').hide()
    })
      // Initial setup
    $('.tab-button:first').addClass('active');
    $('.tab-content:first').show();

    // Tab click event
    $('.tab-button').click(function() {
        var tabId = $(this).data('tab');

        // Remove 'active' class from all buttons and hide all tab contents
        $('.tab-button').removeClass('active');
        $('.tab-content').hide();

        // Add 'active' class to the clicked button and show the corresponding tab content
        $(this).addClass('active');
        $('#' + tabId).show();
    });
});