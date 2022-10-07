const { userDetails, findTeamById, findUserTeams, findAllHeads, convertArrayToObject, refactorHeads, findAllEvents } = require("../utils")
const { authCheck, liveCheck, adminCheck } = require("../middleware/auth");
const router = require("express").Router();

router.get("/profile", [authCheck, liveCheck], async (req, res) => {

    const userDetail = await userDetails(req.user);
    const userTeams = await findUserTeams(req.user);

    context = {
        user: userDetail,
        teams: userTeams,
        authenticated: req.isAuthenticated(),
        message: req.flash("message")
    }
    // users team
    res.render("profile", context);
})

router.get("/ourteam", async (req, res) => {
    const headsData = await findAllHeads();

    let heads = refactorHeads(headsData);

    const context = {
        authenticated: req.isAuthenticated(),
        headTitles: heads
    }

    res.render('ourteam.ejs', context);
})

router.get("/gallery", async (req, res) => {
    const context = {
        authenticated: req.isAuthenticated(),
    }
    res.render('gallery.ejs', context)
})
router.get("/verify", [authCheck, adminCheck], async (req, res) => {
    const context = {
        authenticated: req.isAuthenticated(),
    }
    res.render('verify.ejs', context)
})

router.get("/rulebooks", async (req, res) => {
    const context = {
        authenticated: req.isAuthenticated(),
        events: await findAllEvents()
    }
    res.render('table.ejs', context);
})


module.exports = router