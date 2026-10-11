import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  ArrowLeft, ArrowRight, Check, ChevronDown, Heart, Leaf, Minus, Plus,
  Search, ShoppingBag, Sparkles, Star, X,
} from "lucide-react";

type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  rating: number;
  reviewCount: number;
  badge: string | null;
  color: string;
  description: string;
  details: string[];
  image: string;
  imageAlt: string;
};

type CartLine = { product: Product; quantity: number };
type Customer = { name: string; email: string; address: string; city: string; region: string; postalCode: string };
type Order = {
  id: string;
  createdAt: string;
  customer: Customer;
  items: Array<{ productId: string; name: string; price: number; quantity: number; image: string }>;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  paymentStatus: string;
};
type View = "shop" | "checkout" | "orders" | "confirmation";

const viewPaths: Record<View, string> = {
  shop: "/",
  checkout: "/checkout",
  orders: "/orders",
  confirmation: "/order-confirmation",
};

function viewFromPath(pathname: string): View {
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";
  const entry = Object.entries(viewPaths).find(([, path]) => path === normalizedPath);
  return (entry?.[0] as View | undefined) ?? "shop";
}

const shippingThreshold = 75;
const shippingFee = 8.95;
const taxRate = 0.08;
const formatPrice = (price: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(price);

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "That didn't work. Please try again.");
  return data as T;
}

