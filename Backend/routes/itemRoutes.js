const express = require("express");
const router = express.Router();
const { getAllItems } = require("../Controller/itemController");

router.get("/all", getAllItems);

module.exports = router;