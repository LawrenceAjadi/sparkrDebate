'use strict';

var _ = require('lodash');
var async = require('async');
var numeral = require('numeral');
var Question = require('../models/Question');
var User = require('../models/User');
var secrets = require('../config/secrets');

/**
 * GET /polls
 * List of all polls
 */
exports.polls = function (req, res, next) {
    Question
        .find({ user : req.user.id })
        .where('isSpark').equals(false)
        .sort('date')
        .exec(function (err, polls) {
            if (err) {
                return next(err);
            }

            res.render('polls', {
                title: 'Polls',
                polls: polls,
                url: req.protocol + '://' + req.get('host')
            });
        });
};

/**
 * GET /create
 * Create new poll
 */
exports.createPoll = function (req, res) {
    var question,
        q = req.flash('question');

    if (q.length > 0) {
        question = new Question(q[0]);
    } else {
        question = new Question({
            name: '',
            anonymousComments: true,
            loginToVote: true,
            answers: [{ name: '' }, { name: '' }]
        });
    }

    res.render('createPoll', {
        title: 'Create Pool',
        question: question
    });
};

/**
 * POST /create
 * Create new poll
 */
exports.postCreatePoll = function (req, res, next) {
    var errors, question;

    req.assert('name', 'Question cannot be blank').notEmpty();
    req.assert('answers.0.name', 'Answer 1 cannot be blank').notEmpty();
    req.assert('answers.1.name', 'Answer 2 cannot be blank').notEmpty();

    errors = req.validationErrors();

    if (errors) {
        req.flash('errors', errors);
        req.flash('question', req.body);
        return res.redirect('/create');
    }

    question = new Question(req.body);
    question.user = req.user.id;
    question.answers[0].order = 1;
    question.answers[1].order = 2;
    question.save(function (err) {
        if (err) {
            return next(err);
        }
        req.flash('success', { msg: 'The poll was created.' });
        return res.redirect('/polls');
    });


};

function userCookieCheckVote(question, userId, cookie){
    var vote = _.find(question.votes, function (v) {
        return v.obsolete === false && v.user && v.user.toString() === userId;
    });
    if (!vote) {
        vote = _.find(question.votes, function (v) {
            return v.obsolete === false && v.cookie && v.cookie === cookie;
        });
    }
    return vote;
}

/**
 * GET /:pollId
 * GET /:pollId/:questionId
 * Open poll or question page
 */
exports.poll = function (req, res, next) {
    var pollId = req.params.pollId,
        questionId = req.params.questionId,
        userId = req.user ? req.user.id : undefined,
        cookieVote = req.signedCookies.vote || undefined,
        vote,
        isWidget = req.url.indexOf('/w/') === 0,
        jadePoll,
        jadePollVoted;

    jadePoll = isWidget ? 'widget/poll' : 'poll';
    jadePollVoted = isWidget ? 'widget/pollVoted' : 'pollVoted';

    function response(question) {
        if (!userId && !cookieVote) {
            res.cookie('vote', Math.random().toString(36).substring(3), { signed: true });
        }
        if (userId) {
            res.clearCookie('vote', { path: '/'});
        }

        vote = userCookieCheckVote(question, userId, cookieVote);

        if (vote) {
            var answerPerc1 = 0,
                answerPerc2 = 0,
                comment;

            if (question.answers[0].votes) {
                answerPerc1 = (question.answers[0].votes / (question.answers[0].votes + question.answers[1].votes || 0)) * 100;
            }
            if (question.answers[1].votes) {
                answerPerc2 = (question.answers[1].votes / (question.answers[1].votes + question.answers[0].votes || 0)) * 100;
            }

            comment =  _.find(question.comments, function (c) {
                return c.obsolete === false && c.user && c.user._id.toString() === userId;
            });
            if (!comment) {
                comment =  _.find(question.comments, function (c) {
                    return c.obsolete === false && c.cookie && c.cookie === cookieVote;
                });
            }

            _(question.comments).forEach(function (c) {
                c.test = "sanel";
            });

            async.each(question.comments, function(c, callback) {
                Question
                    .find({ fromComment : c._id })
                    .populate('user', 'profile.name')
                    .select('poll name votes answers date user isSpark isQuestion')
                    .lean()
                    .exec(function (err, sparks) {
                        if (err) {
                            return next(err);
                        }
                        c.sparks = sparks;

                        _(c.sparks).forEach(function (s) {
                            var sparkVote = userCookieCheckVote(s, userId, cookieVote),
                                sparkAnswerPerc1 = 0,
                                sparkAnswerPerc2 = 0;

                            if (sparkVote) {
                                if (s.answers[0].votes) {
                                    sparkAnswerPerc1 = (s.answers[0].votes / (s.answers[0].votes + s.answers[1].votes || 0)) * 100;
                                }
                                if (s.answers[1].votes) {
                                    sparkAnswerPerc2 = (s.answers[1].votes / (s.answers[1].votes + s.answers[0].votes || 0)) * 100;
                                }

                                s.readonly = true;
                                s.answerPerc1 = sparkAnswerPerc1;
                                s.answerPerc2 = sparkAnswerPerc2;
                                s.percentage1 = numeral(sparkAnswerPerc1).format('0');
                                s.percentage2 = numeral(sparkAnswerPerc2).format('0');
                                s.vote = sparkVote;
                            }
                        });

                        callback();
                    });
            }, function (err) {
                res.render(jadePollVoted, {
                    question: question,
                    commentsAnswer1: _.filter(question.comments, { 'answer': question.answers[0]._id }),
                    commentsAnswer2: _.filter(question.comments, { 'answer': question.answers[1]._id }),
                    answerPerc1: answerPerc1,
                    answerPerc2: answerPerc2,
                    percentage1: numeral(answerPerc1).format('0'),
                    percentage2: numeral(answerPerc2).format('0'),
                    vote: vote, // User's vote document,
                    comment: comment, // User's comment document
                    url: req.protocol + '://' + req.get('host'),
                    userId: userId || "",
                    cookie: cookieVote || ""
                });
            });
        } else {
            res.render(jadePoll, {
                question: question
            });
        }
    }

    if (questionId) {
        Question
            //.findById(questionId)
            .findOne({_id : questionId})
            .populate('user', 'profile.name')
            .populate('comments.user comments.notes.user comments.sparks.user', 'profile.name')
            .lean()
            .exec(function (err, question) {
                if (err) {
                    return next(err);
                }
                if (!question || question.poll.toString() !== pollId) {
                    return next("Nema...");
                }

                response(question);
            });
    } else {
        Question
            .findOne({poll: pollId})
            .populate('user', 'profile.name')
            .populate('comments.user comments.notes.user comments.sparks.user', 'profile.name')
            .sort('date')
            .lean()
            .exec(function (err, question) {
                if (err) {
                    return next(err);
                }
                if (!question) {
                    return next("Nema...");
                }

                response(question);
            });
    }
};

