import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const fixUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to database...");

        // Define a minimal schema
        const userSchema = new mongoose.Schema({
            email: String,
            status: String,
            isEmailVerified: Boolean,
            verificationToken: String
        });
        
        const User = mongoose.model("UserFix", userSchema, "users");

        const result = await User.updateMany(
            {}, 
            { 
                $set: { 
                    isEmailVerified: true, 
                    status: "active" 
                },
                $unset: {
                    verificationToken: "",
                    verificationTokenExpires: ""
                }
            }
        );

        console.log(`Successfully updated ${result.modifiedCount} users to active/verified.`);
        process.exit();
    } catch (error) {
        console.error("Failed to fix users:", error);
        process.exit(1);
    }
};

fixUsers();
