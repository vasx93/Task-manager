const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const host_mail = process.env.HOST_MAIL;

module.exports = {
	welcomeEmail(email, name) {
		sgMail.send({
			to: email,
			from: host_mail,
			subject: `${name}, welcome to Task It!`,
			text: ` Thank you for joining our team at Task It!. If you need some help further up on the road, dont hesistate to contact us!`,
		});
	},
	cancelAccountEmail(email, name) {
		sgMail.send({
			to: email,
			from: host_mail,
			subject: `Sorry to see you leave ${name}!`,
			text:
				'If you could state out the reason of your leave, it would be very helpful in the future. GGWP',
		});
	},
};
