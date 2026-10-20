"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { ProductIcon } from "@/components/ProductIcon";
import {
  Coins,
  Search,
  Filter,
  ShoppingCart,
  Zap,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowUpDown,
  ShoppingBag,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  slug: string;
  shortDesc: string;
  coinPrice: number;
  isAvailable: boolean;
  stockQuantity: number;
  image: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function ShopPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [availability, setAvailability] = useState("all");
  const [sort, setSort] = useState("newest");
  const [notification, setNotification] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (selectedCategory !== "all") params.set("category", selectedCategory);
      if (availability !== "all") params.set("availability", availability);
      if (sort !== "newest") params.set("sort", sort);

      const res = await fetch(`/api/products?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
        setCategories(data.categories || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchProducts();
    }, 250);

    return () => clearTimeout(delayDebounceFn);
  }, [search, selectedCategory, availability, sort]);

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    if (!product.isAvailable || product.stockQuantity <= 0) return;
    addToCart(product, 1);
    setNotification(`Added "${product.name}" to cart!`);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleBuyNow = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    if (!product.isAvailable || product.stockQuantity <= 0) return;
    addToCart(product, 1);
    router.push("/checkout");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#121624] border border-amber-500/50 text-amber-300 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-up">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <span className="text-sm font-semibold">{notification}</span>
        </div>
      )}

      {/* Header and User Balance Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-[#181d2a]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-2">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Digital Marketplace</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Digital Product Catalog</h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Redeem your earned coins for genuine game keys, gift cards, and subscriptions.
          </p>
        </div>

        {user ? (
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#0f131f] border border-amber-500/25">
            <div>
              <p className="text-xs text-zinc-400">Your Coin Balance</p>
              <div className="flex items-center gap-2 text-2xl font-black text-amber-400">
                <Coins className="w-6 h-6 text-amber-400" />
                <span>{user.coinBalance.toLocaleString()}</span>
              </div>
            </div>
            <Link
              href="/earn"
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-colors shrink-0"
            >
              + Earn More
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#0f131f] border border-[#1e2538]">
            <p className="text-xs text-zinc-400">
              <Link href="/auth/login" className="text-amber-400 font-bold hover:underline">
                Sign in
              </Link>{" "}
              to check your coin balance and redeem products.
            </p>
          </div>
        )}
      </div>

      {/* Search and Filters Bar */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Search Input */}
        <div className="md:col-span-5 relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Minecraft, Google Play, Steam..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0f131f] border border-[#1e2538] text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 transition-colors"
          />
        </div>

        {/* Category Filter */}
        <div className="md:col-span-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#0f131f] border border-[#1e2538] text-sm text-zinc-200 focus:outline-none focus:border-amber-400 transition-colors"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Availability Filter */}
        <div className="md:col-span-2">
          <select
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#0f131f] border border-[#1e2538] text-sm text-zinc-200 focus:outline-none focus:border-amber-400 transition-colors"
          >
            <option value="all">All Stock Status</option>
            <option value="available">In Stock Only</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>

        {/* Sort Filter */}
        <div className="md:col-span-2">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#0f131f] border border-[#1e2538] text-sm text-zinc-200 focus:outline-none focus:border-amber-400 transition-colors"
          >
            <option value="newest">Newest First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name_asc">Name: A to Z</option>
          </select>
        </div>
      </div>

      {/* Category Quick Pills */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            selectedCategory === "all"
              ? "bg-amber-500 text-black font-bold"
              : "bg-[#121624] text-zinc-400 hover:text-white border border-[#1d2334]"
          }`}
        >
          All Items ({products.length})
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.slug)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedCategory === c.slug
                ? "bg-amber-500 text-black font-bold"
                : "bg-[#121624] text-zinc-400 hover:text-white border border-[#1d2334]"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      <div className="mt-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="h-72 rounded-2xl bg-[#0f131f]/50 border border-[#1a2030] animate-pulse p-6"
              >
                <div className="w-14 h-14 rounded-xl bg-[#171d2b] mb-4"></div>
                <div className="h-4 bg-[#171d2b] rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-[#171d2b] rounded w-1/2 mb-6"></div>
                <div className="h-8 bg-[#171d2b] rounded mt-auto"></div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 px-4 rounded-2xl bg-[#0f131f] border border-[#1a2030]">
            <div className="inline-flex p-4 rounded-2xl bg-amber-500/10 text-amber-400 mb-4">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">No products found</h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
              We couldn&apos;t find any digital products matching your current search or category filters.
            </p>
            <button
              onClick={() => {
                setSearch("");
                setSelectedCategory("all");
                setAvailability("all");
              }}
              className="mt-5 px-4 py-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold hover:bg-amber-500/30 transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => {
              const inStock = product.isAvailable && product.stockQuantity > 0;
              const affordable = user ? user.coinBalance >= product.coinPrice : true;

              return (
                <div
                  key={product.id}
                  className="rounded-2xl bg-[#0d101a] border border-[#1c2234] hover:border-amber-500/30 transition-all flex flex-col justify-between p-5 hover:shadow-xl hover:shadow-amber-500/5 group"
                >
                  <div>
                    {/* Top row: Icon & Availability Badge */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <Link href={`/shop/product/${product.slug}`}>
                        <ProductIcon type={product.image || product.name} className="w-14 h-14" />
                      </Link>

                      {inStock ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          In Stock ({product.stockQuantity})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                          <XCircle className="w-3 h-3" />
                          Out of Stock
                        </span>
                      )}
                    </div>

                    {/* Category Label */}
                    <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                      {product.category?.name}
                    </p>

                    {/* Product Name */}
                    <Link
                      href={`/shop/product/${product.slug}`}
                      className="block text-base font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1"
                    >
                      {product.name}
                    </Link>

                    {/* Short Description */}
                    <p className="text-xs text-zinc-400 line-clamp-2 mt-1.5 leading-relaxed">
                      {product.shortDesc}
                    </p>
                  </div>

                  {/* Price & Action Buttons */}
                  <div className="mt-6 pt-4 border-t border-[#171d2b]">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-[11px] text-zinc-400">Price</span>
                        <div className="flex items-center gap-1.5 text-lg font-black text-amber-400">
                          <Coins className="w-5 h-5" />
                          <span>{product.coinPrice.toLocaleString()}</span>
                          <span className="text-xs text-amber-400/80 font-normal">coins</span>
                        </div>
                      </div>

                      {user && (
                        <span
                          className={`text-[11px] font-semibold ${
                            affordable ? "text-emerald-400" : "text-zinc-400"
                          }`}
                        >
                          {affordable ? "✓ Can Redeem" : "Need more coins"}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={(e) => handleAddToCart(product, e)}
                        disabled={!inStock}
                        className="py-2.5 px-3 rounded-xl bg-[#141824] hover:bg-[#1a2030] text-zinc-200 border border-[#22293d] font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        Add to Cart
                      </button>

                      <button
                        onClick={(e) => handleBuyNow(product, e)}
                        disabled={!inStock}
                        className="py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Zap className="w-3.5 h-3.5 fill-black" />
                        Buy Now
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
