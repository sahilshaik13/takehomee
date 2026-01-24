import { motion } from 'framer-motion';
import { ShoppingCart, Package, Tag, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { getBestBulkTier, formatPrice } from '../utils/priceUtils';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  
  // 1. Stock Logic
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock < 10;
  
  const bulkTier = getBestBulkTier(product);
  
  // Category colors
  const categoryColors = {
    Clothing: 'bg-purple-100 text-purple-700',
    Tech: 'bg-blue-100 text-blue-700',
    Accessories: 'bg-amber-100 text-amber-700',
    Stationery: 'bg-green-100 text-green-700',
  };

  const handleAddToCart = () => {
    if (!isOutOfStock) {
      addToCart(product);
    }
  };

  return (
    <motion.div
      className={`group bg-white border transition-all duration-300 overflow-hidden flex flex-col h-full
        ${isOutOfStock 
          ? 'border-zinc-200 opacity-75' 
          : 'border-zinc-100 hover:border-zinc-200 hover:shadow-lg'
        }
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={!isOutOfStock ? { y: -4 } : {}}
      data-testid={`product-card-${product.id}`}
    >
      {/* Image/Emoji Section */}
      <div className="relative aspect-square bg-zinc-50 flex items-center justify-center overflow-hidden">
        <span className="text-7xl transition-transform duration-300 group-hover:scale-110">
          {product.image}
        </span>
        
        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10">
            <span className="bg-zinc-800 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">
              Sold Out
            </span>
          </div>
        )}
        
        {/* Low Stock Badge (Only if NOT out of stock) */}
        {!isOutOfStock && isLowStock && (
          <div className="absolute top-3 left-3 z-10">
            <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 border border-amber-200 px-2 py-1 text-xs font-mono uppercase tracking-wider rounded">
              <AlertCircle className="w-3 h-3" />
              Only {product.stock} left
            </span>
          </div>
        )}
        
        {/* Category Badge */}
        <div className="absolute top-3 right-3 z-10">
          <span className={`inline-block px-2 py-1 text-xs font-mono uppercase tracking-wider rounded ${categoryColors[product.category] || 'bg-zinc-100 text-zinc-700'}`}>
            {product.category}
          </span>
        </div>

        {/* Bulk Discount Badge */}
        {!isOutOfStock && bulkTier && (
          <div className="absolute bottom-3 left-3 right-3 z-10">
            <div 
              className="bg-emerald-500 text-white px-3 py-1.5 text-xs font-mono flex items-center gap-1.5 shadow-sm"
              data-testid={`bulk-badge-${product.id}`}
            >
              <Tag className="w-3 h-3" />
              <span>Buy {bulkTier.min_quantity}+ @ {formatPrice(bulkTier.unit_price)}</span>
              <span className="ml-auto bg-emerald-600 px-1.5 py-0.5 rounded text-[10px]">
                Save {bulkTier.discount_percentage}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 
          className="font-heading font-bold text-lg text-zinc-900 mb-1 line-clamp-1"
          data-testid={`product-name-${product.id}`}
        >
          {product.name}
        </h3>
        
        <p className="font-body text-sm text-zinc-500 mb-4 line-clamp-2 min-h-[40px]">
          {product.description}
        </p>

        <div className="mt-auto flex items-center justify-between">
          <div>
            <span 
              className={`font-heading font-extrabold text-xl ${isOutOfStock ? 'text-zinc-400' : 'text-zinc-900'}`}
              data-testid={`product-price-${product.id}`}
            >
              {formatPrice(product.price)}
            </span>
            {!isOutOfStock && bulkTier && (
              <span className="text-xs text-zinc-400 ml-1">each</span>
            )}
          </div>
          
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-full font-heading font-bold uppercase tracking-wider text-xs transition-all duration-300
              ${isOutOfStock 
                ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed border border-zinc-200' 
                : 'bg-black text-white hover:bg-brand-blue group/btn shadow-md hover:shadow-lg'
              }
            `}
            data-testid={`add-to-cart-${product.id}`}
          >
            {isOutOfStock ? (
              <span className="whitespace-nowrap">Out of Stock</span>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4 transition-transform group-hover/btn:scale-110" />
                <span className="hidden sm:inline">Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;