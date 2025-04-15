import React from "react";

export default function DashboardPage() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "#b3d9ff"
    }}>
      <h1>Bem-vindo ao painel!</h1>
      <p>Login realizado com sucesso.</p>
    </div>
  );
}
