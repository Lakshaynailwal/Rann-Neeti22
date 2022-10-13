const express = require("express")
const mongoose = require("mongoose")
const session = require("express-session")
const events = require("./models/event.js")
const users = require("./models/user.js")
const Faqs = require("./models/faq.js");
const port = process.env.PORT || 5000;
const { authCheck } = require("./middleware/auth");
const authRoutes = require("./routes/authroutes");
const eventRoutes = require("./routes/eventroutes");
const navRoutes = require("./routes/navroutes");
const teamRoutes = require("./routes/teamroutes");
const paymentRoutes = require("./routes/paymentroutes");
const path = require("path")
const passport = require("passport")
const bodyParser = require("body-parser")
const connectDB = require("./config/db");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const { findAllNotices, isAdmin } = require("./readFromSheet.js")
// Load config
require("dotenv").config({ path: "./config/config.env" });

// Passport Config
require("./config/passport")(passport);


const app = express();


connectDB();

// Sessions middleware
app.use(
    session({
        secret: process.env.SECRET,
        resave: false,
        saveUninitialized: true,
        store: MongoStore.create({ mongoUrl: process.env.MONGO_DATABASE_URI }),
    })
);

// Configure bodyParser
app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);
// set template view engine
app.set("views", "./templates");
app.set("view engine", "ejs");

app.use(express.static(__dirname + "/static"));
app.use("/images", express.static(__dirname + "static/images"));

app.use(function (req, res, next) {
    if (!req.user) {
        res.header(
            "Cache-Control",
            "private, no-cache, no-store, must-revalidate"
        );
        res.header("Expires", "-1");
        res.header("Pragma", "no-cache");
    }
    next();
});



// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

// Routes
app.use("/auth", authRoutes);
app.use("/events", eventRoutes);
app.use("/", navRoutes);
app.use("/", teamRoutes);
app.use("/payment", paymentRoutes);

app.get("/", async (req, res) => {
    const message = req.flash("message");
    const faqs = await Faqs.find({}).lean();
    const context = {
        authenticated: req.isAuthenticated(),
        message: message,
        faqs: faqs,
        notices: await findAllNotices(),
        admin: await isAdmin(req)
    }
    res.render("index", context);
    req.flash("message", "");
})


app.get("*", function (req, res) {
    res.status(404).send("<h1> Not Found! </h1>")
})



app.listen(port, (err) => {
    if (err) throw err;
    console.log("Connection done!");
})