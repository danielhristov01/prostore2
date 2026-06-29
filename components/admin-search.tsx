"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Input } from "./ui/input";

const AdminSearch = () => {
  const searchParams = useSearchParams();
  return <SearchForm key={searchParams.get("query") ?? ""} />;
};

const SearchForm = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const formActionUrl = pathname.includes("/admin/orders")
    ? "/admin/orders"
    : pathname.includes("/admin/users")
      ? "/admin/users"
      : "/admin/products";

  const [queryValue, setQueryValue] = useState(searchParams.get("query") || "");

  return (
    <form action={formActionUrl} method="GET">
      <Input
        type="search"
        placeholder="Search..."
        name="query"
        value={queryValue}
        onChange={(e) => setQueryValue(e.target.value)}
        className="md:w-25 lg:w-75"
      />
      <button className="sr-only" type="submit">
        Search
      </button>
    </form>
  );
};

export default AdminSearch;
