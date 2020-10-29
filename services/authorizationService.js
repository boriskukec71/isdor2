const adminPaths = [{path: 'app-user-access-logs', methods: ['GET']}, {path: 'app-users', methods :['PUT', 'POST', 'DELETE']}];

function auathorizeUser(req, res, next) {
    // Gather the jwt access token from the request header
    const { role } = req.user.role;
    // TODO check admin paths
    next();
}

module.exports = {
    auathorizeUser: auathorizeUser
};