
var fs = require('fs');
module.exports.addRoutes = function () {
    fs.readFile('./config/routes.js', async (err, data) => {
        if (err) throw err;
        for (let d of data.toString().split('\n')) {
            if (d.includes('POST') || d.includes('GET') || d.includes('DELETE')) {
                // console.log(d);
                let first_index = d.indexOf('/')
                let last_index = d.indexOf('\'', 10)
                // console.log(fn , " " , ln);
                let str_url = d.slice(first_index, last_index)
                let description = '';
                if (str_url.includes(':')) {
                    last_index = str_url.indexOf(':');
                    str_url = str_url.slice(0, last_index - 1);



                }
                last_index = str_url.lastIndexOf('/')
                table_name = str_url.slice(1, last_index);
                operation = str_url.slice(last_index + 1, str_url.length);
                switch (operation) {
                    case 'create':
                        description = operation + ' ' + table_name;
                        break;
                    case 'findOne':
                        description = 'get one ' + table_name + ' by id';
                        break;
                    case 'find':
                        description = 'get all ' + table_name;
                        break;
                    case 'update':
                        description = 'update ' + table_name + ' by id';
                        break;
                    case 'delete':
                        description = 'delete ' + table_name + ' by id';
                        break;
                    case 'login':
                        description = table_name + ' login by mobile and password';
                        break;
                    case 'logout':
                        description = table_name + ' logout by id';
                        break;
                    default:
                        break;
                }

                var newOrExistingRecord = await Routes.findOrCreate(
                    { end_point: str_url, status_id: Status.ACTIVE, }
                    , { end_point: str_url, description: description, status_id: Status.ACTIVE }
                );
                if (newOrExistingRecord) {
                    // console.log(newOrExistingRecord);
                    // {"role_id": 2 , "routes_id":54}

                    var newrr = await RolesRoutes.findOrCreate(
                        { roles: 1, routes: newOrExistingRecord.id, status_id: Status.ACTIVE }
                        , { roles: 1, routes: newOrExistingRecord.id, description: description, status_id: Status.ACTIVE }
                    );
                    // console.log(newrr);
                }
            }
        }
        //  console.log(data.toString());

    });
};

// read excel file
var fs = require('fs');

module.exports.addAccount = function () {

    fs.readFile('./assets/Account.xlsx', async (err, data) => {
        var workbook = XLSX.read(data, { type: 'buffer' });
        var first_sheet_name = workbook.SheetNames[0];
        var worksheet = workbook.Sheets[first_sheet_name];
        for (let i = 21; i <= 109; i++) {
            let name = worksheet['C' + i];
            let root_type = worksheet['H' + i];
            let account_type = worksheet['L' + i];
            let account_number = worksheet['F' + i];
            let is_group = worksheet['G' + i];
            let parent_account = worksheet['E' + i];
            // console.log(name ? name.v : '', root_type ? root_type.v : '', account_number ? account_number.v : '',
            //   account_type ? account_type.v : '', is_group ? is_group.v : '', parent_account ? parent_account.v : '');
            //   // One of: Asset, Liability, Income, Expense, Equity

            switch (root_type ? root_type.v : '') {
                case 'Income':
                    root_type = Account.INCOME
                    break;
                case 'Asset':
                    root_type = Account.ASSET
                    break;
                case 'Liability':
                    root_type = Account.LIABILITY
                    break;
                case 'Expense':
                    root_type = Account.EXPENSE
                    break;
                case 'Equity':
                    root_type = Account.EQUITY
                    break;

                default:
                    root_type = null;
            }
            // console.log(account_type);
            switch (account_type ? account_type.v : '') {
                case 'Bank':
                    account_type = Account.BANK
                    break;
                case 'Cash':
                    account_type = Account.CASH
                    break;

                default:
                    account_type = Account.CASH;
            }
            // console.log(account_type);
            const newAcount = await Account.create({
                'name': name ? name.v : '',
                'root_type': root_type,
                'account_type': account_type,
                'account_number': account_number ? account_number.v : 0,
                'is_group': is_group ? is_group.v : null,
                'status_id': Status.ACTIVE,
                'createdBy': req.token.user.id, // current logged in user id
            }).fetch();

            if (newAcount) {
                const pAccount = await Account.findOne({ name: parent_account ? parent_account.v : null })
                if (pAccount) {
                    await Account.addToCollection(newAcount.id, 'parent', pAccount.id);
                }
                // console.log(newAcount.id);
            }
            // var desired_cell = worksheet['E22'];
            // var desired_value = (desired_cell ? desired_cell.v : undefined);
        }

        // console.log(desired_value);
    })
},

module.exports.connectionCheck = async function () {
        // const connection = await Connection.find({
        //     where: { status_id: { nin: [Status.DELETED, Status.REJECTED, Status.PACKAGE_UPDATED] } }
        // });

        // for (let c of connection) {
        //     const invoiceCount = await Invoices.count({ customers: c.customers, packages: { '!=': null }, paid: true, status_id: Status.ACTIVE });
        //     await Connection.update({
        //         id: c.id
        //     }, {
        //             status_id: invoiceCount > 0 ? Status.ACTIVE : Status.PAID
        //         });

        // }
        await Connection.update({ where: { in_review: true } }).set({ in_review: false });
},

module.exports.startCronJobs = async function () {
        let queryObject = {
            where: { status_id: { '!=': Status.DELETED } },
            sort: 'id ASC',
        };
        const crons = await Notify.find(queryObject);

        if (crons) {
            for (const element of crons) {
                util.cronStart(element.id, element.cron_job_time, element.expires_in);
            };
        }
        //console.log(corns);


} 
module.exports.cleanDatabase = async function () {
    await Account.destroy({id:{'>':140}});
    await JournalEntryAccount.destroy({});
    await JournalEntry.destroy({});
    await InvoiceStock.destroy({});
    await TokenVerify.destroy({});
    await CustomerVerify.destroy({});
    await AccountLedgerEntry.destroy({});
    await ChangeMac.destroy({});
    await ChangePackage.destroy({});
    await ChangePassword.destroy({});
    await ConnRenewal.destroy({});
    await Connection.destroy({});
    await Invoices.destroy({});
    await Customers.destroy({});
    
    console.log('Database cleaned.');
    return 'Database cleaned.';

} 