function readCart(): Record<string, number> {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem("little-leaf-cart") ?? "{}");
    if (!stored || typeof stored !== "object" || Array.isArray(stored)) return {};
    return Object.fromEntries(Object.entries(stored)
      .filter(([id, quantity]) => typeof id === "string" && Number.isInteger(quantity) && Number(quantity) > 0 && Number(quantity) <= 20));
  } catch {
    return {};
  }
}

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(["All finds", "At home", "On the go", "Little things"]);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [cartQuantities, setCartQuantities] = useState<Record<string, number>>(readCart);
  const [activeCategory, setActiveCategory] = useState("All finds");
  const [searchText, setSearchText] = useState("");
  const [sortOrder, setSortOrder] = useState("featured");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [view, setView] = useState<View>(() => viewFromPath(window.location.pathname));
  const [order, setOrder] = useState<Order | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const currentPath = window.location.pathname;
    const canonicalPath = viewPaths[viewFromPath(currentPath)];
    window.history.replaceState({ littleLeaf: true, view: viewFromPath(currentPath), previousPath: null }, "", canonicalPath);

    const handlePopState = () => {
      const nextView = viewFromPath(window.location.pathname);
      const nextPath = viewPaths[nextView];
      if (window.location.pathname !== nextPath) {
        window.history.replaceState({ littleLeaf: true, view: nextView, previousPath: null }, "", nextPath);
      }
      setView(nextView);
      setCartOpen(false);
      setSelectedProduct(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (view === "confirmation" && !order) openView("orders", true);
  }, [view, order]);

  useEffect(() => {
    request<{ products: Product[]; categories: string[] }>("/api/products")
      .then((data) => {
        setProducts(data.products);
        setCategories(data.categories);
        setLoadError("");
      })
      .catch((error: Error) => setLoadError(error.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("little-leaf-cart", JSON.stringify(cartQuantities));
    } catch {
      // The bag remains usable for this visit if browser storage is unavailable.
    }
  }, [cartQuantities]);

  const cart = useMemo(() => Object.entries(cartQuantities).flatMap(([id, quantity]) => {
    const product = products.find((entry) => entry.id === id);
    return product && quantity > 0 ? [{ product, quantity }] : [];
  }), [cartQuantities, products]);
  const itemCount = cart.reduce((total, line) => total + line.quantity, 0);
  const subtotal = cart.reduce((total, line) => total + line.product.price * line.quantity, 0);
  const shipping = subtotal === 0 || subtotal >= shippingThreshold ? 0 : shippingFee;
  const tax = Math.round(subtotal * taxRate * 100) / 100;
  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();
    const filtered = products.filter((product) => {
      const matchesCategory = activeCategory === "All finds" || product.category === activeCategory;
      const matchesSearch = !normalizedSearch || `${product.name} ${product.category} ${product.description} ${product.color}`.toLowerCase().includes(normalizedSearch);
      return matchesCategory && matchesSearch;
    });
    if (sortOrder === "price-low") return filtered.sort((a, b) => a.price - b.price);
    if (sortOrder === "price-high") return filtered.sort((a, b) => b.price - a.price);
    if (sortOrder === "rating") return filtered.sort((a, b) => b.rating - a.rating);
    return filtered;
  }, [products, activeCategory, searchText, sortOrder]);

  function addToCart(product: Product) {
    setCartQuantities((previous) => ({ ...previous, [product.id]: Math.min(20, (previous[product.id] ?? 0) + 1) }));
    setNotice(`${product.name} added to your bag`);
    window.setTimeout(() => setNotice(""), 2600);
  }

  function updateQuantity(productId: string, quantity: number) {
    setCartQuantities((previous) => {
      const next = { ...previous };
      if (quantity <= 0) delete next[productId];
      else next[productId] = Math.min(quantity, 20);
      return next;
    });
  }

  function openView(nextView: View, replaceHistory = false) {
    const nextPath = viewPaths[nextView];
    if (replaceHistory) {
      window.history.replaceState({ littleLeaf: true, view: nextView, previousPath: null }, "", nextPath);
    } else if (nextView !== view || window.location.pathname !== nextPath) {
      window.history.pushState({ littleLeaf: true, view: nextView, previousPath: window.location.pathname }, "", nextPath);
    }
    setView(nextView);
    setCartOpen(false);
    setSelectedProduct(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <div className="announcement">
        <Sparkles size={14} aria-hidden="true" />
        <span>A little something for you: free shipping on orders over $75</span>
        <Sparkles size={14} aria-hidden="true" />
      </div>
      <header className="site-header">
        <button className="brand" type="button" onClick={() => openView("shop")} aria-label="Little Leaf Market home">
          <span className="brand-mark"><Leaf size={21} strokeWidth={1.8} /></span>
          <span className="brand-copy">little leaf<span>MARKET</span></span>
        </button>
        <nav className="main-nav" aria-label="Main navigation">
          <button className={view === "shop" ? "nav-link active" : "nav-link"} aria-current={view === "shop" ? "page" : undefined} onClick={() => openView("shop")}>Shop all</button>
          <button className={view === "orders" ? "nav-link active" : "nav-link"} aria-current={view === "orders" ? "page" : undefined} onClick={() => openView("orders")}>Find an order</button>
        </nav>
        <div className="header-actions">
          <button className="icon-button bag-button" aria-label={`Open shopping bag with ${itemCount} items`} onClick={() => setCartOpen(true)}>
            <ShoppingBag size={20} strokeWidth={1.8} /><span>Bag</span><span className="bag-count">{itemCount}</span>
          </button>
        </div>
      </header>

      <main id="main-content">
        {view === "shop" && (
          <>
            <section className="hero">
              <div className="hero-copy">
                <div className="eyebrow"><span className="eyebrow-line" /> LITTLE THINGS, MADE WITH CARE</div>
                <h1>Find your kind<br />of <em>everyday.</em></h1>
                <p>Thoughtful finds for the rituals, routines, and in-between moments that make a life yours.</p>
                <button className="button button-dark hero-cta" onClick={() => document.getElementById("shop-the-good-stuff")?.scrollIntoView({ behavior: "smooth" })}>
                  Shop the good stuff <ArrowRight size={16} />
                </button>
                <div className="hero-note"><Heart size={14} /> Small-batch goods, chosen with a little more heart.</div>
              </div>
              <div className="hero-visual">
                <img src="https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?auto=format&fit=crop&w=1400&q=90" alt="Sunlit home with warm, natural textures and a leafy plant" />
                <div className="hero-sticker"><span>made for<br />slow living</span><Leaf size={18} /></div>
                <div className="hero-photo-caption"><span>THE SUNDAY EDIT</span><span>vol. 01 — everyday rituals</span></div>
              </div>
                      <div className="hero-flower flower-one" aria-hidden="true">✳</div>
              <div className="hero-flower flower-two" aria-hidden="true">✳</div>
            </section>

            <section className="promise-bar" aria-label="Our promises">
              <span><Leaf size={16} /> Thoughtfully sourced</span>
              <span><Heart size={16} /> Small makers, big heart</span>
              <span><Sparkles size={16} /> Packed with care</span>
            </section>

            <section className="catalog-section" id="shop-the-good-stuff">
              <div className="catalog-heading">
                <div>
                  <div className="eyebrow"><span className="eyebrow-line" /> THE LITTLE LEAF EDIT</div>
                  <h2>Good things, <em>gathered.</em></h2>
                </div>
                <p>Useful things with a little soul.<br />All chosen to be loved for a long time.</p>
              </div>
              <div className="catalog-toolbar">
                <div className="category-list" role="group" aria-label="Filter by category">
                  {categories.map((category) => (
                    <button key={category} className={activeCategory === category ? "category-chip selected" : "category-chip"} aria-pressed={activeCategory === category} onClick={() => setActiveCategory(category)}>
                      {category}
                    </button>
                  ))}
                </div>
                <div className="catalog-tools">
                  <label className="search-box">
                    <Search size={17} aria-hidden="true" />
                    <span className="visually-hidden">Search products</span>
                    <input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Find something lovely" />
                    {searchText && <button aria-label="Clear search" onClick={() => setSearchText("")}><X size={15} /></button>}
                  </label>
                  <label className="sort-select">
                    <span className="visually-hidden">Sort products</span>
                    <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
                      <option value="featured">Featured</option>
                      <option value="price-low">Price: low to high</option>
                      <option value="price-high">Price: high to low</option>
                      <option value="rating">Top rated</option>
                    </select>
                    <ChevronDown size={14} aria-hidden="true" />
                  </label>
                </div>
              </div>

              {loading ? (
                <div className="catalog-message" role="status"><span className="spinner" /> Gathering the good things…</div>
              ) : loadError ? (
                <div className="catalog-message error-state" role="alert">{loadError} <button className="text-button" onClick={() => window.location.reload()}>Try again</button></div>
              ) : filteredProducts.length === 0 ? (
                <div className="empty-products">
                  <span className="empty-illustration"><Search size={22} /></span>
                  <h3>No little treasures here (yet)</h3>
                  <p>Try a different search or take a peek at all of our finds.</p>
                  <button className="button button-outline" onClick={() => { setSearchText(""); setActiveCategory("All finds"); }}>See everything</button>
                </div>
              ) : (
                <>
                  <div className="product-grid">
                    {filteredProducts.map((product, index) => (
                      <ProductCard key={product.id} product={product} index={index} onOpen={() => setSelectedProduct(product)} onAdd={() => addToCart(product)} />
                    ))}
                  </div>
                  <div className="results-count" aria-live="polite">A collection of {filteredProducts.length} lovely {filteredProducts.length === 1 ? "thing" : "things"}</div>
                </>
              )}
            </section>
            <section className="note-section">
              <div className="note-leaf"><Leaf size={34} strokeWidth={1.3} /></div>
              <p>“The things we use every day can be small reminders<br className="desktop-break" /> to live a little more <em>like ourselves.</em>”</p>
              <span>A NOTE FROM OUR LITTLE SHOP</span>
            </section>
          </>
        )}

        {view === "checkout" && (
          <Checkout
            cart={cart}
            subtotal={subtotal}
            shipping={shipping}
            tax={tax}
            onBack={() => openView("shop", true)}
            onPlaceOrder={async (customer) => {
              const created = await request<{ order: Order }>("/api/orders", {
                method: "POST",
                body: JSON.stringify({ customer, items: cart.map((line) => ({ productId: line.product.id, quantity: line.quantity })) }),
              });
              setOrder(created.order);
              setCartQuantities({});
              openView("confirmation");
            }}
          />
        )}
        {view === "confirmation" && order && <OrderConfirmation order={order} onShop={() => openView("shop")} onOrders={() => openView("orders")} />}
        {view === "orders" && <OrderLookup onShop={() => openView("shop")} />}
      </main>

      <footer className="site-footer">
        <div className="footer-top">
          <div className="footer-brand"><span className="brand-mark"><Leaf size={21} /></span><span className="brand-copy">little leaf<span>MARKET</span></span></div>
          <p>Little joys for the life you live.</p>
          <button className="footer-shop" onClick={() => openView("shop")}>Back to the shop <ArrowRight size={15} /></button>
        </div>
        <div className="footer-bottom"><span>© 2026 Little Leaf Market</span><span>Small things. Good days. Always.</span><span>Made with a little more heart <Heart size={12} /></span></div>
      </footer>

      {selectedProduct && <ProductDialog product={selectedProduct} onClose={() => setSelectedProduct(null)} onAdd={() => { addToCart(selectedProduct); setSelectedProduct(null); }} />}
      <CartDialog
        open={cartOpen}
        cart={cart}
        subtotal={subtotal}
        shipping={shipping}
        tax={tax}
        total={subtotal + shipping + tax}
        onClose={() => setCartOpen(false)}
        onUpdate={updateQuantity}
        onCheckout={() => cart.length > 0 && openView("checkout")}
      />
      <div className="live-notice" aria-live="polite" aria-atomic="true">{notice}</div>
    </>
  );
}

