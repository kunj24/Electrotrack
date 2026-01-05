"use client"

import { useState, useEffect, useRef, useCallback } from 'react';

// --- TYPE DEFINITIONS ---
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  type: 'text' | 'product_carousel' | 'cart_status' | 'order_tracking' | 'quick_replies' | 'order_list' | 'contact_info';
  products?: Product[];
  orderStatus?: OrderStatus;
  quickReplies?: QuickReply[];
  orders?: OrderSummary[];
  contactInfo?: ContactInfo;
}

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  description: string;
  category?: string;
  stock?: number;
}

interface CartItem extends Product {
  quantity: number;
}

interface OrderStatus {
  orderNumber: string;
  status: 'placed' | 'confirmed' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled';
  eta: string;
  trackingUpdates: { time: string; update: string }[];
  items?: any[];
  total?: number;
  shippingAddress?: any;
}

interface OrderSummary {
  orderId: string;
  _id: string;
  total: number;
  status: string;
  createdAt: string;
  itemCount: number;
}

interface ContactInfo {
  phone: string;
  email: string;
  address: string;
  hours: string;
}

interface QuickReply {
  text: string;
  handler: () => void;
}

// --- SVG ICONS (as React Components) ---
const Icons = {
  Chat: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
  Close: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>,
  Send: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.949a.75.75 0 00.95.543l3.295-.941a.75.75 0 01.94.94l-.94 3.295a.75.75 0 00.543.95l4.95 1.414a.75.75 0 00.95-.826l-2.289-7.999a.75.75 0 00-.95-.543l-7.999 2.289z" /></svg>,
  Cart: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  Check: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>,
  TrailingDot: () => <div className="flex space-x-1"><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div></div>
};

// --- MOCK DATABASE & LOGIC ---
const sampleProducts: Product[] = [
  { id: 1, name: 'Wireless Headphones Pro', price: 2999, image: '🎧', description: 'Premium sound quality with noise cancellation.', category: 'Electronics' },
  { id: 2, name: 'Smart Watch Series X', price: 15999, image: '⌚', description: 'Advanced smartwatch with health monitoring.', category: 'Electronics' },
  { id: 3, name: 'Gaming Mouse RGB', price: 1999, image: '🖱️', description: 'High-precision gaming mouse with RGB lighting.', category: 'Electronics' },
  { id: 4, name: 'Laptop Backpack', price: 1299, image: '🎒', description: 'Durable backpack for laptop and accessories.', category: 'Accessories' },
  { id: 5, name: 'USB-C Hub', price: 2499, image: '🔌', description: 'Multi-port USB-C hub with fast charging.', category: 'Electronics' },
  { id: 6, name: 'Bluetooth Speaker', price: 3499, image: '🔊', description: 'Portable speaker with deep bass.', category: 'Electronics' },
];

const orderStatusSteps: OrderStatus['status'][] = ['placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered'];

// Contact Information for Radhika Electronics
const contactInfo: ContactInfo = {
  phone: '+91 98765 43210',
  email: 'support@radhikaelectronics.com',
  address: 'Radhika Electronics, Electronic Market, Mumbai, Maharashtra 400001',
  hours: 'Monday - Saturday: 10:00 AM - 8:00 PM, Sunday: 11:00 AM - 6:00 PM'
};

