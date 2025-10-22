import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { email, name, projectName, inviteLink } = await req.json();

    // Config SMTP (exemple Gmail)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const mailOptions = {
      from: `"Workflow Manager" <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: `Invitation à rejoindre le projet "${projectName}"`,
      html: `
        <p>Bonjour ${name || "Utilisateur"},</p>
        <p>Vous êtes invité à rejoindre le projet <strong>${projectName}</strong> sur Workflow Manager.</p>
        <p>Cliquez sur ce lien pour rejoindre ou créer votre compte :</p>
        <a href="${inviteLink}" style="background:#2563eb;color:white;padding:10px 15px;border-radius:5px;text-decoration:none;">Rejoindre le projet</a>
        <p>Si vous n'avez pas de compte, le lien vous permettra de vous inscrire puis d’accéder au projet.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ ok: false, error: err }), { status: 500 });
  }
}
