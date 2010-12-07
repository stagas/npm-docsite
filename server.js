var npm = require("npm")
  , server = require("./http-server")

npm.load({}, function (er) {
  if (er) throw er
  server.listen(npm.config.get("npm_docsite__port") || 8008)
})
