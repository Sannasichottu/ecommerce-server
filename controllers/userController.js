const ErrorHander = require('../utils/errorhander');
const catchAsyncErrors = require('../middleware/catchAsyncError');
const User = require("../models/userModel");
const sendToken = require('../utils/jwtToken');
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto")

//Register a User
exports.registerUser = catchAsyncErrors(
    async(req,res,next) => {
        const {name,email,password} = req.body;

        const user = await User.create({
            name,email,password,
            avatar:{
                public_id:"this is a sample id",
                url:"profilepicUrl"
            }
        });

        sendToken(user,201,res)

    }
)


//Login User
exports.loginUser = catchAsyncErrors(async(req,res,next) => {
    const {email,password } = req.body;

    //checking if User has given password and email both

    if(!email || !password) {
        return next(new ErrorHander("Please  Enter Email & password",400))
    }

    const user = await User.findOne({email}).select("+password");

    if(!user) {
        return next(new ErrorHander("Invalid Email or Password",401))
    }

    const isPasswordMatched = user.comparePassword(password);

    if(!isPasswordMatched) {
        return next(new ErrorHander("Invalid Email or Password",401))
    }

    sendToken(user,200,res)

})


//Logout User
exports.logout = catchAsyncErrors(async (req,res,next) =>{

    res.cookie("token",null,{
        expires:new Date(Date.now()),
        httpOnly:true,
    })

    res.status(200).json({
        success:true,
        message:"Logout"
    })
})

/*
//Forgot password
exports.forgotPassword = catchAsyncErrors(
    async(req,res,next) => {
        const user = await User.findOne({ email: req.body.email });

        if(!user) {
            return next(new ErrorHander("User not found",404));
        }

        //Get ResetPasswordToken
        const resetToken = user.getResetPasswordToken();
        await user.save({ validateBeforeSave:false});

        const resetPasswordUrl = `${req.protocol}://${req.get(
            "host"
            )}/api/v1/password/reset/${resetToken}`;

        const message =`Your password reset token is :- \n\n ${resetPasswordUrl} \n\nIf you have not requested this email then please ignore it `;

        try {
            await sendEmail({
                email: user.email,
                subject: `Ecommerce Password Recovery`,
                message
            });

            res.status(200).json({
                success:true,
                message:`Email sent to ${user.email} successfully`
            })

        } catch (error) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;

            await user.save({validateBeforeSave:false});

            return next(new ErrorHander(error.message,500))
        }


    }
)

*/

exports.forgotPassword = catchAsyncErrors(async (req,res,next) => {
    const user = await User.findOne({email:req.body.email});

    if(!user) {
        return next(new ErrorHander("User not found",404))
    }

    //Get ResetPassword Token

    //const resetToken = user.getResetPasswordToken(); //3.13.17
    const resetToken = user.getResetPasswordToken();

    await user.save({validateBeforeSave:false});

    const resetPasswordUrl = `${req.protocol}://${req.get("host")}/api/v1/password/reset/${resetToken}`;

    const message = `Your password reset token is :- \n\n ${resetPasswordUrl} \n\nIF you have not requested this email then, please ignore it`;

    try {
        await sendEmail({
            email:user.email,
            subject:`Ecommerce Password Recovery`,
            message,
        });

        res.status(200).json({
            success:true,
            message:`Email sent to ${user.email} successfully.`
        })

    } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save({ validateBeforeSave:false});

        return next(new ErrorHander(error.message,500))
    }

})


//Reset Password

exports.resetPassword = catchAsyncErrors(async (req,res,next) => {

    //creating token hash
    const resetPasswordToken = crypto
        .createHash("sha256")
        .update(req.params.token)
        .digest("hex");

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire:{$gt:Date.now()}
    });

    if(!user) {
        return next(new ErrorHander("Reset Password Token is invalid or has been expired ", 400))
    }

    if(req.body.password !== req.body.confirmPassword) {
        return next(new ErrorHander("Password does not password", 400))
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    sendToken(user,200,res)


})
