const router = require("express").Router();
const { getNearbyItems } = require("../Controller/locationController");

router.get("/items/nearby/:userId", getNearbyItems);

module.exports = router;