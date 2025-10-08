import { Request, Response } from "express";
import bcrypt from "bcrypt";
import sql from "../../lib/sql";

export const LoginController = async (req: Request, res: Response) => {

    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "All input fields are required." })
        }

        if (typeof email !== "string") {
            return res.status(400).json({ message: "Email must be a string." });
        }

        const processedEmail = email.trim().toLowerCase();

        const [user] = await sql`
        SELECT id, email, password FROM users WHERE email = ${processedEmail}
        `;

        if (!user) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        console.log("Success")

        return res.status(201).json({
            message: "User login successfully.",
        });

    }
    catch (error: unknown) {
        if (error instanceof Error) {
            console.error("Login error:", error.message);
        } else {
            console.error("Unexpected error:", error);
        }

        res.status(500).json({ message: "Internal server error." });
    }
}