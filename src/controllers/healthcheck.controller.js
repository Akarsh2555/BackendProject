import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";


const healthcheck = asyncHandler( async (req, res) => {
    return res
    .status(200)
    .json(
        new ApiResponse(200, null, "Server is Healthy")
    )
})

export {healthcheck}