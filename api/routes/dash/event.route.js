const router = require("express").Router();
const controller = require("../../controllers/dash/event.controller");
const validate = require("../../middlewares/validate.middleware");
const schema = require("../../validations/event.validation");
const eventVal = require("../../validations/eventAll.validation");
const upload = require("../../middlewares/uploadImage.middleware");
const parseFormJson = require("../../middlewares/parseFormJson.middleware");
const { eventAccessGuard } = require("../../middlewares/guard/eventAccess.guard");
const { creatorGuard } = require("../../middlewares/guard/role.guard");
const { autoFilterByCreator } = require("../../middlewares/autoFilterCreator.middleware");

router.get("/", creatorGuard("PROMOTOR_OWNER", "PROMOTOR_EVENT_ADMIN"), autoFilterByCreator(), controller.index);
router.get("/pagination", creatorGuard("PROMOTOR_OWNER", "PROMOTOR_EVENT_ADMIN"), autoFilterByCreator(), controller.getPagination);
router.get("/slug/:slug", controller.slug);
router.get("/:eventId", creatorGuard("PROMOTOR_OWNER", "PROMOTOR_EVENT_ADMIN"), eventAccessGuard(), controller.show);

router.post(
    "/",
    creatorGuard("PROMOTOR_OWNER", "PROMOTOR_EVENT_ADMIN"),
    upload.fields([
        { name: "image", maxCount: 1 },
        { name: "layout_venue", maxCount: 1 },
    ]),
    validate(schema.create),
    controller.store 
);

router.post(
    "/create-all",
    creatorGuard("PROMOTOR_OWNER", "PROMOTOR_EVENT_ADMIN"),
    upload.fields([
        { name: "image", maxCount: 1 },
        { name: "layout_venue", maxCount: 1 },
    ]),
    parseFormJson(["ticket_types", "social_link"]),
    validate(eventVal.create),
    controller.storeAll
);

router.put(
    "/:eventId",
    creatorGuard("PROMOTOR_OWNER", "PROMOTOR_EVENT_ADMIN"),
    eventAccessGuard(),
    upload.fields([
        { name: "image", maxCount: 1 },
        { name: "layout_venue", maxCount: 1 },
    ]),
    parseFormJson(["social_link"]),
    validate(schema.update),
    controller.update
);

router.delete("/:eventId", creatorGuard("PROMOTOR_OWNER", "PROMOTOR_EVENT_ADMIN"), eventAccessGuard(), controller.destroy);

/* ============ GUEST STAR ============ */
router.post(
  "/:eventId/guest-star",
  creatorGuard("PROMOTOR_OWNER", "PROMOTOR_EVENT_ADMIN"), eventAccessGuard(),
  upload.single("image"),
  controller.addGuestStar
);

router.delete(
  "/:eventId/guest-star/:guestId",
  creatorGuard("PROMOTOR_OWNER", "PROMOTOR_EVENT_ADMIN"), eventAccessGuard(),
  controller.removeGuestStar
);

/* ============ SPONSOR ============ */
router.post(
  "/:eventId/sponsor",
  creatorGuard("PROMOTOR_OWNER", "PROMOTOR_EVENT_ADMIN"), eventAccessGuard(),
  upload.single("image"),
  controller.addSponsor
);

router.delete(
  "/:eventId/sponsor/:sponsorId",
  creatorGuard("PROMOTOR_OWNER", "PROMOTOR_EVENT_ADMIN"), eventAccessGuard(),
  controller.removeSponsor
);

/* ============ SCAN STAFF ============ */

router.post(
  "/:eventId/scan-staff",
  creatorGuard("PROMOTOR_OWNER", "PROMOTOR_EVENT_ADMIN"),
  eventAccessGuard(),
  controller.assignScanStaff
);

router.delete(
  "/:eventId/scan-staff/:assignmentId",
  creatorGuard("PROMOTOR_OWNER", "PROMOTOR_EVENT_ADMIN"),
  eventAccessGuard(),
  controller.removeScanStaff
);

/* ============ FASILITAS ============ */
router.post("/:eventId/fasilitas", creatorGuard("PROMOTOR_OWNER", "PROMOTOR_EVENT_ADMIN"), eventAccessGuard(), controller.addFasilitas);
router.delete("/:eventId/fasilitas/:fasilitasId", creatorGuard("PROMOTOR_OWNER", "PROMOTOR_EVENT_ADMIN"), eventAccessGuard(), controller.removeFasilitas);
module.exports = router;
