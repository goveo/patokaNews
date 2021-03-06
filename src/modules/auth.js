const cookieParser = require('cookie-parser');
const session = require('express-session');
const crypto = require('crypto');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const db = require('./database');

const serverSalt = "oZlAprrO5f";

function sha512(password) {
    const hash = crypto.createHmac('sha512', serverSalt);
    hash.update(password);
    const value = hash.digest('hex');
    return {
        passwordHash: value
    };
};

function serializeUser(user, done) {
    done(null, user.id);
};

function deserializeUser(id, done) {
    db.getById(id)
        .then(user => {
            done(user ? null : 'No user', user);
        })
        .catch(err => { });
};

function checkAuth(req, res, next) {
    if (!req.user) {
        return res.render('errorPage', {
            user: undefined,
            error_code: 401,
            error_message: `You are not authorized, go on login page and do it or create an account if you don't have one`,
            visit: false
        });
    }
    next();
}

const Strategy = new LocalStrategy(
    function (username, password, done) {
        let hash = sha512(password).passwordHash;
        console.log('hash:', hash)
        db.getUserByPassHash(username, hash)
            .then(user => {
                if (!user) {
                    console.log('no user');
                    done(null, false);
                }
                console.log(user);
                done(null, user);
            })
            .catch(err => {
                console.log(err);
            })
    }
)

module.exports = {
    sha512: sha512,
    checkAuth: checkAuth,
    serializeUser: serializeUser,
    deserializeUser: deserializeUser,
    Strategy: Strategy
}