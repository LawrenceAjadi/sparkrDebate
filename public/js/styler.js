$(document).ready(function() {
  var aaa = $('.progress-bar').attr('style');
  var x = parseInt(aaa.replace(/[^0-9\.]/g, ''), 10)
  var bbb = $('.progress-bar-danger').attr('style');
  var y = parseInt(bbb.replace(/[^0-9\.]/g, ''), 10)
  
  if(x<y) {
    $('.progress-bar, .primary.selected').css('background-color','#E6A6B2 !important');
    $('.primary.comment, selectedComment.primary.active').css('background-color','#ffffff !important');
    $('.primary.comment, selectedComment.primary.active').css('border-color','#E6A6B2')

    $('.change-vote-answer1, .answer1Color').css('color','#E6A6B2 !important');
    $('.change-vote-answer1-new').css('color','#E6A6B2 !important');


    $('.progress-bar-danger, .danger.selected').css('background-color','#c7193c !important');
    $('.danger.comment, selectedComment.danger.active').css('background-color','#ffffff !important');
    $('.danger.comment, selectedComment.danger.active').css('border-color','#c7193c')

    $('.change-vote-answer2, .answer2Color').css('color','#c7193c !important');
    $('.change-vote-answer2-new').css('color','#c7193c !important');
    console.log('Hello');

  } else if(x>y || x == y) {
    $('.progress-bar, .primary.selected').css('background-color','#c7193c !important');
    $('.primary.comment, selectedComment.primary.active').css('background-color','#ffffff !important');
    $('.primary.comment, selectedComment.primary.active').css('border-color','#c7193c')

    $('.change-vote-answer1, .answer1Color').css('color','#c7193c !important');
    $('.change-vote-answer1-new').css('color','#c7193c !important');


    $('.progress-bar-danger, .danger.selected').css('background-color','#E6A6B2 !important');
    $('.danger.comment, selectedComment.danger.active').css('background-color','#ffffff !important');
    $('.danger.comment, selectedComment.danger.active').css('border-color','#E6A6B2')


    $('.change-vote-answer2, .answer2Color').css('color','#E6A6B2 !important');
    $('.change-vote-answer2-new').css('color','#E6A6B2 !important');
    console.log($('.change-vote-answer1').css('color'));
  }
});
