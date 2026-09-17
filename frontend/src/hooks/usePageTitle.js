"use client";

import { useEffect } from "react";
import useSettings from "./useSettings";

export default function usePageTitle(title) {
  const { siteName } = useSettings();

  useEffect(() => {
    const name = siteName || "OneClick BD";
    document.title = title ? `${title} | ${name}` : name;
  }, [title, siteName]);
}
