import express from "express";
import { handleInboxPost } from "../controller/inboxController";
import Follow from "../types/follow";

const router = express.Router();

router.post("/", handleInboxPost);

router.get("/", async (req, res) => {
  try {
    const follows = await Follow.find();
    res.json(follows);
  } catch (err) {
    console.error("Error fetching all follows:", err);
    res.status(500).json({ message: "Error fetching follows" });
  }
});

router.get("/:userUrl", async (req, res) => {
  try {
    const rawParam = req.params.userUrl;
    const userUrl = decodeURIComponent(rawParam);

    const follows = await Follow.find({ object: userUrl });
    res.json(follows);
  } catch (err) {
    console.error("Error fetching follows for user:", err);
    res.status(500).json({ message: "Error fetching follows for user" });
  }
});

// Followers
router.get("/:userUrl/followers/count", async (req, res) => {
  try {
    const rawParam = req.params.userUrl;
    const userUrl = decodeURIComponent(rawParam);

    const followerCount = await Follow.countDocuments({ object: userUrl });

    res.json({ user: userUrl, count: followerCount });
  } catch (err) {
    console.error("Error counting followers for user:", err);
    res.status(500).json({ message: "Error counting followers for user" });
  }
});

router.get("/:userUrl/actors", async (req, res) => {
  try {
    const userUrl = decodeURIComponent(req.params.userUrl);
    const follows = await Follow.find({ object: userUrl }).select("actor -_id");
    const actors = follows.map((f) => f.actor);
    res.json({ user: userUrl, actors });
  } catch (err) {
    console.error("Error fetching follower actors:", err);
    res.status(500).json({ message: "Error fetching follower actors" });
  }
});

router.get('/:userUrl/followers', async (req, res) => {
  try {
    const rawParam = req.params.userUrl;
    const userUrl = decodeURIComponent(rawParam);
    const page = Number(req.query.page);

    const limit = 10;
    let skip : number = 0;

    if (page && page > 0) {
      skip = limit * (page - 1);
    }

    const follows = page
    ? await Follow.find({ object: userUrl })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .exec()
    : await Follow.find({ object: userUrl })
      .sort({ createdAt: 1 })
      .exec();

    res.json(follows);
  } catch (err) {
    console.error('Error fetching users following:', err);
    res.status(500).json({ message: 'Error fetching users following' });
  }
});

// Following
router.get('/:userUrl/following', async (req, res) => {
  try {
    const rawParam = req.params.userUrl;
    const userUrl = decodeURIComponent(rawParam);
    const page = Number(req.query.page);

    const limit = 10;
    let skip : number = 0;

    if (page && page > 0) {
      skip = limit * (page - 1);
    }

    const follows = page
        ? await Follow.find({ actor: userUrl })
          .sort({ createdAt: 1 })
          .skip(skip)
          .limit(limit)
          .exec()
        : await Follow.find({ actor: userUrl })
          .sort({ createdAt: 1 })
          .exec();

    res.json(follows);
  } catch (err) {
    console.error('Error fetching users being followed:', err);
    res.status(500).json({ message: 'Error fetching users being followed' });
  }
});

router.get('/:userUrl/following/count', async (req, res) => {
  try {
    const userUrl = decodeURIComponent(req.params.userUrl);
    const followingCount = await Follow.countDocuments({ actor: userUrl });
    res.json({ user: userUrl, count: followingCount });
  } catch (err) {
    console.error('Error counting following:', err);
    res.status(500).json({ message: 'Error counting following' });
  }
});

router.delete("/", async (req, res) => {
  try {
    const { actor, object } = req.body;

    if (!actor || !object) {
      return res.status(400).json({ message: "Missing 'actor' or 'object' fields" });
    }

    const result = await Follow.findOneAndDelete({ actor, object });

    if (!result) {
      return res.status(404).json({ message: "Follow relationship not found" });
    }

    res.json({ message: "Unfollowed successfully" });
  } catch (err) {
    console.error("Error unfollowing user:", err);
    res.status(500).json({ message: "Error unfollowing user" });
  }
});


export default router;
