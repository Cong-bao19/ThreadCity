import React from 'react';
import { create } from 'react-test-renderer';
import ParallaxScrollView from '../ParallaxScrollView';
import { useColorScheme } from '@/hooks/useColorScheme';

// Mock `useColorScheme` hook
jest.mock('@/hooks/useColorScheme', () => ({
  useColorScheme: jest.fn(),
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  return {
    useAnimatedRef: () => ({ current: null }),
    useScrollViewOffset: () => ({ value: 0 }),
    useAnimatedStyle: (callback: () => any) => callback(),
    interpolate: (value: number, input: number[], output: number[]) => 0,
    default: {
      createAnimatedComponent: (component: any) => component,
      View: 'View',
      ScrollView: 'ScrollView',
    },
    View: 'View',
    ScrollView: 'ScrollView',
  };
});

// Mock the bottom tab overflow hook
jest.mock('@/components/ui/TabBarBackground', () => ({
  useBottomTabOverflow: () => 0,
}));

// Mock ThemedView component
jest.mock('@/components/ThemedView', () => ({
  ThemedView: ({ children, style }: { children: React.ReactNode, style?: any }) => children,
}));

describe('ParallaxScrollView', () => {
  it('renders correctly', () => {
    // Mock the return value of `useColorScheme`
    (useColorScheme as jest.Mock).mockReturnValue('light');

    const tree = create(
      <ParallaxScrollView headerImage={<></>} headerBackgroundColor={{ light: '#fff', dark: '#000' }}>
        <></>
      </ParallaxScrollView>
    ).toJSON();
    
    expect(tree).toMatchSnapshot();
  });
});
