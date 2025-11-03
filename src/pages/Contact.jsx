import React, { useEffect, useState } from "react";
import { App as CapApp } from "@capacitor/app";
import { Link } from "react-router-dom";

const EMAILS = {
  support: "support@ablackmarketplace.com",
  ads: "ads@ablackmarketplace.com",
  tips: "submit@ablackmarketplace.com",
};

export default function Contact() {
  const [version, setVersion] = useState("");
  useEffect(() => {
    CapApp.getInfo().then((info) => {
      setVersion(`${info.name || "ABM"} v${info.version} (${info.build})`);
    }).catch(() => {});
  }, []);

  const ua = navigator.userAgent;

  const mailto = (to, subject) =>
    `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
      `\n\n—\nApp: ${version || "unknown"}\nDevice: ${ua}`
    )}`;

  return (
    <section className="px-5 py-6 bg-white text-black min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Contact Us</h1>

      <div className="space-y-4">
        <a
          href={mailto(EMAILS.support, "ABM — Support")}
          className="block rounded-2xl bg-black text-white px-4 py-3 text-center"
        >
          General Support
        </a>

        <a
          href={mailto(EMAILS.ads, "ABM — Advertising")}
          className="block rounded-2xl bg-black text-white px-4 py-3 text-center"
        >
          Advertising & Partnerships
        </a>

        <Link
          to="/suggest"
          className="block rounded-2xl border border-black/15 px-4 py-3 text-center"
        >
          Suggest a Business
        </Link>

        <a
          href="https://ablackmarketplace.com/privacy"
          target="_blank" rel="noreferrer"
          className="block rounded-2xl border border-black/15 px-4 py-3 text-center"
        >
          Privacy Policy
        </a>
      </div>

      <p className="text-xs text-black/50 mt-6">
        {version && <>App: {version}<br/></>}
        {ua}
      </p>

      <div className="mt-6">
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
