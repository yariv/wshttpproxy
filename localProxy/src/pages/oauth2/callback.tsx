import * as React from "react";
import { useEffect, useState } from "react";
import { post } from "../../http";

const OAuthCallbackPage = () => {
  const [msg, setMsg] = useState("message");
  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.hash) {
      throw new Error("Missing response parameters");
    }
    const searchParams = new URLSearchParams(url.hash.substr(1));
    const token = searchParams.get("token");
    if (!token) {
      throw new Error("Missing token");
    }
    // TODO rewrite
    (async () => {
      await post<{ token: string }>("/api/setToken", { token: token });
      setMsg("hi");
    })();
  });
  return <div>{msg}</div>;
};
export default OAuthCallbackPage;
