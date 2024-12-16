import type { User } from "@clerk/nextjs/server";

export const parseUser = (user: User) => {
  const { id, firstName, lastName, emailAddresses } = user;
  const userEmail = emailAddresses[0].emailAddress;
  return {
    clerkId: id,
    firstName,
    lastName,
    email: userEmail,
  };
};
