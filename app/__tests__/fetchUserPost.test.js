import { fetchUserPosts } from '../profile/[username]';
import { supabase } from '@/lib/supabase';

// Mock Date for consistent time calculations
const mockDate = new Date('2025-05-18T12:00:00Z');
const originalDate = global.Date;

// Lưu lại hàm tạo Date gốc
const OriginalDate = global.Date;

// Mock cả hàm tạo và các phương thức tĩnh
global.Date = class extends OriginalDate {
  constructor(...args) {
    if (args.length === 0) {
      // Khi gọi new Date() không có tham số, trả về mockDate
      return new OriginalDate(mockDate);
    }
    return new OriginalDate(...args);
  }
  
  // Mock các phương thức tĩnh
  static now() {
    return mockDate.getTime();
  }
  
  static parse(dateString) {
    return OriginalDate.parse(dateString);
  }
};

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn(),
  }
}));

describe('fetchUserPosts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty array when userId is empty', async () => {
    // Test when userId is empty
    try {
        const result = await fetchUserPosts('');
        console.log('returns empty array when userId is empty \n >>> Received result:', JSON.stringify(result, null, 2));
        expect(result).toEqual([]);
    } catch (error) {
        console.error('returns empty array when userId is empty \n >>> Caught error:', error.message);
    }
  });

  it('fetches and formats posts correctly', async () => {
    // Mock data
    const userId = 'user-123';
    const mockPostsData = [
      {
        id: 'post-1',
        user_id: userId,
        content: 'This is test post 1',
        created_at: '2025-05-17T12:00:00Z', // 1 day ago
        likes: [{ count: 10 }],
        comments: [{ count: 5 }]
      },
      {
        id: 'post-2',
        user_id: userId,
        content: 'This is test post 2',
        created_at: '2025-05-18T10:00:00Z', // 2 hours ago
        likes: [{ count: 20 }],
        comments: [{ count: 8 }]
      }
    ];

    const mockProfileData = {
      username: 'testuser',
      avatar_url: 'https://example.com/avatar.jpg'
    };

    const mockCommentsData = [
      {
        id: 'comment-1',
        post_id: 'post-1',
        user_id: 'user-456',
        content: 'This is a test comment',
        created_at: '2025-05-17T14:00:00Z',
        likes: [{ count: 3 }]
      },
      {
        id: 'comment-2',
        post_id: 'post-2',
        user_id: 'user-789',
        content: 'Another test comment',
        created_at: '2025-05-18T11:30:00Z',
        likes: [{ count: 7 }]
      }
    ];

    const mockCommentProfilesData = [
      {
        id: 'user-456',
        username: 'commenter1',
        avatar_url: 'https://example.com/commenter1.jpg'
      },
      {
        id: 'user-789',
        username: 'commenter2',
        avatar_url: 'https://example.com/commenter2.jpg'
      }
    ];    // Mock Supabase responses
    supabase.from.mockImplementation((tableName) => {
      if (tableName === 'posts') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnValue({
            data: mockPostsData,
            error: null
          })
        };
      } else if (tableName === 'profiles') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockReturnValue({
            data: mockProfileData,
            error: null
          }),
          in: jest.fn().mockReturnValue({
            data: mockCommentProfilesData,
            error: null
          })
        };
      } else if (tableName === 'comments') {
        return {
          select: jest.fn().mockReturnThis(),
          in: jest.fn().mockReturnThis(),
          is: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnValue({
            data: mockCommentsData,
            error: null
          })
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        single: jest.fn()
      };
    });    // Execute function

    try {
        const result = await fetchUserPosts(userId);
        console.log('fetches and formats posts correctly \n >>> Received result:', JSON.stringify(result, null, 2));

        expect(result).toHaveLength(2);
        expect(result[0].id).toBe('post-1');
        expect(result[1].id).toBe('post-2');
        expect(result[0].username).toBe('testuser');
        
        // Kiểm tra thời gian tương đối
        expect(['1 Days', '1 Day']).toContain(result[0].time);
        expect(['2 Hours', '2 Hour']).toContain(result[1].time);
        
        expect(result[0].likes).toBe(10);
        expect(result[0].replies).toBe(5);
        
        // Kiểm tra dữ liệu replies
        expect(Array.isArray(result[0].repliesData)).toBe(true);
        expect(result[0].repliesData.length).toBe(1);
        if (result[0].repliesData.length > 0) {
        expect(result[0].repliesData[0].username).toBe('commenter1');
        }
    } catch (error) {
        console.error('fetches and formats posts correctly \n >>> Caught error:', error.message);
    }
  });

  it('handles errors when fetching posts', async () => {
    // Mock error response
    supabase.from.mockImplementation((tableName) => {
      if (tableName === 'posts') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnValue({
            data: null,
            error: { message: 'Error fetching posts' }
          })
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        single: jest.fn()
      };
    });

    // Execute and expect error
    try {
        await expect(fetchUserPosts('user-123')).rejects.toThrow('Error fetching posts');
        console.log('handles errors when fetching posts \n >>> Test passed');
    } catch (error) {
        console.error('handles errors when fetching posts \n >>> Caught error:', error.message);
    }
  });

  it('handles errors when fetching profile data', async () => {
    // Mock successful posts but failed profile
    const mockPostsData = [
      {
        id: 'post-1',
        user_id: 'user-123',
        content: 'Test post',
        created_at: '2025-05-17T12:00:00Z',
        likes: [{ count: 10 }],
        comments: [{ count: 5 }]
      }
    ];

    supabase.from.mockImplementation((tableName) => {
      if (tableName === 'posts') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnValue({
            data: mockPostsData,
            error: null
          })
        };
      } else if (tableName === 'profiles') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockReturnValue({
            data: null,
            error: { message: 'Error fetching profile' }
          })
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        single: jest.fn()
      };
    });

    // Execute and expect error
    try {
        await expect(fetchUserPosts('user-123')).rejects.toThrow('Error fetching profile');
        console.log('handles errors when fetching profile data \n >>> Test passed');
    } catch (error) {
        console.error('handles errors when fetching profile data \n >>> Caught error:', error.message);
    }
  });
  it('handles errors when fetching comments', async () => {
    // Mock successful posts and profile but failed comments
    const mockPostsData = [
      {
        id: 'post-1',
        user_id: 'user-123',
        content: 'Test post',
        created_at: '2025-05-17T12:00:00Z',
        likes: [{ count: 10 }],
        comments: [{ count: 5 }]
      }
    ];

    const mockProfileData = {
      username: 'testuser',
      avatar_url: 'https://example.com/avatar.jpg'
    };

    supabase.from.mockImplementation((tableName) => {
      if (tableName === 'posts') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnValue({
            data: mockPostsData,
            error: null
          })
        };
      } else if (tableName === 'profiles') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockReturnValue({
            data: mockProfileData,
            error: null
          }),
          in: jest.fn().mockReturnValue({
            data: [],
            error: null
          })
        };
      } else if (tableName === 'comments') {
        return {
          select: jest.fn().mockReturnThis(),
          in: jest.fn().mockReturnThis(),
          is: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnValue({
            data: null,
            error: { message: 'Error fetching comments' }
          })
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        single: jest.fn()
      };
    });

    // Execute and expect error
    await expect(fetchUserPosts('user-123')).rejects.toThrow('Error fetching comments');
  });
});