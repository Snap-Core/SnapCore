import { Request, Response } from 'express';
import { LikesService } from '../services/likesService';

export class LikesController {

  static async createLike(req: Request, res: Response) {
    try {
      const { actor, object } = req.body;

      const result = await LikesService.createLike({ actor, object });

      if (result.success) {
        return res.status(201).json({
          message: result.message,
          like: result.like
        });
      } else {
        let statusCode = 400;
        if (result.message === 'Post does not exist') {
          statusCode = 404;
        } else if (result.message === 'Post already liked') {
          statusCode = 409;
        } else if (result.message.includes('Internal server error')) {
          statusCode = 500;
        }

        return res.status(statusCode).json({
          message: result.message
        });
      }

    } catch (error) {
      console.error('Error in createLike controller:', error);
      return res.status(500).json({
        message: 'Internal server error'
      });
    }
  }

  static async removeLike(req: Request, res: Response) {
    try {
      const { actor, object } = req.body;

      const result = await LikesService.removeLike({ actor, object });

      if (result.success) {
        return res.status(200).json({
          message: result.message
        });
      } else {
        let statusCode = 400;
        if (result.message === 'Post does not exist') {
          statusCode = 404;
        } else if (result.message === 'Like not found') {
          statusCode = 410; 
        } else if (result.message.includes('Internal server error')) {
          statusCode = 500;
        }

        return res.status(statusCode).json({
          message: result.message
        });
      }

    } catch (error) {
      console.error('Error in removeLike controller:', error);
      return res.status(500).json({
        message: 'Internal server error'
      });
    }
  }

  static async getLikesByPost(req: Request, res: Response) {
    try {
      const postUrl = decodeURIComponent(req.params.postUrl);

      const result = await LikesService.getLikesByPost(postUrl);

      if (result.success) {
        return res.status(200).json({
          likes: result.likes,
          totalCount: result.totalCount
        });
      } else {
        const statusCode = result.message?.includes('Internal server error') ? 500 : 400;
        return res.status(statusCode).json({
          message: result.message
        });
      }

    } catch (error) {
      console.error('Error in getLikesByPost controller:', error);
      return res.status(500).json({
        message: 'Internal server error'
      });
    }
  }

  static async checkUserLike(req: Request, res: Response) {
    try {
      const { actor } = req.params;
      const postUrl = decodeURIComponent(req.params.postUrl);

      const result = await LikesService.hasUserLikedPost(actor, postUrl);

      if (result.success) {
        return res.status(200).json({
          liked: result.liked
        });
      } else {
        const statusCode = result.message?.includes('Internal server error') ? 500 : 400;
        return res.status(statusCode).json({
          message: result.message
        });
      }

    } catch (error) {
      console.error('Error in checkUserLike controller:', error);
      return res.status(500).json({
        message: 'Internal server error'
      });
    }
  }
}