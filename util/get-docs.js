var fs = require('fs')
  , path = require('path')
  , npm = require('npm')
  , cache = require('npm/cache')
  , asyncMap = require('npm/utils/async-map')

module.exports = getDocs

// Fetch documentation and readme for a given package@version from npm.
function getDocs (name, version, cb) {
  cache.read(name, version, function (er, pkgjson) {
    if (er) cb(er)
    else {
      var cachedir = npm.cache + '/' + name + '/' + version + '/package/'
      getReadme(cachedir, function (er, readme) {
        if (er) return cb(er)
        var obj = {
          readme: readme
          , docs: null
        }
        if (pkgjson.directories && pkgjson.directories.doc &&
            pkgjson.directories.doc !== '.') {
          // NOTE: Filtering out pkgs that specify pkg root as doc dir.
          dirToJson(cachedir + pkgjson.directories.doc, function(er, docs) {
            if (er) return cb(er, null)
            obj.docs = docs
            cb(null, obj)
          })
        } else cb(null, obj)
      })
    }
  })
}

// Locates and fires callback on any README files in the argument dir.
function getReadme(dir, cb) {
  fs.readdir(dir, function(er, filelist) {
    if (er) return cb(er)
    filelist = filelist.filter(function (fname) {
      return fname.match(/^readme/i) !== null
    })
    fs.readFile(dir + filelist[0], 'utf8', function(er, data) {
      cb(null, data)
    })
  })
}

// Returns an object of files within the argument directory and all subdirs.
function dirToJson (dir, cb) {
  fs.readdir(dir, function (er, filelist) {
    if (er) return cb(er)
    var obj = {}
    asyncMap(filelist, function (file, cb) {
      var basename = path.basename(file, path.extname(file))
      fs.stat(dir + '/' + file, function(er, stats) {
        if (er) return cb(er)
        if (stats.isDirectory()) {
          // If a dir, then recurse.
          dirToJson(path.join(dir, file), function (er, data) {
            if (er) return cb(er)
            obj[basename] = data
            cb()
          })
        } else {
          // Only include markdown files.
          if (['.md', '.mmd', '.markdown'].indexOf(path.extname(file))
              !== -1) {
            fs.readFile(dir + '/' + file, 'utf8', function (er, data) {
              if (er) return cb(er)
              obj[basename] = data
              cb()
            })
          } else cb()
        }
      })
    }, function (er) { cb(er, obj) })
  })
}
