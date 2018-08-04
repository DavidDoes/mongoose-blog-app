'use strict'

const mongoose = require('mongoose')
mongoose.Promise = global.Promise

//new:
var authorSchema = mongoose.Schema({
    firstName: 'string',
    lastName: 'string',
    userName: {
        type: 'string',
        unique: true
    }
})
//new (referenced on line 26)
var commentSchema = mongoose.Schema({ content: 'string' })

//schema for single post
var postSchema = mongoose.Schema({
    title: 'string',
    content: 'string',
    author: { //links to Author collection to retrieve author values; we need line 30 `.populate()` for this ref to work
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Author'
    },
    comments: [commentSchema]
})
//pre hook so that author collection is available to schema, otherwise firstName and lastName undefined. used by serialize on line 47
postSchema.pre('find', function(next){
    this.populate('author') //merge data from authors collection; Mongoose will then automatically look for ref on line 24 
    next()
})

postSchema.pre('findOne', function(next){
    this.populate('author') //because author in separate collection, need to merge it to get serialize to work in virtual below
    next()
})

//virtual
postSchema.virtual('authorName').get(function(){
    return `${this.author.firstName} ${this.author.lastName}`.trim()
})

//instance method
postSchema.methods.serialize = function() {
    return {
        id: this._id,
        title: this.title,
        content: this.content,
        author: this.authorName,
        comments: this.comments
    }
}

//mongoose automatically looks for plural version
//var nameOfVar = mongoose.model('CollectionName', 'schemaForCollection')
var Author = mongoose.model('Author', authorSchema)
const Blogpost = mongoose.model('Blogpost', postSchema)

module.exports = {Blogpost}