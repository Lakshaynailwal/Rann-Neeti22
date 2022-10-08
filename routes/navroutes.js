const { userDetails, findTeamById, findUserTeams, findAllHeads, convertArrayToObject, updateUnderTaking, refactorHeads, findAllEvents, findAllPendingPayments, findAllTeamsVerification, updatePaymentStatus, findAllUsersVerification } = require("../utils")
const { authCheck, liveCheck, adminCheck } = require("../middleware/auth");
const { isAdmin } = require("../readFromSheet.js")
const payment = require("../models/payment");
const router = require("express").Router();

router.get("/profile", [authCheck, liveCheck], async (req, res) => {

    const userDetail = await userDetails(req.user);
    const userTeams = await findUserTeams(req.user);

    context = {
        user: userDetail,
        teams: userTeams,
        authenticated: req.isAuthenticated(),
        message: req.flash("message"),
        admin: await isAdmin(req)
    }
    // users team
    res.render("profile", context);
})

router.get("/ourteam", async (req, res) => {
    const headsData = await findAllHeads();

    let heads = refactorHeads(headsData);

    const context = {
        authenticated: req.isAuthenticated(),
        headTitles: heads,
        admin: await isAdmin(req)
    }

    res.render('ourteam.ejs', context);
})

router.get("/gallery", async (req, res) => {
    const context = {
        authenticated: req.isAuthenticated(),
        admin: await isAdmin(req)
    }
    res.render('gallery.ejs', context)
})
router.get("/verify", [authCheck, adminCheck], async (req, res) => {
    const context = {
        authenticated: req.isAuthenticated(),
        teams: await findAllTeamsVerification(),
        users: await findAllUsersVerification(),
        admin: await isAdmin(req)
    }
    res.render('verify.ejs', context)
})

router.post("/verifyTeamPayment", [authCheck, adminCheck], async (req, res) => {
    const { teamId, status } = req.body;

    let paymentStatus = 0;
    if (status == "on")
        paymentStatus = 1;

    await updatePaymentStatus(req, "team", paymentStatus, teamId);
    res.redirect('/verify');
})

router.post("/verifyUserPayment", [authCheck, adminCheck], async (req, res) => {
    const { userId, status } = req.body;

    let paymentStatus = 0;
    if (status == "on")
        paymentStatus = 1;

    await updatePaymentStatus(req, "user", paymentStatus, userId);
    res.redirect('/verify');
})


router.get("/rulebooks", async (req, res) => {
    const context = {
        authenticated: req.isAuthenticated(),
        events: await findAllEvents(),
        admin: await isAdmin(req)
    }
    res.render('table.ejs', context);
})

router.post("/uploadUndertaking", async (req, res) => {
    const { undertaking } = req.body;
    let check = await updateUnderTaking(req, undertaking);
    req.flash("message", check);
    res.redirect(req.session.returnTo || "/");
})


module.exports = router