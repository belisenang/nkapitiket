// controllers/dash/payout.controller.js
const service = require("../../services/dash/payout.service");
const { CreatorBankAccounts, User } = require("../../../models");
const bcrypt = require("../../../utils/bcrypt");
module.exports = {

    async dashboard(req, res) {
        
        try {
            const creator_id = req.user.creator_id;
            const { range = 30 } = req.query;
            const data = await service.getDashboard(creator_id, range);

            res.json({ success: true, data });
            
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },

    async history(req, res) {
        try {
            const creator_id = req.user.creator_id;
            const data = await service.getPayoutHistory(creator_id);

            res.json({ success: true, data });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },

    async create(req, res) {

        try {

            const creator_id =
                req.user.creator_id;

            const userId =
                req.user.id;

            const {

                amount,
                password

            } = req.body;


            const user =
                await User.findByPk(
                    userId
                );


            const valid =
                await bcrypt.compare(
                    password,
                    user.password_hash
                );


            if (!valid)
                return res
                    .status(401)
                    .json({

                        success: false,

                        message:
                            "Password salah"

                    });


            const io =
                req.app.get("io");


            const payout =
                await service.createPayout(

                    creator_id,

                    amount,

                    io

                );


            res.json({

                success: true,

                data: payout

            });

        }
        catch (err) {

            res.status(400).json({

                success: false,

                message: err.message

            });

        }

    },

    async bankInfo(req, res) {
        const creator_id = req.user.creator_id;
        const bank = await CreatorBankAccounts.findOne({ where: { creator_id } });

        res.json({ success: true, data: bank || null });
    },

    // Get Creator Finance Setting by Creator ID
    async getCreatorFinanceSetting(req, res) {
        try {
            const creatorFinanceSetting = await CreatorFinanceSettings.findOne({
                where: { creator_id: req.params.creator_id },
            });

            if (!creatorFinanceSetting) {
                return res.status(404).json({ success: false, message: "Finance setting not found" });
            }

            res.json({ success: true, data: creatorFinanceSetting });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    // Update Creator Finance Setting
    async updateCreatorFinanceSetting(req, res) {
        try {
            const { admin_fee_type, admin_fee_value } = req.body;
            const creatorFinanceSetting = await CreatorFinanceSettings.update(
                { admin_fee_type, admin_fee_value },
                { where: { creator_id: req.params.creator_id } }
            );

            if (creatorFinanceSetting[0] === 0) {
                return res.status(404).json({ success: false, message: "Creator finance setting not found" });
            }

            res.json({ success: true, message: "Finance setting updated successfully" });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    // Get System Finance Setting
    async getSystemFinanceSetting(req, res) {
        try {
            const systemFinanceSetting = await SystemFinanceSettings.findOne();

            if (!systemFinanceSetting) {
                return res.status(404).json({ success: false, message: "System finance setting not found" });
            }

            res.json({ success: true, data: systemFinanceSetting });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    // Update System Finance Setting
    async updateSystemFinanceSetting(req, res) {
        try {
            const { tax_rate, service_tax_rate } = req.body;
            const systemFinanceSetting = await SystemFinanceSettings.update(
                { tax_rate, service_tax_rate },
                { where: {} }
            );

            if (systemFinanceSetting[0] === 0) {
                return res.status(404).json({ success: false, message: "System finance setting not found" });
            }

            res.json({ success: true, message: "System finance setting updated successfully" });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    async verifyPassword(req, res) {

        try {

            const userId =
                req.user.id;

            const { password } =
                req.body;

            const user =
                await User.findByPk(
                    userId
                );

            if (!user)
                throw new Error(
                    "User not found"
                );

            const match =
                await bcrypt.compare(
                    password,
                    user.password_hash
                );

            if (!match)
                return res
                    .status(401)
                    .json({

                        success: false,

                        message:
                            "Password salah"

                    });

            res.json({

                success: true,

                message: "Password valid"

            });

        }
        catch (err) {

            res.status(400).json({

                success: false,

                message: err.message

            });

        }

    }
};