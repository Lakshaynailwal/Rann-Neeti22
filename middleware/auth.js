require("dotenv").config({ path: "../config/config.env" });

module.exports = {
    authCheck: function (req, res, next) {
        if (!req.user) {
            req.session.returnTo = req.originalUrl;
            res.redirect("/auth/google");
        } else {
            req.session.user = req.user;
            req.session.returnTo = req.originalUrl;
            return next();
        }
    },
    liveCheck: function (req, res, next) {
        return next();
    },
    adminCheck: function (req, res, next) {
        res.redirect("/");
    }
}