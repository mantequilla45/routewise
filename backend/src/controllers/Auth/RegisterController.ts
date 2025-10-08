import { Request, Response } from "express";
import bcrypt from "bcrypt";
import sql from "../../lib/sql";

export const RegisterController = async (req: Request, res: Response) => {

    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "All input fields are required." })
        }

        if (typeof email !== "string") {
            return res.status(400).json({ message: "Email must be a string." });
        }

        const processedEmail = email.trim().toLowerCase();

        const existingUser = await sql`
        SELECT id FROM users WHERE email = ${processedEmail}
        `;

        if (existingUser.length > 0) {
            return res.status(400).json({ message: "Email already registered." });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        await sql`
        INSERT INTO users (email, password)
        VALUES (${processedEmail}, ${hashedPassword})
        RETURNING id, email
        `;

        console.log("Success")

        return res.status(201).json({
            message: "User registered successfully.",
        });

    }
    catch (error: unknown) {
        if (error instanceof Error) {
            console.error("RegisterController error:", error.message);
        } else {
            console.error("Unexpected error:", error);
        }

        res.status(500).json({ message: "Internal server error." });
    }
}