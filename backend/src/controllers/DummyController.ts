import { Request, Response } from "express";

export const getDummyData = async (req : Request, res : Response) => {
    try {
        const data = [
            { id: 1, name: 'Alice', role: 'Developer' },
            { id: 2, name: 'Bob', role: 'Designer' }
        ];

        res.status(200).json({
            success: true,
            message: 'Dummy data fetched successfully',
            data
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        });
    }
};