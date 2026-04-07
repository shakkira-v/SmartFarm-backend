import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const testUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const User = mongoose.model("UserTest", new mongoose.Schema({
            email: String,
            password: { type: String, required: true }
        }, { strict: false }), "users");

        const email = 'sharikhaventhodi@gmail.com';
        const newPassword = 'newPassword123';
        
        const user = await User.findOne({ email });
        if (!user) {
            console.log("User not found");
            process.exit();
        }

        console.log("Found user. Old hash:", user.password);
        
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();
        
        console.log("User saved. New hash:", user.password);
        
        const reFetched = await User.findOne({ email });
        const isMatch = await bcrypt.compare(newPassword, reFetched.password);
        console.log("Comparison with new password:", isMatch);
        
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

testUser();
