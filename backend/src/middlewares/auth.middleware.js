import jwt from "jsonwebtoken"
import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.models.js"


export const verifyJWT = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "") || req.headers["authorization"]?.replace("Bearer ", "")

  if(!token) {
    throw new ApiError(401, "Unauthorized");
  }

  try {
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
    const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
    
    if(!user) {
      throw new ApiError(401, "Unauthorized")
    }
    
    req.user = user
    next();

  } catch (error) {
    throw new ApiError(401, error?.message || "Unauthorized or invalid access token")
  }
})

export const optionalVerifyJWT = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "") || req.headers["authorization"]?.replace("Bearer ", "");

  if (!token) {
    return next();
  }

  try {
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
    if (user) {
      req.user = user;
    }
  } catch (error) {
    // optional, continue as unauthenticated guest
  }
  next();
})