
var moment = require('moment');
var commonQuery = { status_id: { '!=': Status.DELETED } };
module.exports = {
    customerExpire: async function (req, res) {
        if (!(req.param('days')) || isNaN(req.param('days')))
            return res.badRequest('Not a valid request');
        let days = req.param('days');
        var today = new Date();
        var myToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
        let dateStart = moment(myToday).add(days, 'days').format("YYYY-MM-DD HH:mm:ss");
        let dateEnd = moment(myToday).add(days+1, 'days').format("YYYY-MM-DD HH:mm:ss");
        let queryObject;
        if (req.token.user.role.id == 2) {
            let connection = await Connection.find(
                {
                    where: { status_id: { '!=': Status.DELETED }, dealer: req.token.user.id },
                    select: ['id']
                },
            );
            // console.log(connection);
            let connectionList = [];
            for(let c of connection){
                connectionList.push(c.id);
            }
            queryObject = {
                where: { connection: {in:connectionList}, status_id: { '!=': Status.DELETED }, expiration_date: {'>=': dateStart, '<': dateEnd} },
            };
        }
        else {
            queryObject = {
                where: { status_id: { '!=': Status.DELETED }, expiration_date: {'>=': dateStart, '<': dateEnd} },
            };
        }
        ConnRenewal.count(queryObject).exec(function countCB(err, found) {
            if (err) {
                return res.json({ err: err });
            }
            return res.json({ count: found });
        }
        );
    },
    customerExpirePercentage: async function (req, res) {
        if (!(req.param('days')) || isNaN(req.param('days')))
            return res.badRequest('Not a valid request');
        let days = req.param('days');
        var today = new Date();
        var myToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
        let date = moment(myToday).add(days, 'days').format("YYYY-MM-DD HH:mm:ss");
        let queryObject;
        if (req.token.user.role.id == 2) {
            let connection = await Connection.find(
                {
                    where: { status_id: { '!=': Status.DELETED }, dealer: req.token.user.id },
                    select: ['id']
                },
            );
            queryObject = {
                where: { connection: connection.id, status_id: { '!=': Status.DELETED }, expiration_date: { 'like': '%' + date + '%' } },
            };
        }
        else {
            queryObject = {
                where: { status_id: { '!=': Status.DELETED }, expiration_date: { 'like': '%' + date + '%' } },
            };
        }
        ConnRenewal.count(queryObject).exec(function countCB(err, found) {
            // console.log(result);
            if (err) {
                return res.json({ err: err });
            }
            ConnRenewal.count(commonQuery)
                .exec(function cb(error, foundObj) {
                    if (!error) {
                        let responseObj = (found / foundObj) * 100;
                        return res.json({ percentage: responseObj });
                    }
                    else {
                        return res.json({ error: error });
                    }

                })

        }
        );
    },
    totalCustomer: async function (req, res) {
        if (req.token.user.role.id == 2) {
            let connection = await Connection.find(
                {
                    where: { status_id: { '!=': Status.DELETED }, dealer: req.token.user.id },
                    select: ['dealer', 'customers']
                },
            );
            var obj = _.groupBy(connection, 'dealer');
            let count;
            for (let key in obj) {
                if (obj.hasOwnProperty(key)) {
                    count = obj[key].length;
                }
            }
            return res.json({ count: count })
        }
        else {
            Customers.count(commonQuery)
                .exec(function (err, count) {
                    if (!err) {
                        return res.json({ count: count })
                    }
                    return res.json({ err: err })

                })

        }
    },
    customerByDealer: async function (req, res) {

        const userList = await User.find({
            where : { status_id: { '!=': Status.DELETED }, role:2 }
        });
        if (!userList) {
            throw new CustomError('user not found', {
                status: 403
            });
        }
        let arrobj = [];
        let data;
      
        for (let ul in userList) {
            let connection = await Connection.find(
                {
                    where: { status_id: { '!=': Status.DELETED }, dealer: userList[ul].id },
                    select: ['dealer', 'customers']
                },
            );
            data = {};
            if (connection.length >= 1) {
                var obj = _.groupBy(connection, 'dealer');
                
                for (let key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        // const user = await User.findOne({ id: key });
                        // if (!user) {
                        //     throw new CustomError('user not found', {
                        //         status: 403
                        //     });
                        // }
                        data = {
                            // dealer: '',
                            // customers: '',
                        }
                        data.id = userList[ul].id;
                        data.dealer = userList[ul].first_name;
                        data.customers = obj[key].length;
                        // data['customers'] = ccount;
                        arrobj.push(data);
                    }
                }
            }
            else{
                data.id = userList[ul].id;
                data.dealer = userList[ul].first_name;
                data.customers = 0;
                // console.log(data);
                arrobj.push(data);

            }
            
            

        }
        return res.json(arrobj);

    },
    monthTimeline: async function (req, res) {
        if (!(req.param('month')) || isNaN(req.param('month')))
            return res.badRequest('Not a valid month');
        const month = req.param('month');
        let daysInMonth = moment(month, "MM").daysInMonth();
        let arrobj = [];
        for (let d = 1; d <= daysInMonth; d++) {
            // console.log(d);
            let date = new Date(2018, month - 1, d);
            let mDate = moment(date).format("YYYY-MM-DD HH:mm:ss");
            let dateStart = moment(mDate).format("YYYY-MM-DD HH:mm:ss");
            let dateEnd = moment(mDate).add(1, 'days').format("YYYY-MM-DD HH:mm:ss");
            // console.log(mDate);
            let queryObject = {
                where: { status_id: { '!=': Status.DELETED }, expiration_date: {'>=': dateStart, '<': dateEnd}  },
            };
            const count = await ConnRenewal.count(queryObject);
            // console.log(result);
            // if (!count) {
            //     return res.json({ err: err });
            // }
            arrobj.push(count);
            // console.log(count);
            ;
        }
        return res.json(arrobj);
    }

}