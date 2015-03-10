'use strict';

$(function () {
    var selectedComment;

    // User
    function saveVote(question, answer, changeOpinion) {
        var request = $.ajax({
            url: "/vote",
            type: "POST",
            dataType: "json",
            data: {
                question : question,
                answer: answer,
                changeOpinion: changeOpinion
            }
        });

        request.done(function (res) {
            location.reload();
        });

        request.fail(function (jqXHR, textStatus) {
            console.log(jqXHR);
            console.error(textStatus);
        });
    }

    $('.btn-answer').on('click', function () {
        var question = $(".question[data-id]").data('id'),
            answer = $(this).data('id');
        saveVote(question, answer, false);
    });

    function PopupCenter(url, title, w, h) {
        // Fixes dual-screen position                         Most browsers      Firefox
        var dualScreenLeft = window.screenLeft != undefined ? window.screenLeft : screen.left;
        var dualScreenTop = window.screenTop != undefined ? window.screenTop : screen.top;

        var width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
        var height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;

        var left = ((width / 2) - (w / 2)) + dualScreenLeft;
        var top = ((height / 2) - (h / 2)) + dualScreenTop;
        var newWindow = window.open(url, title, 'scrollbars=no, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);

        // Puts focus on the newWindow
        if (window.focus) {
            newWindow.focus();
        }
    }

    $('.show-login-form').on('click', function () {
        $('.login-form').show();
        $('.loginForVote').hide();
    });

    $('#cancel').on('click', function () {
        $('.login-form').hide();
        $('.loginForVote').show();
    });

    $('.btn-twitter').on('click', function () {
        PopupCenter('/auth/twitter', 'Twitter Login', '800', '500');
    });

    $('.btn-facebook').on('click', function () {
        PopupCenter('/auth/facebook', 'Facebook Login', '1000', '550');
    });

    $('.answer1Color').on('click', function () {
        var question = $(".question[data-id]").data('id'),
            answer = $(this).data('id');
        saveVote(question, answer, true);
    });

    $('.answer2Color').on('click', function () {
        var question = $(".question[data-id]").data('id'),
            answer = $(this).data('id');
        saveVote(question, answer, true);
    });
});