const { userDetails, findTeamById, findUserTeams, findAllHeads, convertArrayToObject, refactorHeads } = require("../utils")
const { authCheck, liveCheck } = require("../middleware/auth");
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
router.get("/table", async (req, res) => {
    res.render('table.ejs', { authenticated: req.isAuthenticated() });
})


module.exports = router