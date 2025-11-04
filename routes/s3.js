import {Router} from "express";
import {abortUpload,completeUpload,createMultipartUpload,getUploadUrl} from "../controllers/s3_controller.js"

const router=Router();

router.post("/create-multipart-upload",createMultipartUpload);
router.post("/generate-upload-urls",getUploadUrl);
router.post("/complete-multipart-upload",completeUpload);
router.post("/abort-multipart-upload",abortUpload);

export default router;