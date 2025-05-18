import React from 'react';
import { create } from 'react-test-renderer';
import ParallaxScrollView from '../ParallaxScrollView';
import { useColorScheme } from '@/hooks/useColorScheme';

// Mock `useColorScheme` hook
jest.mock('@/hooks/useColorScheme', () => ({
  useColorScheme: jest.fn(),
}));

describe('ParallaxScrollView', () => {
  it('renders correctly', () => {
    // Mock trả về giá trị của `useColorScheme`
    (useColorScheme as jest.Mock).mockReturnValue('light');

    const tree = create(
      <ParallaxScrollView headerImage={<></>} headerBackgroundColor={{ light: '#fff', dark: '#000' }}>
        <></>
      </ParallaxScrollView>
    ).toJSON();
    
    expect(tree).toMatchSnapshot();
  });
});
