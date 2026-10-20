import { NextRequest, NextResponse } from "next/server";
import { DELETE as deleteUserHandler, PATCH as patchUserHandler } from "../route";

export const dynamic = "force-dynamic";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const url = new URL(req.url);
  url.searchParams.set("id", params.id);
  const newReq = new NextRequest(url, {
    method: "DELETE",
    headers: req.headers,
  });
  return deleteUserHandler(newReq);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const url = new URL(req.url);
  url.searchParams.set("id", params.id);
  const newReq = new NextRequest(url, {
    method: "PATCH",
    headers: req.headers,
    body: req.body,
    // @ts-ignore
    duplex: "half",
  });
  return patchUserHandler(newReq);
}
