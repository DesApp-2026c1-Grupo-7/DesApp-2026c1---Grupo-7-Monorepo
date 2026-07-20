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

const sendSessionConfirmationEmail = async (to, studentName, session) => {
  const fecha = new Date(session.fechaHora).toLocaleString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const infoAdicional = session.tipo === 'virtual' 
    ? `<p><strong>Link de la sesión:</strong> <a href="${session.link}">${session.link}</a></p>`
    : `<p><strong>Ubicación:</strong> ${session.ubicacion}</p>`;

  const mailOptions = {
    from: `"Asistente Académico" <${process.env.MAIL_FROM || 'no-reply@asistente.edu'}>`,
    to,
    subject: `Confirmación de inscripción: Sesión de ${session.materia.nombre}`,
    text: `¡Hola ${studentName}! Tu inscripción a la sesión de estudio de ${session.materia.nombre} ha sido confirmada.
    Tema: ${session.tema}
    Fecha: ${fecha}
    ${session.tipo === 'virtual' ? `Link: ${session.link}` : `Ubicación: ${session.ubicacion}`}
    
    ¡Muchos éxitos en tu estudio!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
        <h2 style="color: #4A90E2;">¡Inscripción Confirmada!</h2>
        <p>Hola <strong>${studentName}</strong>,</p>
        <p>Tu inscripción a la siguiente sesión de estudio ha sido confirmada:</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Materia:</strong> ${session.materia.nombre}</p>
          <p style="margin: 5px 0;"><strong>Tema:</strong> ${session.tema}</p>
          <p style="margin: 5px 0;"><strong>Fecha y Hora:</strong> ${fecha}</p>
          ${infoAdicional}
          ${session.descripcion ? `<p style="margin: 5px 0;"><strong>Descripción:</strong> ${session.descripcion}</p>` : ''}
        </div>
        <p>¡Muchos éxitos en tu estudio!</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 0.8rem; color: #777;">Este es un mensaje automático, por favor no respondas a este correo.</p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};

const sendSessionCancellationEmail = async (to, studentName, session) => {
  const mailOptions = {
    from: `"Asistente Académico" <${process.env.MAIL_FROM || 'no-reply@asistente.edu'}>`,
    to,
    subject: `Sesión cancelada: ${session.materia.nombre}`,
    text: `Hola ${studentName}, te informamos que la sesión de estudio de ${session.materia.nombre} sobre "${session.tema}" ha sido cancelada por el organizador.
    Sentimos los inconvenientes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
        <h2 style="color: #E24A4A;">Sesión Cancelada</h2>
        <p>Hola <strong>${studentName}</strong>,</p>
        <p>Te informamos que la siguiente sesión de estudio ha sido cancelada por el organizador:</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Materia:</strong> ${session.materia.nombre}</p>
          <p style="margin: 5px 0;"><strong>Tema:</strong> ${session.tema}</p>
        </div>
        <p>Sentimos los inconvenientes que esto pueda causarte.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 0.8rem; color: #777;">Este es un mensaje automático, por favor no respondas a este correo.</p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};

const sendSessionReminderEmail = async (to, studentName, session) => {
  const fecha = new Date(session.fechaHora).toLocaleString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const infoAdicional = session.tipo === 'virtual' 
    ? `<p><strong>Link de la sesión:</strong> <a href="${session.link}">${session.link}</a></p>`
    : `<p><strong>Ubicación:</strong> ${session.ubicacion}</p>`;

  const mailOptions = {
    from: `"Asistente Académico" <${process.env.MAIL_FROM || 'no-reply@asistente.edu'}>`,
    to,
    subject: `Recordatorio: Sesión de ${session.materia.nombre} mañana`,
    text: `¡Hola ${studentName}! Mañana tienes una sesión de estudio de ${session.materia.nombre}.
    Tema: ${session.tema}
    Fecha: ${fecha}
    ${session.tipo === 'virtual' ? `Link: ${session.link}` : `Ubicación: ${session.ubicacion}`}
    
    ¡Te esperamos!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
        <h2 style="color: #4A90E2;">¡Recordatorio de Sesión!</h2>
        <p>Hola <strong>${studentName}</strong>,</p>
        <p>Te recordamos que mañana tienes una sesión de estudio:</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Materia:</strong> ${session.materia.nombre}</p>
          <p style="margin: 5px 0;"><strong>Tema:</strong> ${session.tema}</p>
          <p style="margin: 5px 0;"><strong>Fecha y Hora:</strong> ${fecha}</p>
          ${infoAdicional}
        </div>
        <p>¡Te esperamos para seguir aprendiendo juntos!</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 0.8rem; color: #777;">Este es un mensaje automático, por favor no respondas a este correo.</p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};

const sendSessionRejectionEmail = async (to, studentName, session) => {
  const mailOptions = {
    from: `"Asistente Académico" <${process.env.MAIL_FROM || 'no-reply@asistente.edu'}>`,
    to,
    subject: `Solicitud rechazada: Sesión de ${session.materia.nombre}`,
    text: `Hola ${studentName}, te informamos que tu solicitud para unirte a la sesión de estudio de ${session.materia.nombre} sobre "${session.tema}" ha sido rechazada por el organizador.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
        <h2 style="color: #E24A4A;">Solicitud Rechazada</h2>
        <p>Hola <strong>${studentName}</strong>,</p>
        <p>Te informamos que tu solicitud para unirte a la siguiente sesión de estudio fue rechazada por el organizador:</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Materia:</strong> ${session.materia.nombre}</p>
          <p style="margin: 5px 0;"><strong>Tema:</strong> ${session.tema}</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 0.8rem; color: #777;">Este es un mensaje automático, por favor no respondas a este correo.</p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};

const sendSessionUpdateEmail = async (to, studentName, session, camposCambiados) => {
  const fecha = new Date(session.fechaHora).toLocaleString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const infoAdicional = session.tipo === 'virtual'
    ? `<p><strong>Link de la sesión:</strong> <a href="${session.link}">${session.link}</a></p>`
    : `<p><strong>Ubicación:</strong> ${session.ubicacion}</p>`;

  const listaCambiosTexto = camposCambiados.join(', ');
  const listaCambiosHtml = camposCambiados
    .map(c => `<li>${c.charAt(0).toUpperCase()}${c.slice(1)}</li>`)
    .join('');

  const mailOptions = {
    from: `"Asistente Académico" <${process.env.MAIL_FROM || 'no-reply@asistente.edu'}>`,
    to,
    subject: `Cambios en tu sesión de estudio: ${session.materia.nombre}`,
    text: `¡Hola ${studentName}! El organizador actualizó ${listaCambiosTexto} de tu sesión de estudio de ${session.materia.nombre}.
    Tema: ${session.tema}
    Fecha: ${fecha}
    ${session.tipo === 'virtual' ? `Link: ${session.link}` : `Ubicación: ${session.ubicacion}`}

    Revisá los detalles actualizados en la aplicación.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
        <h2 style="color: #4A90E2;">Cambios en tu sesión de estudio</h2>
        <p>Hola <strong>${studentName}</strong>,</p>
        <p>El organizador actualizó ${listaCambiosTexto} de la siguiente sesión de estudio:</p>
        <ul>${listaCambiosHtml}</ul>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Materia:</strong> ${session.materia.nombre}</p>
          <p style="margin: 5px 0;"><strong>Tema:</strong> ${session.tema}</p>
          <p style="margin: 5px 0;"><strong>Fecha y Hora:</strong> ${fecha}</p>
          ${infoAdicional}
        </div>
        <p>Por favor, tomá nota de los cambios.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 0.8rem; color: #777;">Este es un mensaje automático, por favor no respondas a este correo.</p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};

module.exports = {
  sendInvitationEmail,
  sendUserNotFoundEmail,
  sendSessionConfirmationEmail,
  sendSessionCancellationEmail,
  sendSessionReminderEmail,
  sendSessionRejectionEmail,
  sendSessionUpdateEmail
};
