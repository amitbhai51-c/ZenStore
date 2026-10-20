"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ProductIcon } from "@/components/ProductIcon";
import {
  ShieldAlert,
  Users,
  ShoppingBag,
  Coins,
  Package,
  CreditCard,
  Settings,
  Mail,
  FileCode,
  ToggleLeft,
  MessageSquare,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Send,
  Ticket,
} from "lucide-react";

type AdminTab =
  | "dashboard"
  | "users"
  | "products"
  | "orders"
  | "payments"
  | "redeem-codes"
  | "settings"
  | "maintenance"
  | "smtp"
  | "templates"
  | "contact";

export default function AdminPortalPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Data states
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [productsList, setProductsList] = useState<any[]>([]);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [ordersList, setOrdersList] = useState<any[]>([]);
  const [paymentsList, setPaymentsList] = useState<any[]>([]);
  const [redeemCodesList, setRedeemCodesList] = useState<any[]>([]);
  const [settingsData, setSettingsData] = useState<any>(null);
  const [smtpData, setSmtpData] = useState<any>(null);
  const [templatesList, setTemplatesList] = useState<any[]>([]);
  const [contactList, setContactList] = useState<any[]>([]);

  // Search/Filters
  const [userSearch, setUserSearch] = useState("");
  const [orderFilter, setOrderFilter] = useState("all");

  // Modals state
  const [coinModal, setCoinModal] = useState<{ userId: string; username: string; email: string } | null>(null);
  const [coinAmount, setCoinAmount] = useState(100);
  const [coinReason, setCoinReason] = useState("");

  const [suspendModal, setSuspendModal] = useState<{ userId: string; username: string; isSuspended: boolean } | null>(null);
  const [suspendReason, setSuspendReason] = useState("");

  const [productModal, setProductModal] = useState<any | null>(null);

  const [deliverModal, setDeliverModal] = useState<{ orderId: string; orderNumber: string } | null>(null);
  const [deliveryCode, setDeliveryCode] = useState("");

  const [declineModal, setDeclineModal] = useState<{ orderId: string; orderNumber: string; totalCoins: number } | null>(null);
  const [declineReason, setDeclineReason] = useState("");

  const [paymentReviewModal, setPaymentReviewModal] = useState<any | null>(null);
  const [paymentNote, setPaymentNote] = useState("");

  // Redeem Code Modal
  const [codeModal, setCodeModal] = useState<any | null>(null);

  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [testEmailRecipient, setTestEmailRecipient] = useState("");

  // Check admin role
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/auth/login");
      } else if (user.role !== "ADMIN") {
        router.push("/");
      }
    }
  }, [user, isLoading, router]);

  // Load active tab data
  const loadTabData = async (tab: AdminTab) => {
    setError("");
    try {
      if (tab === "dashboard") {
        const res = await fetch("/api/admin/stats");
        if (res.ok) setDashboardData(await res.json());
      } else if (tab === "users") {
        const res = await fetch(`/api/admin/users?search=${encodeURIComponent(userSearch)}`);
        if (res.ok) {
          const json = await res.json();
          setUsersList(json.users || []);
        }
      } else if (tab === "products") {
        const res = await fetch("/api/admin/products");
        if (res.ok) {
          const json = await res.json();
          setProductsList(json.products || []);
          setCategoriesList(json.categories || []);
        }
      } else if (tab === "orders") {
        const res = await fetch(`/api/admin/orders?status=${orderFilter}`);
        if (res.ok) {
          const json = await res.json();
          setOrdersList(json.orders || []);
        }
      } else if (tab === "payments") {
        const res = await fetch("/api/admin/payments");
        if (res.ok) {
          const json = await res.json();
          setPaymentsList(json.payments || []);
        }
      } else if (tab === "redeem-codes") {
        const res = await fetch("/api/admin/redeem-codes");
        if (res.ok) {
          const json = await res.json();
          setRedeemCodesList(json.codes || []);
        }
      } else if (tab === "settings" || tab === "maintenance") {
        const res = await fetch("/api/admin/settings");
        if (res.ok) {
          const json = await res.json();
          setSettingsData(json.settings || {});
        }
      } else if (tab === "smtp") {
        const res = await fetch("/api/admin/smtp");
        if (res.ok) {
          const json = await res.json();
          setSmtpData(json.smtp || {});
        }
      } else if (tab === "templates") {
        const res = await fetch("/api/admin/templates");
        if (res.ok) {
          const json = await res.json();
          setTemplatesList(json.templates || []);
          if (json.templates?.length > 0 && !selectedTemplate) {
            setSelectedTemplate(json.templates[0]);
          }
        }
      } else if (tab === "contact") {
        const res = await fetch("/api/admin/contact");
        if (res.ok) {
          const json = await res.json();
          setContactList(json.messages || []);
        }
      }
    } catch {
      setError("Failed to fetch administrative data.");
    }
  };

  useEffect(() => {
    if (user?.role === "ADMIN") {
      loadTabData(activeTab);
    }
  }, [activeTab, user]);

  // Actions
  const handleAdjustCoins = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coinModal) return;
    try {
      const res = await fetch("/api/admin/users/adjust-coins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: coinModal.userId,
          amount: coinAmount,
          reason: coinReason,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Adjustment failed");
      } else {
        setMessage(data.message);
        setCoinModal(null);
        setCoinReason("");
        loadTabData("users");
      }
    } catch {
      setError("Network error");
    }
  };

  const handleToggleSuspend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suspendModal) return;
    try {
      const action = suspendModal.isSuspended ? "unsuspend" : "suspend";
      const res = await fetch("/api/admin/users/suspend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: suspendModal.userId,
          action,
          reason: suspendReason,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Suspension update failed");
      } else {
        setMessage(data.message);
        setSuspendModal(null);
        setSuspendReason("");
        loadTabData("users");
      }
    } catch {
      setError("Network error");
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productModal) return;
    try {
      const isEdit = !!productModal.id;
      const url = isEdit ? `/api/admin/products/${productModal.id}` : "/api/admin/products";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productModal),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save product");
      } else {
        setMessage(isEdit ? "Product updated!" : "Product created successfully!");
        setProductModal(null);
        loadTabData("products");
      }
    } catch {
      setError("Network error saving product");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to archive this product?")) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMessage("Product archived.");
        loadTabData("products");
      }
    } catch {
      setError("Failed to archive product");
    }
  };

  const handleDeliverOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliverModal) return;
    try {
      const res = await fetch("/api/admin/orders/deliver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: deliverModal.orderId,
          digitalContent: deliveryCode,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Delivery failed");
      } else {
        setMessage(data.message);
        setDeliverModal(null);
        setDeliveryCode("");
        loadTabData("orders");
      }
    } catch {
      setError("Network error");
    }
  };

  const handleDeclineOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!declineModal) return;
    try {
      const res = await fetch("/api/admin/orders/decline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: declineModal.orderId,
          reason: declineReason,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Decline failed");
      } else {
        setMessage(data.message);
        setDeclineModal(null);
        setDeclineReason("");
        loadTabData("orders");
      }
    } catch {
      setError("Network error");
    }
  };

  const handleReviewPayment = async (action: "approve" | "reject") => {
    if (!paymentReviewModal) return;
    try {
      const res = await fetch("/api/admin/payments/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: paymentReviewModal.id,
          action,
          note: paymentNote,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Review failed");
      } else {
        setMessage(data.message);
        setPaymentReviewModal(null);
        setPaymentNote("");
        loadTabData("payments");
      }
    } catch {
      setError("Network error");
    }
  };

  // Redeem Code actions
  const handleSaveRedeemCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeModal) return;
    try {
      const res = await fetch("/api/admin/redeem-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(codeModal),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create redeem code");
      } else {
        setMessage(data.message);
        setCodeModal(null);
        loadTabData("redeem-codes");
      }
    } catch {
      setError("Network error creating code");
    }
  };

  const handleToggleCodeActive = async (id: string, current: boolean) => {
    try {
      const res = await fetch(`/api/admin/redeem-codes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !current }),
      });
      if (res.ok) {
        setMessage("Code status updated.");
        loadTabData("redeem-codes");
      }
    } catch {
      setError("Failed to update code status");
    }
  };

  const handleDeleteCode = async (id: string) => {
    if (!confirm("Are you sure you want to delete this redeem code?")) return;
    try {
      const res = await fetch(`/api/admin/redeem-codes/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMessage("Redeem code deleted.");
        loadTabData("redeem-codes");
      }
    } catch {
      setError("Failed to delete code");
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsData),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Website settings updated successfully! Live site reflects changes immediately.");
      } else {
        setError(data.error || "Failed to update settings");
      }
    } catch {
      setError("Network error");
    }
  };

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/smtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(smtpData),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("SMTP settings saved.");
      } else {
        setError(data.error || "Failed to save SMTP settings");
      }
    } catch {
      setError("Network error");
    }
  };

  const handleTestSmtp = async () => {
    try {
      setMessage("Testing SMTP connection...");
      const res = await fetch("/api/admin/smtp/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testRecipient: testEmailRecipient || user?.email }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
      } else {
        setError(data.error);
      }
    } catch {
      setError("Failed to run SMTP test");
    }
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;
    try {
      const res = await fetch(`/api/admin/templates/${selectedTemplate.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: selectedTemplate.subject,
          htmlBody: selectedTemplate.htmlBody,
        }),
      });
      if (res.ok) {
        setMessage("Template saved successfully.");
      }
    } catch {
      setError("Failed to save template");
    }
  };

  const handleTestTemplate = async () => {
    if (!selectedTemplate) return;
    try {
      setMessage(`Dispatching test for ${selectedTemplate.name}...`);
      const res = await fetch("/api/admin/templates/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateType: selectedTemplate.type,
          testRecipient: testEmailRecipient || user?.email,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
      } else {
        setError(data.error);
      }
    } catch {
      setError("Failed to test template");
    }
  };

  if (isLoading || !user || user.role !== "ADMIN") {
    return (
      <div className="flex-1 flex items-center justify-center py-20 text-amber-400">
        Verifying Administrative Access...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 flex flex-col">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#181d2a] mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-bold mb-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>CoinCraft Master Control Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Administrative Portal</h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/shop"
            className="px-3 py-1.5 rounded-xl bg-[#121622] text-zinc-300 hover:text-white border border-[#1e2538] text-xs font-semibold"
          >
            Public Shop →
          </Link>
          <div className="text-xs text-right">
            <p className="text-zinc-400">Signed in as</p>
            <p className="font-bold text-amber-400">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-4 mb-6 border-b border-[#181d2a]">
        {[
          { id: "dashboard", label: "Dashboard", icon: ShieldAlert },
          { id: "users", label: "Users & Coins", icon: Users },
          { id: "products", label: "Products Catalog", icon: ShoppingBag },
          { id: "orders", label: "Orders & Fulfillment", icon: Package },
          { id: "payments", label: "Manual Payments", icon: CreditCard },
          { id: "redeem-codes", label: "Redeem Codes", icon: Ticket },
          { id: "settings", label: "Website Info", icon: Settings },
          { id: "maintenance", label: "Maintenance Controls", icon: ToggleLeft },
          { id: "smtp", label: "SMTP Mailer", icon: Mail },
          { id: "templates", label: "Email Templates", icon: FileCode },
          { id: "contact", label: "Contact Tickets", icon: MessageSquare },
        ].map((item) => {
          const Icon = item.icon;
          const isSelected = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as AdminTab);
                setMessage("");
                setError("");
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                isSelected
                  ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                  : "bg-[#0d101a] text-zinc-400 hover:text-white border border-[#1c2234]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Notifications */}
      {message && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage("")} className="text-emerald-300 font-bold">×</button>
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError("")} className="text-red-300 font-bold">×</button>
        </div>
      )}

      {/* ======================= TAB: DASHBOARD ======================= */}
      {activeTab === "dashboard" && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-[#0d101a] border border-[#1c2234]">
              <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
                <span>Registered Users</span>
                <Users className="w-4 h-4 text-sky-400" />
              </div>
              <p className="text-2xl font-black text-white">{dashboardData?.stats?.totalUsers ?? 0}</p>
              <p className="text-[11px] text-emerald-400 mt-1">
                {dashboardData?.stats?.verifiedUsers ?? 0} verified • {dashboardData?.stats?.suspendedUsers ?? 0} suspended
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#0d101a] border border-[#1c2234]">
              <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
                <span>Total Catalog Products</span>
                <ShoppingBag className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-black text-white">{dashboardData?.stats?.totalProducts ?? 0}</p>
              <p className="text-[11px] text-zinc-400 mt-1">
                {dashboardData?.stats?.availableProducts ?? 0} in stock • {dashboardData?.stats?.outOfStockProducts ?? 0} out of stock
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#0d101a] border border-[#1c2234]">
              <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
                <span>Orders to Fulfill</span>
                <Package className="w-4 h-4 text-yellow-400" />
              </div>
              <p className="text-2xl font-black text-amber-400">{dashboardData?.stats?.pendingOrders ?? 0}</p>
              <p className="text-[11px] text-emerald-400 mt-1">
                {dashboardData?.stats?.deliveredOrders ?? 0} completed deliveries
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#0d101a] border border-[#1c2234]">
              <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
                <span>Circulating Wallet Coins</span>
                <Coins className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-black text-amber-400">
                {dashboardData?.stats?.totalCoinsInCirculation?.toLocaleString() ?? 0}
              </p>
              <p className="text-[11px] text-zinc-400 mt-1">
                Pending Manual Payments: <strong>{dashboardData?.stats?.pendingPayments ?? 0}</strong>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-[#0d101a] border border-[#1c2234]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Recent Orders</h3>
                <button
                  onClick={() => setActiveTab("orders")}
                  className="text-xs text-amber-400 hover:underline"
                >
                  View All Orders →
                </button>
              </div>

              <div className="divide-y divide-[#171d2b]">
                {dashboardData?.recentOrders?.map((ord: any) => (
                  <div key={ord.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-mono text-amber-400 font-bold">{ord.orderNumber}</p>
                      <p className="text-zinc-400">{ord.user?.email}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-white">{ord.totalCoins} coins</span>
                      <p
                        className={`text-[10px] font-bold ${
                          ord.status === "DELIVERED"
                            ? "text-emerald-400"
                            : ord.status === "DECLINED"
                            ? "text-red-400"
                            : "text-amber-400"
                        }`}
                      >
                        {ord.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#0d101a] border border-[#1c2234]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Recent Audit Logs</h3>
              </div>

              <div className="divide-y divide-[#171d2b] space-y-1">
                {dashboardData?.recentAuditLogs?.map((log: any) => (
                  <div key={log.id} className="py-2 text-xs">
                    <div className="flex justify-between text-zinc-400 text-[11px]">
                      <span className="font-bold text-amber-400">{log.action}</span>
                      <span>{new Date(log.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-zinc-300 text-[11px] font-mono mt-0.5 truncate">{log.details}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================= TAB: USERS ======================= */}
      {activeTab === "users" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadTabData("users")}
                placeholder="Search email or username..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#0d101a] border border-[#1c2234] text-xs text-white"
              />
            </div>

            <button
              onClick={() => loadTabData("users")}
              className="px-4 py-2 rounded-xl bg-[#141824] border border-[#22293d] text-xs text-zinc-300 hover:text-white flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh Users
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[#1c2234]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0e121c] text-zinc-400 border-b border-[#1c2234]">
                <tr>
                  <th className="p-3.5">User</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Verified</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Wallet Coins</th>
                  <th className="p-3.5">Orders</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#171d2c] bg-[#090b12]">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-[#0e121d] transition-colors">
                    <td className="p-3.5">
                      <p className="font-bold text-white">{u.username}</p>
                      <p className="text-zinc-400 text-[11px]">{u.email}</p>
                    </td>
                    <td className="p-3.5">
                      <span className="font-semibold text-zinc-300">{u.role}</span>
                    </td>
                    <td className="p-3.5">
                      {u.isVerified ? (
                        <span className="text-emerald-400 font-bold">✓ Yes</span>
                      ) : (
                        <span className="text-amber-400 font-bold">Pending OTP</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      {u.isSuspended ? (
                        <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-bold text-[10px]">
                          Suspended
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[10px]">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 font-bold text-amber-400">
                      {u.coinBalance.toLocaleString()} coins
                    </td>
                    <td className="p-3.5 text-zinc-400">{u._count?.orders ?? 0}</td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => {
                          setCoinModal({ userId: u.id, username: u.username, email: u.email });
                          setCoinAmount(100);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold text-[11px]"
                      >
                        Adjust Coins
                      </button>

                      {u.role !== "ADMIN" && (
                        <button
                          onClick={() => {
                            setSuspendModal({
                              userId: u.id,
                              username: u.username,
                              isSuspended: u.isSuspended,
                            });
                            setSuspendReason(u.suspensionReason || "");
                          }}
                          className={`px-2.5 py-1 rounded-lg border font-semibold text-[11px] ${
                            u.isSuspended
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : "bg-red-500/10 text-red-400 border-red-500/30"
                          }`}
                        >
                          {u.isSuspended ? "Unsuspend" : "Suspend"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================= TAB: PRODUCTS ======================= */}
      {activeTab === "products" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Manage Digital Products Catalog
            </h3>
            <button
              onClick={() =>
                setProductModal({
                  name: "",
                  slug: "",
                  shortDesc: "",
                  fullDesc: "",
                  categoryId: categoriesList[0]?.id || "",
                  coinPrice: 500,
                  stockQuantity: 50,
                  isAvailable: true,
                  image: "gift",
                  deliveryInstructions: "",
                })
              }
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add New Product
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[#1c2234]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0e121c] text-zinc-400 border-b border-[#1c2234]">
                <tr>
                  <th className="p-3.5">Product</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Coin Price</th>
                  <th className="p-3.5">Stock Qty</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#171d2c] bg-[#090b12]">
                {productsList.map((p) => (
                  <tr key={p.id} className="hover:bg-[#0e121d] transition-colors">
                    <td className="p-3.5 flex items-center gap-3">
                      <ProductIcon type={p.image || p.name} className="w-10 h-10 shrink-0" />
                      <div>
                        <p className="font-bold text-white">{p.name}</p>
                        <p className="text-[11px] text-zinc-500 font-mono">/shop/product/{p.slug}</p>
                      </div>
                    </td>
                    <td className="p-3.5 text-zinc-300">{p.category?.name}</td>
                    <td className="p-3.5 font-bold text-amber-400">{p.coinPrice} coins</td>
                    <td className="p-3.5 text-white font-medium">{p.stockQuantity}</td>
                    <td className="p-3.5">
                      {p.isAvailable && p.stockQuantity > 0 ? (
                        <span className="text-emerald-400 font-bold">In Stock</span>
                      ) : (
                        <span className="text-red-400 font-bold">Out of Stock</span>
                      )}
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => setProductModal(p)}
                        className="px-2.5 py-1 rounded-lg bg-[#141824] hover:bg-[#1a2030] text-zinc-300 hover:text-white border border-[#20273a]"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================= TAB: ORDERS ======================= */}
      {activeTab === "orders" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400">Filter Status:</span>
              <select
                value={orderFilter}
                onChange={(e) => {
                  setOrderFilter(e.target.value);
                  loadTabData("orders");
                }}
                className="px-3 py-1.5 rounded-xl bg-[#0d101a] border border-[#1c2234] text-xs text-white"
              >
                <option value="all">All Orders</option>
                <option value="PENDING">Pending Delivery</option>
                <option value="DELIVERED">Delivered</option>
                <option value="DECLINED">Declined & Refunded</option>
              </select>
            </div>

            <button
              onClick={() => loadTabData("orders")}
              className="px-3 py-1.5 rounded-xl bg-[#141824] text-zinc-300 text-xs border border-[#20273a]"
            >
              Refresh Orders
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[#1c2234]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0e121c] text-zinc-400 border-b border-[#1c2234]">
                <tr>
                  <th className="p-3.5">Order Ref</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Items Snapshot</th>
                  <th className="p-3.5">Total Coins</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#171d2c] bg-[#090b12]">
                {ordersList.map((ord) => (
                  <tr key={ord.id} className="hover:bg-[#0e121d] transition-colors">
                    <td className="p-3.5">
                      <p className="font-mono text-amber-400 font-bold">{ord.orderNumber}</p>
                      <p className="text-[10px] text-zinc-500">
                        {new Date(ord.createdAt).toLocaleString()}
                      </p>
                    </td>
                    <td className="p-3.5">
                      <p className="font-bold text-white">{ord.user?.username}</p>
                      <p className="text-zinc-400 text-[11px]">{ord.user?.email}</p>
                    </td>
                    <td className="p-3.5">
                      {ord.items?.map((it: any) => (
                        <div key={it.id} className="text-zinc-300">
                          {it.productName} × {it.quantity}
                        </div>
                      ))}
                    </td>
                    <td className="p-3.5 font-bold text-amber-400">{ord.totalCoins} coins</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          ord.status === "DELIVERED"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : ord.status === "DECLINED"
                            ? "bg-red-500/10 text-red-400 border border-red-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        {ord.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      {ord.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => {
                              setDeliverModal({
                                orderId: ord.id,
                                orderNumber: ord.orderNumber,
                              });
                              setDeliveryCode("");
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold text-[11px]"
                          >
                            Fulfill & Deliver Key
                          </button>
                          <button
                            onClick={() => {
                              setDeclineModal({
                                orderId: ord.id,
                                orderNumber: ord.orderNumber,
                                totalCoins: ord.totalCoins,
                              });
                              setDeclineReason("");
                            }}
                            className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold text-[11px]"
                          >
                            Decline & Refund
                          </button>
                        </>
                      )}
                      {ord.status === "DELIVERED" && (
                        <span className="text-emerald-400 font-semibold text-[11px]">
                          ✓ Fulfilled ({ord.digitalDelivery?.substring(0, 10)}...)
                        </span>
                      )}
                      {ord.status === "DECLINED" && (
                        <span className="text-red-400 text-[11px]">
                          Refunded: {ord.declineReason}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================= TAB: PAYMENTS ======================= */}
      {activeTab === "payments" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Review Coin Purchase Requests
            </h3>
            <button
              onClick={() => loadTabData("payments")}
              className="px-3 py-1.5 rounded-xl bg-[#141824] text-zinc-300 text-xs border border-[#20273a]"
            >
              Refresh Payments
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[#1c2234]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0e121c] text-zinc-400 border-b border-[#1c2234]">
                <tr>
                  <th className="p-3.5">Reference ID</th>
                  <th className="p-3.5">User</th>
                  <th className="p-3.5">Method</th>
                  <th className="p-3.5">Coins</th>
                  <th className="p-3.5">Amount (INR)</th>
                  <th className="p-3.5">UTR / TxID</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#171d2c] bg-[#090b12]">
                {paymentsList.map((pay) => (
                  <tr key={pay.id} className="hover:bg-[#0e121d] transition-colors">
                    <td className="p-3.5 font-mono text-zinc-300 font-bold">{pay.paymentReference}</td>
                    <td className="p-3.5">
                      <p className="font-bold text-white">{pay.user?.username}</p>
                      <p className="text-zinc-500 text-[11px]">{pay.user?.email}</p>
                    </td>
                    <td className="p-3.5 text-zinc-300">{pay.paymentMethod}</td>
                    <td className="p-3.5 font-bold text-amber-400">+{pay.coinsAmount} coins</td>
                    <td className="p-3.5 text-white font-semibold">₹{(pay.amountInrPaise / 100).toFixed(2)}</td>
                    <td className="p-3.5 font-mono text-sky-400">{pay.utrReference || "-"}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          pay.status === "SUCCESS"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : pay.status === "PENDING"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}
                      >
                        {pay.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      {pay.status === "PENDING" && (
                        <button
                          onClick={() => {
                            setPaymentReviewModal(pay);
                            setPaymentNote("");
                          }}
                          className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-[11px]"
                        >
                          Review & Action
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================= TAB: REDEEM CODES ======================= */}
      {activeTab === "redeem-codes" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Custom Coin Redeem Codes ({redeemCodesList.length})
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Create promotional or gift codes with custom coin amounts that verified users can redeem once.
              </p>
            </div>
            <button
              onClick={() => {
                const randomCode = `COIN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
                setCodeModal({
                  code: randomCode,
                  coinAmount: 100,
                  maxUses: 1,
                  expiresAt: "",
                  isActive: true,
                });
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              Create Redeem Code
            </button>
          </div>

          {redeemCodesList.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#0d101a] border border-[#1c2234]">
              <Ticket className="w-10 h-10 text-zinc-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">No Redeem Codes Created Yet</h3>
              <p className="text-xs text-zinc-400 mb-4 max-w-sm mx-auto">
                Create promo codes with custom coin amounts to reward users, run events, or distribute test credits.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-[#1c2234]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0e121c] text-zinc-400 border-b border-[#1c2234]">
                  <tr>
                    <th className="p-3.5">Code</th>
                    <th className="p-3.5">Coin Amount</th>
                    <th className="p-3.5">Usage / Limit</th>
                    <th className="p-3.5">Expires</th>
                    <th className="p-3.5">Created By</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#171d2c] bg-[#090b12]">
                  {redeemCodesList.map((rc) => {
                    const isExpired = rc.expiresAt && new Date() > new Date(rc.expiresAt);
                    const isLimitReached = rc.maxUses > 0 && rc.timesRedeemed >= rc.maxUses;

                    return (
                      <tr key={rc.id} className="hover:bg-[#0e121d] transition-colors">
                        <td className="p-3.5 font-mono text-base font-black text-amber-400 tracking-wider">
                          {rc.code}
                        </td>
                        <td className="p-3.5 font-bold text-white">
                          +{rc.coinAmount.toLocaleString()} coins
                        </td>
                        <td className="p-3.5 text-zinc-300">
                          <span className="font-bold text-white">{rc.timesRedeemed}</span> /{" "}
                          <span>{rc.maxUses === 0 ? "Unlimited" : rc.maxUses}</span>
                        </td>
                        <td className="p-3.5 text-zinc-400">
                          {rc.expiresAt ? (
                            <span className={isExpired ? "text-red-400 font-semibold" : ""}>
                              {new Date(rc.expiresAt).toLocaleDateString()}
                            </span>
                          ) : (
                            "Never"
                          )}
                        </td>
                        <td className="p-3.5 text-zinc-400">
                          {rc.createdBy?.username || "Admin"}
                        </td>
                        <td className="p-3.5">
                          {rc.isActive && !isExpired && !isLimitReached ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[10px]">
                              Active
                            </span>
                          ) : isExpired ? (
                            <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-bold text-[10px]">
                              Expired
                            </span>
                          ) : isLimitReached ? (
                            <span className="px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 font-bold text-[10px]">
                              Limit Reached
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 font-bold text-[10px]">
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right space-x-2">
                          <button
                            onClick={() => handleToggleCodeActive(rc.id, rc.isActive)}
                            className={`px-2.5 py-1 rounded-lg border font-semibold text-[11px] ${
                              rc.isActive
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            }`}
                          >
                            {rc.isActive ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            onClick={() => handleDeleteCode(rc.id)}
                            className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-semibold text-[11px]"
                          >
                            <Trash2 className="w-3.5 h-3.5 inline" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ======================= TAB: WEBSITE SETTINGS ======================= */}
      {activeTab === "settings" && settingsData && (
        <div className="p-6 rounded-2xl bg-[#0d101a] border border-[#1c2234] max-w-3xl">
          <h3 className="text-base font-bold text-white mb-4">Website Information & Branding</h3>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-400 mb-1">Website Name</label>
                <input
                  type="text"
                  value={settingsData.siteName || ""}
                  onChange={(e) => setSettingsData({ ...settingsData, siteName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#121624] border border-[#20273a] text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Tagline</label>
                <input
                  type="text"
                  value={settingsData.tagline || ""}
                  onChange={(e) => setSettingsData({ ...settingsData, tagline: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#121624] border border-[#20273a] text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-400 mb-1">Contact Email</label>
                <input
                  type="email"
                  value={settingsData.contactEmail || ""}
                  onChange={(e) => setSettingsData({ ...settingsData, contactEmail: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#121624] border border-[#20273a] text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Server Timezone</label>
                <input
                  type="text"
                  value={settingsData.timezone || "Asia/Kolkata"}
                  onChange={(e) => setSettingsData({ ...settingsData, timezone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#121624] border border-[#20273a] text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">Support Desk Details</label>
              <input
                type="text"
                value={settingsData.supportInfo || ""}
                onChange={(e) => setSettingsData({ ...settingsData, supportInfo: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#121624] border border-[#20273a] text-white"
              />
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">Footer Copyright / Branding Text</label>
              <input
                type="text"
                value={settingsData.footerText || ""}
                onChange={(e) => setSettingsData({ ...settingsData, footerText: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#121624] border border-[#20273a] text-white"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-md shadow-amber-500/20"
              >
                Save Website Information
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================= TAB: MAINTENANCE & ECONOMY ======================= */}
      {activeTab === "maintenance" && settingsData && (
        <div className="p-6 rounded-2xl bg-[#0d101a] border border-[#1c2234] max-w-3xl space-y-6">
          <h3 className="text-base font-bold text-white mb-2">Maintenance & Economy Controls</h3>

          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-[#121624] border border-[#1e2538] flex items-center justify-between">
              <div>
                <p className="font-bold text-white text-sm">Coin Earning Maintenance</p>
                <p className="text-zinc-400">Blocks Link tasks and AFK heartbeats across all clients</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setSettingsData({ ...settingsData, earningMaintenance: !settingsData.earningMaintenance })
                }
                className={`px-4 py-1.5 rounded-xl font-bold ${
                  settingsData.earningMaintenance
                    ? "bg-red-500 text-white"
                    : "bg-emerald-500 text-black"
                }`}
              >
                {settingsData.earningMaintenance ? "MAINTENANCE ON" : "ACTIVE"}
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#121624] border border-[#1e2538] flex items-center justify-between">
              <div>
                <p className="font-bold text-white text-sm">Coin Purchasing Maintenance</p>
                <p className="text-zinc-400">Blocks Razorpay and manual payment generation</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setSettingsData({ ...settingsData, purchaseMaintenance: !settingsData.purchaseMaintenance })
                }
                className={`px-4 py-1.5 rounded-xl font-bold ${
                  settingsData.purchaseMaintenance
                    ? "bg-red-500 text-white"
                    : "bg-emerald-500 text-black"
                }`}
              >
                {settingsData.purchaseMaintenance ? "MAINTENANCE ON" : "ACTIVE"}
              </button>
            </div>

            <h4 className="font-bold text-white pt-2">Earning Rates & Caps</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-400 mb-1">Reward per Link Task (Coins)</label>
                <input
                  type="number"
                  value={settingsData.linkRewardCoins || 2}
                  onChange={(e) => setSettingsData({ ...settingsData, linkRewardCoins: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#121624] border border-[#20273a] text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Max Daily Link Task Coins</label>
                <input
                  type="number"
                  value={settingsData.linkDailyMaxCoins || 40}
                  onChange={(e) => setSettingsData({ ...settingsData, linkDailyMaxCoins: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#121624] border border-[#20273a] text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">AFK Coins per Minute</label>
                <input
                  type="number"
                  value={settingsData.afkCoinsPerMinute || 1}
                  onChange={(e) => setSettingsData({ ...settingsData, afkCoinsPerMinute: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#121624] border border-[#20273a] text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Max Daily AFK Coins</label>
                <input
                  type="number"
                  value={settingsData.afkDailyMaxCoins || 20}
                  onChange={(e) => setSettingsData({ ...settingsData, afkDailyMaxCoins: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#121624] border border-[#20273a] text-white"
                />
              </div>
            </div>

            <h4 className="font-bold text-white pt-2">Manual Payment Gateway URL</h4>
            <div>
              <label className="block text-zinc-400 mb-1">External Payment URL / UPI Link</label>
              <input
                type="text"
                value={settingsData.manualPaymentUrl || ""}
                onChange={(e) => setSettingsData({ ...settingsData, manualPaymentUrl: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#121624] border border-[#20273a] text-white"
              />
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleSaveSettings}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs"
              >
                Save Maintenance & Economy Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= TAB: SMTP MAILER ======================= */}
      {activeTab === "smtp" && smtpData && (
        <div className="p-6 rounded-2xl bg-[#0d101a] border border-[#1c2234] max-w-3xl space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">SMTP Email Gateway Configuration</h3>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                smtpData.isConfigured
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                  : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
              }`}
            >
              {smtpData.isConfigured ? "✓ Connected / Configured" : "Unconfigured (Simulated Log Mode)"}
            </span>
          </div>

          <form onSubmit={handleSaveSmtp} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-400 mb-1">SMTP Host</label>
                <input
                  type="text"
                  placeholder="smtp.mailtrap.io or smtp.gmail.com"
                  value={smtpData.host || ""}
                  onChange={(e) => setSmtpData({ ...smtpData, host: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#121624] border border-[#20273a] text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">SMTP Port</label>
                <input
                  type="number"
                  placeholder="587"
                  value={smtpData.port || 587}
                  onChange={(e) => setSmtpData({ ...smtpData, port: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#121624] border border-[#20273a] text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-400 mb-1">SMTP Username / API Key</label>
                <input
                  type="text"
                  value={smtpData.username || ""}
                  onChange={(e) => setSmtpData({ ...smtpData, username: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#121624] border border-[#20273a] text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">SMTP Password</label>
                <input
                  type="password"
                  placeholder="Keep blank to retain existing password"
                  onChange={(e) => setSmtpData({ ...smtpData, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#121624] border border-[#20273a] text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-400 mb-1">Sender Name</label>
                <input
                  type="text"
                  value={smtpData.senderName || ""}
                  onChange={(e) => setSmtpData({ ...smtpData, senderName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#121624] border border-[#20273a] text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Sender Email Address</label>
                <input
                  type="email"
                  value={smtpData.senderEmail || ""}
                  onChange={(e) => setSmtpData({ ...smtpData, senderEmail: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#121624] border border-[#20273a] text-white"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs"
              >
                Save SMTP Settings
              </button>

              <button
                type="button"
                onClick={handleTestSmtp}
                className="px-5 py-2.5 rounded-xl bg-[#171d2c] hover:bg-[#20273b] text-zinc-200 border border-[#27324c] font-bold text-xs flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5 text-amber-400" />
                Test SMTP Connection
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================= TAB: EMAIL TEMPLATES ======================= */}
      {activeTab === "templates" && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-4 p-4 rounded-2xl bg-[#0d101a] border border-[#1c2234] space-y-2">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
              Select Template ({templatesList.length})
            </h3>
            <div className="space-y-1">
              {templatesList.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => setSelectedTemplate(tpl)}
                  className={`w-full p-3 rounded-xl text-left text-xs transition-colors ${
                    selectedTemplate?.id === tpl.id
                      ? "bg-amber-500 text-black font-bold"
                      : "bg-[#111420] text-zinc-300 hover:bg-[#161a28]"
                  }`}
                >
                  <p className="font-bold">{tpl.name}</p>
                  <p className="text-[10px] opacity-75 truncate">{tpl.type}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-8 p-6 rounded-2xl bg-[#0d101a] border border-[#1c2234]">
            {selectedTemplate ? (
              <form onSubmit={handleSaveTemplate} className="space-y-4 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-[#181d2a]">
                  <div>
                    <h3 className="text-base font-bold text-white">{selectedTemplate.name}</h3>
                    <p className="text-zinc-400 text-[11px]">{selectedTemplate.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleTestTemplate}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Test Send
                  </button>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Subject Line</label>
                  <input
                    type="text"
                    value={selectedTemplate.subject}
                    onChange={(e) =>
                      setSelectedTemplate({ ...selectedTemplate, subject: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#121624] border border-[#20273a] text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">HTML Template Body</label>
                  <textarea
                    rows={12}
                    value={selectedTemplate.htmlBody}
                    onChange={(e) =>
                      setSelectedTemplate({ ...selectedTemplate, htmlBody: e.target.value })
                    }
                    className="w-full p-3.5 rounded-xl bg-[#090b12] border border-[#20273a] text-zinc-200 font-mono text-[11px] leading-relaxed"
                  />
                </div>

                <div className="p-3 rounded-xl bg-[#101420] border border-[#1c2336] text-[11px]">
                  <span className="font-bold text-amber-400">Supported Variables:</span>{" "}
                  <span className="font-mono text-zinc-300">{selectedTemplate.variablesJson}</span>
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold"
                >
                  Save Template Changes
                </button>
              </form>
            ) : (
              <p className="text-zinc-500 text-xs">Select a template on the left to edit.</p>
            )}
          </div>
        </div>
      )}

      {/* ======================= TAB: CONTACT TICKETS ======================= */}
      {activeTab === "contact" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Customer Support Tickets ({contactList.length})
            </h3>
            <button
              onClick={() => loadTabData("contact")}
              className="px-3 py-1.5 rounded-xl bg-[#141824] text-zinc-300 text-xs border border-[#20273a]"
            >
              Refresh Tickets
            </button>
          </div>

          <div className="space-y-3">
            {contactList.map((msg) => (
              <div
                key={msg.id}
                className="p-5 rounded-2xl bg-[#0d101a] border border-[#1c2234] space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white">{msg.name}</span>{" "}
                    <span className="text-zinc-400">({msg.email})</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {new Date(msg.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="font-bold text-amber-400">{msg.subject}</p>
                <p className="text-zinc-300 bg-[#090b12] p-3 rounded-xl border border-[#171d2b]">
                  {msg.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================= MODALS ======================= */}

      {/* 1. Coin Adjustment Modal */}
      {coinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="max-w-md w-full bg-[#101422] border border-[#20273a] rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Adjust Coin Balance</h3>
            <p className="text-xs text-zinc-400 mb-4">
              For user: <strong className="text-amber-400">{coinModal.username}</strong> ({coinModal.email})
            </p>

            <form onSubmit={handleAdjustCoins} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 mb-1 font-semibold">
                  Coin Amount (Positive to add, Negative to deduct)
                </label>
                <input
                  type="number"
                  step={1}
                  required
                  value={coinAmount}
                  onChange={(e) => setCoinAmount(parseInt(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#090b12] border border-[#20273a] text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-zinc-300 mb-1 font-semibold">
                  Mandatory Reason / Audit Note
                </label>
                <textarea
                  required
                  rows={3}
                  value={coinReason}
                  onChange={(e) => setCoinReason(e.target.value)}
                  placeholder="e.g. Promotional event bonus, manual top-up, compensation..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#090b12] border border-[#20273a] text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCoinModal(null)}
                  className="flex-1 py-2.5 rounded-xl bg-[#141824] text-zinc-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold"
                >
                  Execute Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Suspend/Unsuspend Modal */}
      {suspendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="max-w-md w-full bg-[#101422] border border-[#20273a] rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">
              {suspendModal.isSuspended ? "Unsuspend Account" : "Suspend Account"}
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              User: <strong className="text-white">{suspendModal.username}</strong>
            </p>

            <form onSubmit={handleToggleSuspend} className="space-y-4 text-xs">
              {!suspendModal.isSuspended && (
                <div>
                  <label className="block text-zinc-300 mb-1 font-semibold">
                    Mandatory Suspension Reason (Sent in email notification)
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                    placeholder="e.g. Violating terms of service, fraud prevention..."
                    className="w-full px-3.5 py-2 rounded-xl bg-[#090b12] border border-[#20273a] text-white"
                  />
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSuspendModal(null)}
                  className="flex-1 py-2.5 rounded-xl bg-[#141824] text-zinc-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2.5 rounded-xl font-bold ${
                    suspendModal.isSuspended
                      ? "bg-emerald-500 text-black"
                      : "bg-red-500 text-white"
                  }`}
                >
                  {suspendModal.isSuspended ? "Confirm Unsuspend" : "Confirm Suspension"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Product Add/Edit Modal */}
      {productModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="max-w-xl w-full bg-[#101422] border border-[#20273a] rounded-2xl p-6 shadow-2xl my-8">
            <h3 className="text-lg font-bold text-white mb-4">
              {productModal.id ? "Edit Product" : "Add Digital Product"}
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-300 mb-1 font-semibold">Product Name</label>
                  <input
                    type="text"
                    required
                    value={productModal.name || ""}
                    onChange={(e) => setProductModal({ ...productModal, name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#090b12] border border-[#20273a] text-white"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 mb-1 font-semibold">URL Slug</label>
                  <input
                    type="text"
                    required
                    value={productModal.slug || ""}
                    onChange={(e) => setProductModal({ ...productModal, slug: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#090b12] border border-[#20273a] text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-zinc-300 mb-1 font-semibold">Category</label>
                  <select
                    value={productModal.categoryId || ""}
                    onChange={(e) => setProductModal({ ...productModal, categoryId: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#090b12] border border-[#20273a] text-white"
                  >
                    {categoriesList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-300 mb-1 font-semibold">Coin Price</label>
                  <input
                    type="number"
                    required
                    value={productModal.coinPrice || 0}
                    onChange={(e) => setProductModal({ ...productModal, coinPrice: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#090b12] border border-[#20273a] text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 mb-1 font-semibold">Stock Quantity</label>
                  <input
                    type="number"
                    required
                    value={productModal.stockQuantity || 0}
                    onChange={(e) => setProductModal({ ...productModal, stockQuantity: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#090b12] border border-[#20273a] text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 mb-1 font-semibold">Icon / Image Type</label>
                <select
                  value={productModal.image || "gift"}
                  onChange={(e) => setProductModal({ ...productModal, image: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#090b12] border border-[#20273a] text-white"
                >
                  <option value="minecraft">Minecraft Block Style</option>
                  <option value="googleplay">Google Play Card</option>
                  <option value="steam">Steam Wallet</option>
                  <option value="discord">Discord Nitro</option>
                  <option value="spotify">Spotify Premium</option>
                  <option value="roblox">Roblox Robux</option>
                  <option value="gift">General Gift Card</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-300 mb-1 font-semibold">Short Summary</label>
                <input
                  type="text"
                  value={productModal.shortDesc || ""}
                  onChange={(e) => setProductModal({ ...productModal, shortDesc: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#090b12] border border-[#20273a] text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-300 mb-1 font-semibold">Full Description</label>
                <textarea
                  rows={3}
                  value={productModal.fullDesc || ""}
                  onChange={(e) => setProductModal({ ...productModal, fullDesc: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#090b12] border border-[#20273a] text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-300 mb-1 font-semibold">Delivery Instructions</label>
                <textarea
                  rows={2}
                  value={productModal.deliveryInstructions || ""}
                  onChange={(e) =>
                    setProductModal({ ...productModal, deliveryInstructions: e.target.value })
                  }
                  placeholder="e.g. Redeem at https://example.com/redeem"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#090b12] border border-[#20273a] text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setProductModal(null)}
                  className="flex-1 py-2.5 rounded-xl bg-[#141824] text-zinc-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Order Delivery Modal */}
      {deliverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="max-w-md w-full bg-[#101422] border border-[#20273a] rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Fulfill Digital Order</h3>
            <p className="text-xs text-zinc-400 mb-4">
              Order Reference: <strong className="text-amber-400">{deliverModal.orderNumber}</strong>
            </p>

            <form onSubmit={handleDeliverOrder} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 mb-1 font-semibold">
                  Digital Code / Key / Redemption Content
                </label>
                <textarea
                  required
                  rows={4}
                  value={deliveryCode}
                  onChange={(e) => setDeliveryCode(e.target.value)}
                  placeholder="Enter 25-char Minecraft key, Google Play gift card PIN, or voucher voucher..."
                  className="w-full p-3 rounded-xl bg-[#090b12] border border-[#20273a] text-sky-400 font-mono text-xs"
                />
                <p className="text-[11px] text-zinc-500 mt-1">
                  This content will be securely encrypted and revealed only in the customer&apos;s account vault.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeliverModal(null)}
                  className="flex-1 py-2.5 rounded-xl bg-[#141824] text-zinc-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold"
                >
                  Confirm Delivery & Send Email
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Order Decline & Refund Modal */}
      {declineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="max-w-md w-full bg-[#101422] border border-[#20273a] rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Decline Order & Refund Coins</h3>
            <p className="text-xs text-zinc-400 mb-4">
              Order: <strong className="text-amber-400">{declineModal.orderNumber}</strong> (
              {declineModal.totalCoins} coins)
            </p>

            <form onSubmit={handleDeclineOrder} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 mb-1 font-semibold">
                  Mandatory Decline Reason (Sent in email notification)
                </label>
                <textarea
                  required
                  rows={3}
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  placeholder="e.g. Out of stock with distributor, invalid details..."
                  className="w-full p-3 rounded-xl bg-[#090b12] border border-[#20273a] text-white text-xs"
                />
              </div>

              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-[11px]">
                Declining will automatically refund {declineModal.totalCoins} coins back to the user&apos;s wallet.
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeclineModal(null)}
                  className="flex-1 py-2.5 rounded-xl bg-[#141824] text-zinc-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-white font-bold"
                >
                  Confirm Decline & Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Payment Review Modal */}
      {paymentReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="max-w-md w-full bg-[#101422] border border-[#20273a] rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Review Manual Payment Request</h3>
            <p className="text-xs text-zinc-400 mb-4">
              Ref: <strong className="text-amber-400">{paymentReviewModal.paymentReference}</strong>
            </p>

            <div className="p-4 rounded-xl bg-[#0b0e18] border border-[#1b2238] space-y-2 mb-4 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-400">Coins Requested:</span>
                <span className="text-amber-400 font-bold">+{paymentReviewModal.coinsAmount} coins</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Expected INR:</span>
                <span className="text-white font-bold">
                  ₹{(paymentReviewModal.amountInrPaise / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">User Submitted UTR:</span>
                <span className="font-mono text-sky-400 font-bold">
                  {paymentReviewModal.utrReference || "No UTR submitted yet"}
                </span>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 mb-1 font-semibold">
                  Admin Note / Reason (Optional for approve, required for reject)
                </label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="e.g. Bank statement verified..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#090b12] border border-[#20273a] text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentReviewModal(null)}
                  className="flex-1 py-2.5 rounded-xl bg-[#141824] text-zinc-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleReviewPayment("reject")}
                  className="flex-1 py-2.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 font-bold"
                >
                  Reject Request
                </button>
                <button
                  type="button"
                  onClick={() => handleReviewPayment("approve")}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-black font-bold"
                >
                  Approve & Credit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Redeem Code Creation Modal */}
      {codeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="max-w-md w-full bg-[#101422] border border-[#20273a] rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Create Custom Redeem Code</h3>
            <p className="text-xs text-zinc-400 mb-4">
              Issue a custom promo code that verified users can redeem for free coins.
            </p>

            <form onSubmit={handleSaveRedeemCode} className="space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-zinc-300 font-semibold">Redeem Code String</label>
                  <button
                    type="button"
                    onClick={() => {
                      const rand = `COIN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
                      setCodeModal({ ...codeModal, code: rand });
                    }}
                    className="text-[11px] text-amber-400 hover:underline"
                  >
                    Generate Random
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={codeModal.code || ""}
                  onChange={(e) =>
                    setCodeModal({ ...codeModal, code: e.target.value.toUpperCase() })
                  }
                  placeholder="e.g. WELCOME100 or VIP500"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#090b12] border border-[#20273a] text-amber-400 font-mono font-bold uppercase tracking-wider"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-300 mb-1 font-semibold">
                    Coin Amount to Credit
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={codeModal.coinAmount || 100}
                    onChange={(e) =>
                      setCodeModal({
                        ...codeModal,
                        coinAmount: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#090b12] border border-[#20273a] text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 mb-1 font-semibold">
                    Max Redemptions (0 = Unlimited)
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={codeModal.maxUses !== undefined ? codeModal.maxUses : 1}
                    onChange={(e) =>
                      setCodeModal({
                        ...codeModal,
                        maxUses: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#090b12] border border-[#20273a] text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 mb-1 font-semibold">
                  Expiration Date (Optional)
                </label>
                <input
                  type="date"
                  value={codeModal.expiresAt ? codeModal.expiresAt.substring(0, 10) : ""}
                  onChange={(e) =>
                    setCodeModal({ ...codeModal, expiresAt: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#090b12] border border-[#20273a] text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="codeActiveCheck"
                  checked={codeModal.isActive ?? true}
                  onChange={(e) =>
                    setCodeModal({ ...codeModal, isActive: e.target.checked })
                  }
                  className="rounded bg-[#090b12] border-[#20273a] text-amber-500 focus:ring-0"
                />
                <label htmlFor="codeActiveCheck" className="text-zinc-300 font-medium">
                  Active immediately upon creation
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCodeModal(null)}
                  className="flex-1 py-2.5 rounded-xl bg-[#141824] text-zinc-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold"
                >
                  Create Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
