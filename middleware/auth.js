require("dotenv").config({ path: "../config/config.env" });
const { findAllAdmins } = require("../readFromSheet.js");

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
    adminCheck: async function (req, res, next) {
        const admins = await findAllAdmins();
        if (process.env.NODE_ENV == "development")
            return next();
        else {
            // check if current user is admin
            let admin = false;
            for (let i = 0; i < admins.length; i++) {
                if (admins[i][0] == req.user.email)
                    admin = true;
            }

            if (admin)
                return next();
            else
                res.redirect("/");
        }
    }
}