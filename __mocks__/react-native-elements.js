const React = require('react');

// Create mock components for all common react-native-elements components
const createMockComponent = (name) => {
  const component = (props) => {
    return React.createElement(name, props, props.children);
  };
  return component;
};

// Mock the most commonly used components from react-native-elements
module.exports = {
  Avatar: createMockComponent('Avatar'),
  Badge: createMockComponent('Badge'),
  Button: createMockComponent('Button'),
  ButtonGroup: createMockComponent('ButtonGroup'),
  Card: createMockComponent('Card'),
  CheckBox: createMockComponent('CheckBox'),
  Divider: createMockComponent('Divider'),
  Header: createMockComponent('Header'),
  Icon: createMockComponent('Icon'),
  Image: createMockComponent('Image'),
  Input: createMockComponent('Input'),
  ListItem: createMockComponent('ListItem'),
  Overlay: createMockComponent('Overlay'),
  PricingCard: createMockComponent('PricingCard'),
  Rating: createMockComponent('Rating'),
  SearchBar: createMockComponent('SearchBar'),
  Slider: createMockComponent('Slider'),
  SocialIcon: createMockComponent('SocialIcon'),
  Text: createMockComponent('Text'),
  Tile: createMockComponent('Tile'),
  Tooltip: createMockComponent('Tooltip'),
  // Animation related
  Animated: {
    timing: jest.fn().mockReturnValue({
      start: jest.fn(),
    }),
    spring: jest.fn().mockReturnValue({
      start: jest.fn(),
    }),
    Value: jest.fn().mockReturnValue({
      interpolate: jest.fn().mockReturnValue({}),
      setValue: jest.fn(),
      addListener: jest.fn(),
    }),
    inOut: jest.fn(),
  },
  // Theme related
  ThemeProvider: createMockComponent('ThemeProvider'),
  withTheme: jest.fn((Component) => Component),
};
