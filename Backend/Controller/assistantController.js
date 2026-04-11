const pool = require("../db");

const chatWithAssistant = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || message.trim() === "") {
            return res.status(400).json({
                success: false,
                error: "Message is required."
            });
        }

        const userMessage = message.toLowerCase().trim();
        console.log("User message:", userMessage);

        // --- SMART CATEGORY / INTENT MAPPING ---
        const categoryKeywords = {
            utility_tools: ["tool", "tools", "repair", "fix", "drill", "screwdriver", "hammer", "measure", "mount"],
            hardware: ["hardware", "ladder", "pressure washer", "blower", "generator", "workbench", "tool rack"],
            electronics: ["electronics", "camera", "drone", "projector", "speaker", "gopro", "vr", "power bank"],
            camping: ["camping", "camp", "tent", "outdoor", "picnic", "kayak", "sleeping bag", "stove", "trip"],
            gaming: ["gaming", "game", "video game", "console", "playstation", "nintendo", "controller"],
            home_appliances: ["home appliance", "appliance", "vacuum", "heater", "cooler", "steamer", "air fryer", "robot cleaner"],
            kitchen: ["kitchen", "cook", "cooking", "baking", "food", "coffee", "grinder", "blender", "slow cooker", "popcorn"]
        };

        for (const category in categoryKeywords) {
            const keywords = categoryKeywords[category];
            const matched = keywords.some(keyword => userMessage.includes(keyword));

            if (matched) {
                const result = await pool.query(
                    "SELECT id, item_name, price_per_day FROM items WHERE LOWER(category) = $1 AND LOWER(status) = 'available' LIMIT 5",
                    [category]
                );

                if (result.rows.length === 0) {
                    return res.json({
                        success: true,
                        reply: `I couldn't find any ${category.replace("_", " ")} items available right now.`
                    });
                }

                return res.json({
                    success: true,
                    reply: `Here are some ${category.replace("_", " ")} items you can borrow:`,
                    items: result.rows
                });
            }
        }

        // --- FAQ RESPONSES ---
        if (userMessage.includes("borrow")) {
            return res.json({
                success: true,
                reply: "To borrow an item, open the item page, select the start and end date, and click Reserve. The owner will then approve or reject your request."
            });
        }

        if (userMessage.includes("list") && userMessage.includes("item")) {
            return res.json({
                success: true,
                reply: "To list an item, go to your dashboard, click 'List Item', fill in the item details such as name, category, description, price, and image, then submit the form."
            });
        }

        if (userMessage.includes("trust score")) {
            return res.json({
                success: true,
                reply: "Trust score shows how reliable a user is based on responsible borrowing and lending behavior on the platform."
            });
        }

        if (
            userMessage.includes("what is neighbornodes") ||
            userMessage.includes("how does neighbornodes work") ||
            userMessage.includes("how this platform works")
        ) {
            return res.json({
                success: true,
                reply: "NeighborNodes is a community borrowing platform where users can lend and borrow rarely used items within a local trusted network."
            });
        }

        if (
            userMessage.includes("accepted request") ||
            userMessage.includes("request accepted")
        ) {
            return res.json({
                success: true,
                reply: "If your request is accepted, the item is reserved for your selected dates and you can proceed with the borrowing flow."
            });
        }

        if (
            userMessage.includes("rejected request") ||
            userMessage.includes("request rejected")
        ) {
            return res.json({
                success: true,
                reply: "If your request is rejected, you can browse similar items or try another listing."
            });
        }

        // --- FALLBACK RESPONSE ---
        return res.json({
            success: true,
            reply: "I can help you find items, explain borrowing, listing, and trust score. Try asking something like 'I want to cook tonight', 'Show camping items', or 'How do I borrow?'"
        });

    } catch (error) {
        console.error("Assistant Error:", error);
        return res.status(500).json({
            success: false,
            error: "Assistant failed to respond."
        });
    }
};

module.exports = { chatWithAssistant };