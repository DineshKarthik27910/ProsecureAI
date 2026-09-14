import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import './layout.css';

export default function AppShell() {
  return (
    <div className="app-layout">
      {/* Fixed Navigation Sidebar */}
      <Sidebar />

      {/* Main Application Area */}
      <div className="app-main">
        {/* Sticky Header */}
        <Header />

        {/* Dynamic Route Content */}
        <main className="content-wrapper">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
