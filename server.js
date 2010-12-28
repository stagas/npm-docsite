var npm = require("npm")
  , server = require("./express-app")
  , port = npm.config.get("npm_docsite__port") || process.env.PORT || 8008

npm.load({}, function (er) {
  if (er) throw er
  server.listen(port)
})
