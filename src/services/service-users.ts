/******************
 * Author: Santhosh Suryavanshi
 * GitHub: https://github.com/santhusurya
 * Script Name: Fetch & Store Users JSON Data Service
 * Script Details:
 * 1) The Script to run as a separate service.
 * a) Write a script to fetch the users from. https://jsonplaceholder.typicode.com/users and save them in DB(DB_NAME: master, collection: users).
 * i) Also, add a default password for each user that can be used for login.
 * ii) Add user role(user can be either admin or viewer)
 ******************/

import axios from 'axios';
import bcrypt from 'bcrypt';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

export const serviceFetchStoreUsers = () => {
    // Define 2 user roles
    const userRoles = ['admin', 'viewer'];

    // Create hash of the password to be set for all the users
    const passwordHash = bcrypt.hashSync(process.env.USER_PASSWORD, 10);

    console.log('\x1b[36m%s\x1b[0m', `/******************\n* API FETCH & STORE TASK 1 - FETCH USERS - START \n*\n* 1. Fetch Users details from REST API ${process.env.USERS_API_URL} & modify the received users details by adding custom data: "password" & "user_role"\n* 2. Store the complete users data into a MongoDB: DB name as "${process.env.MASTER_DB_NAME}" & Collection name as "${process.env.USERS_COLLECTION_NAME}" \n******************/\n`);

    console.log('\x1b[33m%s\x1b[0m', '1. Connecting to Users API ' + process.env.USERS_API_URL + ' to fetch list of users details');

    // Start HTTPS GET request using AXIOS library
    axios.get(`${process.env.USERS_API_URL}`)
        .then(response => {

            /****
             * JSON processing scripts - START
             ****/

            console.log('\x1b[36m%s\x1b[0m', '2. Received JSON response from Users API');

            const usersJSON = JSON.stringify(response.data);

            // JSON data received from API was converted into Array using JSON.parse()
            const usersArray = JSON.parse(usersJSON);

            // Foreach User List Array to add custom "password" & "user_role" key & value
            usersArray.forEach(element => {
                // element.user_id = element.id;
                element.password = passwordHash;
                element.user_role = userRoles[Math.floor(Math.random() * 2)];
            });

            console.log('\x1b[32m%s\x1b[0m', '3. Users details was updated with "password" & "user_role" data');

            /****
             * JSON processing scripts - END
             ****/




            /****
             * MongoDB related scripts - START
             ****/

            console.log('\x1b[33m%s\x1b[0m', '4. Connecting to MongoDB Server to create new DB & Collection');

            // Create users DB if not exists
            MongoClient.connect(`${process.env.MONGODB_URL}` + `${process.env.MASTER_DB_NAME}`, { useNewUrlParser: true, useUnifiedTopology: true }, (err, db) => {
                if (err) throw err;

                console.log('\x1b[32m%s\x1b[0m', '5. ' + '"' + `${process.env.MASTER_DB_NAME}` + '" DB was created if not exists');

                // Select master DB
                const dbo = db.db(`${process.env.MASTER_DB_NAME}`);

                // Create collection 'users'
                dbo.createCollection(`${process.env.USERS_COLLECTION_NAME}`, (err, res) => {
                    if (err) throw err;

                    console.log('\x1b[32m%s\x1b[0m', '6. ' + '"' + `${process.env.USERS_COLLECTION_NAME}` + '" Collection was created if not exists');

                    // Reset Collection to EMPTY to make sure to add only FRESH Current Data
                    dbo.collection(`${process.env.USERS_COLLECTION_NAME}`).deleteMany({}, (err, result) => {
                        if (err) throw err;

                        console.log('\x1b[36m%s\x1b[0m', '7. Resetting Collection to Empty if contains any previous data');

                        // Insert all users received from API into "users" collection inside "master" DB
                        dbo.collection(`${process.env.USERS_COLLECTION_NAME}`).insertMany(usersArray, (err, res) => {
                            if (err) throw err;

                            console.log('\x1b[32m%s\x1b[0m', '8. "users" Collection was populated with users details received from Users API along with "password" and "user_role" data');

                            console.log('\x1b[36m%s\x1b[0m', '\n/******************\n* API FETCH & STORE TASK 1 - FETCH USERS - END\n******************/');

                            db.close();
                        });
                    });
                });
            });

            /****
             * MongoDB related scripts - END
             ****/

        })
        .catch(error => {
            console.log('\x1b[31m%s\x1b[0m', '2. Error receiving JSON response from Users API');
            console.log('\x1b[31m%s\x1b[0m', `Error from API ${process.env.USERS_API_URL}:- ` + error);
        });
}

serviceFetchStoreUsers();
