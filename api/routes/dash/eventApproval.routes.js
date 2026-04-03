const router = require("express").Router();

const controller = require("../../controllers/dash/admin/eventApproval.controller");
router.get(
  "/admin/events/draft",
  controller.listDraftEvents
);

router.get(
  "/admin/events/:id/detail",
  controller.getEventDetail
);

router.post(
  "/admin/events/publish",
  controller.publishEvent
);

module.exports = router;