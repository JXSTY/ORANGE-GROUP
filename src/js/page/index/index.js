(function () {
    $(document).ready(function () {

        $(window).scroll(function() {
            var domTop = document.documentElement.scrollTop || document.body.scrollTop;
            var $level2 = $('#level2');
            console.log("dom卷起距离=" + domTop);
            domTop >= 550? headerFixed():headerUnFixed();
            $level2.css('padding-top',130);
        });
    });

    function headerFixed(){
        $('#header').addClass('fixed');
    }
    function headerUnFixed(){
        $('#header').removeClass('fixed');
    }
})();