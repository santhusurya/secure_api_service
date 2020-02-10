import express from 'express';
import bodyParser from 'body-parser';
import passport from 'passport';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

/***
 * Express Server - START
 */


// create express app
const app = express();

// Set Server Listening port from .env file
const port = process.env.PORT;

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }))

// parse requests of content-type - application/json
app.use(bodyParser.json())

// define a simple route
app.get('/api/v1', (req, res) => {
    res.json({ "message": "Welcome to Secure API & Services Demo. This includes 2 Service & 5 API Endpoints." });
});



/***
 * TEST API URLs - START
 */

app.get('/api/v1/users', (req, res) => {
    MongoClient.connect(process.env.MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true }, (err, db) => {
        if (err) throw err;
        const dbo = db.db(process.env.MASTER_DB_NAME);
        dbo.collection(process.env.USERS_COLLECTION_NAME).find({}).toArray((err1, result) => {
            if (err1) throw err;
            db.close();
            res.json(result);
        });
    });
})

app.get('/api/v1/users/:id', (req, res) => {
    MongoClient.connect(process.env.MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true }, (err, db) => {
        if (err) throw err;
        const selectedUserId = parseInt(req.params.id, 10);
        const dbo = db.db(process.env.MASTER_DB_NAME);

        dbo.collection(process.env.USERS_COLLECTION_NAME).find({ id: selectedUserId }).toArray((err1, result) => {
            if (err1) throw err;
            db.close();
            res.json(result);
        });
    });
})


app.get('/api/v1/posts', (req, res) => {
    const allPosts = [];
    const userID = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    userID.forEach(element => {
        MongoClient.connect(process.env.MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true }, (err, db) => {
            if (err) throw err;

            const dbo = db.db(process.env.USER_DB_NAME_PREFIX + element);
            dbo.collection(process.env.USER_POSTS_COLLECTION_NAME).find({}).toArray((err1, result) => {
                if (err1) throw err;
                db.close();
                if (result.length !== 0) {
                    allPosts.push(result);
                }
                else {
                    res.json({ "message" : "EMPTY DB"});
                }

                if (element === 10) {
                    setTimeout(() => {
                        res.json(allPosts);
                    }, 2000);
                }

            });
        });
    });
})


app.get('/api/v1/posts/user/:id', (req, res) => {

    MongoClient.connect(process.env.MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true }, (err, db) => {
        if (err) throw err;

        const selectedUserId = req.params.id;
        const dbo = db.db(process.env.USER_DB_NAME_PREFIX + selectedUserId);
        dbo.collection(process.env.USER_POSTS_COLLECTION_NAME).find({}).toArray((err1, result) => {
            if (err1) throw err;
            db.close();
            if (result.length !== 0) {
                res.json(result);
            }
            else {
                res.json({ "message": "EMPTY DB" });
            }

        });
    });
})

/***
 * TEST API URLs - END
 */




// Handle errors
app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.json({ error: err });
});

// listen for requests
app.listen(port, err => {
    if (err) {
        return console.error(err);
    }
    return console.log(`Web Server Is Listening on Port No ${port}`);
});

/***
 * Express Server - END
 */