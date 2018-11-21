import httpStatus from "http-status";
import {config} from "../../config/config";

const nodemailer = require('nodemailer');
const mg = require('nodemailer-mailgun-transport');

// This is your API key that you retrieve from www.mailgun.com/cp (free up to 10K monthly emails)
const auth = {
  auth: {
    api_key: process.env.MAILGUN_KEY,
    domain: process.env.MAILGUN_DOMAIN
  },
  // proxy: 'http://user:pass@localhost:8080' // optional proxy, default is false
}

const nodemailerMailgun = nodemailer.createTransport(mg(auth));

/**
 * get current deployed version
 */
function create(req, res) {
  const { from, to = (process.env.MAILGUN_RECEIVER || '').split(','), subject, html } = req.body
  if (!from || !to || !subject || !html) return res.status(httpStatus.BAD_REQUEST).json({
    message: 'Body does not contain any or all of the following fields: from, to, subject, html'
  })

  console.debug('auth', auth)
  console.debug('to', to)

  const toSendBody = {
    from: from,
    subject: subject,
    html: html
  }

  if (Array.isArray(to) && to.length > 1) {
    toSendBody.to = to[0]
    toSendBody.cc = to[1]
  } else if (Array.isArray(to)) {
    toSendBody.to = to[0]
  } else {
    toSendBody.to = to
  }

  nodemailerMailgun.sendMail({
    from: from,
    to: to,
    subject: subject,
    html: html
  }, (err, info) => {
    if (err) {
      return res.json(err.message)
    }
    else {
      return res.json(info.message)
    }
  });

  /*
  const mailOptions = {
    from: 'sender@email.com', // sender address
    to: 'dietmar.aumann@gmail.com', // list of receivers
    subject: 'Subject of your email', // Subject line
    html: '<p>Your html here</p>'// plain text body
  }

  transporter.sendMail(mailOptions, function (err, info) {
    if(err)
      return res.json(err)
    else
      return res.json(info)
  });
  */
}

export default { create }
