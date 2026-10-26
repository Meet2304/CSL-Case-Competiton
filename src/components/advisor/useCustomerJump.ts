"use client";

import { useEffect } from "react";
import type { AdvisorCustomer } from "@/data/types";
import { customerAnchor } from "@/lib/advisor";

/**
 * When a notification links to `#customer-<id>`, switch the paginated list
 * to the page holding that customer and scroll their row into view.
 */
export function useCustomerJump(
  customers: AdvisorCustomer[],
  pageSize: number,
  setPage: (page: number) => void,
) {
  useEffect(() => {
    function jump() {
      const index = customers.findIndex((c) => `#${customerAnchor(c.id)}` === window.location.hash);
      if (index < 0) return;
      setPage(Math.floor(index / pageSize) + 1);
      // Wait for the new page to render before scrolling.
      requestAnimationFrame(() =>
        document.getElementById(customerAnchor(customers[index].id))?.scrollIntoView({ behavior: "smooth", block: "center" }),
      );
    }
    jump();
    window.addEventListener("hashchange", jump);
    return () => window.removeEventListener("hashchange", jump);
  }, [customers, pageSize, setPage]);
}
