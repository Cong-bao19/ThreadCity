import React from 'react';
import { useColorScheme } from '@/hooks/useColorScheme';
import renderer from 'react-test-renderer';
import { Collapsible } from '../Collapsible';

// Mock useColorScheme hook
jest.mock('@/hooks/useColorScheme', () => ({
  useColorScheme: jest.fn(),
}));

describe('Collapsible', () => {
  it('renders closed by default', () => {
    // Mock trả về theme là 'light'
    (useColorScheme as jest.Mock).mockReturnValue('light');  // Type casting để đảm bảo jest.Mock được nhận diện

    const tree = renderer.create(
      <Collapsible title="Test Title">Content</Collapsible>
    ).toJSON();

    expect(tree).toMatchSnapshot();
  });
});
