const payment = require("./models/payment");
const { writeData, writePaymentData, isAdmin } = require("./readFromSheet.js");

// Load config
require("dotenv").config({ path: "./config/config.env" });

module.exports = { // event functions ===================================================================================================================================
    findAllEvents: async function (req) {
        const events = require("./models/event");

        let eventList = await events.find({}).lean();
        return eventList;
    },
    findEvent: async function (params) {
        const eventTable = require("./models/event");
        const event = await eventTable.findOne({ name: params }).lean();
        return event;
    },// user functions ===================================================================================================================================
    userDetails: async function (user) {
        const userTable = require("./models/user");
        const userDetail = await userTable.findOne({ googleId: user.googleId });
        return userDetail;
    },
    findUserById: async function (user_id) {
        const userTable = require("./models/user");
        const userDetail = await userTable.findOne({ _id: user_id });

        return userDetail;
    },
    isRegisteredforEvent: async function (user, event) {

        const userTable = require("./models/user");

        let checker = false;
        if (event && user) {
            const userDetail = await userTable.findOne({ googleId: user.googleId });
            const registeredTeams = userDetail.teams;
            for (let i = 0; i < registeredTeams.length; i++) {
                if (registeredTeams[i].eventId.toString() == event._id.toString())
                    checker = true;
            }
        }
        return checker;
    },
    checkAtheleticEvents: async function (user, event) {
        const userTable = require("./models/user");

        let checker = false;
        if (event && user) {
            const userDetail = await userTable.findOne({ googleId: user.googleId });

            if (userDetail) {
                const registeredTeams = userDetail.teams;
                let count = 0;

                for (let i = 0; i < registeredTeams.length; i++) {
                    let currentEvent = await module.exports.findEventById(registeredTeams[i].eventId);
                    if (currentEvent.eventType === "atheletic")
                        count++;
                }

                if (count === 3)
                    checker = true;

            }
        }
        return checker;
    },
    findUserTeams: async function (user) {
        const userDetail = await module.exports.userDetails(user);

        let teams = [];
        if (userDetail) {
            const userTeams = userDetail.teams;
            for (let i = 0; i < userTeams.length; i++) {
                let team = await module.exports.findTeamById(userTeams[i].teamId)
                if (team) {
                    let event = await module.exports.findEventById(team.event);
                    team.eventName = event.name;
                    teams.push(team);
                }
            }
        }
        return teams;

    },
    findAllPendingPayments: async function (user) {
        const teamTable = require("./models/team");


        let payments = [];
        const userDetail = await module.exports.userDetails(user);

        if (userDetail) {
            const teams = userDetail.teams;
            // check the hospitality fees is paid or not    



            if (userDetail.paymentStatus == 0) {
                payments.push({ paymentType: "user", amount: Number(process.env.AMOUNT), id: userDetail._id });
            }

            // check the teams fees, for the teams whose team leader is current user

            for (let i = 0; i < teams.length; i++) {
                let team = await teamTable.findOne({ _id: teams[i].teamId });
                if (team && team.teamLeader.toString() == userDetail._id.toString() && team.paymentStatus == 0) {
                    let event = await module.exports.findEventById(teams[i].eventId);
                    payments.push({ paymentType: "team", amount: event.fees, id: team._id, eventName: event.name, image: event.event_image });
                }
            }
        }

        return payments;
    },
    updateUsersPhone: async function (user, phone) {
        const userTable = require("./models/user");
        await userTable.updateOne({ googleId: user.googleId }, { $set: { phoneNumber: phone } });
    },
    updateUsersCollege: async function (user, college) {
        const userTable = require("./models/user");
        await userTable.updateOne({ googleId: user.googleId }, { $set: { college: college } });
    },
    // team functions ===================================================================================================================================
    createTeam: async function (req, event) {
        const userTable = require("./models/user");
        const teamTable = require("./models/team");
        const eventTable = require("./models/event")
        const userDetail = await userTable.findOne({ googleId: req.user.googleId });
        const { TeamName } = req.body;

        // check if the hospitality fees paid or not -- this validation is removed now

        // if (userDetail && userDetail.paymentStatus == 0) {
        //     return "Sorry, you can't create a team before submitting accomadation charges!";
        // }

        // check the validation that is the user registered for the event or not

        if (event && userDetail) {
            let checker = (await module.exports.isRegisteredforEvent(req.user, event)) || (await module.exports.checkAtheleticEvents(req.user, event));

            if (checker) {
                return "You are already registered for this event";
            }

            // check any team with this name is already existing or not

            const existingTeam = await teamTable.findOne({ name: TeamName });

            if (existingTeam) {
                return "Team with team-name already exists!";
            }


            // validation is done

            // creating a new entry in team table
            var newteam = new teamTable({
                event: event._id,
                name: TeamName,
                teamLeader: userDetail._id,
                college: req.body.college,
            });

            newteam.save(function (err) {
                if (err) {
                    console.log(err.errors);
                }
            });

            // updating the team id of the leader
            await userTable.updateOne({ googleId: userDetail.googleId }, { $push: { teams: { teamId: newteam._id, eventId: event._id } } });
            await module.exports.updateUsersPhone(req.user, req.body.phone);
            await module.exports.updateUsersCollege(req.user, req.body.college);

            return "Team created successfully!";
        }
        return "Sorry, unable to create team at this moment";
    },
    findEventById: async function (eventId) {
        const eventTable = require("./models/event");
        const eventDetail = await eventTable.findOne({ _id: eventId });
        return eventDetail;
    },
    joinTeam: async function (teamId, req) {
        const teamTable = require("./models/team");
        const userTable = require("./models/user");
        const eventTable = require("./models/event")


        if (teamId && req) {
            let teamDetail = null;
            try {
                teamDetail = await teamTable.findOne({ _id: teamId });
            }
            catch (err) {
                return "Invalid Team Id";
            }
            const userDetail = await userTable.findOne({ googleId: req.user.googleId });


            if (teamDetail) {
                const eventDetail = await module.exports.findEventById(teamDetail.event);

                // this validation is removed now
                // if (userDetail && userDetail.paymentStatus == 0) {
                //     return "Sorry, you can't join a team before submitting accomodation charges."
                // }

                // validtion of team id
                if (teamDetail == null || userDetail == null || eventDetail == null) {
                    return "Invalid Details";
                }

                // validation for already registered user or not
                let checker = (await module.exports.isRegisteredforEvent(req.user, eventDetail)) || (await module.exports.checkAtheleticEvents(req.user, eventDetail));

                if (checker) {
                    return "You are already registered for this event!";
                }

                // first we have to check this team is full or not
                let maxTeamsize = eventDetail.teamSize;
                let currentTeamSize = teamDetail.members.length;

                if (maxTeamsize > currentTeamSize + 1) {
                    await userTable.updateOne({ googleId: userDetail.googleId }, { $push: { teams: { teamId: teamId, eventId: eventDetail._id } } });
                    await teamTable.updateOne({ _id: teamId }, { $push: { members: { member_id: userDetail._id } } });
                    await module.exports.updateUsersPhone(req.user, req.body.phone);
                    await module.exports.updateUsersCollege(req.user, req.body.college);
                    return "Team joined successfully!"
                }
                else {
                    return "Team already full!";
                }
            }
        }
        else {
            return "Invaild Team ID";
        }
    },
    findTeamById: async function (teamId) {
        const teamTable = require("./models/team");
        let teamDetail = await teamTable.findOne({ _id: teamId });
        const event = await module.exports.findEventById(teamDetail.event);
        teamDetail.eventName = event.name;
        // console.log(teamDetail);
        return teamDetail;
    },
    findAllMembersOfTeam: async function (team) {

        if (team) {
            const mems = team.members;
            const memberDetails = []
            for (let i = 0; i < mems.length; i++) {
                let member = await module.exports.findUserById(mems[i].member_id);
                if (member) {
                    memberDetails.push(await module.exports.findUserById(mems[i].member_id));
                }
            }

            return memberDetails;
        }

    },
    // delete a member of team
    deleteTeamMember: async function (teamId, memberId, user) {
        const teamTable = require("./models/team");
        const userTable = require("./models/user");

        const teamDetail = await teamTable.findOne({ _id: teamId });
        const userDetail = await userTable.findOne({ _id: memberId });
        const currentUser = await module.exports.userDetails(user);

        if (teamDetail && userDetail && (teamDetail.teamLeader.toString() == currentUser._id.toString())) {
            // delete this members team from user table

            for (let i = 0; i < userDetail.teams.length; i++) {
                if (userDetail.teams[i].teamId == teamId) {
                    userDetail.teams.splice(i, 1);
                }
            }

            await userDetail.save();
            // remove this user from teamMembers list

            for (let i = 0; i < teamDetail.members.length; i++) {
                if (teamDetail.members[i].member_id == memberId) {
                    teamDetail.members.splice(i, 1);
                }
            }

            await teamDetail.save();

            return true;
        }

        return false;
    },
    deleteTeam: async function (teamId, user) {
        const teamTable = require("./models/team");


        const teamDetail = await teamTable.findOne({ _id: teamId });
        console.log(user);
        const userDetail = await module.exports.userDetails(user);

        if (userDetail && teamDetail && (teamDetail.teamLeader.toString() == userDetail._id.toString())) {
            if (teamDetail.paymentStatus == 0) {
                // remove all the members from team
                for (let i = 0; i < teamDetail.members.length; i++) {
                    await module.exports.deleteTeamMember(teamId, teamDetail.members[i].member_id, user);
                }

                // remove the leader from the team

                for (let i = 0; i < userDetail.teams.length; i++) {
                    if (userDetail.teams[i].teamId == teamId) {
                        userDetail.teams.splice(i, 1);
                    }
                }

                await userDetail.save();

                // delete the team from team database

                await teamTable.deleteOne({ _id: teamId });

                return true;
            }

            return false;
        }
        else
            return false;
    },
    findAllTeamsVerification: async function (req) {
        const teamTable = require("./models/team");
        let teams = await teamTable.find({}).lean();

        for (let i = 0; i < teams.length; i++) {
            teams[i].event = await module.exports.findEventById(teams[i].event);
            teams[i].teamLeader = await module.exports.findUserById(teams[i].teamLeader);
        }

        return teams;

    },
    findAllUsersVerification: async function (req) {
        const userTable = require("./models/user");
        let users = await userTable.find({}).lean();
        return users;

    },
    updatePaymentStatus: async function (req, typ, status, id) {
        let checker = await isAdmin(req);
        if (!checker)
            return false;

        const userTable = require('./models/user');
        const teamTable = require('./models/team')
        if (typ == "team") {
            await teamTable.updateOne({ _id: id }, { paymentStatus: status });
            const team = await teamTable.findOne({ _id: id });

            var currentdate = new Date();
            var datetime = currentdate.getDate() + "/"
                + (currentdate.getMonth() + 1) + "/"
                + currentdate.getFullYear() + " @ "
                + currentdate.getHours() + ":"
                + currentdate.getMinutes() + ":"
                + currentdate.getSeconds();
            eventName = await module.exports.findEventById(team.event);
            await writePaymentData(['team', (team.name).toString(), eventName.fees.toString(), datetime, (team.college).toString(), req.user.email]);
        }
        else {
            await userTable.updateOne({ _id: id }, { paymentStatus: status });
            const user = await userTable.findOne({ _id: id });
            await writePaymentData(['user', user.firstName, 1700, Date.now(), user.college, req.user.email]);
        }

    },
    // heads
    findAllHeads: async function () {
        const headTable = require("./models/heads")
        const heads = await headTable.find({}).lean();

        heads.sort(function (a, b) {
            return parseInt(a.order) > parseInt(b.order) ? 1 : -1;
        });
        return heads;
    },
    refactorHeads: function (headsData) {
        let heads = {}
        for (let i = 0; i < headsData.length; i++) {
            if (heads.hasOwnProperty(headsData[i].title)) {
                heads[headsData[i].title].push(headsData[i]);
            } else {
                heads[headsData[i].title] = [];
                i--;
            }
        }
        return heads;
    }
};