function ProductCard({ product, index, onOpen, onAdd }: { product: Product; index: number; onOpen: () => void; onAdd: () => void }) {
  return (
    <article className="product-card" style={{ animationDelay: `${index * 50}ms` }}>
      <button className="product-image-wrap" onClick={onOpen} aria-label={`View ${product.name}`}>
        <img className="product-image" src={product.image} alt={product.imageAlt} loading="lazy" />
        {product.badge && <span className="product-badge">{product.badge}</span>}
        <span className="quick-view">Quick look <ArrowRight size={14} /></span>
      </button>
      <div className="product-info">
        <div className="product-meta"><span>{product.category}</span><span><Star size={12} fill="currentColor" /> {product.rating.toFixed(1)} <span className="review-count">({product.reviewCount})</span></span></div>
        <div className="product-title-row"><button className="product-name" onClick={onOpen}>{product.name}</button><span className="product-price">{formatPrice(product.price)}</span></div>
        <div className="product-bottom"><span>{product.color}</span><button className="add-button" onClick={onAdd} aria-label={`Add ${product.name} to bag`}><Plus size={15} /> Add</button></div>
      </div>
    </article>
  );
}

function ProductDialog({ product, onClose, onAdd }: { product: Product; onClose: () => void; onAdd: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeAction = useRef(onClose);
  closeAction.current = onClose;
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    const closeOnCancel = (event: Event) => {
      event.preventDefault();
      closeAction.current();
    };
    dialog.addEventListener("cancel", closeOnCancel);
    return () => {
      dialog.removeEventListener("cancel", closeOnCancel);
      if (dialog.open) dialog.close();
    };
  }, [product.id]);
  return (
    <dialog ref={dialogRef} className="product-dialog" aria-label={`${product.name} details`} onClick={(event) => { if (event.target === dialogRef.current) onClose(); }}>
      <button className="dialog-close" onClick={onClose} aria-label="Close product details"><X size={19} /></button>
      <div className="dialog-product-image"><img src={product.image} alt={product.imageAlt} /></div>
      <div className="dialog-product-copy">
        <div className="eyebrow"><span className="eyebrow-line" /> {product.category.toUpperCase()}</div>
        <h2>{product.name}</h2>
        <div className="dialog-rating"><Star size={14} fill="currentColor" /> {product.rating.toFixed(1)} <span>({product.reviewCount} kind words)</span></div>
        <p>{product.description}</p>
        <ul>{product.details.map((detail) => <li key={detail}><Check size={15} /> {detail}</li>)}</ul>
        <div className="dialog-buy-row"><strong>{formatPrice(product.price)}</strong><button className="button button-dark" onClick={onAdd}>Add to your bag <ShoppingBag size={16} /></button></div>
      </div>
    </dialog>
  );
}

