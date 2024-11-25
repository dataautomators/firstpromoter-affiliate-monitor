import * as React from "react";

import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

type EmailTemplateProps = {
  host: string;
  userName: string;
  newBalance: string;
  previousBalance: string;
  increaseAmount: string;
};

export function ReferralBalanceEmail({
  host,
  userName,
  newBalance,
  previousBalance,
  increaseAmount,
}: EmailTemplateProps) {
  return (
    <Html>
      <Head />
      <Preview>🎉 Your {host} Referral Balance Has Increased!</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white px-2 font-sans">
          <Container className="mx-auto my-auto p-5">
            <Section className="py-4">
              <Text className="text-xl font-bold">Hi {userName},</Text>

              <Text className="mt-4">
                Great news! Your referral balance has just increased. 🎉
              </Text>

              <Text className="mt-4 font-medium">
                Here are the updated details:
              </Text>

              <Section className="my-6 space-y-2">
                <Text className="text-gray-700">
                  New Balance:{" "}
                  <span className="font-bold text-green-600">
                    ${newBalance}
                  </span>
                </Text>
                <Text className="text-gray-700">
                  Previous Balance:{" "}
                  <span className="text-gray-500">${previousBalance}</span>
                </Text>
                <Text className="text-gray-700">
                  Increase Amount:{" "}
                  <span className="font-bold text-green-600">
                    +${increaseAmount}
                  </span>
                </Text>
              </Section>

              <Text className="mt-4 text-gray-700">
                Thank you for sharing the love and helping others discover us.
                Keep spreading the word to earn even more rewards!
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