/**
 * POST /vote
 * Add vote to question
 * @param req
 * @param res
 * @param next
 */
exports.vote = function (req, res, next) {
    var questionId = req.body.question,
        answerId = req.body.answer,
        userId = req.user ? req.user.id : null,
        cookie = req.signedCookies.vote || null,
        changeOpinion = req.body.changeOpinion.toString() === "true";

    if (!questionId || !answerId) {
        return next("Error!");
    }

    Question.findById(questionId, function (err, question) {
        var vote, answer1, answer2;

        if (err) {
            return next(err);
        }
        if (!question) {
            return next("The question does not exist!");
        }

        if (changeOpinion) {
            question.obsoleteVotesAndCommentsForUser(userId);
            question.obsoleteVotesAndCommentsForCookie(cookie);
        }

        vote = question.checkIfUserVote(userId) || question.checkIfUserCookieVote(cookie);
        if (vote) {
            answer1 = question.getAnswerById(vote.answer.toString());
            answer1.votes = answer1.votes - 1;
            vote.answer = answerId;
            answer2 = question.getAnswerById(answerId);
            if (answer2) {
                answer2.votes = answer2.votes ? answer2.votes + 1 : 1;
            }
        } else {
            question.votes.push({
                answer: answerId,
                user: req.user ? req.user.id : undefined,
                cookie: !req.user && req.signedCookies.vote ? req.signedCookies.vote : undefined
            });

            if (changeOpinion) {
                _(question.answers).forEach(function (ans) {
                    if (ans._id.toString() === answerId) {
                        ans.votes = ans.votes ? ans.votes + 1 : 1;
                    } else {
                        ans.votes = ans.votes - 1;
                    }
                });
            } else {
                answer1 = question.getAnswerById(answerId);
                if (answer1) {
                    answer1.votes = answer1.votes ? answer1.votes + 1 : 1;
                }
            }
        }

        if (question.isSpark) {
            var tmpVotes = _.filter(question.votes, { 'obsolete': false });
            if (tmpVotes.length >= secrets.sparksMaxVoteCount) {
                question.isQuestion = true;
            }
        }

        question.save(function (err, data) {
            if (err) {
                return next(err);
            }

            Question
                .findOne({ _id : data._id })
                .populate('user', 'profile.name')
                .select('poll name votes answers date user isSpark isQuestion')
                .lean()
                .exec(function (err, question) {
                    if (err) {
                        return next(err);
                    }

                    vote = userCookieCheckVote(question, userId, cookie);
                    var answerPerc1 = 0,
                        answerPerc2 = 0;

                    if (vote) {
                        if (question.answers[0].votes) {
                            answerPerc1 = (question.answers[0].votes / (question.answers[0].votes + question.answers[1].votes || 0)) * 100;
                        }
                        if (question.answers[1].votes) {
                            answerPerc2 = (question.answers[1].votes / (question.answers[1].votes + question.answers[0].votes || 0)) * 100;
                        }

                        question.readonly = true;
                        question.answerPerc1 = answerPerc1;
                        question.answerPerc2 = answerPerc2;
                        question.percentage1 = numeral(answerPerc1).format('0');
                        question.percentage2 = numeral(answerPerc2).format('0');
                        question.vote = vote;
                    }

                    res.json(question);
                });
        });
    });
};

