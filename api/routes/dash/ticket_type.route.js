const router = require("express").Router();
const controller = require("../../controllers/dash/ticket_type.controller");
const schema = require("../../validations/ticket_type.validation");
const validate = require("../../middlewares/validate.middleware");
const { eventAccessGuard } = require("../../middlewares/guard/eventAccess.guard");
const { creatorGuard } = require("../../middlewares/guard/role.guard");
const { autoFilterByCreator } = require("../../middlewares/autoFilterCreator.middleware");

router.get("/ticket-group", creatorGuard("PROMOTOR_OWNER", "PROMOTOR_EVENT_ADMIN"), autoFilterByCreator(), controller.getTicketGroup);
router.post("/ticket-group", creatorGuard("PROMOTOR_OWNER", "PROMOTOR_EVENT_ADMIN"), autoFilterByCreator(), controller.postTicketGroup);

// ticket bundle
router.get("/:eventId/bundles", eventAccessGuard(), autoFilterByCreator(), controller.getTicketBundles);
router.post("/:eventId/bundles", eventAccessGuard(), creatorGuard("PROMOTOR_OWNER", "PROMOTOR_EVENT_ADMIN"), autoFilterByCreator(), controller.createTicketBundle);
router.put("/:eventId/bundles/:bundleId", eventAccessGuard(), creatorGuard("PROMOTOR_OWNER", "PROMOTOR_EVENT_ADMIN"), autoFilterByCreator(), controller.updateTicketBundle);
router.delete("/:eventId/bundles/:bundleId", eventAccessGuard(), creatorGuard("PROMOTOR_OWNER", "PROMOTOR_EVENT_ADMIN"), autoFilterByCreator(), controller.deleteTicketBundle);

router.get("/:eventId/detail/:ticketTypeId", eventAccessGuard(), autoFilterByCreator(), controller.show);
router.post("/:eventId/create", eventAccessGuard(), creatorGuard("PROMOTOR_OWNER", "PROMOTOR_EVENT_ADMIN"), autoFilterByCreator(), validate(schema.bulkCreate), controller.store);
router.put("/:eventId/update/:ticketTypeId", eventAccessGuard(), creatorGuard("PROMOTOR_OWNER", "PROMOTOR_EVENT_ADMIN"), autoFilterByCreator(), validate(schema.update), controller.update);
router.delete("/:eventId/delete/:ticketTypeId", eventAccessGuard(), creatorGuard("PROMOTOR_OWNER", "PROMOTOR_EVENT_ADMIN"), autoFilterByCreator(), controller.destroy);

module.exports = router;
