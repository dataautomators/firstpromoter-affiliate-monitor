import { getDecryptedCredentials } from "@/lib/cryptoHelpers";

export class ScraperError extends Error {}

const baseUrl =
  process.env.MOCK_API_URL || "https://api.fprom.io/api/affiliate/v1";

export const login = async (
  email: string,
  password: string,
  companyHost: string
) => {
  const decryptedPassword = getDecryptedCredentials(password);
  const response = await fetch(`${baseUrl}/authorization/login`, {
    method: "POST",
    body: JSON.stringify({ email, password: decryptedPassword }),
    headers: {
      "Content-Type": "application/json",
      company_host: companyHost,
    },
  });

  const data = await response.json();
  const { tokens } = data;

  if (!tokens) {
    const { code } = data;
    switch (code) {
      case "invalid_credentials":
        throw new Error("Invalid credentials");
      case "invalid_route":
        throw new Error("Invalid url");
      default:
        throw new Error("Invalid credentials or url");
    }
  }

  const accessToken = tokens.access_token;
  const refreshToken = tokens.refresh_token;

  return { accessToken, refreshToken };
};

export const getData = async (token: string, companyHost: string) => {
  const response = await fetch(`${baseUrl}/me?include_promoter=true`, {
    headers: {
      Authorization: `Bearer ${token}`,
      company_host: companyHost,
    },
  });

  if (!response.ok) {
    switch (response.status) {
      case 401:
        throw new ScraperError("Unauthorized");
      case 404:
        throw new ScraperError("Not found");
      default:
        throw new ScraperError("Failed to fetch data");
    }
  }

  const data = await response.json();

  const { stats, balances } = data.promoter;
  const newData = {
    clicks: stats?.clicks_count || 0,
    referral: stats?.referrals_count || 0,
    unpaid: balances?.current_balance?.cash || 0,
    customers: stats?.customers_count || 0,
  };

  console.log({ newData });

  return newData;
};