/**
 * POST /comment
 * Add comment (reason) to question
 * @param req
 * @param res
 * @param next
 */
exports.comment = function (req, res, next) {
    var questionId = req.body.question,
        answerId = req.body.answer,
        userId = req.user ? req.user.id : null,
        cookie = req.signedCookies.vote || null,
        comment = req.body.comment,
        source = req.body.source,
        selected = req.body.selected;

    if (!questionId || !answerId) {
        return next("Error!");
    }

    Question
        .findById(questionId)
        .populate('user comments.user comments.notes.user', 'profile.name')
        .exec(function (err, question) {
            var commentDocument, newComment;

            if (err) {
                return next(err);
            }
            if (!question) {
                return next("The question does not exist!");
            }

            commentDocument = question.checkIfUserComment(userId) || question.checkIfUserCookieComment(cookie);
            if (commentDocument) {
                return res.json('You already enter comment');
            }

            // User select existing comments
            _.forEach(selected, function (item) {
                var tmpComment = _.find(question.comments, function (c) {
                    return c._id.toString() === item;
                });

                tmpComment.agree.push({
                    user: req.user ? req.user.id : undefined,
                    cookie: !req.user && req.signedCookies.vote ? req.signedCookies.vote : undefined
                });
            });

            newComment = {
                answer: answerId,
                user: req.user ? req.user.id : undefined,
                cookie: !req.user && req.signedCookies.vote ? req.signedCookies.vote : undefined,
                comment: comment,
                source: source || undefined
            };

            question.comments.push(newComment);

            question.save(function (err, data) {
                if (err) {
                    return next(err);
                }
                res.json(_.last(data.comments));
            });
        });
};

/**
 * POST /commentVote
 * Add comment vote (agree-disagree)
 * @param req
 * @param res
 * @param next
 */
exports.commentVote = function (req, res, next) {
    var questionId = req.body.question,
        userId = req.user ? req.user.id : null,
        cookie = req.signedCookies.vote || null,
        comment = req.body.comment,
        agree = req.body.agree.toString() === "true";

    Question
        .findById(questionId)
        .exec(function (err, question) {
            var tmpComment;

            if (err) {
                return next(err);
            }
            if (!question) {
                return next("The question does not exist!");
            }

            tmpComment = _.find(question.comments, function (c) {
                return c._id.toString() === comment;
            });

            if (userId) {
                _.filter(
                    tmpComment.agree,
                    function (a) {
                        return a.user && a.user.toString() === userId;
                    }
                ).map(function (d) {
                    return d._id.toString();
                }).forEach(function (d) {
                    tmpComment.agree.pull(d);
                });

                _.filter(
                    tmpComment.disagree,
                    function (a) {
                        return a.user && a.user.toString() === userId;
                    }
                ).map(function (d) {
                    return d._id.toString();
                }).forEach(function (d) {
                    tmpComment.disagree.pull(d);
                });
            }
            if (cookie) {
                _.filter(
                    tmpComment.agree,
                    function (a) {
                        return a.cookie === cookie;
                    }
                ).map(function (d) {
                    return d._id.toString();
                }).forEach(function (d) {
                    tmpComment.agree.pull(d);
                });

                _.filter(
                    tmpComment.disagree,
                    function (a) {
                        return a.cookie === cookie;
                    }
                ).map(function (d) {
                    return d._id.toString();
                }).forEach(function (d) {
                    tmpComment.disagree.pull(d);
                });
            }

            if (agree) {
                tmpComment.agree.push({
                    user: userId,
                    cookie: cookie
                });
            } else {
                tmpComment.disagree.push({
                    user: userId,
                    cookie: cookie
                });
            }

            question.save(function (err, data) {
                if (err) {
                    return next(err);
                }
                var t = _.find(data.comments, function (c) {
                    return c._id.toString() === comment;
                });

                res.json({
                    status: 'ok',
                    data: {
                        agree: t.agree ? t.agree.length : 0,
                        disagree: t.disagree ? t.disagree.length : 0
                    }
                });
            });
        });
};

/**
 * POST /note
 * Add note on comment
 * @param req
 * @param res
 * @param next
 */
