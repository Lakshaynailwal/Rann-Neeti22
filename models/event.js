const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema(
    {
        name:
        {
            type: String,
            required: true,
        },
        content:
        {
            type: String,
            required: true,
        },
        event_image:
        {
            type: String,
            required: true,
        },
        rulebook_link:
        {
            type: String,
            required: true,
        },
        fixture_link:
        {
            type: String,
        },
        eventCoordinator:
        {
            name:
            {
                type: String,
            },
            phone:
            {
                type: String,
            },
        },
        fees:
        {
            type: Number,
            required: true,
        },
        womenFees:
        {
            type: Number,
        },
        duration:
        {
            hours:
            {
                type: Number
            },
            minutes:
            {
                type: Number,
            }
        },
        venue:
        {
            type: String,
            required: true,
        },
        eventType:
        {
            type: String,
        },
        teamSize: {
            type: Number,
            required: true
        },
        genderSpecific: {
            type: Boolean,
            default: false,
        }
    }
);

module.exports = mongoose.model("events", EventSchema);