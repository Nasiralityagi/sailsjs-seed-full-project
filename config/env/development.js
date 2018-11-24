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


    
    // host:'139.99.46.84',
    // host:'localhost',
    host:'192.168.31.93',
    // host:'192.168.100.5',
    datastores: {
        default: {
          // No need to set `adapter` again, because we already configured it in `config/datastores.js`.
          url: 'mysql://root:@localhost:3306/linkerbits_alpha'
        //   url: 'mysql://linker:tiger@localhost:3306/linkerbits_alpha'
        }
      },

      models:{
        migrate: 'safe',
        // migrate: 'alter',
      },
    

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
        // baseUrl: 'https://ee355a14.ngrok.io/',
        // appUrl: 'http://localhost:1337/', 
        appUrl: 'http://192.168.31.93:1337/',        
        mailer: '',
        mailinPort: 2526,

    },
   
    // these details are for abdul.bsse1399@gmail.com. Replace with an linkerbits account
    GOOGLE: {
        CLIENT_ID: '595077466690-vbcf4ubfdng2b1nrb402mj147e018v.apps.googleusercontent.com',
        SECRET: 'pLutB0O1ThBS4mrw3nCweB'
    },   

    port: 1337,
    LOG_QUERIES: 'true',
    hookTimeout: 200000
};
