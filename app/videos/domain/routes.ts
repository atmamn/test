import { Router } from "express";
import { addVidRating } from "../api/addVidRating";
import { addVidToList } from "../api/addVidToList";
import { deleteVidFromList } from "../api/deleteVidFromList";
import { deleteVidRating } from "../api/deleteVidRating";
import { vidsByCategory } from "../api/getSimilarVideos";
import { getCasts } from "../api/getVideoCasts";
import { vidLimitedInfo } from "../api/getVidLimitedInfo";
import { getUserListVids } from "../api/getVidsInUserList";
import { isVideoInUserList } from "../api/isVideoInUsersList";
import { isVideoRatedByUser } from "../api/isVidRatedByUser";
import { streamVideo } from "../api/streamVideo";
import { uploadVideo } from "../api/uploadVid";
import { uploadVidCast } from "../api/uploadVidCast";
import { getVidUrl } from "../api/getVidUrl";

const router = Router();

router.post("/upload-video", uploadVideo);
router.get("/video-options", vidLimitedInfo);
router.get("/similar-videos", vidsByCategory);
router.get("/casts", getCasts);
router.post("/upload-cast", uploadVidCast);
router.get("/stream-video", streamVideo);
router.post("/add-video-to-list", addVidToList);
router.post("/is-video-in-users-list", isVideoInUserList);
router.delete("/delete-video-from-list", deleteVidFromList);
router.get("/get-videos-in-user-list", getUserListVids);
router.post("/add-video-rating", addVidRating);
router.delete("/delete-video-rating", deleteVidRating);
router.post("/is-video-rated-by-user", isVideoRatedByUser);
router.get("/get-video-url", getVidUrl);

export default router;
