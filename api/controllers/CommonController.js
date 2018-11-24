/**
 * CommonController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
var moment = require('moment');
var fs = require('fs');
module.exports = {
    create_grace_days: async function (req, res) {
        if (!_.isNumber(req.param('grace_days'))) {
            return res.badRequest("grace_days required");
        }
        await GracePeriod.destroy({});
        const grace_period = await GracePeriod.create({
            grace_days: req.param('grace_days'),
            createdBy: req.token.user.id
        }).fetch();
        if (!grace_period) {
            return res.status(401).send({ err: 'error while creating grace period' });
        }
        else
            return res.ok(grace_period);
    },
    find_grace_period: async function (req, res) {

        const grace_period = await GracePeriod.find();

        if (grace_period.length < 1) {
            return res.status(401).send({ err: 'error while finding grace period' });
        }
        else {
            return res.ok(grace_period[0])
        }
    },
    update_grace_period: async function (req, res) {
        if (!_.isNumber(req.param('grace_days'))) {
            return res.badRequest("grace_days required");
        }
        const grace_period = await GracePeriod.update().set({ grace_days: req.param('grace_days') }).fetch();
        if (grace_period.length < 1) {
            return res.status(401).send({ err: 'error while finding grace period' });
        }
        else {
            return res.ok(grace_period[0])
        }
    },
    clearDatabase: async function (req, res) {
        const invoice = await Invoices.find({});
        for (const i of invoice) {
            if (fs.existsSync('./assets/files/invoice/' + i.id + '.pdf')) {
                fs.unlinkSync('./assets/files/invoice/' + i.id + '.pdf');
            }

        }
        const result = await start.cleanDatabase();
        return res.ok(result);
    },
    hello: async function (req, res) {
        sails.sockets.join(req.socket, req.token.user.username);
        res.json({ message: 'youve subscribed to a room : ' + req.token.user.username });
    },
    leave: async function (req, res) {
        sails.sockets.leave(req.socket, req.token.user.username);
        res.json({ message: 'youve unsubscribed from a room : ' + req.token.user.username });
    }

};

