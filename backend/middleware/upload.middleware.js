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

const reelStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "snapgram/reels",
    resource_type: "video",
    allowed_formats: ["mp4", "mov", "avi", "webm"],
  },
});

const storyStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "snapgram/stories",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 1080, crop: "limit", quality: "auto" }],
  },
});

const msgStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "snapgram/messages",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 1080, quality: "auto" }],
  },
});

export const uploadPost = multer({ storage: postStorage, limits: { fileSize: 5 * 1024 * 1024 } }).single("image");
export const uploadAvatar = multer({ storage: avatarStorage, limits: { fileSize: 2 * 1024 * 1024 } }).single("avatar");
export const uploadReel = multer({ storage: reelStorage, limits: { fileSize: 50 * 1024 * 1024 } }).single("video");
export const uploadStory = multer({ storage: storyStorage, limits: { fileSize: 5 * 1024 * 1024 } }).single("media");
export const uploadMsgImage = multer({ storage: msgStorage, limits: { fileSize: 5 * 1024 * 1024 } }).single("image");
