const { userDetails, findTeamById, findUserTeams } = require("../utils")

const router = require("express").Router();

router.get("/profile", async (req, res) => {

    const userDetail = await userDetails(req.user);
    const userTeams = await findUserTeams(req.user);

    context = {
        user: userDetail,
        teams: userTeams
    }
    // users team
    res.render("profile", context);
})


module.exports = router