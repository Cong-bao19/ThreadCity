import React from 'react';
import renderer from 'react-test-renderer';
import { HelloWave } from '../HelloWave';

describe('HelloWave', () => {
  it('renders correctly', () => {
    const tree = renderer.create(<HelloWave />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
