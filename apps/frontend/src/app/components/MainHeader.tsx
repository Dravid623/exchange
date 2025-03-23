"use client";

import Link from "next/link";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { FaRupeeSign } from "react-icons/fa";

export function MainHeader() {
  return (
    <header className="w-full shadow-md top-0">
      <div className="container flex items-center justify-between ">
        <Link href="/" className="flex items-center gap-2">
          <FaRupeeSign width={40} height={40} />
          <span className="text-lg font-semibold text-gray-900 dark:text-white">
            Exchange
          </span>
        </Link>

        <div className="flex-1 max-w-md">
          <Input type="text" placeholder="Search..." label={""} />
        </div>

        <div className="flex gap-3">
          <Button variant="primary" label={"Login"}></Button>
        </div>
      </div>
    </header>
  );
}
