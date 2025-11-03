import React from "react";
import { Link } from "react-router-dom";

export default function About() {
  return (
    <section className="px-5 py-6 bg-white text-black min-h-screen">
      <h1 className="text-2xl font-bold mb-3">About A Black Marketplace</h1>
      <p className="text-black/80 mb-4">
        A Black Marketplace helps you quickly find Black-owned businesses near you.
        It’s built for the community—fast, simple, and privacy-minded.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">How it works</h2>
      <ul className="list-disc ml-5 space-y-2 text-black/80">
        <li>Use your location (with permission) to sort results by distance.</li>
        <li>Browse by category or search by name/city.</li>
        <li>Tap any business for hours, contact info, and directions.</li>
        <li>Suggest a business to help us grow the directory.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">Data & Privacy</h2>
      <p className="text-black/80">
        Location is used only to rank results on your device—we don’t store your
        live location. For details, read our{" "}
        <a
          href="https://ablackmarketplace.com/privacy-policy"
          className="text-blue-600 underline"
          target="_blank" rel="noreferrer"
        >
          Privacy Policy
        </a>.
      </p>

      <div className="mt-8">
        <Link
          to="/more"
          className="inline-block rounded-xl border border-black/15 px-4 py-2 text-black hover:bg-black/5"
        >
          ← Back
        </Link>
      </div>
    </section>
  );
}
