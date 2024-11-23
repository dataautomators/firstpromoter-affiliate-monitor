import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (request: NextRequest) => {
  const body = await request.json();
  if (body.id) {
    revalidatePath("/");
    revalidatePath(`/promoter/${body.id}`);
  }
  return NextResponse.json({ message: "Hello, world!" });
};
