// A simple mock for react-native
module.exports = {
  View: function View(props) { return props.children; },
  Text: function Text(props) { return props.children; },
  TouchableOpacity: function TouchableOpacity(props) { return props.children; },
  TouchableHighlight: function TouchableHighlight(props) { return props.children; },
  TouchableWithoutFeedback: function TouchableWithoutFeedback(props) { return props.children; },
  StyleSheet: {
    create: (styles) => styles,
    flatten: jest.fn((style) => style),
    hairlineWidth: 1
  },
  Platform: {
    OS: 'ios',
    select: jest.fn((obj) => obj.ios),
    Version: 42
  },
  Animated: {
    View: function AnimatedView(props) { return props.children; },
    Text: function AnimatedText(props) { return props.children; },
    timing: jest.fn(() => ({ start: jest.fn() })),
    spring: jest.fn(() => ({ start: jest.fn() })),
    createAnimatedComponent: jest.fn((component) => component)
  },
  Dimensions: {
    get: jest.fn(() => ({ width: 390, height: 844, scale: 2, fontScale: 1 })),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  },
  TextInput: function TextInput(props) { return null; },
  Image: function Image(props) { return null; },
  ScrollView: function ScrollView(props) { return props.children; },
  FlatList: function FlatList(props) { return null; },
  SectionList: function SectionList(props) { return null; }
};
