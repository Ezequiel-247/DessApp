jest.mock('../src/models/material', () => ({
  increment: jest.fn(),
  decrement: jest.fn(),
  update: jest.fn(),
}));

jest.mock('../src/models/post', () => ({
  increment: jest.fn(),
  decrement: jest.fn(),
  update: jest.fn(),
}));

jest.mock('../src/models/comment', () => ({
  increment: jest.fn(),
  decrement: jest.fn(),
  update: jest.fn(),
}));

const Vote = require('../src/models/vote');
const Material = require('../src/models/material');
const Post = require('../src/models/post');
const Comment = require('../src/models/comment');

describe('Vote Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('afterCreate', () => {
    it('should increment total_upvotes and likes_count on material if is_upvote is true', async () => {
      const vote = { target_type: 'material', target_id: 1, is_upvote: true };
      await Vote.runHooks('afterCreate', vote, { transaction: 'mock-tx' });

      expect(Material.increment).toHaveBeenCalledWith(
        ['total_upvotes', 'likes_count'],
        { by: 1, where: { id: 1 }, transaction: 'mock-tx' }
      );
      expect(Material.update).toHaveBeenCalled();
    });

    it('should increment dislikes_count on material if is_upvote is false', async () => {
      const vote = { target_type: 'material', target_id: 1, is_upvote: false };
      await Vote.runHooks('afterCreate', vote, { transaction: 'mock-tx' });

      expect(Material.increment).toHaveBeenCalledWith(
        'dislikes_count',
        { by: 1, where: { id: 1 }, transaction: 'mock-tx' }
      );
    });

    it('should use Post model when target_type is post', async () => {
      const vote = { target_type: 'post', target_id: 2, is_upvote: true };
      await Vote.runHooks('afterCreate', vote, { transaction: 'mock-tx' });

      expect(Post.increment).toHaveBeenCalledWith(
        ['total_upvotes', 'likes_count'],
        { by: 1, where: { id: 2 }, transaction: 'mock-tx' }
      );
    });

    it('should use Comment model when target_type is comment', async () => {
      const vote = { target_type: 'comment', target_id: 3, is_upvote: true };
      await Vote.runHooks('afterCreate', vote, { transaction: 'mock-tx' });

      expect(Comment.increment).toHaveBeenCalledWith(
        ['total_upvotes', 'likes_count'],
        { by: 1, where: { id: 3 }, transaction: 'mock-tx' }
      );
    });
  });

  describe('afterUpdate', () => {
    it('should switch from downvote to upvote', async () => {
      const vote = {
        target_type: 'material', target_id: 1, is_upvote: true,
        changed: jest.fn().mockReturnValue(true),
        previous: jest.fn().mockReturnValue(false),
      };
      await Vote.runHooks('afterUpdate', vote, { transaction: 'mock-tx' });

      expect(Material.increment).toHaveBeenCalledWith(
        ['total_upvotes', 'likes_count'],
        { by: 1, where: { id: 1 }, transaction: 'mock-tx' }
      );
      expect(Material.decrement).toHaveBeenCalledWith(
        'dislikes_count',
        { by: 1, where: { id: 1 }, transaction: 'mock-tx' }
      );
    });

    it('should switch from upvote to downvote', async () => {
      const vote = {
        target_type: 'material', target_id: 1, is_upvote: false,
        changed: jest.fn().mockReturnValue(true),
        previous: jest.fn().mockReturnValue(true),
      };
      await Vote.runHooks('afterUpdate', vote, { transaction: 'mock-tx' });

      expect(Material.increment).toHaveBeenCalledWith(
        'dislikes_count',
        { by: 1, where: { id: 1 }, transaction: 'mock-tx' }
      );
      expect(Material.decrement).toHaveBeenCalledWith(
        ['total_upvotes', 'likes_count'],
        { by: 1, where: { id: 1 }, transaction: 'mock-tx' }
      );
    });

    it('should do nothing if is_upvote did not change', async () => {
      const vote = {
        target_type: 'material', target_id: 1, is_upvote: true,
        changed: jest.fn().mockReturnValue(false),
      };
      await Vote.runHooks('afterUpdate', vote, { transaction: 'mock-tx' });

      expect(Material.increment).not.toHaveBeenCalled();
      expect(Material.decrement).not.toHaveBeenCalled();
      expect(Material.update).not.toHaveBeenCalled();
    });
  });

  describe('afterDestroy', () => {
    it('should decrement counters if the deleted vote was an upvote on material', async () => {
      const vote = { target_type: 'material', target_id: 1, is_upvote: true };
      await Vote.runHooks('afterDestroy', vote, { transaction: 'mock-tx' });

      expect(Material.decrement).toHaveBeenCalledWith(
        ['total_upvotes', 'likes_count'],
        { by: 1, where: { id: 1 }, transaction: 'mock-tx' }
      );
    });

    it('should decrement dislikes_count if the deleted vote was a downvote on material', async () => {
      const vote = { target_type: 'material', target_id: 1, is_upvote: false };
      await Vote.runHooks('afterDestroy', vote, { transaction: 'mock-tx' });

      expect(Material.decrement).toHaveBeenCalledWith(
        'dislikes_count',
        { by: 1, where: { id: 1 }, transaction: 'mock-tx' }
      );
    });

    it('should use Post model when target_type is post', async () => {
      const vote = { target_type: 'post', target_id: 2, is_upvote: true };
      await Vote.runHooks('afterDestroy', vote, { transaction: 'mock-tx' });

      expect(Post.decrement).toHaveBeenCalledWith(
        ['total_upvotes', 'likes_count'],
        { by: 1, where: { id: 2 }, transaction: 'mock-tx' }
      );
    });

    it('should use Comment model when target_type is comment', async () => {
      const vote = { target_type: 'comment', target_id: 3, is_upvote: false };
      await Vote.runHooks('afterDestroy', vote, { transaction: 'mock-tx' });

      expect(Comment.decrement).toHaveBeenCalledWith(
        'dislikes_count',
        { by: 1, where: { id: 3 }, transaction: 'mock-tx' }
      );
    });
  });
});
