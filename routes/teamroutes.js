const { application } = require("express");
const { findAllEvents, findEvent, isRegisteredforEvent, createTeam, joinTeam, findTeamById, findAllMembersOfTeam, userDetails, findUserById, deleteTeamMember, deleteTeam } = require("../utils.js");
const { authCheck, liveCheck } = require("../middleware/auth");
const { isAdmin } = require("../readFromSheet.js");

const router = require("express").Router();

router.get("/team", [authCheck, liveCheck], async (req, res) => {
    const teamId = req.query.teamId;
    const teamDetail = await findTeamById(teamId);

    if (teamDetail == null) {
        res.send("No such team found!");
        return;
    }

    const members = await findAllMembersOfTeam(teamDetail);
    const teamLeader = await findUserById(teamDetail.teamLeader);

    const context = {
        team: teamDetail,
        teamMembers: members,
        leader: teamLeader,
        user: req.user,
        authenticated: req.isAuthenticated(),
        admin: await isAdmin(req)
    }
    res.render("teampage", context);
})

router.post("/team/deleteMember", [authCheck, liveCheck], async (req, res) => {
    const teamId = req.body.teamId;
    const memberId = req.body.memberId;

    let checker = await deleteTeamMember(teamId, memberId, req.user);

    if (checker)
        req.flash("message", "Member removed successfully");
    else
        req.flash("message", "Sorry, something went wrong");
    res.redirect("/profile");
})

router.post("/team/deleteTeam", [authCheck, liveCheck], async (req, res) => {
    const teamId = req.body.teamId;
    let checker = await deleteTeam(teamId, req.user);

    if (checker)
        req.flash("message", "Team deleted successfully");
    else
        req.flash("message", "Sorry, something went wrong");
    res.redirect("/profile");
})
module.exports = router