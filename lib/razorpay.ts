export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    // If it's already fully loaded and is a constructor
    if (window.Razorpay && typeof window.Razorpay === "function") {
      resolve(true);
      return;
    }

    // Check if script is already present but not loaded yet
    const existingScript = document.getElementById("rzp-checkout-script");
    if (existingScript) {
      existingScript.addEventListener("load", () => {
        if (typeof window.Razorpay === "function") resolve(true);
        else resolve(false);
      });
      existingScript.addEventListener("error", () => resolve(false));
      return;
    }

    // Otherwise, create and inject it
    const script = document.createElement("script");
    script.id = "rzp-checkout-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => {
      // Give it a tiny tick to evaluate if needed
      setTimeout(() => {
        if (window.Razorpay && typeof window.Razorpay === "function") {
          resolve(true);
        } else {
          console.error("Razorpay script loaded but window.Razorpay is not a function:", window.Razorpay);
          resolve(false);
        }
      }, 50);
    };
    script.onerror = () => {
      console.error("Failed to load Razorpay script from CDN");
      resolve(false);
    };
    document.body.appendChild(script);
  });
};
