'use strict';

/**
 * Module dependencies.
 */

var express = require('express');
var cookieParser = require('cookie-parser');
var compress = require('compression');
var session = require('express-session');
var bodyParser = require('body-parser');
var logger = require('morgan');
var errorHandler = require('errorhandler');
var csrf = require('lusca').csrf();
var methodOverride = require('method-override');
var favicon = require('serve-favicon');

var _ = require('lodash');
var MongoStore = require('connect-mongo')({ session: session });
var flash = require('express-flash');
var path = require('path');
var mongoose = require('mongoose');
var passport = require('passport');
var expressValidator = require('express-validator');
var connectAssets = require('connect-assets');

/**
 * Controllers (route handlers).
 */

var homeController = require('./controllers/home');
var userController = require('./controllers/user');
var contactController = require('./controllers/contact');
var pollController = require('./controllers/poll');


/**
 * API keys and Passport configuration.
 */

var secrets = require('./config/secrets');
var passportConf = require('./config/passport');

/**
 * Create Express server.
 */

var app = express();

/**
 * Connect to MongoDB.
 */

mongoose.connect(secrets.db);
mongoose.connection.on('error', function () {
    console.error('MongoDB Connection Error. Make sure MongoDB is running.');
});

var hour = 3600000;
var day = hour * 24;
var week = day * 7;

/**
 * CSRF whitelist.
 */

var csrfExclude = ['/vote', '/comment', '/commentVote', '/note', '/spark', '/sparkvote'];

/**
 * Express configuration.
 */

app.use(favicon(__dirname + '/public/favicon.ico'));
app.set('port', process.env.PORT || 3210);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(compress());
app.use(connectAssets({
    paths: [path.join(__dirname, 'public/css'), path.join(__dirname, 'public/js')],
    helperContext: app.locals
}));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressValidator());
app.use(methodOverride());
app.use(cookieParser(secrets.sessionSecret));
app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: secrets.sessionSecret,
    store: new MongoStore({
        url: secrets.db,
        auto_reconnect: true
    })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(function (req, res, next) {
    // CSRF protection.
    if (_.contains(csrfExclude, req.path)) {
        return next();
    }
    csrf(req, res, next);
});
app.use(function (req, res, next) {
    // Make user object available in templates.
    res.locals.user = req.user;
    // Make Moment.js library available in templates
    app.locals.moment = require('moment');
    // Numeral.js - library for formatting and manipulating numbers.
    app.locals.numeral = require('numeral');
    next();
});
app.use(function (req, res, next) {
    // Remember original destination before login.
    var path = req.path.split('/')[1];
    if (/auth|images|login|logout|signup|fonts|favicon/i.test(path)) {
        return next();
    }
    req.session.returnTo = req.path;
    next();
});
app.use(express.static(path.join(__dirname, 'public'), { maxAge: week }));

/**
 * Main routes.
 */

app.get('/', homeController.index);
app.get('/about', homeController.about);
app.get('/login', userController.getLogin);
app.post('/login', userController.postLogin);
app.post('/loginWidget', userController.postLoginWidget);
app.get('/logout', userController.logout);
app.get('/forgot', userController.getForgot);
app.post('/forgot', userController.postForgot);
app.get('/reset/:token', userController.getReset);
app.post('/reset/:token', userController.postReset);
app.get('/signup', userController.getSignup);
app.post('/signup', userController.postSignup);
app.get('/contact', contactController.getContact);
app.post('/contact', contactController.postContact);
app.get('/account', passportConf.isAuthenticated, userController.getAccount);
app.post('/account/profile', passportConf.isAuthenticated, userController.postUpdateProfile);
app.post('/account/password', passportConf.isAuthenticated, userController.postUpdatePassword);
app.post('/account/delete', passportConf.isAuthenticated, userController.postDeleteAccount);
app.get('/account/unlink/:provider', passportConf.isAuthenticated, userController.getOauthUnlink);

/**
 * OAuth sign-in routes.
 */

app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));
app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login' }), function (req, res) {
    if (req.session.widget) {
        res.redirect('/widget/callback');
    } else {
        res.redirect(req.session.returnTo || '/');
    }
});
app.get('/auth/twitter', passport.authenticate('twitter'));
app.get('/auth/twitter/callback', passport.authenticate('twitter', { failureRedirect: '/login' }), function (req, res) {
    if (req.session.widget) {
        res.redirect('/widget/callback');
    } else {
        res.redirect(req.session.returnTo || '/');
    }
});

app.get('/polls', passportConf.isAuthenticated, pollController.polls);
app.get('/create', passportConf.isAuthenticated, pollController.createPoll);
app.post('/create', passportConf.isAuthenticated, pollController.postCreatePoll);

app.post('/vote', pollController.vote);
app.post('/comment', pollController.comment);
app.post('/commentVote', pollController.commentVote);

app.post('/note', pollController.note);
app.post('/spark', pollController.spark);
app.post('/sparkvote', pollController.sparkVote);

app.get('/w/:pollId', pollController.poll);
app.get('/w/:pollId/:questionId', pollController.poll);

app.get('/widget/callback', function (req, res, next) {
    res.render('widget/callback', {});
});

app.get('/widget/:pollId', function (req, res, next) {
    req.session.widget = true;

    res.render('widget/index', {
        url: req.protocol + '://' + req.get('host'),
        pollId: req.params.pollId
    });
});
app.get('/widget/:pollId/:questionId', pollController.poll);

app.get('/:pollId', pollController.poll);
app.get('/:pollId/:questionId', pollController.poll);

/**
 * 500 Error Handler.
 */

app.use(errorHandler());

/**
 * Start Express server.
 */

app.listen(app.get('port'), function () {
  console.log('Express server listening on port %d in %s mode', app.get('port'), app.get('env'));
});

module.exports = app;