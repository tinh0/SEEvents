import express from "express";
import {
  getUser,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getUserActivities,
  updatePfp,
  updateToken,
  getUserNotificationPreferences,
  updateNotificationPreferences,
  getUserByEmail,
  deleteUserActivity,
  changePassword
} from "../controllers/userController.ts";
const router = express.Router();

// Get all users
router.get("/", getUsers);

// Get single user
router.get("/:id", getUser);

// Create new user
router.post("/", createUser);

// Update user
router.put("/:id", updateUser);

// Password change route
router.post("/change-password/:id", changePassword);

//Delete user
router.delete("/:id", deleteUser);

router.get("/userActivities/:id", getUserActivities);
router.delete("/userActivities/:id", deleteUserActivity);

router.post("/pfp/:id", updatePfp);

router.post("/update-token/:id", updateToken);

// Notification preferences routes
router.get("/preferences/notifications/:id", getUserNotificationPreferences);
router.post("/preferences/notifications/:id", updateNotificationPreferences);

router.get("/auth/:id", getUserByEmail);

export default router;
