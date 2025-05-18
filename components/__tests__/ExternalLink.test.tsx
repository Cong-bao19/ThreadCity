import React from 'react';
import renderer from 'react-test-renderer';
import { ExternalLink } from '../ExternalLink';

describe('ExternalLink', () => {
  it('renders correctly', () => {
    const tree = renderer.create(
      <ExternalLink href="https://example.com">Example</ExternalLink>
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
