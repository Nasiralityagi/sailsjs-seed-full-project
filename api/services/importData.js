const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
var jsonfile = require('jsonfile')
var _ = require('lodash');
var Passwords = require('machinepack-passwords');
var Promise = require("bluebird");

// DATA FILES

module.exports = {
    'importData': async function () {
        console.log("in function...")
        var DATA_PACKAGES = 'data/data_packages.json';
        var DATA_USERS = 'data/data_users.json';
        var DATA_CUSTOMERS = 'data/data_customers.json';
        var DATA_CONNECTIONS = 'data/data_connections.json';

        //templates
        let template_users = [];
        let template_customers = [];
        let template_connections = [];
        let importResult = {}

        // If modifying these scopes, delete credentials.json.
        const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
        const TOKEN_PATH = 'credentials.json';




        // let importData = () => {

        // hybridNotification.sendSMS("923345111683", "LinkerBits SMS Notifications");
        const process = async () => {
            let reportData = await generateReport(null);

            // console.log("finished!")
            // jsonfile.writeFile(DATA_USERS, reportData.template_users, { spaces: 2 }, function (err) {
            //     console.error(err)
            // })
            // jsonfile.writeFile(DATA_CUSTOMERS, reportData.template_customers, { spaces: 2 }, function (err) {
            //     console.error(err)
            // })
            // jsonfile.writeFile(DATA_CONNECTIONS, reportData.template_connections, { spaces: 2 }, function (err) {
            //     console.error(err)
            // })
            return reportData;
        }
        process()
            .then(v => console.log(v))
            .catch(err => console.error(err))
        // res.send('Hello World');

        // } importDAta function
        //function for to read file
        async function generateReport(_reportDate) {
            let readFile = Promise.promisify(fs.readFile);
            let content = await readFile('client_secret.json');
            //error
            let test = await authorize(JSON.parse(content), _reportDate);

            return test;

            // fs.readFile('client_secret.json', (err, content) => {
            //   if (err) return console.log('Error loading client secret file:', err);
            //   // Authorize a client with credentials, then call the Google Sheets API.
            //   authorize(JSON.parse(content), listMajors);
            // });
        }

        /**
         * Create an OAuth2 client with the given credentials, and then execute the
         * given callback function.
         * @param {Object} credentials The authorization client credentials.
         * @param {function} callback The callback to call with the authorized client.
         */
        async function authorize(credentials, _reportDate) {
            const { client_secret, client_id, redirect_uris } = credentials.installed;
            const oAuth2Client = new google.auth.OAuth2(
                client_id, client_secret, redirect_uris[0]);

            // Check if we have previously stored a token.

            let readFile = Promise.promisify(fs.readFile);
            let token = await readFile(TOKEN_PATH);

            oAuth2Client.setCredentials(JSON.parse(token));

            let expireCustomers = await listMajors(oAuth2Client, _reportDate);


            // fs.readFile(TOKEN_PATH, (err, token) => {
            //   if (err) return getNewToken(oAuth2Client, callback);
            //   oAuth2Client.setCredentials(JSON.parse(token));
            //   callback(oAuth2Client);
            // });

            return expireCustomers;
        }

        /**
         * Get and store new token after prompting for user authorization, and then
         * execute the given callback with the authorized OAuth2 client.
         * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
         * @param {getEventsCallback} callback The callback for the authorized client.
         */
        function getNewToken(oAuth2Client, callback) {
            const authUrl = oAuth2Client.generateAuthUrl({
                access_type: 'offline',
                scope: SCOPES,
            });
            console.log('Authorize this app by visiting this url:', authUrl);
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout,
            });
            rl.question('Enter the code from that page here: ', (code) => {
                rl.close();
                oAuth2Client.getToken(code, (err, token) => {
                    if (err) return callback(err);
                    oAuth2Client.setCredentials(token);
                    // Store the token to disk for later program executions
                    fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                        if (err) console.error(err);
                        console.log('Token stored to', TOKEN_PATH);
                    });
                    callback(oAuth2Client);
                });
            });
        }

        /**
         * Prints the names and majors of students in a sample spreadsheet:
         * @see https://docs.google.com/spreadsheets/d/1GrzNr0nL0TJoNiCQhhn7ckOrZQc6QasuP7Xz6jGqHJQ/edit
         * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
         */

        // function to read file and perform operations
        async function listMajors(auth, _reportDate) {

            // var function1 = async () => {
            const sheets = google.sheets({ version: 'v4', auth });
            let spreadsheets = Promise.promisify(sheets.spreadsheets.values.get);

            let connections = await spreadsheets({
                spreadsheetId: '1GrzNr0nL0TJoNiCQhhn7ckOrZQc6QasuP7Xz6jGqHJQ',
                range: 'Connections!A2:Z', //Sheet name and rows to read 
            });

            let dealers = await spreadsheets({
                spreadsheetId: '1GrzNr0nL0TJoNiCQhhn7ckOrZQc6QasuP7Xz6jGqHJQ',
                range: 'Notification!A2:C', //Sheet name and rows to read 
            });
            let lookupPackages = await spreadsheets({
                spreadsheetId: '1GrzNr0nL0TJoNiCQhhn7ckOrZQc6QasuP7Xz6jGqHJQ',
                range: 'Data!F2:F7', //Sheet name and rows to read 
            });


            //dealers iteration
            importResult.packages = 0

            /* script to import package data*/

            for (let lookupPackage of lookupPackages.data.values) {
                // console.log(lookupPackage[0])
                const newPackage = await Packages.create({
                    'package_name': lookupPackage[0],
                    'bandwidth': "",
                    'data_limit': "",
                    'status_id': Status.ACTIVE,
                }).fetch();

                if (newPackage) {
                    importResult.packages++;
                    console.log("newpackage: ", newPackage.id);
                }
            }


            importResult.users = 0;

            /* script to import newUser data*/

            for (let data of dealers.data.values) {
                let encryptedPassword = await util.getEncryptedPasswordAsync(data[1]);
                const newUser = await User.create({
                    "title": "Mr",
                    "first_name": data[0],
                    "last_name": data[0],
                    'mobile': data[1],
                    "username": data[0],
                    'email': "",
                    'job_title': "",
                    'password': encryptedPassword,
                    'status_id': Status.ACTIVE,
                    'role_type': 1,
                    'role': 2
                }).fetch();
                if (newUser) {
                    importResult.users
                    console.log("newUser: ", newUser.id);
                }

            }

            //customers and connection iteration
            let COUNT_REC = 0;
            // for (let i = 0; i < connections.data.values.length; i++) {
            importResult.customers = 0
            importResult.connections = 0
            // for (let i = 0; i < 100; i++) {

                let scope = this;


            for (let connectionData of connections.data.values) {

                var reportDate = new Date();
                var d = new Date(connectionData[9]);
                date1 = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
                date2 = Date.UTC(reportDate.getFullYear(), reportDate.getMonth(), reportDate.getDate());
                var ms = Math.abs(date2 - date1);
                var diffDays = Math.floor(ms / 1000 / 60 / 60 / 24);
                // if (diffDays > 24 && diffDays < 32) {
                if (true) {
                    COUNT_REC++;
                
                    let encryptedPassword = await util.getEncryptedPasswordAsync(connectionData[12]);
                    let name = connectionData[20]
                    let first_name = name.split(' ')[0]
                    let last_name = name.substring(first_name.length).trim()

                    const newCustomer = await Customers.findOrCreate({ "mobile": connectionData[22] }, {
                        "first_name": first_name,
                        "last_name": last_name,
                        "email": "",
                        "password": encryptedPassword,
                        "mobile": connectionData[22],
                        "cnic": connectionData[21],
                        "status_id": Status.ACTIVE
                    }).exec(async (err, user, wasCreated) => {
                        if (!err) {

                            importResult.customers++;
                            if(wasCreated){
                                sails.log('Created a new customer: ' + user.id);
                            } else {
                                sails.log('found the customer: ' + user.id);
                            }
                            let _address = (connectionData[23] == undefined || connectionData[23] == "") ? "RYK" : connectionData[23];
                            console.log("date -- > ", connectionData[8])
                            const newConnection = await Connection.findOrCreate({ 'username': connectionData[11] }, {
                                'address': _address,
                                'router_of': "null",
                                "router_brand": "",
                                "router_model": "32",
                                "router_price": "34",
                                "drop_wire_of": connectionData[14],
                                "drop_wire_length": "34",
                                "price_per_meter": "21",
                                'username': connectionData[11],
                                'password': connectionData[12],
                                'registration_date': new Date(connectionData[8]),
                                'is_wireless': 0,
                                'customers': user.id,
                                'packages': 2,
                                'dealer': 2,
                                'status_id': Status.ACTIVE,
                            }).exec(async function (err, _connection, wasCreated) {
                                if (!err) {
                                    importResult.connections++;
                                    if(wasCreated){
                                        sails.log("new connection: ", _connection.id);
                                    } else {
                                        sials.log("existing connection: ", _connection.id);
                                    }

                                    const newConnRenewal = await ConnRenewal.create({
                                        'activation_date': new Date(connectionData[9]),
                                        'status_id': Status.ACTIVE,
                                        'connection': _connection.id
                                    }).fetch();
                                    console.log("--- > connRenewal : ", newConnRenewal.id);
                                }
                            });
                            // if (newConnection) {
                            //     importResult.connections++;
                            //     console.log("new connection: ", newConnection.id)
                            // }

                        }
                    });


                    // if(connectionData[23] !== undefined){
                    // }


                    // "registration_date": connectionData[8],

                    // "installed_by": connectionData[6],

                }

            }
            console.log(COUNT_REC);



            return {
                importResult: importResult
            };
        }

    }
}