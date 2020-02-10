/******************
 * Author: Santhosh Suryavanshi
 * GitHub: https://github.com/santhusurya
 * Script Name: Fetch & Store POSTS & COMMENTS JSON Data Service
 * Script Details:
 * 1) The Script to run as a separate service.
 * b) Write a script to fetch posts and comments from https://jsonplaceholder.typicode.com/posts and https://jsonplaceholder.typicode.com/comments respectively.
 * i) Map comments to the posts as an array. Based on the userId, the post will be added to its respective user DB (collection=posts).
 * Note: One DB per user and each user DB will have posts collection.
 * For example: There are 3 users: A, B, C There Should be 3 DBs: A. B, C and each should have collection 'posts'.
 ******************/

import axios from 'axios';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();


export const serviceFetchStorePostsComments = () => {

    console.log('\x1b[36m%s\x1b[0m', `/******************\n* API FETCH & STORE TASK 2 - FETCH POSTS & COMMENTS - START \n*\n* 1. Fetch Posts & Comments details from REST API ${process.env.POSTS_API_URL} & ${process.env.COMMENTS_API_URL} respectively. Next combine Comments with Posts based on PostIDs."\n* 2. Store the complete POSTS segregated based on Posts UserID into separate MongoDB: DB with name prefix "${process.env.USER_DB_NAME_PREFIX}" combined with corresponding UserIDs & Collection name as "${process.env.USER_POSTS_COLLECTION_NAME}" \n******************/\n`);

    console.log('\x1b[33m%s\x1b[0m', '1. Connecting to POSTS & COMMENTS API ' + process.env.POSTS_API_URL + ' & ' + process.env.COMMENTS_API_URL + ' respectively to fetch list of Posts & Comments details');

    // Start HTTPS GET request using AXIOS library - Fetching 2 different URLs at once
    axios.all([
        axios.get(process.env.POSTS_API_URL),
        axios.get(process.env.COMMENTS_API_URL)
    ])
        .then(responseArr => {
            // this part will be executed only when all requests are complete

            /****
            * JSON processing scripts - START
            ****/

            console.log('\x1b[36m%s\x1b[0m', '2. Received JSON response from POSTS & COMMENTS API');

            // POSTS API URL JSON response data converted into Array using JSON.parse()
            const postsJSON = JSON.stringify(responseArr[0].data);
            const postsArray = JSON.parse(postsJSON);

            // COMMENTS API URL JSON response data converted into Array using JSON.parse()
            const commentsJSON = JSON.stringify(responseArr[1].data);
            const commentsArray = JSON.parse(commentsJSON);


            /**
             * Combine Comments with respective Posts - START
             */
            postsArray.forEach(postElement => {
                let count = 0;
                const commentsItemArray = [];

                commentsArray.forEach(commentElement => {
                    if (commentElement.postId === postElement.id) {
                        commentsItemArray[count] = commentElement;
                        count++;
                    }
                });

                postElement.comments = commentsItemArray;
            });

            console.log('\x1b[32m%s\x1b[0m', '3. Combined COMMENTS ARRAY with each & every respective POSTS');

            /**
             * Combine Comments with respective Posts - END
             */


            /**
             * Extract Unique User IDs from all the posts - START
             */

            const postUserIds = [];
            let userIdCount = 0;

            // Extract user id of all the posts into a separate array
            postsArray.forEach(postElement => {
                postUserIds[userIdCount] = postElement.userId;
                userIdCount++;
            });

            // Extract only unique values from all posts user IDs array
            const uniqueUserIds = [...new Set(postUserIds)];

            /**
             * Extract Unique User IDs from all the posts - END
             */


            /**
             * Extract All Posts into separate Array based on User IDs to push them into separate DBs based on User IDs - START
             */

            // Initialize multi-dimensional empty array
            const userPostsArray = [];
            uniqueUserIds.forEach(userId => {
                userPostsArray[userId] = [];
            });

            // Group all the posts based on User IDs
            uniqueUserIds.forEach(userId => {
                let postCount = 0;
                postsArray.forEach(postElement => {
                    if (postElement.userId === userId) {
                        userPostsArray[userId][postCount] = postElement;
                        postCount++;
                    }
                });
            });

            console.log('\x1b[32m%s\x1b[0m', '4. Created a temporary array with all the POSTS/COMMENTS grouped together based on User IDS of POSTS. This will be used to push the POSTS into separate DB as per User IDs');

            /**
             * Extract All Posts into separate Array based on User IDs to push them into separate DBs based on User IDs - END
             */

            /****
             * JSON processing scripts - END
             ****/



            /****
            * MongoDB related scripts - START
            ****/

            console.log('\x1b[33m%s\x1b[0m', '5. Connecting to MongoDB Server to create new DBs & Collections');

            // For each & every user IDs create a separate DB & associated POSTS Collection
            uniqueUserIds.forEach(userId => {

                // Generate name for DB for each & every User Ids
                const userDbName = `${process.env.USER_DB_NAME_PREFIX}` + userId;


                // Create posts DB if not exists
                MongoClient.connect(`${process.env.MONGODB_URL}` + userDbName, { useNewUrlParser: true, useUnifiedTopology: true }, (err, db) => {
                    if (err) throw err;

                    console.log('\x1b[32m%s\x1b[0m', '6. ' + '"' + userDbName + '" DB was created if not exists');

                    // Select DB for further operations
                    const dbo = db.db(userDbName);

                    // Create collection 'posts'
                    dbo.createCollection(`${process.env.USER_POSTS_COLLECTION_NAME}`, (err, res) => {
                        if (err) throw err;

                        dbo.collection(`${process.env.USER_POSTS_COLLECTION_NAME}`).deleteMany({}, (err, result) => {
                            if (err) throw err;
                            console.log('\x1b[32m%s\x1b[0m', '7. DB NAME' + userDbName + ' - "' + `${process.env.USER_POSTS_COLLECTION_NAME}` + '" Collection was created if not exists');

                            console.log('\x1b[36m%s\x1b[0m', '8. DB - ' + userDbName + ' - Resetting Collection to Empty if contains any previous data');

                            dbo.collection(`${process.env.USER_POSTS_COLLECTION_NAME}`).insertMany(userPostsArray[userId], (err, res) => {
                                if (err) throw err;

                                console.log('\x1b[32m%s\x1b[0m', '9. DB - ' + userDbName + ' was populated with posts & associated comments from every individual users based on user ids into "posts" Collection ');

                                if (userId === 10) {
                                    setTimeout(() => {
                                        console.log('\x1b[36m%s\x1b[0m', '\n/******************\n* API FETCH & STORE TASK 2 - FETCH POSTS & COMMENTS - END\n******************/');
                                    }, 5000);
                                }


                                db.close();
                            });
                        });
                    });
                });
            });

            /****
            * MongoDB related scripts - END
            ****/
        }).catch(error => {
            console.log('\x1b[31m%s\x1b[0m', '2. Error receiving JSON response from POSTS & COMMENTS API');
            console.log('\x1b[31m%s\x1b[0m', `Error from API ${process.env.POSTS_API_URL} & ${process.env.COMMENTS_API_URL}:- ` + error);
        });
}

serviceFetchStorePostsComments();
