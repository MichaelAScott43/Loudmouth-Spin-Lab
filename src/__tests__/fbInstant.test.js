/**
 * Unit tests for the Facebook Instant Games SDK wrapper.
 */

import { isFBInstantReady, initFBInstant } from '../utils/fbInstant';

describe('isFBInstantReady', () => {
  const originalWindow = global.window;

  afterEach(() => {
    global.window = originalWindow;
  });

  test('returns false when FBInstant is not on window', () => {
    global.window = {};
    expect(isFBInstantReady()).toBe(false);
  });

  test('returns true when FBInstant is present on window', () => {
    global.window = { FBInstant: {} };
    expect(isFBInstantReady()).toBe(true);
  });
});

describe('initFBInstant', () => {
  afterEach(() => {
    delete global.window;
  });

  test('returns default player when FBInstant is not present', async () => {
    global.window = {};
    const result = await initFBInstant();
    expect(result).toEqual({ name: 'Player', photo: null });
  });

  test('returns player info from FBInstant SDK when present', async () => {
    global.window = {
      FBInstant: {
        initializeAsync: jest.fn().mockResolvedValue(undefined),
        startGameAsync: jest.fn().mockResolvedValue(undefined),
        player: {
          getName: () => 'Dr. Loudmouth',
          getPhoto: () => 'https://example.com/photo.jpg',
        },
      },
    };

    const result = await initFBInstant();
    expect(result).toEqual({
      name: 'Dr. Loudmouth',
      photo: 'https://example.com/photo.jpg',
    });
    expect(global.window.FBInstant.initializeAsync).toHaveBeenCalledTimes(1);
    expect(global.window.FBInstant.startGameAsync).toHaveBeenCalledTimes(1);
  });

  test('falls back to defaults when SDK methods return null', async () => {
    global.window = {
      FBInstant: {
        initializeAsync: jest.fn().mockResolvedValue(undefined),
        startGameAsync: jest.fn().mockResolvedValue(undefined),
        player: {
          getName: () => null,
          getPhoto: () => null,
        },
      },
    };

    const result = await initFBInstant();
    expect(result.name).toBe('Player');
    expect(result.photo).toBeNull();
  });
});
