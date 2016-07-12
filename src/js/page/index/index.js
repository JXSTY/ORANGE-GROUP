(function () {
    $(document).ready(function () {

        $(window).scroll(function() {
            var domTop = document.documentElement.scrollTop || document.body.scrollTop;
            console.log("dom卷起距离=" + domTop);
            domTop >= 550? headerFixed():headerUnFixed();
        });

    });

    function headerFixed(){
        $('#header').addClass('fixed');
    }

    function headerUnFixed(){
        $('#header').removeClass('fixed');
    }
})();