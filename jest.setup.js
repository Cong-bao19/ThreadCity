// Cài đặt biến môi trường và mock cho Jest
// The path might have changed in newer versions of react-native-reanimated
// so we're mocking it manually instead of importing it

// Mock for global Flow types
global.Flow = {
  setNonOptionalType: jest.fn(),
  setOptionalType: jest.fn(),
  setMaybeOptionalType: jest.fn()
};

// Mock Expo's polyfill modules
jest.mock('expo/src/winter/PolyfillFunctions', () => ({
  polyfillGlobal: jest.fn(),
  polyfillObject: jest.fn(),
  install: jest.fn(),
  default: {
    polyfillGlobal: jest.fn(),
    polyfillObject: jest.fn(),
    install: jest.fn()
  }
}), { virtual: true });

jest.mock('expo/src/winter/runtime.native', () => ({
  install: jest.fn(),
  default: { install: jest.fn() }
}), { virtual: true });

jest.mock('expo/src/winter/index', () => ({}), { virtual: true });

// Mock for __DEV__ global variable which is used in React Native
global.__DEV__ = true;

// Mock for React Native's ErrorUtils
global.ErrorUtils = {
  setGlobalHandler: jest.fn(),
  getGlobalHandler: jest.fn(() => jest.fn()),
  reportError: jest.fn(),
  reportFatalError: jest.fn(),
};

// Mock cho expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy'
  }
}));

// Mock cho expo-blur
jest.mock('expo-blur', () => ({
  BlurView: 'BlurView'
}));

// Mock cho react-native-qrcode-svg
jest.mock('react-native-qrcode-svg', () => 'QRCode');

// Mock cho react-native-vector-icons
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');

// Mock cho useThemeColor hook
jest.mock('@/hooks/useThemeColor', () => ({
  useThemeColor: () => '#000000'
}));

// Mock cho useColorScheme hook
jest.mock('@/hooks/useColorScheme', () => ({
  __esModule: true,
  default: () => 'light'
}));

// Thêm process.env.EXPO_OS nếu cần
process.env.EXPO_OS = 'ios';

// Mock cho react-navigation
jest.mock('@react-navigation/elements', () => ({
  PlatformPressable: ({ children, ...props }) => {
    const React = require('react');
    return React.createElement('View', props, children);
  }
}));

// Mock cho TabBarBackground
jest.mock('@/components/ui/TabBarBackground', () => ({
  useBottomTabOverflow: () => ({ bottom: 0 })
}));

// Mock cho expo-router
jest.mock('expo-router', () => ({
  Link: ({ children, ...props }) => {
    const React = require('react');
    return React.createElement('View', props, children);
  }
}));

// Mock expo-web-browser
jest.mock('expo-web-browser', () => ({
  openBrowserAsync: jest.fn()
}));

// Mock expo-symbols which is causing issues
jest.mock('expo-symbols', () => ({
  SymbolView: require('react-native').View,
  SymbolWeight: {
    REGULAR: 'regular',
    SEMIBOLD: 'semibold',
    BOLD: 'bold'
  }
}));

// Mock React Native components that are causing issues
const mockRNComponent = (name) => {
  const React = require('react');
  const MockComponent = (props) => {
    return React.createElement('div', props, props.children);
  };
  MockComponent.displayName = name;
  return MockComponent;
};

// Mock React Native directly to avoid circular references
jest.mock('react-native', () => ({
  View: function View(props) { return props.children; },
  Text: function Text(props) { return props.children; },
  TouchableOpacity: function TouchableOpacity(props) { return props.children; },
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
    spring: jest.fn(() => ({ start: jest.fn() }))
  },
  ScrollView: function ScrollView(props) { return props.children; },
  Dimensions: {
    get: jest.fn(() => ({ width: 390, height: 844, scale: 2, fontScale: 1 })),
  },
  Image: function Image(props) { return null; },
}), { virtual: true });

// Better mock for Reanimated with all necessary methods
jest.mock('react-native-reanimated', () => {
  const Reanimated = {
    default: {
      call: jest.fn(),
      createAnimatedComponent: (component) => component,
      Value: jest.fn(() => ({
        setValue: jest.fn(),
      })),
      event: jest.fn(),
      add: jest.fn(),
      sub: jest.fn(),
      multiply: jest.fn(),
      divide: jest.fn(),
      interpolate: jest.fn(() => ({
        interpolate: jest.fn(),
      })),
      useSharedValue: jest.fn(() => ({
        value: 0,
      })),
      useAnimatedStyle: jest.fn(() => ({})),
      useAnimatedScrollHandler: jest.fn(() => jest.fn()),
      useAnimatedGestureHandler: jest.fn(() => jest.fn()),
      Extrapolation: { CLAMP: 'clamp' },
      withSpring: jest.fn(),
      withTiming: jest.fn(),
      withDecay: jest.fn(),
      withSequence: jest.fn(),
      withRepeat: jest.fn(),
      FadeIn: {
        duration: jest.fn().mockReturnValue({
          delay: jest.fn().mockReturnValue({
            withCallback: jest.fn()
          })
        })
      },
      FadeOut: {
        duration: jest.fn().mockReturnValue({
          delay: jest.fn().mockReturnValue({
            withCallback: jest.fn()
          })
        })
      }
    },
    View: function AnimatedView(props) { return props.children; },
    Text: function AnimatedText(props) { return props.children; },
    Image: function AnimatedImage(props) { return null; },
    ScrollView: function AnimatedScrollView(props) { return props.children; },
    createAnimatedComponent: jest.fn(component => component),
    useSharedValue: jest.fn(() => ({
      value: 0,
    })),
    useAnimatedStyle: jest.fn(() => ({})),
    useAnimatedScrollHandler: jest.fn(() => jest.fn()),
    useScrollViewOffset: jest.fn(() => 0),
    useAnimatedRef: jest.fn(() => ({ current: {} })),
    useAnimatedGestureHandler: jest.fn(() => jest.fn()),
    withSpring: jest.fn(),
    withTiming: jest.fn(),
    withDecay: jest.fn(),
    withSequence: jest.fn(),
    withRepeat: jest.fn(),
    interpolate: jest.fn()
  };
  return Reanimated;
});

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

// Mock Expo constants
jest.mock('expo-constants', () => ({
  Constants: {
    expoConfig: {
      extra: {
        supabaseUrl: 'https://mock-supabase-url.com',
        supabaseAnonKey: 'mock-anon-key',
      },
    },
  },
}));
