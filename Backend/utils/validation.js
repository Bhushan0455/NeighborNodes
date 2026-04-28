const { z } = require("zod");

// Reusable Middleware Factory
const validate = (schema) => (req, res, next) => {
    try {
        schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        next();
    } catch (err) {
        return res.status(400).json({
            success: false,
            error: "Validation Error: Invalid input data",
            details: err.errors
        });
    }
};

// 1. Auth Schemas
const registerSchema = z.object({
    body: z.object({
        name: z.string().min(2, "Name must be at least 2 characters").max(50),
        email: z.string().email("Invalid email format"),
        password: z.string().min(6, "Password must be at least 6 characters"),
        phone: z.string().min(10, "Phone number is too short").max(20),
        pincode: z.string().min(5).max(10),
        locality: z.string().optional(),
        address: z.string().optional(),
        role: z.string().optional()
    })
});

const loginSchema = z.object({
    body: z.object({
        email: z.string().email("Invalid email format"),
        password: z.string().min(1, "Password is required")
    })
});

// 2. Lender Schemas
const listItemSchema = z.object({
    body: z.object({
        owner_id: z.number().int().positive(),
        item_name: z.string().min(3).max(100),
        category: z.string().min(1).max(50),
        price_per_day: z.number().positive("Price must be greater than zero"),
        image_url: z.string().url("Must be a valid URL").optional().or(z.literal('')),
        description: z.string().optional()
    })
});

// 3. Borrow Schemas
const borrowRequestSchema = z.object({
    body: z.object({
        item_id: z.number().int().positive(),
        borrower_id: z.number().int().positive(),
        start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format must be YYYY-MM-DD"),
        end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format must be YYYY-MM-DD")
    })
});

module.exports = {
    validate,
    registerSchema,
    loginSchema,
    listItemSchema,
    borrowRequestSchema
};
