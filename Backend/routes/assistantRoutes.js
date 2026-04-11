const router = require("express").Router();
const { chatWithAssistant } = require("../Controller/assistantController");

router.post("/chat", chatWithAssistant);

module.exports = router;