// models/DigitalMarketingPlan.js
const mongoose = require('mongoose');

const digitalMarketingPlanSchema = new mongoose.Schema({
    planName: {
        type: String,
        required: true,
        unique: true
    },
    durations: [
        {
            duration: {
                type: String,
                required: true
            },
            price: {
                type: Number,
                required: true
            }
        }
    ],
    features: {
        type: [String],
        default: []
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

const DigitalMarketingPlan = mongoose.model('DigitalMarketingPlan', digitalMarketingPlanSchema);

module.exports = DigitalMarketingPlan;