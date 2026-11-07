import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { MessageCircle, Send, X, Sparkles } from "lucide-react";
import { ShopContext } from "../context/ShopContext";

const AiAssistant = () => {
  const { backendUrl, currency } = useContext(ShopContext);
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi, I am Charu’s shopping helper. Ask about Men/Women/Kids wear, sizes, pickup, delivery, or refunds.",
      products: [],
    },
  ]);

  const ask = async (event) => {
    event.preventDefault();
    const text = question.trim();
    if (!text || loading) return;
    setQuestion("");
    setMessages((rows) => [...rows, { role: "user", text, products: [] }]);
    setLoading(true);
    try {
      const response = await axios.post(backendUrl + "/api/ai/assistant", {
        question: text,
      });
      if (response.data.success) {
        setMessages((rows) => [
          ...rows,
          {
            role: "assistant",
            text: response.data.answer,
            products: response.data.products || [],
          },
        ]);
      } else {
        setMessages((rows) => [
          ...rows,
          { role: "assistant", text: response.data.message || "Could not answer right now.", products: [] },
        ]);
      }
    } catch (error) {
      setMessages((rows) => [
        ...rows,
        {
          role: "assistant",
          text: error.response?.data?.message || "AI helper is warming up. Try again in a moment.",
          products: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-[60] inline-flex items-center gap-2 rounded-full bg-[#1C1917] px-4 py-3 text-sm text-white shadow-lg sm:right-5"
        aria-label="Open shopping assistant"
      >
        <MessageCircle size={18} />
        Ask Charu AI
      </button>

      {open && (
        <div className="fixed bottom-5 right-5 z-[70] flex h-[min(32rem,78vh)] w-[min(24rem,92vw)] flex-col overflow-hidden rounded-3xl border border-[#E6DFD6] bg-[#FBF9F6] shadow-2xl">
          <div className="flex items-center justify-between border-b border-[#E6DFD6] bg-[#1C1917] px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <Sparkles size={16} />
              <div>
                <p className="text-sm font-medium">Shopping assistant</p>
                <p className="text-[11px] text-white/70">Powered by Hugging Face models</p>
              </div>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close assistant">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  message.role === "user"
                    ? "ml-auto bg-[#1C1917] text-white"
                    : "bg-white text-[#1C1917] shadow-sm"
                }`}
              >
                <p>{message.text}</p>
                {message.products?.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {message.products.map((product) => (
                      <Link
                        key={product._id}
                        to={`/product/${product._id}`}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2 rounded-xl border border-[#E6DFD6] bg-[#F4F0EA] p-2 text-[#1C1917]"
                      >
                        {product.image ? (
                          <img src={product.image} alt="" className="h-12 w-10 rounded-lg object-cover" />
                        ) : null}
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium">{product.name}</p>
                          <p className="text-[11px] text-[#7A3030]">
                            {currency}
                            {product.price}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <p className="text-xs text-[#8A8178]">Thinking with store products...</p>
            )}
          </div>

          <form onSubmit={ask} className="flex gap-2 border-t border-[#E6DFD6] bg-white p-3">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Try: white shirt for men"
              className="flex-1 rounded-full border border-[#E6DFD6] px-3 py-2 text-sm outline-none focus:border-[#1C1917]"
            />
            <button
              type="submit"
              disabled={loading}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7A3030] text-white disabled:opacity-50"
              aria-label="Send"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default AiAssistant;
