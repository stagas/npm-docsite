var npm = require("npm")
  , http = require("http")
  , fs = require("npm/utils/graceful-fs")
  , cache = require("npm/cache")
  , registry = require("npm/utils/registry")
  , path = require("path")
  , url = require("url")
  , server

module.exports = server = http.createServer(function (req, res) {
  var ru = url.parse(req.url).pathname
  if (req.url.toLowerCase() === "/favicon.ico") {
    res.writeHead(301, {location:"http://npmjs.org/favicon.ico"})
    res.end('<a href="http://npmjs.org/favicon.ico">/favicon.ico</a>')
    return
  }
  // if the first two parts of the url are /<name>/<version> then
  // it's a docsite request.
  var parts = ru.split("/")
    , name = parts[1]
    , ver = parts[2]
  if (!name || !ver) {
    return registry.get(ru, null, Infinity, false, function (er, data) {
      if (er) return error(er, res)
      res.writeHead(200, {"content-type":"application/json"})
      res.end(JSON.stringify(data))
    })
  }
  cache.read(name, ver, function (er, data) {
    if (er) return cache.add(name, ver, gotData(req, res))
    gotData(req, res)(er, data)
  })
  function gotData (req, res) { return function (er, data) {
    if (er) return error(er, res)
    res.writeHead(200, {"content-type":"text/plain"})
    // try to find docdir
    var docs = data.directories && data.directories.docs
             || data.directories && data.directories.doc
             || data.docs || data.doc || null
    if (docs) return gotDocs(req, res, docs, data)
    res.end("nothing found")
  }}
})
function gotDocs (req, res, docs, data) {
  var docPath = path.join(npm.cache, data.name, data.version, "package", docs)
  fs.readdir(docPath, function (er, files) {
    res.end(docPath + "\n"+ JSON.stringify(files))
  })
}
function error (er, res) {
  res.writeHead(500)
  res.end(er.stack || er.message)
}
