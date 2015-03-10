module.exports = {

    db: process.env.MONGODB || 'mongodb://localhost:27017/sparkr',

    sessionSecret: process.env.SESSION_SECRET || 'h0hjsutszKo96NbdRNQg',

    sparksMaxVoteCount: process.env.SPARKS_MAX_VOTE_COUNT || 3,

    sendgrid: {
        user: process.env.SENDGRID_USER || 'dsanel',
        password: process.env.SENDGRID_PASSWORD || 'VeryStrongPassword'
    },

    facebook: {
        clientID: process.env.FACEBOOK_ID || '742598065787544',
        clientSecret: process.env.FACEBOOK_SECRET || '20b77ad650a34bcf923730392da22b7c',
        callbackURL: '/auth/facebook/callback',
        passReqToCallback: true
    },

    twitter: {
        consumerKey: process.env.TWITTER_KEY || 'krXUQ4TNETB2DbkvMVr5K7ry1',
        consumerSecret: process.env.TWITTER_SECRET  || 'jvnPGXw72khkZh0DykMlkmM9qg4VOrlr0uRqNwEew9Xoi91neG',
        callbackURL: '/auth/twitter/callback',
        passReqToCallback: true
    }
};
