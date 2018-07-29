'use strict'

const express = require('express')
const mongoose = require ('mongoose')

mongoose.Promise = global.Promise

const {PORT, DATABASE_URL} = require('./config')
const {Blogpost} = require('./models')

const app = express()
app.use(express.json())

//GET requests should res with all posts in db
// /posts/:id should res with single post with :id if exists, using schema
app.get('/posts', (req, res) => {
    Blogpost.find()
        .then(posts => {
            console.log(posts)
            res.json({
                posts: posts.map(post => post.serialize())
            })
        })
        .catch(err => {
            console.error(err)
            res.status(500).json({ message: 'Internal server error'})
        })
})

app.get('/posts/:id', (req, res) => {
    Blogpost.findById(req.params.id)
        .then(post => res.json(post.serialize()))
        .catch(err => {
            console.error(err)
            res.status(500).json({ message: 'Internal server error' })
        })
})

app.post('/posts', (req, res) => {
    const requiredFields = ["title", "content", "author"]
    for (let i = 0; i < requiredFields.length; i++) {
        const field = requiredFields[i]
        if (!(field in req.body)) {
            const message = `Missing \`${field}\` in request body`
            console.error(message)
            return res.status(400).send(message)
        }
    }
    Blogpost.create({
        title: req.body.title,
        content: req.body.content,
        author: {
            firstName: req.body.author.split(' ')[0],
            lastName: req.body.author.split(' ')[1]
        }
    })
    .then(post => { //find blog post by id, stringify
        Blogpost.findById(post.id)
        .then(post => res.status(201).json(post.serialize())
    )
    })
    .catch(err => {
        console.error(err)
        res.status(500).json({ message: 'Internal server error' })
    })
})

app.put('/posts/:id', (req, res) => {
    const requiredFields = ["id"]
    if(!(req.params.id && req.body.id && req.params.id === req.body.id)) {
        const message = 
            `Request path id (${req.params.id}) and request body id ` +
            `(${req.body.id}) must match`
        console.error(message)
        return res.status(400).json({ message: message })
    }

    const toUpdate = {}
    const updateableFields = ["title", "content", "author"]

    updateableFields.forEach(field => {
        if (field in req.body) {
            toUpdate[field] = req.body[field]
        }
    })

    Blogpost
        .findByIdAndUpdate(req.params.id, {$set: toUpdate})
        .then(post => res.status(200).end())
        .catch(err => res.status(500).json({ message: 'Internal server error' }))
})

app.delete('/posts/:id', (req, res) => {
    Blogpost.findByIdAndRemove(req.params.id)
        .then(post => res.status(204).end())
        .catch(err => res.status(500).json({ message: 'Internal server error' }))
})

let server;

function runServer(databaseUrl, port = PORT) {
    return new Promise((resolve, reject) => {
      mongoose.connect(
        databaseUrl,
        err => {
          if (err) {
            return reject(err);
          }
          server = app
            .listen(port, () => {
              console.log(`Your app is listening on port ${port}`);
              resolve();
            })
            .on("error", err => {
              mongoose.disconnect();
              reject(err);
            });
        }
      );
    });
  }

  function closeServer() {
    return mongoose.disconnect().then(() => {
      return new Promise((resolve, reject) => {
        console.log("Closing server");
        server.close(err => {
          if (err) {
            return reject(err);
          }
          resolve();
        });
      });
    });
  }

  if (require.main === module) {
    runServer(DATABASE_URL).catch(err => console.error(err));
  }
  
  module.exports = { app, runServer, closeServer };

//   mongoimport --db mongoose-blog-app --collection blogposts --drop --file ~/Documents/projects/Databases/seed-data.json