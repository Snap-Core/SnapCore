import { Router } from 'express';
import { LikesController } from '../controllers/likes-controller';

const router = Router();

router.post('/activities/like', LikesController.handleLike);
router.post('/activities/unlike', LikesController.handleUnlike);
router.post('/external/likes', LikesController.getExternalLikes);

router.post('/inbox', async (req, res) => {
  try {
    const activity = req.body;
    
    switch (activity.type) {
      case 'Like':
        await LikesController.handleIncomingLike(activity);
        return res.status(202).json({ message: 'Like activity processed' });
      case 'Undo':
        if (activity.object && activity.object.type === 'Like') {
          return res.status(202).json({ message: 'Undo Like activity processed' });
        }
        break;
      default:
        return res.status(202).json({ message: 'Activity received but not processed' });
    }
    
    return res.status(202).json({ message: 'Activity processed' });
    
  } catch (error) {
    console.error('Error processing inbox activity:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
