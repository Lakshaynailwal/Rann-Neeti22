// Imports
var express = require("express");
var router = express.Router();

const Razorpay = require("razorpay");
const xid = require('xid-js');
const PaymentDetail = require("../models/payment");
const UserDetail = require("../models/user");
const teamTable = require("../models/team");
const { findAllPendingPayments, findTeamById, findEventById, findEvent, findUserById } = require("../utils");
const { authCheck, liveCheck } = require("../middleware/auth");
const { isAdmin } = require("../readFromSheet.js")
const payment = require("../models/payment");


// Load config
require("dotenv").config({ path: "./config/config.env" });

// Create an instance of Razorpay
let razorPayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Payment Page
 * button on the navbar, onclick will show the pending payment page
 */
router.get("/", [authCheck, liveCheck], async function (req, res, next) {
    const payments = await findAllPendingPayments(req.user);
    const userDetail = await findUserById(req.user._id);
    const context = {
        authenticated: req.isAuthenticated(),
        payments: payments,
        admin: await isAdmin(req),
        userDetail: userDetail
    }
    res.render("payment", context);
});

/**
 * Checkout Page
 * each button "Pay" will be lead to this post request 
 */
router.post("/order", [authCheck, liveCheck], async function (req, res, next) {
    // console.log("inside /order");
    const paymentType = req.body.paymentType;
    const id = req.body.id;

    let amt = process.env.AMOUNT;
    if (paymentType == "team") {
        const teamDetail = await findTeamById(id);
        const eventDetail = await findEventById(teamDetail.event);
        amt = eventDetail.fees;
    }

    params = {
        amount: amt * 100,
        currency: "INR",
        receipt: xid.next(),
        payment_capture: "1",
    };
    razorPayInstance.orders
        .create(params)
        .then(async (response) => {
            const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
            // Save orderId and other payment details
            const paymentDetail = new PaymentDetail({
                orderId: response.id,
                receiptId: response.receipt,
                amount: response.amount,
                currency: response.currency,
                createdAt: response.created_at,
                status: response.status,
            });
            try {
                // Render Order Confirmation page if saved succesfully

                const context = {
                    title: "Confirm Order",
                    razorpayKeyId: razorpayKeyId,
                    paymentDetail: paymentDetail,
                    id: req.body.id,
                    paymentType: req.body.paymentType,
                }


                await paymentDetail.save();
                res.render("checkout", context);
            } catch (err) {
                // Throw err if failed to save
                if (err) throw err;
            }
        })
        .catch((err) => {
            // Throw err if failed to create order
            if (err) throw err;
        });
});



/**
 * Verify Payment
 * 
 */
router.post("/verify", [authCheck, liveCheck], async function (req, res, next) {
    body = req.body.razorpay_order_id + "|" + req.body.razorpay_payment_id;
    let paymentType = req.body.paymentType;
    let id = req.body.id;

    let crypto = require("crypto");
    let expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest("hex");

    // Compare the signatures
    if (expectedSignature === req.body.razorpay_signature) {
        // if same, then find the previosuly stored record using orderId,
        // and update paymentId and signature, and set status to paid.

        if (paymentType == "team") {
            // update in team table
            var updatedTeam = await teamTable.updateOne({ _id: id }, { paymentStatus: 1 });
        }
        else {
            // update in user table
            var userUpdated = await UserDetail.updateOne({ _id: id }, { paymentStatus: 1 });
        }


        PaymentDetail.findOneAndUpdate(
            { orderId: req.body.razorpay_order_id },
            {
                paymentId: req.body.razorpay_payment_id,
                signature: req.body.razorpay_signature,
                status: "paid",
            },
            { new: true },
            function (err, doc) {
                // Throw er if failed to save
                if (err) {
                    throw err;
                }
                // Render payment success page, if saved succeffully
                req.flash("message", "Payment successfull");
                res.redirect("/");
            }
        );
    } else {
        req.flash("message", "Sorry, unable to make payment");
        res.redirect("/");
    }
});

module.exports = router;