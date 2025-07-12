import {v2 as cloudinary} from "cloudinary"
import fs from 'fs'

cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_API_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

const uploadOnCloudinary = async (localFilePath) => {
    try{
        if(!localFilePath) return null
        // upload on cloudinary
        const response = await  cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // File is uploaded on cloudinary
        //console.log("FILE UPLOADED", response.url)
        //return response;
        fs.unlinkSync(localFilePath)
        return response;

    }catch(error){
        // to remove scrap files we use fs(file system) to deelete them
        fs.unlinkSync(localFilePath) // remover file from local server
        return null
    }
}

// Delete previous image on cloud
const deleteOnCloudinary = async (url) => {
    try {
        // Extract public_id: after 'upload/' and before extension
        const parts = url.split('/upload/')[1].split('.');
        const public_id = parts[0]; // everything before extension

        console.log("Deleting public_id:", public_id);

        const response = await cloudinary.uploader.destroy(public_id, {
            resource_type: "auto", // handles image, video, etc.
        });

        console.log("Cloudinary deletion response:", response);
        return response;
    } catch (error) {
        console.error("Error deleting from Cloudinary:", error);
        return null;
    }
};

export { uploadOnCloudinary, deleteOnCloudinary};