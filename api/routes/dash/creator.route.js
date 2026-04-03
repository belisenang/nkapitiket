const router = require("express").Router();
const controller = require("../../controllers/dash/creator.controller");
const validate = require("../../middlewares/validate.middleware");
const schema = require("../../validations/creator.validation");
const upload = require("../../middlewares/uploadImage.middleware");
const { creatorGuard } = require("../../middlewares/guard/role.guard");
const parseFormJson = require("../../middlewares/parseFormJson.middleware");
const { autoFilterByCreator } = require("../../middlewares/autoFilterCreator.middleware");
router.get("/pagination", controller.getPagination);
router.get("/", controller.index);
router.get("/slug/:slug", controller.showBySlug);

router.post("/", upload.single("image"), validate(schema.create), controller.store);
router.get("/:id", creatorGuard("PROMOTOR_OWNER"), controller.show);
router.put("/:id", creatorGuard("PROMOTOR_OWNER"), upload.single("image"), parseFormJson(["social_link"]), validate(schema.update), controller.update);
router.delete("/:id", controller.destroy);

router.get("/:id/finance", controller.getFinanceSettings);
router.post("/:id/finance", controller.updateFinanceSettings);

router.get(
    "/:id/bank-accounts",
    creatorGuard("PROMOTOR_OWNER"),
    controller.getBankAccounts
);

router.post(
    "/:id/bank-accounts",
    creatorGuard("PROMOTOR_OWNER"),
    validate(schema.bankAccount),
    controller.upsertBankAccount
);

router.post(
    "/:id/bank-accounts/verify",
    creatorGuard("PROMOTOR_OWNER"),
    controller.verifyBankAccount
);

router.get(
    "/:id/documents",
    creatorGuard("PROMOTOR_OWNER"),
    controller.getDocuments
);

router.post(
    "/:id/documents",
    creatorGuard("PROMOTOR_OWNER"),
    upload.fields([
        { name: "ktp_image", maxCount: 1 },
        { name: "npwp_image", maxCount: 1 },
        { name: "legal_doc", maxCount: 1 }
    ]),
    validate(schema.documents),
    controller.upsertDocuments
);
module.exports = router;
