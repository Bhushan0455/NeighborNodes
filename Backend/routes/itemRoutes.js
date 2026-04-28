const express = require("express");
const router = express.Router();
const { getAllItems, getItemById } = require("../Controller/itemController");

router.get("/all", getAllItems);
router.get("/:id", getItemById);

module.exports = router;