'use client';

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import {
  ShoppingCart,
  Users,
  Palette,
  CalendarDays,
  WalletCards,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  Settings,
  LogOut,
  LayoutGrid,
} from 'lucide-react';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { data: session } = useSession();
  const pathname = usePathname();

  const imageSrc =
    session?.user?.image ||
    "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&w=634&q=80";

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const menuItems = [
    { href: "/dashboard/order",    label: "Order",          icon: ShoppingCart },
    { href: "/dashboard/customer", label: "Customer",       icon: Users },
    { href: "/dashboard/dyeing",   label: "Dyeing",         icon: Palette },
    { href: "/dashboard/calender", label: "Calender",       icon: CalendarDays },
    { href: "/dashboard/accounts", label: "Accounts",       icon: WalletCards },
    { href: "/dashboard/admins",   label: "Administration", icon: ShieldCheck },
  ];

  return (
    <>
      {/* ===== MOBILE HEADER ===== */}
      <div
        className="lg:hidden flex items-center justify-between px-4 py-3 text-white fixed top-0 left-0 right-0 z-50"
        style={{ backgroundColor: "var(--mn-accent)" }}
      >
        <Link href="/" className="flex items-center gap-2">
          <div
            className="p-1.5 rounded-md"
            style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
          >
            <Image
              src="/Image/logo.png"
              alt="NM Dyeing Logo"
              width={20}
              height={20}
              className="brightness-200"
            />
          </div>
          <span className="text-sm font-semibold tracking-wide" style={{ fontFamily: "var(--mn-font-primary)" }}>
            NM-Dyeing
          </span>
        </Link>
        <button className="cursor-pointer p-1" onClick={() => setIsMobileOpen(!isMobileOpen)}>
          {isMobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* ===== SIDEBAR ===== */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          text-white
          transition-all duration-300 ease-in-out
          ${isOpen ? "w-[255px]" : "w-[72px]"}
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static h-screen flex flex-col
        `}
        style={{ backgroundColor: "var(--mn-accent)", fontFamily: "var(--mn-font-primary)" }}
      >
        <div className="flex flex-col h-full">

          {/* ===== LOGO / HEADER BLOCK — Figma: 255×68, gap 8, padding 8 ===== */}
          <div style={{ padding: "8px", minHeight: "68px" }} className="flex items-center">
            <Link
              href="/"
              className="relative flex items-center gap-2 w-full"
              style={{
                backgroundColor: "rgba(255,255,255,0.08)",
                borderRadius: "var(--mn-radius-md)",
                padding: "8px",
                gap: "8px",
              }}
            >
              {/* Icon */}
              <div
                className="shrink-0 flex items-center justify-center"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "var(--mn-radius-md)",
                  backgroundColor: "rgba(255,255,255,0.15)",
                }}
              >
                <Image
                  src="/Image/logo.png"
                  alt="NM Dyeing Logo"
                  width={20}
                  height={20}
                  className="brightness-200"
                />
              </div>

              {/* Name — hidden when collapsed */}
              <div className={`${!isOpen && "lg:hidden"} overflow-hidden transition-all duration-200`}>
                <p className="text-[14px] font-semibold text-white leading-tight whitespace-nowrap">
                  NM-Dyeing
                </p>
                <p
                  className="text-[10px] mt-0.5 uppercase tracking-widest whitespace-nowrap"
                  style={{ color: "rgba(255,255,255,0.5)", fontFamily: "var(--mn-font-secondary)" }}
                >
                  Management
                </p>
              </div>

              {/* Collapse toggle */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setIsOpen(!isOpen);
                }}
                className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 items-center justify-center w-6 h-6 rounded-full cursor-pointer z-50 transition-colors"
                style={{ backgroundColor: "var(--mn-accent-4)", border: "2px solid rgba(255,255,255,0.15)" }}
                title={isOpen ? "Collapse sidebar" : "Expand sidebar"}
              >
                {isOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
              </button>
            </Link>
          </div>

          {/* Horizontal divider */}
          <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.08)", margin: "0 8px" }} />

          {/* ===== NAVIGATION MENU ===== */}
          <div className="flex-1 overflow-y-auto" style={{ padding: "8px" }}>
            {isOpen && (
              <p
                className="text-[9px] uppercase tracking-[2.5px] font-bold mb-3 mt-2 px-2"
                style={{ color: "rgba(255,255,255,0.35)" }}
              >
                Main Menu
              </p>
            )}

            <nav className="flex flex-col" style={{ gap: "2px" }}>
              {menuItems.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    title={!isOpen ? item.label : undefined}
                    className="flex items-center transition-all duration-150 group relative"
                    style={{
                      gap: "10px",
                      padding: "10px 12px",
                      borderRadius: "var(--mn-radius-md)",
                      backgroundColor: isActive
                        ? "rgba(255,255,255,0.15)"
                        : "transparent",
                      color: isActive ? "#ffffff" : "rgba(255,255,255,0.55)",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.07)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    {/* Active indicator bar */}
                    {isActive && (
                      <span
                        className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full"
                        style={{
                          width: "3px",
                          height: "20px",
                          backgroundColor: "#ffffff",
                          borderRadius: "0 2px 2px 0",
                        }}
                      />
                    )}
                    <Icon
                      size={18}
                      className="shrink-0"
                      style={{ color: isActive ? "#ffffff" : "rgba(255,255,255,0.5)" }}
                    />
                    <span
                      className={`text-[13px] font-medium whitespace-nowrap ${!isOpen && "lg:hidden"}`}
                      style={{ color: isActive ? "#ffffff" : "rgba(255,255,255,0.65)" }}
                    >
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Horizontal divider */}
          <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.08)", margin: "0 8px" }} />

          {/* ===== USER FOOTER — Figma: 255×68, gap 10, padding 8 ===== */}
          <div
            ref={dropdownRef}
            className="relative"
            style={{ padding: "8px", minHeight: "68px", backgroundColor: "var(--mn-accent-4)" }}
          >
            {/* Dropdown menu */}
            {dropdownOpen && (
              <div
                className="absolute bottom-[72px] left-2 right-2 overflow-hidden z-50"
                style={{
                  backgroundColor: "var(--mn-accent-8)",
                  borderRadius: "var(--mn-radius-md)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  boxShadow: "0px 4px 16px rgba(0,0,0,0.4)",
                }}
              >
                <Link
                  href="/dashboard/setting"
                  className="flex items-center gap-3 px-4 py-3 text-[13px] transition-colors"
                  style={{ color: "rgba(255,255,255,0.8)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <Settings size={15} />
                  <span className={!isOpen ? "lg:hidden" : ""}>Settings</span>
                </Link>
                <Link
                  href="/dashboard/menu"
                  className="flex items-center gap-3 px-4 py-3 text-[13px] transition-colors"
                  style={{ color: "rgba(255,255,255,0.8)", borderTop: "1px solid rgba(255,255,255,0.06)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <LayoutGrid size={15} />
                  <span className={!isOpen ? "lg:hidden" : ""}>Menu</span>
                </Link>
                {session && (
                  <button
                    onClick={() => signOut()}
                    className="flex items-center gap-3 w-full px-4 py-3 text-[13px] transition-colors cursor-pointer text-left"
                    style={{
                      color: "var(--mn-accent-6)",
                      borderTop: "1px solid rgba(255,255,255,0.06)",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(203,82,84,0.08)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <LogOut size={15} />
                    <span className={!isOpen ? "lg:hidden" : ""}>Log Out</span>
                  </button>
                )}
              </div>
            )}

            {/* User row */}
            <div
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 cursor-pointer rounded-lg transition-colors w-full"
              style={{
                padding: "8px",
                gap: "8px",
                borderRadius: "var(--mn-radius-md)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.07)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <Image
                className="object-cover rounded-full shrink-0"
                style={{ border: "2px solid rgba(255,255,255,0.2)", width: 36, height: 36 }}
                src={imageSrc}
                alt="User avatar"
                width={36}
                height={36}
              />
              <div className={`${!isOpen && "lg:hidden"} overflow-hidden flex-1 min-w-0`}>
                <p className="text-[13px] font-semibold text-white truncate leading-tight">
                  {session?.user?.name || "Guest"}
                </p>
                <p className="text-[10px] truncate mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                  Admin
                </p>
              </div>
              <ChevronRight
                size={14}
                className={`shrink-0 transition-transform duration-200 ${!isOpen && "lg:hidden"}`}
                style={{ color: "rgba(255,255,255,0.35)", transform: dropdownOpen ? "rotate(90deg)" : "rotate(0deg)" }}
              />
            </div>
          </div>
        </div>
      </aside>

      {/* Vertical separator rail — Figma: rail 1×fullHeight */}
      {/* Rendered by the parent layout. The sidebar's right edge acts as the rail. */}

      {/* MOBILE OVERLAY */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden backdrop-blur-sm"
          style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;