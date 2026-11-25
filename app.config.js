module.exports = ({ config }) => {
  const plugins = [...(config.plugins || [])];
  const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (googleMapsApiKey) {
    plugins.push([
      'react-native-maps',
      { androidGoogleMapsApiKey: googleMapsApiKey },
    ]);
  }

  return { ...config, plugins };
};
