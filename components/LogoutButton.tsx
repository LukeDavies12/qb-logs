"use client";

import { LogOutIcon } from "lucide-react";
import { logout } from "./logoutAction";


export function LogoutButton() {
  return (
    <form action={logout}>
      <button className="p-2 bg-neutral-900 hover:bg-neutral-800 active:outline-none rounded-sm"><LogOutIcon className="w-5" /></button>
    </form>
  );
}