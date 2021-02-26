const adminPaths = [
    {path: 'app-user-access-logs', methods: ['GET']}, 
    {path: 'app-users', methods :['GET', 'PUT', 'POST', 'DELETE']}
];

function authorizeUser(req, res, next) {
    const { role } = req.user.role;
    // TODO check admin paths
    next();
}

module.exports = {
    authorizeUser: authorizeUser
};