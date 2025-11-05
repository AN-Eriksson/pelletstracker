import React from 'react';

const SiteHeader = () => {
  return (
    <header className="flex items-center justify-between">
      <img src="/pelletlogo.png" alt="logo" width="200" />
      <h1 className="text-2xl font-bold mb-6">Logga och följ din pelletsförbrukning!</h1>
    </header>
  );
};

export default SiteHeader;