exports.note = function (req, res, next) {
    var commentId = req.body.comment,
        note = req.body.note,
        agree = req.body.agree.toString() === "true";

    if (!commentId || !note) {
        return next("Error!");
    }

    Question
        .findOne({ 'comments._id' : commentId})
        .select('comments')
        .exec(function (err, comments) {
            if (err) {
                return next(err);
            }

            var comment = _.find(comments.comments, function (c) {
                return c._id.toString() === commentId;
            });

            var newNote = {
                note: note,
                user: req.user ? req.user.id : null,
                cookie: !req.user && req.signedCookies.vote ? req.signedCookies.vote : undefined,
                agree: agree
            };

            comment.notes.push(newNote);
            comments.save(function (err, doc) {
                var result = {
                        agree: agree,
                        date: new Date(),
                        note: note
                    };

                if (req.user) {
                    result.user = {
                        _id: req.user.id,
                        profile: {
                            name: req.user.profile.name
                        }
                    };
                }

                res.json(result);
            });
        });
};

/**
 * POST /spark
 * Add sparkr on comment
 * @param req
 * @param res
 * @param next
 */
exports.spark = function (req, res, next) {
    var commentId = req.body.comment,
        spark = req.body.spark,
        answer1 = req.body.answer1,
        answer2 = req.body.answer2;

    if (!commentId || !spark) {
        return next("Error!");
    }

    Question
        .findOne({ 'comments._id' : commentId})
        .select('poll comments._id')
        .exec(function (err, comments) {
            if (err) {
                return next(err);
            }
            var comment, question;

            comment = _.find(comments.comments, function (c) {
                return c._id.toString() === commentId;
            });

            question = new Question({
                user: req.user ? req.user.id : undefined,
                cookie: !req.user && req.signedCookies.vote ? req.signedCookies.vote : undefined,
                name: spark,
                answers: [
                    { name: answer1, order: 1 },
                    { name: answer2, order: 2 }
                ],
                isQuestion: false,
                isSpark: true,
                fromComment: comment._id,
                poll: comments.poll
            });

            question.save(function (err, newQuestion) {
                if (err) {
                    return next(err);
                }

                Question
                    .findOne({ _id : newQuestion._id })
                    .populate('user', 'profile.name')
                    .select('name poll votes answers date user isSpark isQuestion')
                    .lean()
                    .exec(function (err, spark) {
                        if (err) {
                            return next(err);
                        }
                        res.json(spark);
                    });
            });
        });
};

/**
 * POST /spark/vote
 * Add sparkr vote
 * @param req
 * @param res
 * @param next
 */
exports.sparkVote = function (req, res, next) {
    var sparkId = req.body.spark,
        answerId = req.body.answer,
        commentId = req.body.comment;

    Question
        .findOne({ 'comments.sparks._id' : sparkId})
        .select('poll anonymousComments loginToVote comments._id comments.sparks')
        .exec(function (err, document) {
            if (err) {
                return next(err);
            }

            var comment = _.find(document.comments, function (c) {
                return c._id.toString() === commentId;
            });

            var spark = _.find(comment.sparks, function (s) {
                return s._id.toString() === sparkId;
            });

            spark.votes.push({
                answer: answerId,
                user: req.user ? req.user.id : undefined,
                cookie: !req.user && req.signedCookies.vote ? req.signedCookies.vote : undefined
            });

            _.forEach(spark.answers, function (a) {
                if (a._id.toString() === answerId) {
                    a.votes = a.votes + 1;
                }
            });

            document.save(function (err, result) {
                if (spark.votes.length >= secrets.sparksMaxVoteCount) {
                    var newQuestion = new Question({
                        name: spark.spark,
                        anonymousComments: result.anonymousComments,
                        loginToVote: result.loginToVote,
                        answers: [
                            {
                                _id: spark.answers[0]._id,
                                name: spark.answers[0].name,
                                votes: spark.answers[0].votes,
                                order: spark.answers[0].order
                            },
                            {
                                _id: spark.answers[1]._id,
                                name: spark.answers[1].name,
                                votes: spark.answers[1].votes,
                                order: spark.answers[1].order
                            }
                        ],
                        votes: spark.votes,
                        user: spark.user,
                        poll: result.poll
                    });

                    // Save new question from spark
                    newQuestion.save(function (err) {
                        if (err) {
                            return next(err);
                        }

                        // Empty old spark
                        spark.question = newQuestion._id;
                        spark.votes = [];
                        document.save(function (err) {
                            User.findById(spark.user, 'profile', function (err, user) {
                                spark.user = user;
                                res.json({
                                    user: user,
                                    spark: spark.spark,
                                    votes: [],
                                    answers: spark.answers,
                                    question: spark.question
                                });
                            });
                        });
                    });
                } else {
                    res.json(spark);
                }
            });
        });
};