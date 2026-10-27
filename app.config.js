// Extends app.json. Passes CLAUDE_API_KEY (from .env.local) to the app via
// `extra`, since only EXPO_PUBLIC_* variables are forwarded automatically.
// Note: anything placed in `extra` is bundled into the app.
module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    claudeApiKey: process.env.CLAUDE_API_KEY ?? "",
  },
});
