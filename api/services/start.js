
var fs = require('fs');
module.exports.addRouts = function () {
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
                // console.log(last_index)
                description = str_url.slice(1, last_index)

                var newOrExistingRecord = await Routes.findOrCreate(
                    { end_point: str_url, description: description, status_id: Status.ACTIVE, }
                    , { end_point: str_url, description: description, status_id: Status.ACTIVE }
                );
                if (newOrExistingRecord) {
                    // console.log(newOrExistingRecord);
                    // {"role_id": 2 , "routes_id":54}

                    var newrr = await RolesRoutes.findOrCreate(
                        { roles: 1, routes: newOrExistingRecord.id, status_id: Status.ACTIVE }
                        , { roles: 1, routes: newOrExistingRecord.id, status_id: Status.ACTIVE }
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
            }).fetch();

            if (newAcount) {
                const pAccount = await Account.findOne({ name: parent_account ? parent_account.v : null })
                if (pAccount) {
                    await Account.addToCollection(newAcount.id, 'parent', pAccount.id);
                }
                console.log(newAcount.id);
            }
            // var desired_cell = worksheet['E22'];
            // var desired_value = (desired_cell ? desired_cell.v : undefined);
        }

        // console.log(desired_value);
    })
}