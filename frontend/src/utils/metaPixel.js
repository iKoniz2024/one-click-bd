/**
 * Helper to safely track client-side Meta Pixel events (AddToCart, ViewContent, InitiateCheckout, Purchase, etc.)
 */
export const trackMetaPixelEvent = (eventName, data = {}) => {
  if (typeof window !== "undefined" && window.fbq) {
    try {
      const payload = { ...data };

      // Ensure currency is always a valid 3-letter uppercase ISO currency string (default BDT)
      let curr = String(payload.currency || "BDT").trim().toUpperCase();
      if (!/^[A-Z]{3}$/.test(curr)) {
        curr = "BDT";
      }
      payload.currency = curr;

      // Ensure value is always a valid positive number
      let val = parseFloat(payload.value);
      if (isNaN(val) || val <= 0) {
        val = 0.01;
      }
      payload.value = Number(val.toFixed(2));

      window.fbq("track", eventName, payload);

      if (process.env.NODE_ENV !== "production") {
        console.log(`[Meta Pixel Client Event]: ${eventName}`, payload);
      }
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[Meta Pixel Client Warning]:", err);
      }
    }
  } else if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
    console.log(`[Meta Pixel Event Pending ID Setup]: ${eventName}`, data);
  }
};
