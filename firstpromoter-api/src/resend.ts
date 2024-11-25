import { Resend } from "resend";
import { ReferralBalanceEmail } from "./email-template.jsx";

export const resend = new Resend(process.env.RESEND_API_KEY);

const from = `${process.env.SENDER_NAME} <${process.env.SENDER_EMAIL}>`;

type SendReferralBalanceEmailProps = {
  to: string;
  userName: string;
  host: string;
  newBalance: string;
  previousBalance: string;
  increaseAmount: string;
};

export const sendReferralBalanceEmail = async ({
  to,
  userName,
  host,
  newBalance,
  previousBalance,
  increaseAmount,
}: SendReferralBalanceEmailProps) => {
  const subject = `🎉 Your ${host} Referral Balance Has Increased!`;

  const email = ReferralBalanceEmail({
    userName,
    host,
    newBalance,
    previousBalance,
    increaseAmount,
  });
  return await resend.emails.send({
    from,
    to,
    subject,
    react: email,
  });
};