function CartDialog({ open, cart, subtotal, shipping, tax, total, onClose, onUpdate, onCheckout }: {
  open: boolean; cart: CartLine[]; subtotal: number; shipping: number; tax: number; total: number;
  onClose: () => void; onUpdate: (id: string, quantity: number) => void; onCheckout: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return (
    <dialog ref={dialogRef} className="cart-dialog" aria-label="Your shopping bag" onClose={onClose} onClick={(event) => { if (event.target === dialogRef.current) onClose(); }}>
      <div className="cart-head"><div><div className="eyebrow"><span className="eyebrow-line" /> YOUR GOOD THINGS</div><h2>Your bag <span>({cart.reduce((sum, line) => sum + line.quantity, 0)})</span></h2></div><button className="dialog-close" onClick={onClose} aria-label="Close bag"><X size={19} /></button></div>
      <div className="cart-content">
        {cart.length === 0 ? (
          <div className="cart-empty"><span className="empty-illustration"><ShoppingBag size={22} /></span><h3>Your bag is taking a little nap.</h3><p>It’s a nice day to find something lovely.</p><button className="button button-outline" onClick={onClose}>Keep browsing <ArrowRight size={15} /></button></div>
        ) : (
          <div className="cart-lines">
            {cart.map(({ product, quantity }) => (
              <div className="cart-line" key={product.id}>
                <img src={product.image} alt="" />
                        <div className="cart-line-info"><strong>{product.name}</strong><span>{product.color}</span><div className="quantity-stepper" role="group" aria-label={`Quantity of ${product.name}`}><button onClick={() => onUpdate(product.id, quantity - 1)} aria-label={`Remove one ${product.name}`}><Minus size={13} /></button><span aria-live="polite">{quantity}</span><button onClick={() => onUpdate(product.id, quantity + 1)} aria-label={`Add one ${product.name}`} disabled={quantity >= 20}><Plus size={13} /></button></div></div>
                <strong className="cart-line-total">{formatPrice(product.price * quantity)}</strong>
              </div>
            ))}
          </div>
        )}
      </div>
      {cart.length > 0 && <div className="cart-footer">
        {subtotal < shippingThreshold && <div className="shipping-nudge">You’re {formatPrice(shippingThreshold - subtotal)} away from free shipping <div className="progress-track"><span style={{ transform: `scaleX(${Math.min(subtotal / shippingThreshold, 1)})` }} /></div></div>}
        <div className="summary-row"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
        <div className="summary-row"><span>Shipping</span><span>{shipping === 0 ? "On us" : formatPrice(shipping)}</span></div>
        <div className="summary-row"><span>Estimated tax (8%)</span><span>{formatPrice(tax)}</span></div>
        <div className="summary-row total-row"><span>Estimated total</span><strong>{formatPrice(total)}</strong></div>
        <p className="tax-note">Demo sales tax is estimated at 8%. No payment is taken.</p>
        <button className="button button-dark checkout-button" onClick={onCheckout}>Continue to checkout <ArrowRight size={16} /></button>
      </div>}
    </dialog>
  );
}

function Checkout({ cart, subtotal, shipping, tax, onBack, onPlaceOrder }: {
  cart: CartLine[]; subtotal: number; shipping: number; tax: number;
  onBack: () => void; onPlaceOrder: (customer: Customer) => Promise<void>;
}) {
  const [customer, setCustomer] = useState<Customer>({ name: "", email: "", address: "", city: "", region: "", postalCode: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const total = subtotal + shipping + tax;
  const change = (field: keyof Customer) => (event: React.ChangeEvent<HTMLInputElement>) => setCustomer((previous) => ({ ...previous, [field]: event.target.value }));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await onPlaceOrder(customer);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "We couldn’t save your order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="checkout-page page-shell">
      <button className="back-link" onClick={onBack}><ArrowLeft size={16} /> Back to the shop</button>
      <div className="checkout-title"><div className="eyebrow"><span className="eyebrow-line" /> ALMOST YOURS</div><h1>Let’s make it <em>official.</em></h1><p>Just a few details to get your good things on their way.</p></div>
      <div className="checkout-layout">
        <form className="checkout-form" onSubmit={submit}>
          <fieldset>
            <legend><span className="step-number">01</span> Where should we send the good things?</legend>
            <div className="form-grid">
              <label className="field full-field">Your name<input required minLength={2} maxLength={100} autoComplete="name" value={customer.name} onChange={change("name")} placeholder="Your full name" /></label>
              <label className="field full-field">Email address<input required type="email" maxLength={254} autoComplete="email" value={customer.email} onChange={change("email")} placeholder="you@example.com" /><small>We’ll use this to find your order later.</small></label>
              <label className="field full-field">Street address<input required minLength={5} maxLength={160} autoComplete="street-address" value={customer.address} onChange={change("address")} placeholder="123 Anywhere Street" /></label>
              <label className="field">City<input required minLength={2} autoComplete="address-level2" value={customer.city} onChange={change("city")} placeholder="Your town" /></label>
              <label className="field">State / region<input required minLength={2} autoComplete="address-level1" value={customer.region} onChange={change("region")} placeholder="State" /></label>
              <label className="field full-field">ZIP / postal code<input required minLength={3} autoComplete="postal-code" value={customer.postalCode} onChange={change("postalCode")} placeholder="12345" /></label>
            </div>
          </fieldset>
          <div className="demo-payment"><div className="demo-payment-icon"><Check size={17} /></div><div><strong>Easy does it — this is a demo checkout.</strong><p>No payment details are collected. Your order is saved locally so you can try the full flow.</p></div></div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-dark place-order-button" type="submit" disabled={submitting || cart.length === 0}>{submitting ? "Saving your order…" : "Place demo order"} <ArrowRight size={16} /></button>
          <p className="privacy-note">Your order details are stored on this device’s local server. This demo is not a real shop.</p>
        </form>
        <aside className="order-summary">
          <div className="summary-title"><h2>Your little bundle</h2><span>{cart.reduce((sum, line) => sum + line.quantity, 0)} items</span></div>
          {cart.length === 0 ? <p className="summary-empty">Your bag is empty. Add a little something before checkout.</p> : cart.map(({ product, quantity }) => (
            <div className="checkout-item" key={product.id}><div className="checkout-thumb"><img src={product.image} alt="" /><span>{quantity}</span></div><div className="checkout-item-info"><strong>{product.name}</strong><span>{product.color}</span></div><span className="checkout-item-price">{formatPrice(product.price * quantity)}</span></div>
          ))}
          <div className="summary-divider" />
          <div className="summary-row"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
          <div className="summary-row"><span>Shipping</span><span>{shipping === 0 ? "On us" : formatPrice(shipping)}</span></div>
          <div className="summary-row"><span>Estimated tax (8%)</span><span>{formatPrice(tax)}</span></div>
          <div className="summary-row total-row"><span>Estimated total</span><strong>{formatPrice(total)}</strong></div>
          <p className="summary-disclaimer">Free shipping on orders $75+. Demo sales tax is estimated at 8%.</p>
        </aside>
      </div>
    </section>
  );
}

function OrderConfirmation({ order, onShop, onOrders }: { order: Order; onShop: () => void; onOrders: () => void }) {
  return (
    <section className="confirmation-page page-shell">
      <span className="confirmation-icon"><Check size={28} /></span>
      <div className="eyebrow"><span className="eyebrow-line" /> A LITTLE SOMETHING TO CELEBRATE</div>
      <h1>It’s all <em>yours.</em></h1>
      <p className="confirmation-lede">Thanks for shopping small with us, {order.customer.name.split(" ")[0]}. We’ve tucked your order safely away.</p>
      <div className="confirmation-card">
        <div className="confirmation-header"><div><span>ORDER NUMBER</span><strong>{order.id}</strong></div><div><span>PLACED ON</span><strong>{new Date(order.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</strong></div></div>
        <div className="confirmation-products">{order.items.map((item) => <div className="checkout-item" key={item.productId}><div className="checkout-thumb"><img src={item.image} alt="" /><span>{item.quantity}</span></div><div className="checkout-item-info"><strong>{item.name}</strong><span>Quantity {item.quantity}</span></div><span className="checkout-item-price">{formatPrice(item.price * item.quantity)}</span></div>)}</div>
        <div className="summary-divider" />
        <div className="summary-row"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
        <div className="summary-row"><span>Shipping</span><span>{order.shipping === 0 ? "On us" : formatPrice(order.shipping)}</span></div>
        <div className="summary-row"><span>Estimated tax</span><span>{formatPrice(order.tax)}</span></div>
        <div className="summary-row total-row"><span>Total</span><strong>{formatPrice(order.total)}</strong></div>
        <div className="demo-payment confirmation-payment"><Check size={16} /> {order.paymentStatus}</div>
        <div className="confirmation-address"><span>GOING TO</span><strong>{order.customer.name}</strong><span>{order.customer.address}, {order.customer.city}, {order.customer.region} {order.customer.postalCode}</span></div>
      </div>
      <div className="confirmation-actions"><button className="button button-dark" onClick={onShop}>Find more good things <ArrowRight size={16} /></button><button className="button button-outline" onClick={onOrders}>See your order history</button></div>
      <p className="confirmation-hint">Keep your order number and {order.customer.email} handy to look it up later.</p>
    </section>
  );
}

function OrderLookup({ onShop }: { onShop: () => void }) {
  const [email, setEmail] = useState("");
  const [orderId, setOrderId] = useState("");
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function lookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (orderId.trim()) {
        const result = await request<{ order: Order }>(`/api/orders/${encodeURIComponent(orderId.trim())}?email=${encodeURIComponent(email.trim())}`);
        setOrders([result.order]);
      } else {
        const result = await request<{ orders: Order[] }>(`/api/orders?email=${encodeURIComponent(email.trim())}`);
        setOrders(result.orders);
      }
    } catch (lookupError) {
      setOrders(null);
      setError(lookupError instanceof Error ? lookupError.message : "We couldn’t find your order.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="orders-page page-shell">
      <button className="back-link" onClick={onShop}><ArrowLeft size={16} /> Back to the shop</button>
      <div className="orders-title"><span className="order-spark"><Sparkles size={20} /></span><div className="eyebrow"><span className="eyebrow-line" /> WE’VE GOT THE DETAILS</div><h1>Find your <em>orders.</em></h1><p>Use the email from checkout to find your order history, or add an order number to find one particular parcel.</p></div>
      <form className="lookup-form" onSubmit={lookup}>
        <label className="field">Email address<input required type="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label>
        <label className="field">Order number <span className="optional-label">Optional</span><input value={orderId} onChange={(event) => setOrderId(event.target.value)} placeholder="LL-20260101-A1B2C3" /></label>
        <button className="button button-dark" type="submit" disabled={loading}>{loading ? "Looking…" : "Find my order"} <ArrowRight size={16} /></button>
      </form>
      {error && <p className="lookup-error" role="alert">{error}</p>}
      {orders && (orders.length === 0 ? (
        <div className="order-empty"><span className="empty-illustration"><ShoppingBag size={22} /></span><h2>No orders found just yet.</h2><p>When you place an order with this email, it’ll show up here.</p><button className="button button-outline" onClick={onShop}>Browse the shop <ArrowRight size={15} /></button></div>
      ) : <div className="order-history"><h2>{orders.length === 1 ? "Your order" : "Your order history"} <span>{orders.length}</span></h2>{orders.map((entry) => <OrderHistoryCard key={entry.id} order={entry} />)}</div>)}
      <p className="lookup-footnote">Order records are stored on the local server running this shop. This demo is not connected to a delivery carrier.</p>
    </section>
  );
}

function OrderHistoryCard({ order }: { order: Order }) {
  return (
    <article className="history-card">
      <div className="history-header"><div><span>ORDER NUMBER</span><strong>{order.id}</strong></div><div><span>PLACED</span><strong>{new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</strong></div><div><span>ORDER TOTAL</span><strong>{formatPrice(order.total)}</strong></div><span className="demo-status"><Check size={13} /> Demo order</span></div>
      <div className="history-items">{order.items.map((item) => <div className="history-item" key={item.productId}><img src={item.image} alt="" /><span>{item.name}</span><span>× {item.quantity}</span></div>)}</div>
      <div className="history-shipping">Shipping to {order.customer.city}, {order.customer.region}</div>
    </article>
  );
}
