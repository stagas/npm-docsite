var getDocs = require('./util/get-docs')
  , registry = require('npm/utils/registry')
  , express = require('express')
  , markdown = require('markdown')
  , pkgcache = {}

module.exports = app = express.createServer()

app.configure(function () {
  app.set('view engine', 'jade')
})

app.get('/favicon.ico', function (req, res) {
  res.redirect('http://npmjs.org/favicon.ico', 301)
})

// 404 page.
app.get('/404', function (req, res) {
  res.render('404', {
    locals: {
      title: 'Page not found'
    }
  })
})

// Application root/index.
app.get('/', function (req, res) {
  registry.get('/', null, Infinity, false, function (er, data) {
    if (er) return error(er, res)
    res.render('index', {
      locals: {
        title: 'npmdoc'
        , pkgs: data
      }
    })
  })
})

// Package (or package subdirectory) page.
app.get(/^\/([^\/]+)(?:\/([^\/]+))?\/?$/, function (req, res) {
  var name = req.params[0]
    , version = req.params[1]

  registry.get(name, undefined, Infinity, false, function (er, data) {
    if (er) return error(er, res)
    // If no version specified, get the latest.
    if (!version) {
      version = data['dist-tags'].latest
    }
    getDocs(name, version, function (er, data) {
      if (er) return error(er, res)
      // TODO: Output a list of other versions of the pkg.
      res.render('pkg', {
        locals: {
          title: name + '@' + version
          , name: name
          , version: version
          , docpath: undefined
          , markdown: markdown
          , docs: data.docs
          , readme: data.readme
        }
      })
    })
  })
})

// Individual doc page.
app.get(/^\/([^\/]+)(?:\/([^\/]+))\/((?:.+)*)$/, function (req, res) {
  var name = req.params[0]
    , version = req.params[1]
    , docpath = req.params[2].split('/').filter(function (elem) {
    return elem.length > 0
  })

  getDocs(name, version, function (er, data) {
    if (er) return error(er, res)
    var target = data.docs
    // Determine if URL doc path is valid.
    var valid_path = (function () {
      var result = true
      docpath.forEach(function (elem) {
        if (!target[elem]) result = false
        else target = target[elem]
      })
      return result
    })()

    if (!valid_path) res.redirect('/404')

    // If target is a dir, then display it as such.
    // Otherwise, render the doc.
    if (typeof target === 'object') {
      res.render('pkg', {
        locals: {
          title: name + '@' + version + '/' + docpath.join('/')
          , name: name
          , version: version
          , docpath: docpath.join('/')
          , docs: target
          , readme: undefined
        }
      })
    } else {
      res.render('doc', {
        locals: {
          title: name + '@' + version + '/' + docpath.join('/')
          , markdown: markdown
          , doc: target
        }
      })
    }
  })
})

// Fall-through wildcard.
app.get('*', function (req, res) { res.redirect('404', 404) })


function error (er, res) {
  console.error(er.stack)
  res.redirect('/404')
}
