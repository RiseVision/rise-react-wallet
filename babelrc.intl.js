module.exports = {
  presets: ['@babel/preset-typescript', '@babel/preset-react'],
  plugins: [
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    '@babel/plugin-syntax-dynamic-import',
    [
      'babel-plugin-react-intl',
      {
        messagesDir: './tmp/intl/messages/'
      }
    ],
    '@babel/plugin-transform-react-jsx'
  ]
};
