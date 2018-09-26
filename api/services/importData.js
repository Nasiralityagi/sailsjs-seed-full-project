const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
var jsonfile = require('jsonfile')
var _ = require('lodash');
var Passwords = require('machinepack-passwords');
var Promise = require("bluebird");
var moment = require('moment');

// DATA FILES

module.exports = {
    importData: async function () {
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
                    'bandwidth': 2,
                    'data_limit': 2,
                    'cost_price': 2121,
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
                    importResult.users++
                    const newAcount = await Account.create({
                        'name': newUser.username,
                        'root_type': Account.INCOME,
                        'account_type': Account.CASH,
                        'account_number': 0,
                        'is_group': false,
                        'status_id': Status.ACTIVE,
                        // 'createdBy': req.token.user.id, // current logged in user id 
                    }).fetch();

                    if (newAcount) {
                        await Account.addToCollection(newAcount.id, 'parent', 129);
                    }
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

                    // let encryptedPassword = await util.getEncryptedPasswordAsync(connectionData[12]);


                    const countCustomer = await Customers.count({ "mobile": connectionData[22] });
                    if (countCustomer <= 0) {
                        let name = connectionData[20];
                        let first_name = name.split(' ')[0];
                        let last_name = name.substring(first_name.length).trim();
                        const newCustomer = await Customers.create({
                            "first_name": first_name == '' ? 'Null' : first_name,
                            "last_name": last_name,
                            "email": "",
                            "password": connectionData[12],
                            "mobile": connectionData[22],
                            "cnic": connectionData[21],
                            "customer_verified": true,
                            "manually_mobile_verified": true,
                            "username": connectionData[22].substr(1, connectionData[22].length),
                            "status_id": Status.ACTIVE,
                            "createdBy": 2,
                        }).fetch();
                        if (newCustomer) {
                            importResult.customers++;
                            sails.log('Created a new customer: ' + newCustomer.id);
                            for (let i = 1; i <= 2; i++) {
                                const customerVerify = await CustomerVerify.create({
                                    customers: newCustomer.id,
                                    doc_type: i,
                                    is_verified: i == 1 ? true : false,
                                    status_id: Status.ACTIVE,
                                    createdBy: 2, // current logged in user id
                                });
                            }

                            


                            let _address = (connectionData[23] == undefined || connectionData[23] == "") ? "RYK" : connectionData[23];
                            console.log("date -- > ", connectionData[8], _.isDate(new Date(connectionData[8])));
                            moment("06/22/2015", "MM/DD/YYYY", true).isValid(); // true
                            if (_.isDate(new Date(connectionData[8]))) {
                                let registration_date = moment(new Date(connectionData[8])).format("YYYY-MM-DD HH:mm:ss");
                                console.log(registration_date, _.isDate(registration_date));

                                if (moment(registration_date, "YYYY-MM-DD HH:mm:ss", true).isValid()) {


                                    const _connection = await Connection.create({
                                        'address': _address,
                                        'router_of': null,
                                        "router_brand": null,
                                        "router_model": null,
                                        "router_price": null,
                                        "drop_wire_of": 1,
                                        "drop_wire_length": 213,
                                        "price_per_meter": 23123,
                                        'registration_date': registration_date,
                                        'is_wireless': 0,
                                        'connection_price': 1000,
                                        'doc_verified': true,
                                        'customers': newCustomer.id,
                                        'packages': 2,
                                        'new_package': 2,
                                        'dealer': 2,
                                        'createdBy': 2,
                                        'status_id': Status.ACTIVE,
                                    }).fetch();
                                    if (_connection) {
                                        // create invoice of connection
                                        const newInvoices = await Invoices.create({
                                            'customers': _connection.customers,
                                            'total_price': _connection.connection_price,
                                            'package_price': _connection.connection_price,
                                            'packages': _connection.new_package,
                                            'status_id': Status.ACTIVE,
                                            'createdBy': _connection.customers, // current logged in user id
                                        }).fetch();
                                        importResult.connections++;
                                        // if(wasCreated){
                                        sails.log("new connection: ", _connection.id);

                                        const newAcount = await Account.create({
                                            'name': connectionData[22].substr(1, connectionData[22].length),
                                            'root_type': Account.INCOME,
                                            'account_type': Account.CASH,
                                            'account_number': 0,
                                            'is_group': false,
                                            'status_id': Status.ACTIVE,
                                        }).fetch();

                                        if (newAcount) {
                                            await Account.addToCollection(newAcount.id, 'parent', 99);
                                        }

                                        // } else {
                                        //     sials.log("existing connection: ", _connection.id);
                                        // }
                                        // 'activation_date': activation_date.toDate(),
                                        // 'expiration_date': expiration_date.toDate(),
                                        // 'renewal_price': req.param('renewal_price'),
                                        // 'cost_price': cost_price,
                                        // 'status_id': Status.PAID,
                                        // 'connection': req.param('connection_id'),
                                        // 'user': req.token.user.id,
                                        // 'createdBy': req.token.user.id

                                        const packagePrice = await Packages.findOne({ id: _connection.packages });

                                        let activation_date = moment(new Date(connectionData[9])).format('YYYY-MM-DD HH:mm:ss');
                                        let expiration_date = moment(new Date(connectionData[9])).add(1, 'M').format('YYYY-MM-DD HH:mm:ss');

                                        console.log(activation_date, expiration_date);
                                        if (moment(activation_date, "YYYY-MM-DD HH:mm:ss", true).isValid()) {

                                            const newConnRenewal = await ConnRenewal.create({
                                                'activation_date': activation_date,
                                                'status_id': Status.ACTIVE,
                                                'renewal_price': 3243,
                                                'user': 2,
                                                'cost_price': packagePrice ? packagePrice.cost_price : 1234,
                                                'createdBy': 2,
                                                'expiration_date': expiration_date,
                                                'connection': _connection.id
                                            }).fetch();

                                            console.log("--- > connRenewal : ", newConnRenewal.id);
                                        }
                                    }
                                    else {
                                        continue;
                                    }
                                }
                            }
                        }
                        // if (newConnection) {
                        //     importResult.connections++;
                        //     console.log("new connection: ", newConnection.id)
                        // }


                    }




                    // if(connectionData[23] !== undefined){
                    // }


                    // "registration_date": connectionData[8],

                    // "installed_by": connectionData[6],



                }
                console.log(COUNT_REC);


            }
            return {
                importResult: importResult
            };
        }
    }
}