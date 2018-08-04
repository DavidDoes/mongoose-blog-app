'use strict'

exports.DATABASE_URL = 
    process.env.DATABASE_URL || 'mongodb://localhost/mongoose-blog-app' || 'mongodb://admin:password1@ds211558.mlab.com:11558/mongo-blog-app';
exports.PORT = 
    process.env.PORT || 8080

