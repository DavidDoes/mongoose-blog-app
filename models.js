'use strict'

const mongoose = require('mongoose')

//schema for single post
const postSchema = mongoose.Schema({
    title: {type: String, required: true },
    content: {type: String, required: true },
    author: {
        firstName: String, required: true,
        lastName: String, required: true 
    },
    created: {type: Number, required: false}
})

//virtual
postSchema.virtual('authorName').get(function(){
    return `${this.author.firstName} ${this.author.lastName}`.trim()
})

//instance method
postSchema.methods.serialize = function() {
    return {
        id: this._id,
        title: this._title,
        content: this._content,
        author: this.authorName
    }
}

const Blogpost = mongoose.model('Blogpost', postSchema)

module.exports = {Blogpost}