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

        });
    }

    function saveComment(question, answer, comment, source, selected) {
        var request = $.ajax({
            url: "/comment",
            type: "POST",
            dataType: "json",
            data: {
                question : question,
                answer: answer,
                comment: comment,
                source: source,
                selected: selected
            }
        });

        request.done(function (newComment) {
            location.reload();
        });

        request.fail(function (jqXHR, textStatus) {

        });
    }

    function saveCommentVote(question, comment, agree) {
        var request = $.ajax({
            url: "/commentVote",
            type: "POST",
            dataType: "json",
            data: {
                question : question,
                comment: comment,
                agree: agree
            }
        });

        request.done(function (result) {
            $("span.agreeVote").html(result.data.agree  + ' agree');
            $("span.disagreeVote").html(result.data.disagree + ' disagree');

        });

        request.fail(function (jqXHR, textStatus) {

        });
    }

    function saveNote(comment, note, agree) {
        var request = $.ajax({
            url: "/note",
            type: "POST",
            dataType: "json",
            data: {
                comment : comment._id,
                note: note,
                agree: agree
            }
        });

        request.done(function (res) {
            hideNoteSparkForm();
            selectedComment.notes.push(res);
            var tmp = new EJS({url: '/html/note.ejs'}).render({
                note: res
            });
            $('.notes').prepend(tmp);
        });

        request.fail(function (jqXHR, textStatus) {

        });
    }

    function saveSpark(comment, spark, answer1, answer2) {
        var request = $.ajax({
            url: "/spark",
            type: "POST",
            dataType: "json",
            data: {
                comment : comment._id,
                spark: spark,
                answer1: answer1,
                answer2: answer2
            }
        });

        request.done(function (res) {
            hideNoteSparkForm();
            selectedComment.sparks.push(res);
            showNotes(selectedComment);
        });

        request.fail(function (jqXHR, textStatus) {

        });
    }

    function saveSparkVote(spark, answer, changeOpinion, sparkDiv) {
        var request = $.ajax({
            url: "/vote",
            type: "POST",
            dataType: "json",
            data: {
                question : spark,
                answer: answer,
                changeOpinion: changeOpinion
            }
        });

        request.done(function (res) {
            console.log(res);
            if (res.isSpark) {
                var tmp = new EJS({url: '/html/spark.ejs'}).render({
                    spark: res
                });
                sparkDiv.replaceWith(tmp);
            }
        });

        request.fail(function (jqXHR, textStatus) {

        });
    }

    function showAllComments(question) {
        var answer1 = $(".answer1[data-id]").data('id'),
            answer2 = $(".answer2[data-id]").data('id'),
            commentsAnswer1 = _.filter(question.comments, { 'answer': answer1 }),
            commentsAnswer2 = _.filter(question.comments, { 'answer': answer2 }),
            answers1Html = $($('.usercomments .comments')[0]),
            answers2Html = $($('.usercomments .comments')[1]);

        function appendComment(comment, type, container) {
            var tmp = new EJS({url: '/html/comment.ejs'}).render({
                '_id': comment._id,
                type: type,
                comment: comment.comment,
                noteCount: comment.notes.length,
                //sparkrCount: comment.sparks.length,
                sparkrCount: 0,
                user: comment.user ? comment.user.profile.name : 'anonymous',
                anonymous: question.anonymousComments
            });
            tmp = $(tmp);
            tmp.find('.comment').data('comment', comment);
            container.append(tmp);
        }

        $('.row.usercomments').show();
        $('.row.existingcomments').hide();

        _.forEach(commentsAnswer1, function (comment) {
            if (comment.comment) {
                appendComment(comment, 'primary', answers1Html);
            }
        });

        _.forEach(commentsAnswer2, function (comment) {
            if (comment.comment) {
                appendComment(comment, 'danger', answers2Html);
            }
        });


        if (commentsAnswer1.length === 0 && commentsAnswer2.length === 0) {
            $('.no-comments').show();
        }
    }

    function showCommentsForVote(question, answer) {
        var container = $('.existingcomments .comments'),
            comments = _.filter(question.comments, { 'answer': answer });

        function appendComment(comment, type, container) {
            var tmp = new EJS({url: '/html/commentVote.ejs'}).render({
                '_id': comment._id,
                type: type,
                comment: comment.comment,
                noteCount: comment.notes.length,
                sparkrCount: comment.sparks.length,
                user: comment.user ? comment.user.profile.name : 'anonymous'
            });
            tmp = $(tmp);
            tmp.find('.comment').data('comment', comment);
            container.append(tmp);
        }

        $('.row.usercomments').hide();
        $('.row.existingcomments').show();

        var answerOrder = _.find(question.answers, { '_id': answer }).order;

        _.forEach(comments, function (comment) {
            if (comment.comment) {
                appendComment(comment, answerOrder === 1 ? 'primary' : 'danger', container);
            }
        });
    }

    function showRightPanel() {
        $('.container').switchClass('container', 'container-fluid', 1);
        $('.col-md-12.left').switchClass('col-md-12', 'col-md-7', 1);
        $('.right').show();
    }

    function hideRightPanel() {
        $('.container-fluid').switchClass('container-fluid', 'container', 1);
        $('.col-md-7.left').switchClass('col-md-7', 'col-md-12', 1);
        $('.right').hide();
    }

    function showNotes(comment) {
        $('.notes').html('');

        var list = [], poll = $('.poll').data('id');
        _.forEach(comment.notes, function (note) { list.push(note); });
        _.forEach(comment.sparks, function (spark) { list.push(spark); });
        var finalList = _.sortBy(list, 'date').reverse();

        $("span.agreeVote").html((comment.agree ? comment.agree.length : 0)  + ' agree');
        $("span.disagreeVote").html((comment.disagree ? comment.disagree.length : 0) + ' disagree');

        _.forEach(finalList, function (item) {
            if (item.isSpark) {
                var tmp = new EJS({url: '/html/spark.ejs'}).render({
                    spark: item,
                    poll: poll
                });
                $('.notes').append(tmp);
            } else {
                var tmp = new EJS({url: '/html/note.ejs'}).render({
                    note: item
                });
                $('.notes').append(tmp);
            }
        });
    }

    function showComment(commentElement) {
        var comment = commentElement.data('comment');

        $('.selected-comment').attr('date-id', comment._id);
        $('.comment').removeClass('active');

        if (selectedComment && selectedComment._id === comment._id) {
            selectedComment = null;
            hideRightPanel();
            return;
        }
        showRightPanel();
        selectedComment = comment;
        $('.selectedComment').html(comment.comment);
        if (commentElement.hasClass('primary')) {
            $('.selectedComment').removeClass('danger');
            $('.selectedComment').addClass('primary');
        } else {
            $('.selectedComment').removeClass('primary');
            $('.selectedComment').addClass('danger');
        }

        commentElement.addClass('active');
        showNotes(comment);
    }

    function resetNoteSparkForm() {
        $('#add-agree-panel textarea').val('');
        $('#add-disagree-panel textarea').val('');
        $('#add-sparkr-panel textarea').val('');
        $('#add-sparkr-panel input.a1').val('');
        $('#add-sparkr-panel input.a2').val('');
    }

    function hideNoteSparkForm() {
        $('#add-agree-panel').hide();
        $('#add-sparkr-panel').hide();
        $('#add-disagree-panel').hide();
    }

    $('.show-login-form').on('click', function () {
        $('.loginbuttons').hide();
        $('.loginform').show();
    });

    $('.btn-answer').on('click', function () {
        var question = $(".question[data-id]").data('id'),
            answer = $(this).data('id');
        saveVote(question, answer, false);
        location.reload();
    });

    $('.change-vote-answer1, .change-vote-answer2').on('click', function () {
        var question = $(".question[data-id]").data('id'),
            answer = $(this).data('id'),
            changeOpinion = false;
        saveVote(question, answer, changeOpinion);
    });

    $('.change-vote-answer1-new, .change-vote-answer2-new').on('click', function () {
        var question = $(".question[data-id]").data('id'),
            answer = $(this).data('id'),
            changeOpinion = true;
        saveVote(question, answer, changeOpinion);
    });


    $('.add-source').on('click', function () {
        $('.add-source').hide();
        $('.source-panel').show();
    });

    $('#save-reason').on('click', function () {
        var comment = $('#reason').val(),
            source = $('#source').val(),
            answer = $(".vote[data-answer]").data('answer'),
            selectedComments = [];

        $('.row.comments .well.selected').each(function (index, value) {
            selectedComments.push($(value).data('id'));
        });

        saveComment(questionObject._id.toString(), answer, comment, source, selectedComments);
    });

    $('#skip-reason').on('click', function () {
        var answer = $(".vote[data-answer]").data('answer');
        saveComment(questionObject._id.toString(), answer, '', '', []);
    });

    $(document).on('click', '.usercomments .well', function () {
        showComment($(this));
    });

    $(document).on('click', '.existingcomments .well', function () {
        if ($(this).hasClass("selected")) {
            $(this).removeClass('selected');
        } else {
            $(this).addClass('selected');
        }
    });

    // Spark vote buttons
    $(document).on('click', '.well.spark button', function () {
        var spark = $(this).data('spark'),
            answer = $(this).data('id'),
            votes = $(this).parent().find('small').data('votes') + 1,
            sparkDiv = $(this).parent().parent().parent();

        $(this).parent().find('small').html(votes + ' votes');
        $(this).parent().parent().find('button').remove();
        console.log(spark, answer);
        saveSparkVote(spark, answer, false, sparkDiv);
    });

    $('#add-sparkr').on('click', function () {
        resetNoteSparkForm();
        $('#add-sparkr-panel').toggle();
        $('#add-agree-panel').hide();
        $('#add-disagree-panel').hide();
    });

    $(document).on('click', '.agreeVote', function () {
        saveCommentVote(
            questionObject._id.toString(),
            selectedComment._id.toString(),
            true);
    });

    $(document).on('click', '.disagreeVote', function () {
        saveCommentVote(
            questionObject._id.toString(),
            selectedComment._id.toString(),
            false);
    });


    $(document).on('click', '.agreeNote', function () {
        resetNoteSparkForm();
        $('#add-agree-panel').toggle();
        $('#add-sparkr-panel').hide();
        $('#add-disagree-panel').hide();
    });

    $(document).on('click', '.disagreeNote', function () {
        resetNoteSparkForm();
        $('#add-disagree-panel').toggle();
        $('#add-sparkr-panel').hide();
        $('#add-agree-panel').hide();
    });

    $('#add-agree-panel button').on('click', function () {
        var note = $('#add-agree-panel textarea').val();
        saveNote(selectedComment, note, true);
    });

    $('#add-disagree-panel button').on('click', function () {
        var note = $('#add-disagree-panel textarea').val();
        saveNote(selectedComment, note, false);
    });

    $('#add-sparkr-panel button').on('click', function () {
        var sparkr = $('#add-sparkr-panel textarea').val(),
            answer1 = $('#add-sparkr-panel input.a1').val(),
            answer2 = $('#add-sparkr-panel input.a2').val();

        saveSpark(selectedComment, sparkr, answer1, answer2);
    });

    if (typeof questionObject !== 'undefined') {
        if ($('.add-comment-form').length > 0) {
            showCommentsForVote(questionObject, $('.vote').data('answer'));
        } else {
            showAllComments(questionObject);
        }
    }

    $(document).on('click', '.answer1Color, .answer2Color', function () {
        var question = $(this).data('question'),
            answer = $(this).data('id'),
            sparkDiv = $(this).parent().parent().parent();
        saveSparkVote(question, answer, true, sparkDiv);
    });

});
