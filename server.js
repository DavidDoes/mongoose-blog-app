'use strict'

const express = require('express')
const mongoose = require('mongoose')
const morgan = require('morgan')
mongoose.Promise = global.Promise

const {
    PORT,
    DATABASE_URL
} = require('./config')
const {
    Author,
    Blogpost
} = require('./models')

const app = express()
app.use(express.json())
app.use(morgan('common'))

//new:
app.get('/authors', (req, res) => {
    Author
        .find()
        .then(authors => {
            res.json(authors.map(author => {
                return {
                    id: author._id,
                    name: `${author.firstName} ${author.lastName}`,
                    userName: author.userName
                }
            }))
        })
        .catch(err => {
            console.error(err)
            res.status(500).json({
                error: 'Internal server error'
            })
        })
})

app.get('/authors/:id', (req, res) => {
    Blogpost.find()
        .then(posts => {
            console.log(posts)
            res.json({
                posts: posts.map(post => post.serialize())
            })
        })
        .catch(err => {
            console.error(err)
            res.status(500).json({
                message: 'Internal server error'
            })
        })
})

app.post('/authors', (req, res) => {
    const requiredFields = ['firstName', 'lastName', 'userName']
    requiredFields.forEach(field => {
        if (!(field in req.body)) {
            const message = `Missing \`${field}\` in request body`
            console.error(message)
            return res.status(400).send(message)
        }
    })
    Author
        .findOne({
            userName: req.body.userName
        })
        .then(author => {
            if (author) {
                const message = `Username has been taken`
                console.error(message)
                return res.status(400).send(message)
            } else {
                Author
                    .create({
                        firstName: req.body.firstName,
                        lastName: req.body.lastName,
                        userName: req.body.userName
                    })
                    .then(author => res.status(201).json({
                        _id: author.id,
                        name: `${author.firstName} ${author.lastName}`,
                        userName: author.userName
                    }))
                    .catch(err => {
                        console.error(err)
                        res.status(500).json({
                            error: 'Internal server error'
                        })
                    })
            }
        })
        .catch(err => {
            console.error(err)
            res.status(500).json({
                error: 'Internal server error'
            })
        })
})

app.put('/authors/:id', (req, res) => {
    if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
        res.status(400).json({
            error: 'Request path id and request body id should match'
        })
    }

    const toUpdate = {}
    const updateableFields = ['firstName', 'lastName', 'userName']
    updateableFields.forEach(field => {
        if (field in req.body) {
            updated[field] = req.body[field]
        }
    })
    Author
        .findOne({
            userName: updated.userName || '',
            _id: {
                $ne: req.params.id
            }
        })
        .then(author => {
            if (author) {
                const message = `Username is taken by someone else`
                console.error(message)
                return res.status(400).send(message)
            } else {
                Author
                    .findByIdAndUpdate(req.paramas.id, {
                        $set: updated
                    }, {
                        new: true
                    })
                    .then(updatedAuthor => {
                        res.status(200).json({
                            id: updatedAuthor.id,
                            name: `${updatedAuthor.firstName} ${updatedAuthor.lastName}`,
                            userName: updatedAuthor.userName
                        })
                    })
                    .catch(err => res.status(500).json({
                        message: err
                    }))
            }
        })
})

app.delete('/authors/:id', (req, res) => {
    Blogpost
        .remove({
            author: req.params.id
        })
        .then(() => {
            Author
                .findByIdAndRemove(req.params.id)
                .then(() => {
                    console.log(`Author and blog posts by author with id \`${req.params.id}\` have been deleted`)
                    res.status(204).json({
                        message: 'success'
                    })
                })
        })
        .catch(err => {
            console.error(err)
            res.status(500).json({
                error: 'Internal server error'
            })
        })
})

//GET requests should res with all posts in db
// /posts/:id should res with single post with :id if exists, using schema
app.get('/posts', (req, res) => {
    Blogpost.find() //find a blog post by doing:
        .then(posts => {
            console.log(posts) //console log all posts
            res.json({ //map thru, return json object of posts with structure
                posts: posts.map(post => {
                    return {
                        id: post._id,
                        author: post.authorName,
                        content: post.content,
                        title: post.title
                    }
                })
            })
        })
        .catch(err => {
            console.error(err)
            res.status(500).json({
                message: 'Internal server error'
            })
        })
})

app.get('/posts/:id', (req, res) => {
    Blogpost
        .findById(req.params.id) //give `findById` the id
        .then(post => { //return json object with structure
            res.json({
                id: post._id,
                author: post.authorName,
                content: post.content,
                title: post.title,
                comments: post.comments
            })
        })
        .catch(err => {
            console.error(err)
            res.status(500).json({
                message: 'Internal server error'
            })
        })
})

app.post('/posts', (req, res) => {
    const requiredFields = ['title', 'content', 'author_id']
    requiredFields.forEach(field => { //check for each requiredFields item
        if (!(field in req.body)) { //if not present, return error
            const message = `Missing \`${field}\` in request body`
            console.error(message);
            return res.status(400).send(message)
        }
    }) //if all requiredFields present:
    Author 
        .findById(req.body.author_id) //get author id
        .then(author => {
            if (author) {
                Blogpost //create Blogpost if author valid
                    .create({
                        title: req.body.title,
                        content: req.body.content,
                        author: req.body.id
                    }) //then return new Blogpost with structure
                    .then(blogPost => res.status(201).json({
                        id: blogPost.id,
                        author: `${author.firstName} ${author.lastName}`,
                        content: blogPost.content,
                        title: blogPost.title,
                        comments: blogPost.comments
                    }))
            }
        })
        .catch(err => {
            console.error(err)
            res.status(500).json({
                message: 'Internal server error'
            })
        })
})

app.put('/posts/:id', (req, res) => { //if any of following not matching, return error
    if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
        res.status(400).json({
            error: 'Request path id and request path body id must match'
        })
        // const message = 
        //     `Request path id (${req.params.id}) and request body id ` +
        //     `(${req.body.id}) must match`
        // console.error(message)
        // return res.status(400).json({ message: message })
    }

    const toUpdate = {}
    const updateableFields = ['title', 'content'] //not required to update both

    updateableFields.forEach(field => { 
        if (field in req.body) { //look for updateableFields in req body
            toUpdate[field] = req.body[field] //set toUpdate equal to req body's fields
        }
    })

    Blogpost // findByIdAndUpdate param 1 = value to change, param 2 = new value object
        .findByIdAndUpdate(req.params.id, {
            $set: toUpdate 
        }, {
            new: true //optional, true returns new document, false (default) returns previous
        })
        // .then(post => res.status(200).end())
        .then(updatedPost => res.status(200).json({ //return status 200 and updated values
            id: updatedPost.id,
            title: updatedPost.title,
            content: updatedPost.content
        }))
        .catch(err => res.status(500).json({
            message: 'Internal server error'
        }))
})

app.delete('/posts/:id', (req, res) => {
    Blogpost.findByIdAndRemove(req.params.id)
        .then(() => {
            console.log(`Blog post \`${req.params.id}\` has been deleted.`)
            res.status(204).end()
        })
        .catch(err => res.status(500).json({
            message: 'Internal server error'
        }))
})

app.use('*', function (req, res) {
    res.status(404).json({
        message: 'Not found'
    })
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

module.exports = {
    app,
    runServer,
    closeServer
};