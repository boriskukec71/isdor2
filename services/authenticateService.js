const jwt = require('jsonwebtoken');
var AppUsers = require('../models/appUserModel');
var config = require('../isidorConfig.js');
const logger = require('../log4js-config').getLogger('authenticateService');
const bcrypt = require('bcrypt');

function authenticateToken(req, res, next) {
    // Gather the jwt access token from the request header
    const token = req.headers['authorization']
    if (!token) {
        logger.error('[' + req.correlationId() + '] No authorization token!');
        return res.sendStatus(401);
    } // if there isn't any token

    jwt.verify(token, config.jwtSecretKey, (err, user) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                logger.debug('[' + req.correlationId() + '] Token expired! ');
                return res.sendStatus(498);    
            }
            logger.debug('[' + req.correlationId() + '] Authenticating error! ', err);
            return res.sendStatus(403);
        }
        //logger.debug('[' + req.correlationId() + '] Successfully loged in : ' + user);
        req.user = user
        next(); 
    })
}


function logIn(req, res) {
    var username = req.body.username || '';
    var password = req.body.password || '';
    if (username == '' || password == '') {
        res.status(401).end();
        return;
    }

    // Fire a query to your DB and check if the credentials are valid
    validate(username, password, res);
}

function validate(username, password, res) {
    AppUsers.findOne({ username: username, status: "active" }, function (err, appUser) {
        if (!appUser) {
            res.status(401).end();
            return;
        }
        bcrypt.compare(password, appUser.password).then((isSame) => {
            if (!isSame) {
                res.status(401).end();
                return;
            }
            const token = genToken(appUser);
            const expiresAt = getExpiresAt(config.tokenExpiresIn);
            res.json({
                token: token,
                expiresAt: expiresAt,
                user: {
                    username: appUser.username,
                    role: appUser.role
                }
            });
        }).catch(() => {res.status(401).end();})
    })
}

// private method
function genToken(user) {
    const token = jwt.sign({ username: user.username, role: user.role }, config.jwtSecretKey, { expiresIn: config.tokenExpiresIn })

    return token;
}

/// delete
function getExpiresAt(expiresIn) {
    var date = new Date();
    return date.getTime() + expiresIn * 1000;
}

module.exports = {
    authenticateToken: authenticateToken,
    logIn: logIn
};