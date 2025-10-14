module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|react-native-animatable|react-native-modal|react-native-safe-area-context|react-native-url-polyfill)/)',
  ],
};
