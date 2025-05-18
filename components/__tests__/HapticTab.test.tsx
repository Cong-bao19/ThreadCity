import React from 'react';
import { create } from 'react-test-renderer';
import { HapticTab } from '../HapticTab';

describe('HapticTab', () => {
    it('renders correctly', () => {
        const props = { onPressIn: jest.fn(), children: 'Test' };
        const tree = create(<HapticTab {...props} />).toJSON();
        expect(tree).toMatchSnapshot();
    });
});
