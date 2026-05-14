const nodemailer = require('nodemailer');

const createTransporter = () => {
  // En desarrollo, si no hay credenciales configuradas, se podría usar Ethereal o un logger
  if (!process.env.MAIL_HOST) {
    console.warn('Configuración de correo no encontrada. Los correos se imprimirán en consola.');
    return {
      sendMail: async (options) => {
        console.log('--- EMAIL MOCK ---');
        console.log(`Para: ${options.to}`);
        console.log(`Asunto: ${options.subject}`);
        console.log(`Cuerpo: ${options.text}`);
        console.log('------------------');
        return { messageId: 'mock-id' };
      }
    };
  }

  return nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: process.env.MAIL_SECURE === 'true',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });
};

const transporter = createTransporter();

const sendInvitationEmail = async (to, senderName, invitationLink) => {
  const mailOptions = {
    from: `"Asistente Académico" <${process.env.MAIL_FROM || 'no-reply@asistente.edu'}>`,
    to,
    subject: `Invitación de contacto de ${senderName}`,
    text: `Hola! ${senderName} quiere sumarte a sus contactos en el Asistente Académico. 
    Para aceptar la invitación, haz clic en el siguiente enlace: ${invitationLink}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
        <h2 style="color: #4A90E2;">¡Hola!</h2>
        <p><strong>${senderName}</strong> quiere sumarte a sus contactos en el Asistente Académico.</p>
        <p>Al ser contactos, podrán compartir sus situaciones académicas y colaborar más fácilmente.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${invitationLink}" style="background-color: #4A90E2; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Aceptar Invitación</a>
        </div>
        <p style="font-size: 0.8rem; color: #777;">Si no reconoces a esta persona, puedes ignorar este correo.</p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};

const sendUserNotFoundEmail = async (to, requestedEmail) => {
  const mailOptions = {
    from: `"Asistente Académico" <${process.env.MAIL_FROM || 'no-reply@asistente.edu'}>`,
    to,
    subject: `Usuario no encontrado: ${requestedEmail}`,
    text: `Hola! Intentaste enviar una invitación a ${requestedEmail}, pero no encontramos a ningún usuario registrado con ese email.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
        <h2 style="color: #E24A4A;">Usuario no encontrado</h2>
        <p>Hola,</p>
        <p>Intentaste enviar una invitación de contacto a <strong>${requestedEmail}</strong>.</p>
        <p>Lamentablemente, no encontramos a ningún usuario registrado con esa dirección de correo electrónico en nuestra plataforma.</p>
        <p>Asegúrate de que el correo sea correcto o invita a tu compañero a unirse a la plataforma primero.</p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};

module.exports = {
  sendInvitationEmail,
  sendUserNotFoundEmail
};
