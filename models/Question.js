'use strict';

var _ = require('lodash'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    Types = Schema.Types;

var answerSchema = new Schema({
    name: String,
    order: { type: Number, default: 1 },
    votes: { type: Number, default: 0 } // Number of votes for this answer
});

var voteSchema = new mongoose.Schema({
    answer: Types.ObjectId,
    user: Types.ObjectId,
    cookie: String, // Anonymous users use random string in cookie
    date: { type: Date, default: Date.now },
    location: String,
    referral: String,
    obsolete: { type: Boolean, default: false }
});

var noteSchema = new mongoose.Schema({
    user : { type: Types.ObjectId, ref: 'User' },
    cookie: String, // Anonymous users use random string in cookie
    date: { type: Date, default: Date.now },
    note: String,
    agree: Boolean
});

var eventSchema = new mongoose.Schema({
    user : { type: Types.ObjectId, ref: 'User' },
    cookie: String, // Anonymous users use random string in cookie
    date: { type: Date, default: Date.now }
});

var commentSchema = new mongoose.Schema({
    answer: Types.ObjectId,
    user : { type: Types.ObjectId, ref: 'User' },
    cookie: String, // Anonymous users use random string in cookie
    date: { type: Date, default: Date.now },
    comment: String,
    source: String,
    notes: [noteSchema],
    obsolete: { type: Boolean, default: false },
    agree: [eventSchema],
    disagree: [eventSchema]
});

commentSchema.methods.checkIfUserVote = function (userId) {
    var tmp = _.find(this.agree, function (a) {
        return a.user && a.user.toString() === userId;
    });

    if (!tmp) {
        tmp = _.find(this.disagree, function (d) {
            return d.user && d.user.toString() === userId;
        });
    }

    return tmp;
};

commentSchema.methods.checkIfCookieVote = function (cookie) {
    var tmp = _.find(this.agree, function (a) {
        return a.cookie === cookie;
    });

    if (!tmp) {
        tmp = _.find(this.disagree, function (d) {
            return d.cookie === cookie;
        });
    }

    return tmp;
};

var questionSchema = new Schema({
    poll: {type: mongoose.Schema.ObjectId, default: mongoose.Types.ObjectId},
    user : { type: Types.ObjectId, ref: 'User' },
    date: { type: Date, default: Date.now },
    name: String,
    type: { type: String, default: 'Yes/No' },
    answers: [answerSchema],
    anonymousComments: { type: Boolean, default: false },
    loginToVote: { type: Boolean, default: false },
    loginToComment: { type: Boolean, default: false },
    votes: [voteSchema],
    comments: [commentSchema],

    isQuestion: { type: Boolean, default: true },
    isSpark: { type: Boolean, default: false },
    fromComment: { type: Types.ObjectId }
});

/**
 * Check if user is already voted
 * @param user._id
 * @returns Vote document or undefined
 */
questionSchema.methods.checkIfUserVote = function (userId) {
    return _.find(this.votes, function (vote) {
        return vote.obsolete === false && vote.user && vote.user.toString() === userId;
    });
};

/**
 * Check if user with given cookie is already voted
 * @param cookie (random string)
 * @returns Vote document or undefined
 */
questionSchema.methods.checkIfUserCookieVote = function (cookie) {
    return _.find(this.votes, function (vote) {
        return vote.obsolete === false && vote.cookie && vote.cookie === cookie;
    });
};

/**
 * Check if user is already commented
 * @param user._id
 * @returns Comment document or undefined
 */
questionSchema.methods.checkIfUserComment = function (userId) {
    return _.find(this.comments, function (comment) {
        return comment.obsolete === false && comment.user && comment.user._id.toString() === userId;
    });
};

/**
 * Check if user with given cookie is already comment
 * @param cookie (random string)
 * @returns Comment document or undefined
 */
questionSchema.methods.checkIfUserCookieComment = function (cookie) {
    return _.find(this.comments, function (comment) {
        return comment.obsolete === false && comment.cookie && comment.cookie === cookie;
    });
};

/**
 * Get answer for given _id
 * @param answerId
 * @returns Answer document
 */
questionSchema.methods.getAnswerById = function (answerId) {
    return _.find(this.answers, function (a) {
        return a._id.toString() === answerId;
    });
};

questionSchema.methods.obsoleteVotesAndCommentsForUser = function (userId) {
    _(this.votes).forEach(function (vote) {
        if (vote.user && vote.user.toString() === userId) {
            vote.obsolete = true;
        }
    });
    _(this.comments).forEach(function (comment) {
        if (comment.user && comment.user.toString() === userId) {
            comment.obsolete = true;
        }
    });
};

questionSchema.methods.obsoleteVotesAndCommentsForCookie = function (cookie) {
    _(this.votes).forEach(function (vote) {
        if (vote.cookie && vote.cookie === cookie) {
            vote.obsolete = true;
        }
    });
    _(this.comments).forEach(function (comment) {
        if (comment.cookie && comment.cookie === cookie) {
            comment.obsolete = true;
        }
    });
};

module.exports = mongoose.model('Note', noteSchema);
module.exports = mongoose.model('Question', questionSchema);