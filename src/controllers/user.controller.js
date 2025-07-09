import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {User} from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";

//Method to generate access abd refresh Tokens
const generateAccessAndRefreshTokens = async(userId) => {
    try{
        const user = await User.findById(userId)
        const accessToken = user.generateAcccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return {accessToken, refreshToken}

    }catch(error){
        throw new ApiError(500, "Something Went Wrong while generating Tokens")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    // get details from user
    //validation(not empty)
    // check if user is logged in: usermame/email
    //check for images
    //check for avatars
    //upload them to cloudinary, check avatar
    // create userObject - create entry in db
    // remove password and refresh token
    //check for user creation
    //return response
    
    const {fullName, email, username, password} = req.body
    //console.log("email:", email);

    /*if(fullName === ""){
        throw new ApiError(400, "fullname is Required")
    }*/

    if(
        [fullName, email, username, password].some((field) =>
        field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are Required")
    }
    // we can use certain operators using $sign

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if(existedUser){
        throw new ApiError(400, "Username or email already exist")
    }
    
    const avatarLocalPath = req.files?.avatar[0]?.path
    //const coverImageLocalPath = req.files?.coverImage[0]?.path

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is Required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath); 
    
    
    if(!avatar){
        throw new ApiError(400, "Avatar is Required")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshTokens"
    )

    if(!createdUser){
        throw new ApiError(500, "Something went Wrong while user registration")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )
})

const loginUser = asyncHandler(async (req, res) => {
    //req.body -> data
    //check username/email
    //find the user
    //check password
    //access and refresh token generate
    //send cokkie
    //send response

    const {username, email, password} = req.body

    if(!(username || email)){
        throw new ApiError(400, "username or email is required")

    }
    // find if username or email any one 
    const user = await User.findOne({
        $or: [{username}, {email}]
    });

    if(!user){
        throw new ApiError(400 , "User does nit exist")
    }

    // password check from bcryp
    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(401, "Invalid User Credentials")
    }

   const {accessToken, refreshToken} =   await generateAccessAndRefreshTokens(user._id)

   const loggedInUser = await User.findById(user._id).
   select("-password -refreshToken")

   // handleing Cookies

   const options = {
    httpOnly: true,
    secure: true
   }

   return res
   .status(200)
   .cookie("accessToken", accessToken, options)
   .cookie("refreshToken", refreshToken, options)
   .json(
    new ApiResponse(
        200,
        {
            user: loggedInUser, accessToken, 
            refreshToken
        },
        "User logged In Successfully"
    )
   )
})

const logoutUser = asyncHandler(async (req, res) => {
    // remove cookies
    // reove refreshTokens
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }        
        },
        {
            new: true
        }
    )

    const options = {
    httpOnly: true,
    secure: true
   }

   res.
   status(200)
   .clearCookie("accessToken", options)
   .clearCookie("refreshToken", options)
   .json(new ApiResponse(200, {}, "UserLoggedOut Successfully"))
})

const refreshAccessToken = asyncHandler( async (req, res) => {
    //request token frim cookies
    const incommingRefreshToken = req.cookie.refreshToken || req.body.refreshToken

    if(!incommingRefreshToken){
        throw new ApiError(401, "Unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incommingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401, "Invalid Refresh Token")
        }
    
        if(incommingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh Token is Expired")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(new ApiResponse(
            200,
            {accessToken, refresToken},
            "Access Token Refreshed"
        ))
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh Token")
    }
})

export {
    registerUser, 
    loginUser,
    logoutUser,
    refreshAccessToken
}