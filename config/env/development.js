/**
 * Development environment settings
 *
 * This file can include shared settings for a development team,
 * such as API keys or remote database passwords.  If you're using
 * a version control solution for your Sails app, this file will
 * be committed to your repository unless you add it to your .gitignore
 * file.  If your repository will be publicly viewable, don't add
 * any private information to this file!
 *
 */

module.exports = {
    /***************************************************************************
     * Set the default database connection for models in the development       *
     * environment (see config/connections.js and config/models.js )           *
     ***************************************************************************/


    // datastore: {
    //     mysqlServer: {
    //         adapter: 'sails-mysql',
    //         // user: 'sails-no-del',   // this mysql user doesn't have any DELETE permission
    //         user: 'root',
    //         password: '',
    //         database: 'linkerbits_alpha'
    //         //socketPath : '/tmp/mysql.sock'
    //     },

    //     mySqlSafe: {
    //       adapter: 'sails-mysql',
    //       user: 'sails-no-del',   // this mysql user doesn't have any DELETE permission
    //       // user: 'root',
    //       password: '',
    //       database: 'linkerbits_alpha'
    //       //socketPath : '/tmp/mysql.sock'
    //     },

    //   /**
    //    * use this one when you modify a table and want to generate new mysql table structure for that.
    //    */
    // //   onlyForStructure: {
    // //       adapter: 'sails-mysql',
    // //       user: 'root',
    // //       password: '',
    // //       database: 'linkerbits_api_tmp'
    // //     }
    // },
    host:'localhost',


    // datastore: {
    //     connection: 'mysqlServer',
    //     migrate: 'safe'
    // },

    log: {
        //level: 'silly'
    },    
    mailer: '',

    mandrillApiKey: '',  //live key
    // mandrillApiKey: 'W9dBFohZ1Cdq2KwPUkwWrg', // test key    

    googleAPIKey:'',    
// pwd: beta2017, uName: beta.test
    defConfig: {
        account:{},
        baseUrl: 'https://ee355a14.ngrok.io/',
        appUrl: 'http://localhost:1337/',        
        mailer: '',
        mailinPort: 2526,

    },
   
    // these details are for abdul.bsse1399@gmail.com. Replace with an linkerbits account
    GOOGLE: {
        CLIENT_ID: '595077466690-vbcf4akubfdng2b1nrb402mj147e018v.apps.googleusercontent.com',
        SECRET: 'pLutB0O1ThBSHl4mrw3nCweB'
    },   

    port: 1337,
    LOG_QUERIES: 'true',
    hookTimeout: 200000
};
