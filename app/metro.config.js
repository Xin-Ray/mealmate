const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  "@src": path.resolve(__dirname, "src"),
};

module.exports = withNativeWind(config, { input: "./global.css" });
