import express from "express";
import { handleInboxPost } from "../controller/inboxController";
import Follow from "../types/follow";
import {
  countGraphFollowers,
  countGraphFollowing,
  getGraphFollowers,
  getGraphFollowing,
  removeGraphFollow
} from "../services/neo4jProxyService";

const router = express.Router();

router.post("/", handleInboxPost);

router.get('/followers', async (req, res) => {
  try {
    console.log('Here1');
    const { username, domain } = req.query as { username: string; domain: string };

    if (!username || !domain) {
      return res.status(400).json({ error: 'Invalid get followers request' });
    }

    const page = Number(req.query.page);

    const limit = 10;
    let skip : number = 0;

    if (page && page > 0) {
      skip = limit * (page - 1);
    }

    const followers = await getGraphFollowers(username, domain, skip, limit)

    res.json(followers);
  } catch (err) {
    console.error('Error fetching users following:', err);
    res.status(500).json({ message: 'Error fetching users following' });
  }
});

router.get('/following', async (req, res) => {
  try {
    const { username, domain } = req.query as { username: string; domain: string };

    if (!username || !domain) {
      return res.status(400).json({ error: 'Invalid get followung request' });
    }

    const page = Number(req.query.page);

    const limit = 10;
    let skip : number = 0;

    if (page && page > 0) {
      skip = limit * (page - 1);
    }

    const following = await getGraphFollowing(username, domain, skip, limit)

    res.json(following);
  } catch (err) {
    console.error('Error fetching users being followed:', err);
    res.status(500).json({ message: 'Error fetching users being followed' });
  }
});


router.get("/followers/count", async (req, res) => {
  try {
    const { username, domain } = req.query as { username: string; domain: string };

    if (!username || !domain) {
      return res.status(400).json({ error: 'Invalid get follower count request' });
    }

    const followerCount = await countGraphFollowers(username, domain);

    res.json(followerCount);
  } catch (err) {
    console.error("Error counting followers for user:", err);
    res.status(500).json({ message: "Error counting followers for user" });
  }
});

router.get('/following/count', async (req, res) => {
  try {
    const { username, domain } = req.query as { username: string; domain: string };

    if (!username || !domain) {
      return res.status(400).json({ error: 'Invalid get user request' });
    }

    const followingCount = await countGraphFollowing(username, domain);

    res.json(followingCount);
  } catch (err) {
    console.error('Error counting following:', err);
    res.status(500).json({ message: 'Error counting following' });
  }
});

router.get("/", async (req, res) => {
  try {
    const follows = await Follow.find();
    res.json(follows);
  } catch (err) {
    console.error("Error fetching all follows:", err);
    res.status(500).json({ message: "Error fetching follows" });
  }
});


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

    const [followerUsername, followerDomain] = actor.split('@');
    const [followedUsername, followedDomain] = object.split('@');
    await removeGraphFollow(followerUsername, followerDomain, followedUsername, followedDomain);

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
