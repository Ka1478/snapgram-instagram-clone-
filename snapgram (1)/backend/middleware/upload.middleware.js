import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const postStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "snapgram/posts",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 1080, crop: "limit", quality: "auto" }],
  },
});

const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "snapgram/avatars",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 400, height: 400, crop: "fill", quality: "auto" }],
  },
});

export const uploadPost = multer({
  storage: postStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

export const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});
