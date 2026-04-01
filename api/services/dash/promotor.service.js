const { User, Creator, CreatorUserMember, Role } = require("../../../models");
const bcrypt = require("bcrypt");
const ROLES = require("../../config/role");
const slugify = require("../../utils/slugify");
const { maskEmail } = require("../../../utils/maskEmail");
const { Op } = require("sequelize");
const { required } = require("joi");
module.exports = {

    async getPagination(creatorId, page, limit, search) {
        const offset = (page - 1) * limit;
        const where = {
            creator_id: creatorId
        };
        if (search) {
            where["$user.full_name$"] = { [Op.like]: `%${search}%` };
        }
        const { count, rows } = await CreatorUserMember.findAndCountAll({
            where,
            include: [
                {
                    model: User,
                    as: "user",
                    attributes: { exclude: ["password_hash"] }
                },
                {
                    model: Role,
                    as: "role",
                    attributes: ["id", "name"]
                }
            ],
            limit,
            offset,
            order: [["created_at", "ASC"]]
        });
        const data = rows.map(m => ({
            id: m.user.id,
            email: maskEmail(m.user.email),
            full_name: m.user.full_name,
            phone: m.user.phone,
            image: m.user.image ? process.env.MEDIA_URL_AUTH + m.user.image : null,
            is_active: m.user.is_active,
            role: m.role?.name
        }));
        return {
            data,
            pagination: {
                page,
                limit,
                total: count
            }
        };
    },

    async getAll(creatorId) {
        const members = await CreatorUserMember.findAll({
            where: { creator_id: creatorId },
            include: [
                {
                    model: User,
                    as: "user",
                    attributes: { exclude: ["password_hash"] }
                },
                {
                    model: Role,
                    attributes: ["id", "name"],
                    as: "role"
                }
            ]
        });

        return members.map(m => ({
            id: m.user.id,
            email: maskEmail(m.user.email),
            full_name: m.user.full_name,
            phone: m.user.phone,
            image: m.user.image,
            is_active: m.user.is_active,
            role: m.role?.name
        }));
    },

    async getOne(userId, creatorId) {
        const member = await CreatorUserMember.findOne({
            where: {
                user_id: userId,
                creator_id: creatorId
            },
            include: [
                {
                    model: User,
                    as: "user",
                    attributes: { exclude: ["password_hash"] }
                },
                {
                    model: Role,
                    as: "role"
                }
            ]
        });

        if (!member) {
            throw new Error("Promotor member not found");
        }
        const img = member.user.image ? process.env.MEDIA_URL_AUTH + member.user.image : null;

        return {
            id: member.user.id,
            email: member.user.email,
            full_name: member.user.full_name,
            phone: member.user.phone,
            image: img,
            is_active: member.user.is_active,
            role: member.role?.name
        };
    },

    async getScanStaff(creatorId) {
        const members = await CreatorUserMember.findAll({
            where: { creator_id: creatorId , role_id: ROLES.PROMOTOR_SCAN_STAFF_ID},
            required: true,
            include: [
                {
                    model: User,
                    as: "user",
                    attributes: { exclude: ["password_hash"] },
                    where: {is_active: true},
                    required: true,
                },
                {
                    model: Role,
                    attributes: ["id", "name"],
                    as: "role"
                }
            ]
        });

        return members.map(m => ({
            id: m.user.id,
            name: m.user.full_name,
        }));
    },

    async registerPromotor(data) {
        if (data.password !== data.confirm_password) {
            throw new Error("Password and confirm password do not match");
        }
        const existing = await User.findOne({ where: { email: data.email } });
        if (existing) {
            throw new Error("Email already registered");
        }

        const saltRounds = parseInt(process.env.BCRYPT_SALT) || 10;
        const password_hash = await bcrypt.hash(data.password, saltRounds);

        const user = await User.create({
            email: data.email,
            full_name: data.full_name,
            phone: data.phone || null,
            password_hash
        });

        const creator = await Creator.create({
            name: data.organizer_name,
            slug: slugify(data.organizer_name),
            owner_user_id: user.id
        });

        await CreatorUserMember.create({
            user_id: user.id,
            creator_id: creator.id,
            role_id: ROLES.PROMOTOR_OWNER_ID
        });

        const userSafe = user.toJSON();
        delete userSafe.password_hash;

        return {
            user: userSafe,
            creator
        };
    },

    async createPromotorEventAdmin(data, creatorId) {
        if (data.password !== data.confirm_password) {
            throw new Error("Password not match");
        }
        const existing = await User.findOne({ where: { email: data.email } });
        if (existing) throw new Error("Email already registered");

        const password_hash = await bcrypt.hash(
            data.password,
            parseInt(process.env.BCRYPT_SALT)
        );

        const user = await User.create({
            email: data.email,
            full_name: data.full_name,
            phone: data.phone || null,
            password_hash
        });

        await CreatorUserMember.create({
            user_id: user.id,
            creator_id: creatorId,
            role_id: ROLES.PROMOTOR_EVENT_ADMIN_ID
        });

        const userSafe = user.toJSON();
        delete userSafe.password_hash;

        return userSafe;
    },

    async createScanStaff(data, creatorId) {
        if (data.password !== data.confirm_password) {
            throw new Error("Password not match");
        }
        const existing = await User.findOne({ where: { email: data.email } });
        if (existing) throw new Error("Email already registered");

        const password_hash = await bcrypt.hash(
            data.password,
            parseInt(process.env.BCRYPT_SALT)
        );

        const user = await User.create({
            email: data.email,
            full_name: data.full_name,
            phone: data.phone || null,
            password_hash
        });

        await CreatorUserMember.create({
            user_id: user.id,
            creator_id: creatorId,
            role_id: ROLES.PROMOTOR_SCAN_STAFF_ID
        });

        const userSafe = user.toJSON();
        delete userSafe.password_hash;
        return userSafe;
    },

    async updatePromotorMember(id, data, creatorId) {
        const member = await CreatorUserMember.findOne({
            where: { user_id: id, creator_id: creatorId },
            include: [{ model: User, as: "user" }]
        });
        if (!member) throw new Error("Not allowed");

        await member.user.update({
            full_name: data.full_name ?? member.user.full_name,
            phone: data.phone ?? member.user.phone,
            image: data.image ?? member.user.image,
            is_active: data.is_active ?? member.user.is_active
        });
        return member.user;
    },

    async updatePromotorPassword(id, data, creatorId) {
        const member = await CreatorUserMember.findOne({
            where: { user_id: id, creator_id: creatorId },
            include: [{ model: User, as: "user" }]
        });

        if (!member) throw new Error("Promotor member not found");

        // 🔥 CHECK CURRENT PASSWORD
        const isValid = await bcrypt.compare(
            data.current_password,
            member.user.password_hash
        );

        if (!isValid) {
            throw new Error("Password lama salah");
        }

        if (data.password !== data.confirm_password) {
            throw new Error("Password dan konfirmasi tidak sama");
        }

        const saltRounds = parseInt(process.env.BCRYPT_SALT) || 10;
        const password_hash = await bcrypt.hash(data.password, saltRounds);

        await member.user.update({ password_hash });

        return { message: "Password updated successfully" };
    },

    async remove(user_id, creatorId) {
        const member = await CreatorUserMember.findOne({
            where: { user_id: user_id, creator_id: creatorId },
            include: [{ model: User, as: "user" }]
        });
        if (!member) throw new Error("Not allowed");

        await member.user.destroy();
    }
};
