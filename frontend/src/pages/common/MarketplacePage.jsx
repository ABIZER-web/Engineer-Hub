// frontend/src/pages/common/MarketplacePage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getApprovedItems, createItem, createOrder, getOrCreateConversation } from '../../services/api';
import Sidebar from '../../components/Sidebar';
import NewsTicker from '../../components/NewsTicker';
import {
  Menu, Search, Plus, X, Filter, Star, ShoppingCart, Eye,
  Code2, Layers, Loader2, Tag, ChevronDown, ExternalLink,
  IndianRupee, Download, SlidersHorizontal, MessageCircle
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { categories, difficultyLevels, getDifficultyColor, sortOptions } from '../../utils/constants';
import ReportButton from '../../components/ReportButton';
import toast from 'react-hot-toast';
import GlobalSearch from '../../components/GlobalSearch';
import ThemeToggle from '../../components/ThemeToggle';
import NotificationBell from '../../components/NotificationBell';

const ItemCard = ({ item, onBuy, onView }) => (
  <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}
    whileHover={{y:-5,shadow:'0 20px 40px rgba(0,0,0,.1)'}}
    className="bg-white/95 border border-emerald-100/30 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group">
    <div className="h-36 bg-gradient-to-br from-emerald-100/60 to-blue-100/60 relative overflow-hidden">
      {item.images?.[0] ? (
        <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Code2 size={40} className="text-emerald-300"/>
        </div>
      )}
      <div className="absolute top-2 right-2 flex items-center gap-1.5">
        <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${getDifficultyColor(item.difficulty)}`}>{item.difficulty}</span>
        <span className="w-5 h-5 rounded-full bg-white/90 flex items-center justify-center">
          <ReportButton targetType="marketplace" targetId={item._id} />
        </span>
      </div>
      <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm text-white text-[9px] font-black px-2 py-0.5 rounded-full">
        {item.category}
      </div>
    </div>
    <div className="p-4">
      <h3 className="text-sm font-black text-blue-900 line-clamp-1 mb-1">{item.title}</h3>
      <p className="text-[11px] text-blue-900/50 font-medium line-clamp-2 mb-3">{item.description}</p>
      {item.techStack&&<p className="text-[9px] font-bold text-emerald-600 mb-2 line-clamp-1">{item.techStack}</p>}
      {item.averageRating > 0 && (
        <div className="flex items-center gap-1 mb-2">
          <Star size={11} className="fill-amber-400 text-amber-400" />
          <span className="text-[10px] font-black text-blue-900/70">{item.averageRating.toFixed(1)}</span>
          <span className="text-[9px] text-blue-900/40">({item.reviews?.length || 0})</span>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-black text-emerald-600">{formatCurrency(item.price)}</p>
          <p className="text-[9px] text-blue-900/40">{item.purchaseCount||0} purchases</p>
        </div>
        <div className="flex gap-1.5">
          <button onClick={()=>onView(item)} className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors" title="View details">
            <Eye size={14}/>
          </button>
          <button onClick={()=>onBuy(item)} className="flex items-center gap-1 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-blue-600 text-white text-[10px] font-black hover:scale-[1.02] transition-all shadow-sm">
            <ShoppingCart size={11}/>Buy
          </button>
        </div>
      </div>
    </div>
  </motion.div>
);

const SellDrawer = ({ onClose, onSubmit, loading }) => {
  const [form, setForm] = useState({title:'',description:'',price:'',category:'Web App',difficulty:'Intermediate',techStack:'',features:'',requirements:'',demoLink:'',sourceLink:'',version:'1.0.0',license:'MIT'});
  const set = (k,v) => setForm(p=>({...p,[k]:v}));
  const handleSubmit = (e) => {
    e.preventDefault();
    if(!form.title||!form.description||!form.price) return toast.error('Fill required fields');
    if(isNaN(form.price)||Number(form.price)<=0) return toast.error('Enter valid price');
    onSubmit(form);
  };
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex justify-end"
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <motion.div initial={{x:'100%'}} animate={{x:0}} exit={{x:'100%'}} transition={{type:'spring',damping:28,stiffness:280}}
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-blue-600 p-5 flex items-center justify-between flex-shrink-0">
          <h2 className="text-sm font-black text-white uppercase tracking-wide">List Your Project</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X size={18}/></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-3">
          <div>
            <label className="block text-[9px] font-black uppercase tracking-wider text-blue-900/50 mb-1">Title *</label>
            <input value={form.title} onChange={e=>set('title',e.target.value)} required placeholder="e.g. React E-commerce Template"
              className="w-full text-xs font-medium border border-emerald-100/40 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-400 transition-all"/>
          </div>
          <div>
            <label className="block text-[9px] font-black uppercase tracking-wider text-blue-900/50 mb-1">Description *</label>
            <textarea value={form.description} onChange={e=>set('description',e.target.value)} required rows={3} placeholder="Describe your project..."
              className="w-full text-xs font-medium border border-emerald-100/40 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-400 transition-all resize-none"/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-black uppercase tracking-wider text-blue-900/50 mb-1">Price (₹) *</label>
              <input type="number" value={form.price} onChange={e=>set('price',e.target.value)} required min="1" placeholder="499"
                className="w-full text-xs font-medium border border-emerald-100/40 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-400 transition-all"/>
            </div>
            <div>
              <label className="block text-[9px] font-black uppercase tracking-wider text-blue-900/50 mb-1">Category</label>
              <select value={form.category} onChange={e=>set('category',e.target.value)}
                className="w-full text-xs font-medium border border-emerald-100/40 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-400 transition-all">
                {categories.slice(0,20).map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[9px] font-black uppercase tracking-wider text-blue-900/50 mb-1">Tech Stack</label>
            <input value={form.techStack} onChange={e=>set('techStack',e.target.value)} placeholder="e.g. React, Node.js, MongoDB"
              className="w-full text-xs font-medium border border-emerald-100/40 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-400 transition-all"/>
          </div>
          <div>
            <label className="block text-[9px] font-black uppercase tracking-wider text-blue-900/50 mb-1">Key Features</label>
            <textarea value={form.features} onChange={e=>set('features',e.target.value)} rows={2} placeholder="List main features..."
              className="w-full text-xs font-medium border border-emerald-100/40 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-400 transition-all resize-none"/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-black uppercase tracking-wider text-blue-900/50 mb-1">Demo Link</label>
              <input value={form.demoLink} onChange={e=>set('demoLink',e.target.value)} placeholder="https://..."
                className="w-full text-xs font-medium border border-emerald-100/40 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-400 transition-all"/>
            </div>
            <div>
              <label className="block text-[9px] font-black uppercase tracking-wider text-blue-900/50 mb-1">Difficulty</label>
              <select value={form.difficulty} onChange={e=>set('difficulty',e.target.value)}
                className="w-full text-xs font-medium border border-emerald-100/40 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-400 transition-all">
                {difficultyLevels.map(d=><option key={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100/40">
            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-wider">Platform Fee: 5%</p>
            <p className="text-xs font-bold text-blue-900/60 mt-0.5">
              You earn: <span className="text-emerald-600">{formatCurrency(form.price?(Number(form.price)*0.95):0)}</span> per sale
            </p>
          </div>
        </form>
        <div className="p-5 border-t border-emerald-50 flex gap-3 flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-xs font-black uppercase tracking-wider hover:bg-gray-200 transition-all">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-blue-600 text-white text-xs font-black uppercase tracking-wider hover:scale-[1.02] disabled:opacity-50 transition-all shadow-md">
            {loading?<Loader2 size={14} className="animate-spin mx-auto"/>:'Submit Listing'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const ItemDetailModal = ({ item, onClose, onBuy, onMessage }) => (
  <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
    className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
    onClick={e=>e.target===e.currentTarget&&onClose()}>
    <motion.div initial={{scale:.92,y:20}} animate={{scale:1,y:0}} exit={{scale:.92}}
      className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[85vh] flex flex-col">
      <div className="bg-gradient-to-r from-emerald-600 to-blue-600 p-5 flex items-center justify-between">
        <h2 className="text-sm font-black text-white truncate pr-4">{item.title}</h2>
        <button onClick={onClose} className="text-white/70 hover:text-white flex-shrink-0"><X size={18}/></button>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {item.images?.[0]&&<img src={item.images[0]} alt={item.title} className="w-full h-40 object-cover rounded-xl"/>}
        <p className="text-xs font-medium text-blue-900/70 leading-relaxed">{item.description}</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            {label:'Category',value:item.category},
            {label:'Difficulty',value:item.difficulty},
            {label:'Tech Stack',value:item.techStack},
            {label:'Version',value:item.version},
            {label:'License',value:item.license},
            {label:'Purchases',value:`${item.purchaseCount||0} sales`},
          ].filter(f=>f.value).map(({label,value})=>(
            <div key={label} className="p-3 bg-emerald-50/50 rounded-xl">
              <p className="text-[9px] font-black uppercase tracking-wider text-blue-900/40">{label}</p>
              <p className="text-xs font-bold text-blue-900 mt-0.5">{value}</p>
            </div>
          ))}
        </div>
        {item.features&&<div><p className="text-[9px] font-black uppercase tracking-wider text-blue-900/40 mb-1">Features</p><p className="text-xs text-blue-900/60 font-medium">{item.features}</p></div>}
        <div className="flex gap-2">
          {item.demoLink&&<a href={item.demoLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"><ExternalLink size={10}/>Demo</a>}
        </div>
      </div>
      <div className="p-5 border-t border-emerald-50 flex items-center justify-between gap-2">
        <p className="text-xl font-black text-emerald-600">{formatCurrency(item.price)}</p>
        <div className="flex items-center gap-2">
          {onMessage && (
            <button onClick={()=>onMessage(item)} title="Message seller"
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gray-100 text-blue-900/60 text-xs font-black uppercase tracking-wider hover:bg-gray-200 transition-all">
              <MessageCircle size={13}/>Message
            </button>
          )}
          <button onClick={()=>{onBuy(item);onClose();}} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-blue-600 text-white text-xs font-black uppercase tracking-wider hover:scale-[1.02] transition-all shadow-md">
            <ShoppingCart size={13}/>Purchase Now
          </button>
        </div>
      </div>
    </motion.div>
  </motion.div>
);

const MarketplacePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [diffFilter, setDiffFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [showSell, setShowSell] = useState(false);
  const [sellLoading, setSellLoading] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    const fetchItems = async () => {
      try {
        const res = await getApprovedItems({ page: 1 });
        if (isMounted.current) { setItems(res.items || []); setHasMore(!!res.hasMore); setPage(1); }
      } catch {}
      finally { if (isMounted.current) setLoading(false); }
    };
    fetchItems();
    return ()=>{ isMounted.current=false; };
  }, []);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await getApprovedItems({ page: nextPage });
      setItems(prev => [...prev, ...(res.items || [])]);
      setHasMore(!!res.hasMore);
      setPage(nextPage);
    } catch (e) { toast.error(e.message); }
    finally { setLoadingMore(false); }
  };

  const handleSell = async (data) => {
    setSellLoading(true);
    try {
      const res = await createItem(data);
      if (res.success) { toast.success('Listing submitted for approval! 🎉'); setShowSell(false); }
    } catch (e) { toast.error(e.message); }
    finally { setSellLoading(false); }
  };

  const handleBuy = async (item) => {
    if (!user) return toast.error('Please login to purchase');
    if (item.sellerId===user._id||item.sellerEmail===user.email) return toast.error("You can't buy your own listing");
    try {
      const res = await createOrder({ itemId: item._id, paymentMethod: 'upi' });
      if (res.success) toast.success('Purchase successful! Check My Purchases.');
    } catch (e) { toast.error(e.message||'Purchase failed'); }
  };

  const handleMessage = async (item) => {
    if (!user) return toast.error('Please login to message the seller');
    if (item.sellerId === user._id) return toast.error("That's your own listing");
    try {
      const res = await getOrCreateConversation({
        otherUserId: item.sellerId, contextType: 'marketplace', contextId: item._id, contextLabel: item.title,
      });
      navigate(`/messages/${res.conversation._id}`);
    } catch (e) { toast.error(e.message || 'Could not start conversation'); }
  };

  const filtered = items.filter(it=>{
    const ms = !search||[it.title,it.description,it.techStack,it.category].join(' ').toLowerCase().includes(search.toLowerCase());
    const mc = catFilter==='All'||it.category===catFilter;
    const md = diffFilter==='All'||it.difficulty===diffFilter;
    return ms&&mc&&md;
  }).sort((a,b)=>{
    if(sortBy==='priceLow') return a.price-b.price;
    if(sortBy==='priceHigh') return b.price-a.price;
    if(sortBy==='popular') return (b.purchaseCount||0)-(a.purchaseCount||0);
    return new Date(b.createdAt)-new Date(a.createdAt);
  });

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/10 to-blue-50/10">
      <Sidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen}/>
      <div className="flex-1 flex flex-col relative z-10">
        <NewsTicker/>
        <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-emerald-100/30 px-4 md:px-6 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={()=>setIsMobileMenuOpen(true)} className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-emerald-50"><Menu size={20}/></button>
            <div>
              <h1 className="text-base font-black text-emerald-600">Project Marketplace</h1>
              <p className="text-[10px] font-medium text-blue-900/50 hidden sm:block">Buy & sell engineering projects</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
          <button onClick={()=>setShowSell(true)}
            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-white bg-gradient-to-r from-emerald-600 to-blue-600 px-3 py-2 rounded-xl hover:scale-[1.02] transition-all shadow-sm">
            <Plus size={13}/>Sell Project
          </button>
            <GlobalSearch /><ThemeToggle /><NotificationBell />
          </div>
        </div>

        <motion.main initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:.4}}
          className="flex-1 px-4 md:px-6 py-6 max-w-6xl mx-auto w-full">

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            <div className="relative flex-1 min-w-[180px]">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search projects..."
                className="w-full pl-8 pr-3 py-2 text-xs font-medium border border-emerald-100/40 rounded-xl bg-white/80 focus:outline-none focus:border-emerald-300 focus:ring-1 focus:ring-emerald-200 transition-all"/>
            </div>
            <select value={catFilter} onChange={e=>setCatFilter(e.target.value)}
              className="text-xs font-bold border border-emerald-100/40 rounded-xl px-3 py-2 bg-white/80 focus:outline-none focus:border-emerald-300 transition-all">
              <option value="All">All Categories</option>
              {categories.slice(0,20).map(c=><option key={c}>{c}</option>)}
            </select>
            <select value={diffFilter} onChange={e=>setDiffFilter(e.target.value)}
              className="text-xs font-bold border border-emerald-100/40 rounded-xl px-3 py-2 bg-white/80 focus:outline-none focus:border-emerald-300 transition-all">
              <option value="All">All Levels</option>
              {difficultyLevels.map(d=><option key={d}>{d}</option>)}
            </select>
            <select value={sortBy} onChange={e=>setSortBy(e.target.value)}
              className="text-xs font-bold border border-emerald-100/40 rounded-xl px-3 py-2 bg-white/80 focus:outline-none focus:border-emerald-300 transition-all">
              {sortOptions.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          <p className="text-[10px] font-bold text-blue-900/40 mb-4">{filtered.length} project{filtered.length!==1?'s':''} found</p>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_,i)=><div key={i} className="h-56 bg-white/80 rounded-2xl animate-pulse"/>)}
            </div>
          ) : filtered.length===0 ? (
            <div className="text-center py-16">
              <Code2 size={40} className="text-gray-200 mx-auto mb-3"/>
              <p className="text-sm font-bold text-blue-900/40 mb-2">No projects found</p>
              <p className="text-xs text-blue-900/30">Try different search terms or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map(item=>(
                <ItemCard key={item._id} item={item} onBuy={handleBuy} onView={setViewItem}/>
              ))}
            </div>
          )}
          {hasMore && !loading && (
            <div className="flex justify-center mt-6">
              <button onClick={loadMore} disabled={loadingMore}
                className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-600 bg-white border border-emerald-200 px-5 py-2.5 rounded-xl hover:bg-emerald-50 disabled:opacity-50 transition-colors shadow-sm">
                {loadingMore ? <Loader2 size={14} className="animate-spin"/> : null}
                Load More
              </button>
            </div>
          )}
        </motion.main>
      </div>

      <AnimatePresence>
        {showSell&&<SellDrawer onClose={()=>setShowSell(false)} onSubmit={handleSell} loading={sellLoading}/>}
        {viewItem&&<ItemDetailModal item={viewItem} onClose={()=>setViewItem(null)} onBuy={handleBuy} onMessage={handleMessage}/>}
      </AnimatePresence>
    </div>
  );
};

export default MarketplacePage;