// --- MAIN COMPONENT ---
export default function ElectrotrackChatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>(sampleProducts);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.products) {
          const formattedProducts = data.products.map((p: any) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            image: p.image || '📦',
            description: p.description || 'Quality product from Electrotrack',
            category: p.category || 'Electronics'
          }));
          setProducts(formattedProducts);
        }
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      // Keep using sample products as fallback
    }
  };

  // Initialize chat with welcome message
  useEffect(() => {
    if (isChatOpen && messages.length === 0) {
      fetchProducts(); // Fetch real products when chat opens
      botSendMessage(
        `Welcome to Electrotrack! 🛍️ I'm here to help you browse products, manage your cart, or track your orders. How can I assist you today?`,
        'quick_replies',
        {
          quickReplies: [
            { text: '🛍️ Show Products', handler: () => { showProducts() } },
            { text: '🛒 View Cart', handler: () => viewCart() },
            { text: '📦 Track Order', handler: () => askOrderNumber() },
            { text: '📞 Contact Support', handler: () => showSupport() },
          ],
        }
      );
    }
  }, [isChatOpen]);

  // Helper to add bot message with typing indicator
  const botSendMessage = useCallback((text: string, type: Message['type'] = 'text', extra?: Partial<Message>) => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), text, sender: 'bot', type, ...extra },
      ]);
      setIsTyping(false);
    }, 700 + Math.min(text.length * 20, 1200));
  }, []);

  // User sends a message
  const handleSend = () => {
    if (!input.trim()) return;
    const userText = input.trim();
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), text: userText, sender: 'user', type: 'text' }]);
    setInput('');
    handleBotResponse(userText.toLowerCase());
  };

  // Bot response logic
  const handleBotResponse = (text: string) => {
    if (text.includes('show products') || text.includes('products') || text.includes('browse') || text.includes('shop')) {
      showProducts();
      return;
    }
    if (text.includes('cart') || text.includes('basket')) {
      viewCart();
      return;
    }
    if (text.includes('checkout') || text.includes('buy now') || text.includes('purchase')) {
      checkout();
      return;
    }
    if (text.includes('track order') || text.includes('order status') || text.match(/ord[- ]?\d+/i)) {
      const orderMatch = text.match(/ord[- ]?\d+/i);
      if (orderMatch) {
        const orderNum = orderMatch[0].toUpperCase().replace(/\s+/g, '-');
        trackOrder(orderNum);
      } else {
        askOrderNumber();
      }
      return;
    }
    // Check if user typed an order ID directly
    if (text.match(/^ord[- ]?\d{10,}/i)) {
      const orderNum = text.toUpperCase().replace(/\s+/g, '-');
      trackOrder(orderNum);
      return;
    }
    if (text.includes('support') || text.includes('help') || text.includes('contact')) {
      showSupport();
      return;
    }
    if (text.includes('electronics') || text.includes('accessories')) {
      const category = text.includes('electronics') ? 'Electronics' : 'Accessories';
      showProductsByCategory(category);
      return;
    }
    if (text.includes('hi') || text.includes('hello') || text.includes('hey')) {
      botSendMessage('Hello! Welcome to Electrotrack! How can I help you today?', 'quick_replies', {
        quickReplies: [
          { text: '🛍️ Browse Products', handler: () => showProducts() },
          { text: '🛒 My Cart', handler: () => viewCart() },
          { text: '📦 Track Order', handler: () => askOrderNumber() },
        ],
      });
      return;
    }
    // Default response
    botSendMessage("I'm here to help! You can ask me about:", 'quick_replies', {
      quickReplies: [
        { text: '🛍️ Products', handler: () => { showProducts() } },
        { text: '🛒 Cart', handler: () => viewCart() },
        { text: '📦 Orders', handler: () => askOrderNumber() },
        { text: '📞 Support', handler: () => showSupport() },
      ],
    });
  };

  // Show products from inventory with stock information
  const showProducts = async () => {
    try {
      setIsTyping(true);

      // Fetch products from our chatbot-specific API endpoint
      const response = await fetch('/api/chatbot/products?limit=8');
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      const data = await response.json();

      console.log('Fetched products from inventory:', data);

      if (data.success && data.products && data.products.length > 0) {
        setIsTyping(false);
        botSendMessage('Here are our featured products from Electrotrack:', 'product_carousel', { products: data.products });
      } else {
        setIsTyping(false);
        botSendMessage('Sorry, no products are currently available in our inventory. Please check back later!');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setIsTyping(false);
      botSendMessage('Sorry, I couldn\'t load the products right now. Please try again later.');
    }
  };

  // Show products by category
  const showProductsByCategory = async (category: string) => {
    try {
      setIsTyping(true);
      const response = await fetch(`/api/chatbot/products?category=${encodeURIComponent(category)}&limit=8`);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      const data = await response.json();

      if (data.success && data.products && data.products.length > 0) {
        setIsTyping(false);
        botSendMessage(`Here are our ${category} products from Electrotrack:`, 'product_carousel', { products: data.products });
      } else {
        setIsTyping(false);
        botSendMessage(`Sorry, we don't have any ${category} products available right now.`);
      }
    } catch (error) {
      console.error('Error fetching products by category:', error);
      setIsTyping(false);
      botSendMessage(`Sorry, I couldn't load the ${category} products right now. Please try again later.`);
    }
  };

  // Show support
  const showSupport = () => {
    botSendMessage('📞 Contact Radhika Electronics:', 'contact_info', {
      contactInfo,
      quickReplies: [
        { text: '❓ FAQ', handler: () => showFAQ() },
        { text: '�️ Browse Products', handler: () => showProducts() },
      ],
    });
  };

  // Show FAQ
  const showFAQ = () => {
    botSendMessage('Here are some frequently asked questions:', 'quick_replies', {
      quickReplies: [
        { text: 'Return Policy', handler: () => botSendMessage('We offer 7-day return policy on all products. Items must be in original condition.') },
        { text: 'Shipping Info', handler: () => botSendMessage('Free shipping on orders above ₹999. Standard delivery takes 2-5 business days.') },
        { text: 'Payment Methods', handler: () => botSendMessage('We accept all major credit/debit cards, UPI, net banking, and cash on delivery.') },
        { text: 'Warranty', handler: () => botSendMessage('All electronics come with manufacturer warranty. Check product details for specific terms.') },
      ],
    });
  };

  // View cart
  const viewCart = () => {
    if (cart.length === 0) {
      botSendMessage('Your cart is currently empty. 🛒', 'quick_replies', {
        quickReplies: [
          { text: '🛍️ Browse Products', handler: () => showProducts() },
        ],
      });
    } else {
      botSendMessage('Here is your current cart:', 'cart_status', { products: cart });
    }
  };

  // Checkout
  const checkout = () => {
    if (cart.length === 0) {
      botSendMessage('Your cart is empty. Please add products before checking out.', 'quick_replies', {
        quickReplies: [
          { text: '🛍️ Browse Products', handler: () => showProducts() },
        ],
      });
      return;
    }
    const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

    botSendMessage(
      `🛒 Ready to checkout! Your cart total is ₹${total.toFixed(2)}

To complete your purchase, please visit our checkout page or continue shopping.`,
      'quick_replies',
      {
        quickReplies: [
          { text: '�️ Continue Shopping', handler: () => showProducts() },
          { text: '� Contact Support', handler: () => showSupport() },
        ],
      }
    );
  };

  // Fetch recent orders for quick selection
  const fetchRecentOrders = async () => {
    try {
      const response = await fetch('/api/admin/orders');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.orders) {
          const recentOrders = data.orders.slice(0, 5).map((order: any) => ({
            orderId: order.orderId,
            _id: order._id,
            total: order.total,
            status: order.status,
            createdAt: order.createdAt,
            itemCount: order.items?.length || 0
          }));
          return recentOrders;
        }
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
    return [];
  };

  // Ask user for order number
  const askOrderNumber = async () => {
    const recentOrders = await fetchRecentOrders();

    if (recentOrders.length > 0) {
      botSendMessage('Here are some recent orders. Click to track:', 'order_list', {
        orders: recentOrders,
        quickReplies: [
          { text: '📝 Enter Order ID', handler: () => botSendMessage('Please type your order ID (e.g., ORD-1234567890)') },
        ],
      });
    } else {
      botSendMessage('Please enter your order number (e.g., ORD-1234567890) to track your order:', 'quick_replies', {
        quickReplies: [
          { text: '📞 Contact Support', handler: () => showSupport() },
        ],
      });
    }
  };

  // Track order by ID
  const trackOrder = async (orderNumber: string) => {
    try {
      setIsTyping(true);
      const response = await fetch(`/api/orders/tracking?orderId=${encodeURIComponent(orderNumber)}`);
      const data = await response.json();

      if (response.ok && data.success) {
        const orderStatus: OrderStatus = {
          orderNumber: data.orderId,
          status: data.tracking.currentStatus,
          eta: data.tracking.expectedDelivery ?
            new Date(data.tracking.expectedDelivery).toLocaleDateString('en-IN', {
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }) : 'Not available',
          trackingUpdates: data.tracking.events?.map((event: any) => ({
            time: new Date(event.at).toLocaleString('en-IN'),
            update: event.title + (event.description ? ': ' + event.description : '')
          })) || [],
          items: data.order?.items || [],
          total: data.order?.total || 0,
          shippingAddress: data.order?.shippingAddress
        };

        setIsTyping(false);
        botSendMessage(`📦 Tracking details for order ${data.orderId}:`, 'order_tracking', { orderStatus });
      } else {
        setIsTyping(false);
        botSendMessage(`❌ Sorry, I couldn't find order "${orderNumber}". Please check the order ID and try again.`, 'quick_replies', {
          quickReplies: [
            { text: '🔍 Try Again', handler: () => askOrderNumber() },
            { text: '📞 Contact Support', handler: () => showSupport() },
          ],
        });
      }
    } catch (error) {
      setIsTyping(false);
      console.error('Failed to track order:', error);
      botSendMessage('❌ Unable to fetch order details right now. Please try again later.', 'quick_replies', {
        quickReplies: [
          { text: '🔄 Retry', handler: () => trackOrder(orderNumber) },
          { text: '📞 Contact Support', handler: () => showSupport() },
        ],
      });
    }
  };

  // Add product to cart
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    botSendMessage(`✅ Added ${product.name} to your cart!`, 'quick_replies', {
      quickReplies: [
        { text: '🛒 View Cart', handler: () => viewCart() },
        { text: '🛍️ Continue Shopping', handler: () => showProducts() },
        { text: '💳 Checkout', handler: () => checkout() },
      ],
    });
  };

  // Remove product from cart
  const removeFromCart = (id: number) => {
    const removedItem = cart.find(item => item.id === id);
    setCart((prev) => prev.filter((item) => item.id !== id));
    botSendMessage(`🗑️ Removed ${removedItem?.name || 'item'} from your cart.`);
  };

  // Change quantity
  const changeQuantity = (id: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  // Render message bubble
  const MessageBubble = ({ message }: { message: Message }) => {
    const isUser = message.sender === 'user';
    const baseClasses = `max-w-xs md:max-w-md px-4 py-2 rounded-2xl shadow-lg break-words select-text whitespace-pre-wrap animate-fade-slide`;
    const userClasses = 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white self-end';
    const botClasses = 'bg-gradient-to-r from-gray-800 via-gray-900 to-black text-gray-100 self-start backdrop-blur-md bg-opacity-70';

    if (message.type === 'product_carousel' && message.products) {
      return (
        <div className={`${botClasses} p-3 rounded-2xl max-w-full animate-fade-slide`}>
          <p className="mb-3 font-semibold text-lg">{message.text}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {message.products.map((p) => (
              <div
                key={p.id}
                className="bg-gradient-to-tr from-indigo-900 via-indigo-800 to-indigo-700 rounded-xl p-4 flex flex-col items-center text-center shadow-xl cursor-pointer hover:scale-105 transition-transform"
                onClick={() => addToCart(p)}
                title={`Add ${p.name} to cart`}
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') addToCart(p); }}
                role="button"
                aria-label={`Add ${p.name} to cart`}
              >
                {p.image && p.image.startsWith('http') ? (
                  <img src={p.image} alt={p.name} className="w-16 h-16 mb-2 rounded-lg object-cover" />
                ) : (
                  <div className="w-16 h-16 mb-2 bg-indigo-500 rounded-lg flex items-center justify-center text-2xl">
                    📦
                  </div>
                )}
                <div className="font-bold text-lg text-white mb-1 line-clamp-2">{p.name}</div>
                <div className="text-sm text-indigo-300 mb-2 line-clamp-3">{p.description || 'No description available'}</div>
                <div className="font-extrabold text-indigo-400 text-xl mb-2">₹{Number(p.price).toLocaleString('en-IN')}</div>
                <button
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-4 py-1 font-semibold transition"
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(p);
                  }}
                  aria-label={`Add ${p.name} to cart`}
                >
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (message.type === 'cart_status' && message.products) {
      if (message.products.length === 0) {
        return <div className={`${botClasses} ${baseClasses}`}>Your cart is empty.</div>;
      }
      const cartItems = message.products as CartItem[];
      return (
        <div className={`${botClasses} p-4 rounded-2xl max-w-full animate-fade-slide`}>
          <p className="mb-3 font-semibold text-lg">{message.text}</p>
          <ul className="space-y-3 max-h-64 overflow-y-auto">
            {cartItems.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-700 rounded-xl p-3 shadow-lg"
              >
                <div className="flex items-center gap-4">
                  {item.image && item.image.startsWith('http') ? (
                    <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                  ) : (
                    <div className="w-12 h-12 bg-indigo-500 rounded-lg flex items-center justify-center text-xl">
                      📦
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-white line-clamp-1">{item.name}</div>
                    <div className="text-indigo-300">₹{Number(item.price).toLocaleString('en-IN')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => changeQuantity(item.id, -1)}
                    className="bg-indigo-700 hover:bg-indigo-600 rounded-full p-1 text-white"
                    aria-label={`Decrease quantity of ${item.name}`}
                  >
                    –
                  </button>
                  <span className="w-6 text-center text-white font-semibold">{item.quantity}</span>
                  <button
                    onClick={() => changeQuantity(item.id, 1)}
                    className="bg-indigo-700 hover:bg-indigo-600 rounded-full p-1 text-white"
                    aria-label={`Increase quantity of ${item.name}`}
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="bg-red-700 hover:bg-red-600 rounded-full p-1 ml-3 text-white"
                    aria-label={`Remove ${item.name} from cart`}
                  >
                    ×
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4 text-right font-extrabold text-indigo-400">
            Total: ₹{cartItems.reduce((acc, i) => acc + Number(i.price) * i.quantity, 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-4 text-right">
            <button
              onClick={checkout}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-full font-semibold shadow-lg transition"
              aria-label="Checkout cart"
            >
              Checkout
            </button>
          </div>
        </div>
      );
    }

    if (message.type === 'order_tracking' && message.orderStatus) {
      const { orderStatus } = message;
      const currentStepIndex = orderStatusSteps.indexOf(orderStatus.status);

      return (
        <div className={`${botClasses} p-4 rounded-2xl max-w-full animate-fade-slide`}>
          <p className="mb-3 font-bold text-lg">Order Tracking - {orderStatus.orderNumber}</p>
          <p className="mb-2 text-indigo-300">Estimated Delivery: <span className="font-semibold text-white">{orderStatus.eta}</span></p>
          <ol className="relative border-l border-indigo-600 ml-4">
            {orderStatusSteps.map((step, idx) => {
              const isCompleted = idx <= currentStepIndex;
              return (
                <li key={step} className="mb-6 ml-6">
                  <span
                    className={`absolute -left-4 flex items-center justify-center w-8 h-8 rounded-full border-2 border-indigo-600 ${isCompleted ? 'bg-indigo-500' : 'bg-transparent'}`}
                    aria-hidden="true"
                  >
                    {isCompleted ? <Icons.Check /> : <span className="text-indigo-600 font-bold">{idx + 1}</span>}
                  </span>
                  <h4 className={`text-lg font-semibold ${isCompleted ? 'text-white' : 'text-indigo-400'}`}>{step}</h4>
                  {isCompleted && idx === currentStepIndex && (
                    <p className="text-indigo-300 text-sm mt-1">Current status</p>
                  )}
                </li>
              );
            })}
          </ol>
          <div className="mt-4 max-h-40 overflow-y-auto bg-indigo-900 bg-opacity-30 rounded p-3">
            <p className="font-semibold text-indigo-300 mb-2">Recent Updates:</p>
            <ul className="list-disc list-inside space-y-1 text-indigo-200 text-sm">
              {orderStatus.trackingUpdates.map(({ time, update }, i) => (
                <li key={i}>
                  <span className="font-mono text-indigo-400">{time}:</span> {update}
                </li>
              ))}
            </ul>
          </div>
        </div>
      );
    }

    if (message.type === 'order_list' && message.orders) {
      return (
        <div className={`${botClasses} p-4 rounded-2xl max-w-full animate-fade-slide`}>
          <p className="mb-3 font-semibold text-lg">{message.text}</p>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {message.orders.map((order) => (
              <div
                key={order._id}
                className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-700 rounded-xl p-3 cursor-pointer hover:scale-[1.02] transition-transform"
                onClick={() => trackOrder(order.orderId)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="font-bold text-white">{order.orderId}</div>
                  <div className="text-indigo-300 text-sm">₹{order.total?.toFixed(2)}</div>
                </div>
                <div className="text-sm text-indigo-300">
                  Status: <span className="text-white font-semibold">{order.status}</span>
                </div>
                <div className="text-xs text-indigo-400 mt-1">
                  {order.itemCount} item(s) • {new Date(order.createdAt).toLocaleDateString('en-IN')}
                </div>
              </div>
            ))}
          </div>
          {message.quickReplies && (
            <div className="flex flex-wrap gap-2 mt-3">
              {message.quickReplies.map((qr, idx) => (
                <button
                  key={idx}
                  onClick={qr.handler}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-3 py-1 text-sm font-semibold transition"
                >
                  {qr.text}
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (message.type === 'contact_info' && message.contactInfo) {
      const contact = message.contactInfo;
      return (
        <div className={`${botClasses} p-4 rounded-2xl max-w-full animate-fade-slide`}>
          <p className="mb-3 font-semibold text-lg">{message.text}</p>
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-700 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📞</span>
              <div>
                <div className="text-white font-semibold">Phone</div>
                <div className="text-indigo-300">{contact.phone}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">📧</span>
              <div>
                <div className="text-white font-semibold">Email</div>
                <div className="text-indigo-300">{contact.email}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">📍</span>
              <div>
                <div className="text-white font-semibold">Address</div>
                <div className="text-indigo-300">{contact.address}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">🕒</span>
              <div>
                <div className="text-white font-semibold">Business Hours</div>
                <div className="text-indigo-300">{contact.hours}</div>
              </div>
            </div>
          </div>
          {message.quickReplies && (
            <div className="flex flex-wrap gap-2 mt-3">
              {message.quickReplies.map((qr, idx) => (
                <button
                  key={idx}
                  onClick={qr.handler}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-3 py-1 text-sm font-semibold transition"
                >
                  {qr.text}
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (message.type === 'quick_replies' && message.quickReplies) {
      return (
        <div className={`${botClasses} p-3 rounded-2xl max-w-full animate-fade-slide`}>
          <p className="mb-3 font-semibold text-lg">{message.text}</p>
          <div className="flex flex-wrap gap-3">
            {message.quickReplies.map((qr, idx) => (
              <button
                key={idx}
                onClick={qr.handler}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-4 py-2 font-semibold shadow-md transition"
                aria-label={qr.text}
              >
                {qr.text}
              </button>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className={`${isUser ? userClasses : botClasses} ${baseClasses}`}>{message.text}</div>
    );
  };

  return (
    <div className="fixed bottom-6 right-6 w-80 sm:w-96 max-w-[calc(100vw-3rem)] font-sans z-50">
      {/* Chat toggle button */}
      {!isChatOpen && (
        <div className="flex justify-end">
          <button
            onClick={() => setIsChatOpen(true)}
            aria-label="Open chat"
            className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-full p-4 shadow-xl flex items-center justify-center transition-transform active:scale-95 hover:shadow-2xl"
          >
            <Icons.Chat />
          </button>
        </div>
      )}

      {/* Chat window */}
      {isChatOpen && (
        <div className="flex flex-col h-[600px] bg-gradient-to-tr from-gray-900 via-gray-800 to-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-indigo-700">
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-indigo-700 to-blue-700 px-5 py-4 border-b border-indigo-600">
            <h2 className="text-xl font-bold text-white select-none">Electrotrack Assistant</h2>
            <button
              onClick={() => setIsChatOpen(false)}
              aria-label="Close chat"
              className="text-indigo-300 hover:text-white transition-colors"
            >
              <Icons.Close />
            </button>
          </div>

          {/* Messages container */}
          <div
            className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 scrollbar-thin scrollbar-thumb-indigo-600 scrollbar-track-gray-800"
            aria-live="polite"
            aria-relevant="additions"
          >
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isTyping && (
              <div className="self-start bg-indigo-700 bg-opacity-40 rounded-2xl px-5 py-2 max-w-xs animate-pulse text-indigo-300 select-none">
                Assistant is typing <Icons.TrailingDot />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="bg-gradient-to-r from-indigo-700 to-blue-700 px-5 py-4 flex items-center gap-4 border-t border-indigo-600"
          >
            <input
              type="text"
              aria-label="Type your message"
              className="flex-1 rounded-full bg-gray-900 bg-opacity-70 border border-indigo-600 text-white placeholder-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 px-4 py-2 transition"
              placeholder="Ask about products, cart, or order tracking..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isTyping}
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={isTyping || !input.trim()}
              className="p-3 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white transition-transform active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              aria-label="Send message"
            >
              <Icons.Send />
            </button>
          </form>

          {/* Custom CSS for animations */}
          <style jsx>{`
            @keyframes fadeSlideIn {
              0% {
                opacity: 0;
                transform: translateY(10px);
              }
              100% {
                opacity: 1;
                transform: translateY(0);
              }
            }
            .animate-fade-slide {
              animation: fadeSlideIn 0.3s ease forwards;
            }
            /* Scrollbar styling for WebKit */
            .scrollbar-thin::-webkit-scrollbar {
              width: 6px;
            }
            .scrollbar-thin::-webkit-scrollbar-track {
              background: transparent;
            }
            .scrollbar-thin::-webkit-scrollbar-thumb {
              background-color: rgba(99, 102, 241, 0.7);
              border-radius: 3px;
            }
            /* Text truncation classes */
            .line-clamp-1 {
              overflow: hidden;
              display: -webkit-box;
              -webkit-line-clamp: 1;
              -webkit-box-orient: vertical;
            }
            .line-clamp-2 {
              overflow: hidden;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
            }
            .line-clamp-3 {
              overflow: hidden;
              display: -webkit-box;
              -webkit-line-clamp: 3;
              -webkit-box-orient: vertical;
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
