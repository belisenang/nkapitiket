"use strict";

const { v4: uuidv4 } = require("uuid");

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert("ticket_groups", [
      {
        id: uuidv4(),
        creator_id: null,
        name: "Early Bird",
        slug: "early-bird",
        sort_order: 1,
        is_default: false,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        creator_id: null,
        name: "Regular",
        slug: "regular",
        sort_order: 2,
        is_default: true,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        creator_id: null,
        name: "VIP",
        slug: "vip",
        sort_order: 3,
        is_default: false,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("ticket_groups", null, {});
  },
};