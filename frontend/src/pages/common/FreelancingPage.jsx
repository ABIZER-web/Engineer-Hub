// frontend/src/pages/common/FreelancingPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { getAllFreelancers, createProject, submitBid, getProjectsByClient, updateBidStatus, updateProject, rateFreelancer } from '../../services/api';
import Sidebar from '../../components/Sidebar';
import NewsTicker from '../../components/NewsTicker';
import { Menu, Plus, X, Search, Briefcase, Clock, IndianRupee, Loader2, ChevronRight, Tag, Star, Check, User as UserIcon, AlertCircle } from 'lucide-react';
import ReportButton from '../../components/ReportButton';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { skillsList } from '../../utils/constants';
import toast from 'react-hot-toast';
import GlobalSearch from '../../components/GlobalSearch';
import ThemeToggle from '../../components/ThemeToggle';
import NotificationBell from '../../components/NotificationBell';

const PostProjectModal = ({onClose,onPost,loading}) => {
  const [form,setForm] = useState({title:'',description:'',budget:'',budgetType:'fixed',timeline:'',skills:[],category:'Other'});
  const [skillInput,setSkillInput] = useState('');
  const set=(k,v)=>setForm(p=>({...p,[k]:v}));
  const addSkill=(s)=>{if(s&&!form.skills.includes(s))set('skills',[...form.skills,s]);setSkillInput('');};
  const removeSkill=(s)=>set('skills',form.skills.filter(x=>x!==s));
  const handleSubmit=(e)=>{e.preventDefault();if(!form.title||!form.description||!form.budget)return toast.error('Fill required fields');onPost(form);};
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <motion.div initial={{scale:.92,y:20}} animate={{scale:1,y:0}} exit={{scale:.92}}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-blue-600 p-5 flex items-center justify-between flex-shrink-0">
          <h2 className="text-sm font-black text-white uppercase tracking-wide">Post a Project</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X size={18}/></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-3">
          {[{k:'title',label:'Project Title *',ph:'e.g. Build a React Dashboard'},{k:'timeline',label:'Timeline',ph:'e.g. 2 weeks'}].map(({k,label,ph})=>(
            <div key={k}>
              <label className="block text-[9px] font-black uppercase tracking-wider text-blue-900/50 mb-1">{label}</label>
              <input value={form[k]} onChange={e=>set(k,e.target.value)} placeholder={ph} required={k==='title'}
                className="w-full text-xs font-medium border border-emerald-100/40 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-400 transition-all"/>
            </div>
          ))}
          <div>
            <label className="block text-[9px] font-black uppercase tracking-wider text-blue-900/50 mb-1">Description *</label>
            <textarea value={form.description} onChange={e=>set('description',e.target.value)} rows={3} required placeholder="Describe what you need..."
              className="w-full text-xs font-medium border border-emerald-100/40 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-400 transition-all resize-none"/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-black uppercase tracking-wider text-blue-900/50 mb-1">Budget (₹) *</label>
              <input type="number" value={form.budget} onChange={e=>set('budget',e.target.value)} required min="1" placeholder="5000"
                className="w-full text-xs font-medium border border-emerald-100/40 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-400 transition-all"/>
            </div>
            <div>
              <label className="block text-[9px] font-black uppercase tracking-wider text-blue-900/50 mb-1">Type</label>
              <select value={form.budgetType} onChange={e=>set('budgetType',e.target.value)}
                className="w-full text-xs font-medium border border-emerald-100/40 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-400 transition-all">
                <option value="fixed">Fixed</option><option value="hourly">Hourly</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[9px] font-black uppercase tracking-wider text-blue-900/50 mb-1">Required Skills</label>
            <div className="flex gap-2 mb-2">
              <input value={skillInput} onChange={e=>setSkillInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();addSkill(skillInput);}}} placeholder="Type skill + Enter"
                className="flex-1 text-xs font-medium border border-emerald-100/40 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-400 transition-all"/>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {form.skills.map(s=>(
                <span key={s} className="flex items-center gap-1 text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  {s}<button type="button" onClick={()=>removeSkill(s)} className="hover:text-red-500"><X size={9}/></button>
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-1">
              {skillsList.slice(0,12).map(s=>(
                <button type="button" key={s} onClick={()=>addSkill(s)}
                  className={`text-[8px] font-bold px-2 py-0.5 rounded-full border transition-all ${form.skills.includes(s)?'bg-emerald-500 text-white border-emerald-500':'bg-gray-50 text-gray-600 border-gray-200 hover:border-emerald-300'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </form>
        <div className="p-5 border-t border-emerald-50 flex gap-3 flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-xs font-black uppercase tracking-wider hover:bg-gray-200 transition-all">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-blue-600 text-white text-xs font-black uppercase tracking-wider hover:scale-[1.02] disabled:opacity-50 transition-all shadow-md">
            {loading?<Loader2 size={14} className="animate-spin mx-auto"/>:'Post Project'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const RateFreelancerModal = ({project,onClose,onRate,loading}) => {
  const [rating,setRating]=useState(5);
  const [hover,setHover]=useState(0);
  const [comment,setComment]=useState('');
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <motion.div initial={{scale:.92,y:20}} animate={{scale:1,y:0}} exit={{scale:.92}}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-black text-blue-900">Rate the freelancer</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={16}/></button>
        </div>
        <p className="text-xs text-blue-900/50 font-medium mb-4 truncate">{project?.title}</p>
        <div className="flex items-center justify-center gap-1 mb-4">
          {[1,2,3,4,5].map(n=>(
            <button key={n} onMouseEnter={()=>setHover(n)} onMouseLeave={()=>setHover(0)} onClick={()=>setRating(n)} aria-label={`${n} stars`}>
              <Star size={28} className={(hover||rating)>=n?'fill-amber-400 text-amber-400':'text-gray-200'}/>
            </button>
          ))}
        </div>
        <textarea value={comment} onChange={e=>setComment(e.target.value.slice(0,500))} rows={3}
          placeholder="Optional — how was working with them?"
          className="w-full px-3 py-2 text-xs font-medium border border-emerald-100/50 rounded-xl bg-gray-50 focus:outline-none focus:border-emerald-300 transition-all resize-none"/>
        <button onClick={()=>onRate(project._id,{rating,comment})} disabled={loading}
          className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 text-white text-xs font-black uppercase hover:bg-emerald-600 disabled:opacity-50 transition-colors">
          {loading?<Loader2 size={14} className="animate-spin"/>:<Star size={14}/>}Submit review
        </button>
      </motion.div>
    </motion.div>
  );
};

const MyProjectCard = ({p,onBidStatus,onMarkComplete,onOpenRate,busy}) => {
  const [expanded,setExpanded]=useState(false);
  const statusColor = { pending:'bg-amber-50 text-amber-600 border-amber-200', approved:'bg-emerald-50 text-emerald-600 border-emerald-200', rejected:'bg-red-50 text-red-600 border-red-200' };
  return (
    <motion.div initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}}
      className="bg-white/95 border border-emerald-100/30 rounded-2xl p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-sm font-black text-blue-900 truncate">{p.title}</h3>
            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${statusColor[p.moderationStatus]||statusColor.pending}`}>
              {p.moderationStatus==='pending'?'Awaiting admin review':p.moderationStatus}
            </span>
            <span className="text-[8px] font-black uppercase bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{p.status.replace('_',' ')}</span>
          </div>
          <p className="text-xs text-blue-900/50 font-medium line-clamp-2 mb-1">{p.description}</p>
          {p.moderationStatus==='rejected'&&p.rejectionNote&&(
            <p className="text-[10px] text-red-500 font-medium flex items-center gap-1"><AlertCircle size={10}/>{p.rejectionNote}</p>
          )}
        </div>
        <span className="text-sm font-black text-emerald-600 flex-shrink-0">{formatCurrency(p.budget)}</span>
      </div>

      {p.moderationStatus==='approved'&&p.status==='open'&&(
        <button onClick={()=>setExpanded(v=>!v)} className="text-[10px] font-black text-blue-600 flex items-center gap-1 mt-1">
          {p.bids?.length||0} bid{p.bids?.length===1?'':'s'} <ChevronRight size={11} className={`transition-transform ${expanded?'rotate-90':''}`}/>
        </button>
      )}

      {expanded && (p.bids||[]).length>0 && (
        <div className="mt-3 space-y-2 border-t border-emerald-50 pt-3">
          {p.bids.map(b=>(
            <div key={b._id} className="flex items-center justify-between gap-2 p-2.5 bg-gray-50 rounded-xl">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-black text-blue-900 truncate">{b.bidderName||b.bidderEmail}</p>
                <p className="text-[10px] text-blue-900/40">{formatCurrency(b.bidAmount)} · {b.timeline||'—'}</p>
              </div>
              {b.status==='pending'?(
                <div className="flex gap-1.5 flex-shrink-0">
                  <button disabled={busy} onClick={()=>onBidStatus(p._id,b._id,'accepted')}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-500 text-white text-[9px] font-black uppercase hover:bg-emerald-600 disabled:opacity-50">Accept</button>
                  <button disabled={busy} onClick={()=>onBidStatus(p._id,b._id,'rejected')}
                    className="px-2.5 py-1.5 rounded-lg bg-gray-200 text-gray-600 text-[9px] font-black uppercase hover:bg-gray-300 disabled:opacity-50">Reject</button>
                </div>
              ):(
                <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg flex-shrink-0 ${b.status==='accepted'?'bg-emerald-50 text-emerald-600':'bg-gray-100 text-gray-400'}`}>{b.status}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {p.status==='in_progress'&&(
        <button disabled={busy} onClick={()=>onMarkComplete(p._id)}
          className="mt-3 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-white bg-gradient-to-r from-emerald-600 to-blue-600 px-3 py-2 rounded-xl hover:scale-[1.02] disabled:opacity-50 transition-all shadow-sm">
          <Check size={12}/>Mark completed
        </button>
      )}

      {p.status==='completed'&&(
        p.freelancerReview?.rating ? (
          <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-blue-900/60">
            <Star size={12} className="fill-amber-400 text-amber-400"/>You rated this freelancer {p.freelancerReview.rating}/5
          </div>
        ) : (
          <button onClick={()=>onOpenRate(p)}
            className="mt-3 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-3 py-2 rounded-xl hover:bg-amber-100 transition-all">
            <Star size={12}/>Rate the freelancer
          </button>
        )
      )}
    </motion.div>
  );
};

const BidModal = ({project,onClose,onBid,loading}) => {
  const [form,setForm]=useState({bidAmount:'',timeline:'',proposal:''});
  const set=(k,v)=>setForm(p=>({...p,[k]:v}));
  const handleSubmit=(e)=>{e.preventDefault();if(!form.bidAmount||!form.proposal)return toast.error('Fill all fields');onBid(project._id,form);};
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <motion.div initial={{scale:.92,y:20}} animate={{scale:1,y:0}} exit={{scale:.92}}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 flex items-center justify-between">
          <h2 className="text-sm font-black text-white uppercase tracking-wide">Submit Bid</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X size={18}/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100/40">
            <p className="text-xs font-black text-blue-900 line-clamp-1">{project?.title}</p>
            <p className="text-[10px] text-blue-900/50 mt-0.5">Client budget: <span className="text-emerald-600 font-black">{formatCurrency(project?.budget)}</span></p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-black uppercase tracking-wider text-blue-900/50 mb-1">Your Bid (₹) *</label>
              <input type="number" value={form.bidAmount} onChange={e=>set('bidAmount',e.target.value)} required min="1" placeholder="4500"
                className="w-full text-xs font-medium border border-emerald-100/40 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-400 transition-all"/>
            </div>
            <div>
              <label className="block text-[9px] font-black uppercase tracking-wider text-blue-900/50 mb-1">Delivery Time</label>
              <input value={form.timeline} onChange={e=>set('timeline',e.target.value)} placeholder="e.g. 1 week"
                className="w-full text-xs font-medium border border-emerald-100/40 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-400 transition-all"/>
            </div>
          </div>
          <div>
            <label className="block text-[9px] font-black uppercase tracking-wider text-blue-900/50 mb-1">Proposal *</label>
            <textarea value={form.proposal} onChange={e=>set('proposal',e.target.value)} rows={4} required placeholder="Describe your approach, experience and why you're the best fit..."
              className="w-full text-xs font-medium border border-emerald-100/40 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-400 transition-all resize-none"/>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-xs font-black uppercase tracking-wider">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-black uppercase tracking-wider hover:scale-[1.02] disabled:opacity-50 transition-all shadow-md">
              {loading?<Loader2 size={14} className="animate-spin mx-auto"/>:'Submit Bid'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

const FreelancingPage = () => {
  const {user} = useAuth();
  const [isMobileMenuOpen,setIsMobileMenuOpen]=useState(false);
  const [loading,setLoading]=useState(true);
  const [projects,setProjects]=useState([]);
  const [search,setSearch]=useState('');
  const [showPost,setShowPost]=useState(false);
  const [postLoading,setPostLoading]=useState(false);
  const [bidProject,setBidProject]=useState(null);
  const [bidLoading,setBidLoading]=useState(false);
  const [view,setView]=useState('browse'); // 'browse' | 'mine'
  const [myProjects,setMyProjects]=useState([]);
  const [myLoading,setMyLoading]=useState(false);
  const [busy,setBusy]=useState(false);
  const [rateProject,setRateProject]=useState(null);
  const [rateLoading,setRateLoading]=useState(false);
  const [page,setPage]=useState(1);
  const [hasMore,setHasMore]=useState(false);
  const [loadingMore,setLoadingMore]=useState(false);
  const isMounted=useRef(true);

  useEffect(()=>{
    isMounted.current=true;
    const fetch=async()=>{
      try{const r=await getAllFreelancers({status:'open',page:1});if(isMounted.current){setProjects(r.projects||[]);setHasMore(!!r.hasMore);setPage(1);}}
      catch{}finally{if(isMounted.current)setLoading(false);}
    };
    fetch();
    return()=>{isMounted.current=false;};
  },[]);

  const loadMore=async()=>{
    setLoadingMore(true);
    try{
      const nextPage=page+1;
      const r=await getAllFreelancers({status:'open',page:nextPage});
      setProjects(prev=>[...prev,...(r.projects||[])]);
      setHasMore(!!r.hasMore);
      setPage(nextPage);
    }catch(e){toast.error(e.message);}
    finally{setLoadingMore(false);}
  };

  const fetchMine=async()=>{
    if(!user?._id)return;
    setMyLoading(true);
    try{const r=await getProjectsByClient(user._id);if(isMounted.current)setMyProjects(r.projects||[]);}
    catch{}finally{if(isMounted.current)setMyLoading(false);}
  };

  useEffect(()=>{ if(view==='mine') fetchMine(); },[view]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePost=async(data)=>{
    setPostLoading(true);
    try{const r=await createProject(data);if(r.success){toast.success(r.message||'Project submitted for admin review');setShowPost(false);}}
    catch(e){toast.error(e.message);}finally{setPostLoading(false);}
  };

  const handleBid=async(pid,data)=>{
    setBidLoading(true);
    try{const r=await submitBid(pid,data);if(r.success){toast.success('Bid submitted!');setBidProject(null);}}
    catch(e){toast.error(e.message);}finally{setBidLoading(false);}
  };

  const handleBidStatus=async(pid,bidId,status)=>{
    setBusy(true);
    try{
      await updateBidStatus(pid,{bidId,status});
      toast.success(status==='accepted'?'Bid accepted — project is now in progress':'Bid rejected');
      fetchMine();
    }catch(e){toast.error(e.message);}finally{setBusy(false);}
  };

  const handleMarkComplete=async(pid)=>{
    setBusy(true);
    try{
      await updateProject(pid,{status:'completed'});
      toast.success('Project marked completed');
      fetchMine();
    }catch(e){toast.error(e.message);}finally{setBusy(false);}
  };

  const handleRate=async(pid,data)=>{
    setRateLoading(true);
    try{
      await rateFreelancer(pid,data);
      toast.success('Thanks for your review!');
      setRateProject(null);
      fetchMine();
    }catch(e){toast.error(e.message);}finally{setRateLoading(false);}
  };

  const filtered=projects.filter(p=>!search||[p.title,p.description,...(p.skills||[])].join(' ').toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/10 to-emerald-50/10">
      <Sidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen}/>
      <div className="flex-1 flex flex-col relative z-10">
        <NewsTicker/>
        <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-emerald-100/30 px-4 md:px-6 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={()=>setIsMobileMenuOpen(true)} className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-emerald-50"><Menu size={20}/></button>
            <div>
              <h1 className="text-base font-black text-emerald-600">Freelancing Hub</h1>
              <p className="text-[10px] font-medium text-blue-900/50 hidden sm:block">Post projects & bid on opportunities</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
          <button onClick={()=>setShowPost(true)}
            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-white bg-gradient-to-r from-emerald-600 to-blue-600 px-3 py-2 rounded-xl hover:scale-[1.02] transition-all shadow-sm">
            <Plus size={13}/>Post Project
          </button>
            <GlobalSearch /><ThemeToggle /><NotificationBell />
          </div>
        </div>
        <motion.main initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:.4}}
          className="flex-1 px-4 md:px-6 py-6 max-w-4xl mx-auto w-full">
          <div className="flex gap-2 mb-5 bg-white/80 border border-emerald-100/30 rounded-xl p-1 w-fit">
            {[{id:'browse',label:'Browse Projects'},{id:'mine',label:'My Posted Projects'}].map(t=>(
              <button key={t.id} onClick={()=>setView(t.id)}
                className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${view===t.id?'bg-gradient-to-r from-emerald-600 to-blue-600 text-white shadow-sm':'text-blue-900/40 hover:text-blue-900/70'}`}>
                {t.label}
              </button>
            ))}
          </div>
          {view==='browse'?(<>
          <div className="relative mb-5">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search projects, skills..."
              className="w-full pl-8 pr-3 py-2.5 text-xs font-medium border border-emerald-100/40 rounded-xl bg-white/80 focus:outline-none focus:border-emerald-300 focus:ring-1 focus:ring-emerald-200 transition-all"/>
          </div>
          {loading?(
            <div className="space-y-3">{[...Array(4)].map((_,i)=><div key={i} className="h-24 bg-white/80 rounded-2xl animate-pulse"/>)}</div>
          ):filtered.length===0?(
            <div className="text-center py-16 bg-white/95 border border-emerald-100/30 rounded-2xl shadow-sm">
              <Briefcase size={40} className="text-gray-200 mx-auto mb-3"/>
              <p className="text-sm font-bold text-blue-900/40 mb-2">No open projects found</p>
              <button onClick={()=>setShowPost(true)} className="text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-emerald-600 to-blue-600 px-4 py-2 rounded-xl shadow-md hover:scale-[1.02] transition-all">
                Post the First Project
              </button>
            </div>
          ):(
            <div className="space-y-3">
              {filtered.map((p,i)=>(
                <motion.div key={p._id} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:i*.04}}
                  className="bg-white/95 border border-emerald-100/30 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-black text-blue-900 truncate">{p.title}</h3>
                        <span className="text-[8px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full flex-shrink-0">{p.status}</span>
                      </div>
                      <p className="text-xs text-blue-900/50 font-medium line-clamp-2 mb-2">{p.description}</p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {(p.skills||[]).slice(0,5).map(s=>(
                          <span key={s} className="text-[8px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{s}</span>
                        ))}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-blue-900/40 font-medium">
                        <span className="flex items-center gap-0.5"><IndianRupee size={9}/>{formatCurrency(p.budget).replace('₹','')}</span>
                        {p.timeline&&<span className="flex items-center gap-0.5"><Clock size={9}/>{p.timeline}</span>}
                        <span>{p.bids?.length||0} bids</span>
                        <span>{p.clientName||'Client'}</span>
                      </div>
                    </div>
                    {user&&p.clientId!==user._id&&p.clientEmail!==user.email&&(
                      <button onClick={()=>setBidProject(p)}
                        className="flex-shrink-0 text-[10px] font-black uppercase tracking-wider text-white bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-2 rounded-xl hover:scale-[1.02] transition-all shadow-sm">
                        Bid Now
                      </button>
                    )}
                    <ReportButton targetType="freelance" targetId={p._id} className="flex-shrink-0" />
                  </div>
                </motion.div>
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
          </>):(
            myLoading?(
              <div className="space-y-3">{[...Array(3)].map((_,i)=><div key={i} className="h-32 bg-white/80 rounded-2xl animate-pulse"/>)}</div>
            ):myProjects.length===0?(
              <div className="text-center py-16 bg-white/95 border border-emerald-100/30 rounded-2xl shadow-sm">
                <Briefcase size={40} className="text-gray-200 mx-auto mb-3"/>
                <p className="text-sm font-bold text-blue-900/40 mb-2">You haven't posted any projects yet</p>
                <button onClick={()=>setShowPost(true)} className="text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-emerald-600 to-blue-600 px-4 py-2 rounded-xl shadow-md hover:scale-[1.02] transition-all">
                  Post a Project
                </button>
              </div>
            ):(
              <div className="space-y-3">
                {myProjects.map(p=>(
                  <MyProjectCard key={p._id} p={p} busy={busy}
                    onBidStatus={handleBidStatus} onMarkComplete={handleMarkComplete} onOpenRate={setRateProject}/>
                ))}
              </div>
            )
          )}
        </motion.main>
      </div>
      <AnimatePresence>
        {showPost&&<PostProjectModal onClose={()=>setShowPost(false)} onPost={handlePost} loading={postLoading}/>}
        {bidProject&&<BidModal project={bidProject} onClose={()=>setBidProject(null)} onBid={handleBid} loading={bidLoading}/>}
        {rateProject&&<RateFreelancerModal project={rateProject} onClose={()=>setRateProject(null)} onRate={handleRate} loading={rateLoading}/>}
      </AnimatePresence>
    </div>
  );
};

export default FreelancingPage;
