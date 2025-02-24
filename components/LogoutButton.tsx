"use client";

import { LogOutIcon } from "lucide-react";
import { logout } from "./logoutAction";


export function LogoutButton() {
  return (
    <form action={logout}>
      <button className="p-2 bg-neutral-900 hover:bg-neutral-800 active:outline-none"><LogOutIcon className="w-6" /></button>
    </form>
  );
}