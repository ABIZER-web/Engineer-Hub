// frontend/src/pages/common/ResultsPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { getResultsByUser, createResult } from '../../services/api';
import Sidebar from '../../components/Sidebar';
import NewsTicker from '../../components/NewsTicker';
import { Menu, Plus, X, FileText, ChevronDown, ChevronUp, Award, TrendingUp, Loader2 } from 'lucide-react';
import { formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';
import GlobalSearch from '../../components/GlobalSearch';
import ThemeToggle from '../../components/ThemeToggle';
import NotificationBell from '../../components/NotificationBell';

const gradeColor = (g) => {
  const m={O:'text-emerald-600 bg-emerald-50','A+':'text-blue-600 bg-blue-50',A:'text-indigo-600 bg-indigo-50','B+':'text-violet-600 bg-violet-50',B:'text-amber-600 bg-amber-50',C:'text-orange-600 bg-orange-50',D:'text-yellow-600 bg-yellow-50',F:'text-red-600 bg-red-50'};
  return m[g]||'text-gray-600 bg-gray-50';
};

const AddResultModal = ({ onClose, onAdd, loading }) => {
  const [sem, setSem] = useState('');
  const [year, setYear] = useState('2024-25');
  const [type, setType] = useState('final');
  const [subjects, setSubjects] = useState([{subjectName:'',internalMarks:'',externalMarks:'',totalMarks:'',maxMarks:100,grade:'',credits:3,status:'pass'}]);

  const addSubject = () => setSubjects(p=>[...p,{subjectName:'',internalMarks:'',externalMarks:'',totalMarks:'',maxMarks:100,grade:'',credits:3,status:'pass'}]);
  const removeSubject = (i) => setSubjects(p=>p.filter((_,idx)=>idx!==i));
  const updateSubject = (i,k,v) => setSubjects(p=>p.map((s,idx)=>idx===i?{...s,[k]:v}:s));

  const calcSgpa = () => {
    const gp = {O:10,'A+':9,A:8,'B+':7,B:6,C:5,D:4,F:0};
    const valid = subjects.filter(s=>s.grade&&gp[s.grade]!==undefined);
    if(!valid.length) return null;
    const totalCredits = valid.reduce((sum,s)=>sum+(Number(s.credits)||3),0);
    if(!totalCredits) return null;
    const weighted = valid.reduce((sum,s)=>sum+gp[s.grade]*(Number(s.credits)||3),0);
    return (weighted/totalCredits).toFixed(2);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if(!sem) return toast.error('Select semester');
    const sgpa = parseFloat(calcSgpa()||0);
    onAdd({ semester:parseInt(sem), academicYear:year, examType:type,
      subjects: subjects.map(s=>({...s,internalMarks:Number(s.internalMarks)||0,externalMarks:Number(s.externalMarks)||0,totalMarks:Number(s.totalMarks)||0,maxMarks:Number(s.maxMarks)||100})),
      sgpa, resultStatus:'pending' });
  };

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto"
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <motion.div initial={{scale:.92,y:20}} animate={{scale:1,y:0}} exit={{scale:.92}}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-blue-600 p-5 flex items-center justify-between">
          <h2 className="text-sm font-black text-white uppercase tracking-wide">Add Semester Result</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X size={18}/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[9px] font-black uppercase tracking-wider text-blue-900/50 mb-1">Semester *</label>
              <select value={sem} onChange={e=>setSem(e.target.value)} required
                className="w-full text-xs font-medium border border-emerald-100/40 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-400 transition-all">
                <option value="">Select</option>
                {[1,2,3,4,5,6,7,8].map(s=><option key={s} value={s}>Sem {s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-black uppercase tracking-wider text-blue-900/50 mb-1">Academic Year</label>
              <input value={year} onChange={e=>setYear(e.target.value)} placeholder="2024-25"
                className="w-full text-xs font-medium border border-emerald-100/40 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-400 transition-all"/>
            </div>
            <div>
              <label className="block text-[9px] font-black uppercase tracking-wider text-blue-900/50 mb-1">Exam Type</label>
              <select value={type} onChange={e=>setType(e.target.value)}
                className="w-full text-xs font-medium border border-emerald-100/40 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-400 transition-all">
                <option value="final">Final</option><option value="midterm">Midterm</option>
                <option value="practical">Practical</option><option value="viva">Viva</option>
              </select>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[9px] font-black uppercase tracking-wider text-blue-900/50">Subjects</label>
              <button type="button" onClick={addSubject}
                className="text-[9px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg transition-colors flex items-center gap-1">
                <Plus size={10}/>Add Subject
              </button>
            </div>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {subjects.map((s,i)=>(
                <div key={i} className="grid grid-cols-12 gap-1.5 p-2 bg-emerald-50/40 rounded-xl border border-emerald-100/30">
                  <input value={s.subjectName} onChange={e=>updateSubject(i,'subjectName',e.target.value)} placeholder="Subject name"
                    className="col-span-3 text-xs font-medium border border-emerald-100/40 rounded-lg px-2 py-1.5 focus:outline-none focus:border-emerald-400 transition-all bg-white"/>
                  <input type="number" value={s.internalMarks} onChange={e=>updateSubject(i,'internalMarks',e.target.value)} placeholder="Internal"
                    className="col-span-2 text-xs font-medium border border-emerald-100/40 rounded-lg px-2 py-1.5 focus:outline-none focus:border-emerald-400 transition-all bg-white"/>
                  <input type="number" value={s.externalMarks} onChange={e=>updateSubject(i,'externalMarks',e.target.value)} placeholder="External"
                    className="col-span-2 text-xs font-medium border border-emerald-100/40 rounded-lg px-2 py-1.5 focus:outline-none focus:border-emerald-400 transition-all bg-white"/>
                  <select value={s.grade} onChange={e=>updateSubject(i,'grade',e.target.value)}
                    className="col-span-2 text-xs font-medium border border-emerald-100/40 rounded-lg px-2 py-1.5 focus:outline-none focus:border-emerald-400 transition-all bg-white">
                    <option value="">Grade</option>
                    {['O','A+','A','B+','B','C','D','F'].map(g=><option key={g}>{g}</option>)}
                  </select>
                  <select value={s.credits} onChange={e=>updateSubject(i,'credits',Number(e.target.value))} title="Credits"
                    className="col-span-2 text-xs font-medium border border-emerald-100/40 rounded-lg px-2 py-1.5 focus:outline-none focus:border-emerald-400 transition-all bg-white">
                    {[1,2,3,4,5,6].map(c=><option key={c} value={c}>{c} Cr</option>)}
                  </select>
                  <button type="button" onClick={()=>removeSubject(i)} className="col-span-1 text-red-400 hover:text-red-600 flex items-center justify-center transition-colors">
                    <X size={14}/>
                  </button>
                </div>
              ))}
            </div>
            {calcSgpa()&&<p className="text-xs font-black text-emerald-600 mt-2">Calculated SGPA: {calcSgpa()}</p>}
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-xs font-black uppercase tracking-wider hover:bg-gray-200 transition-all">Cancel</button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-blue-600 text-white text-xs font-black uppercase tracking-wider hover:scale-[1.02] disabled:opacity-50 transition-all shadow-md">
              {loading?<Loader2 size={14} className="animate-spin mx-auto"/>:'Submit Result'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

const ResultsPage = () => {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    const fetch = async () => {
      if (!user?._id) { setLoading(false); return; }
      try {
        const res = await getResultsByUser(user._id);
        if (isMounted.current) setResults((res.results||[]).sort((a,b)=>b.semester-a.semester));
      } catch {}
      finally { if (isMounted.current) setLoading(false); }
    };
    fetch();
    return ()=>{ isMounted.current=false; };
  }, [user]);

  const handleAdd = async (data) => {
    setAddLoading(true);
    try {
      const res = await createResult(data);
      if (res.success) {
        setResults(p=>[res.result,...p].sort((a,b)=>b.semester-a.semester));
        setShowModal(false);
        toast.success('Result submitted for approval');
      }
    } catch (e) { toast.error(e.message); }
    finally { setAddLoading(false); }
  };

  const approvedResults = results.filter(r => r.isApproved);
  const bestSgpa = results.length ? Math.max(...results.map(r=>r.sgpa||0)).toFixed(2) : '—';
  const latestSgpa = results[0]?.sgpa?.toFixed(2)||'—';
  const cgpa = (() => {
    const gp = {O:10,'A+':9,A:8,'B+':7,B:6,C:5,D:4,F:0};
    const graded = approvedResults.flatMap(r => (r.subjects||[]).filter(s => gp[s.grade]!==undefined));
    if (!graded.length) return '—';
    const totalCredits = graded.reduce((sum,s)=>sum+(s.credits||3),0);
    if (!totalCredits) return '—';
    const weighted = graded.reduce((sum,s)=>sum+gp[s.grade]*(s.credits||3),0);
    return (weighted/totalCredits).toFixed(2);
  })();

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/10 to-emerald-50/10">
      <Sidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen}/>
      <div className="flex-1 flex flex-col relative z-10">
        <NewsTicker/>
        <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-emerald-100/30 px-4 md:px-6 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={()=>setIsMobileMenuOpen(true)} className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-emerald-50"><Menu size={20}/></button>
            <div>
              <h1 className="text-base font-black text-emerald-600">Academic Results</h1>
              <p className="text-[10px] font-medium text-blue-900/50 hidden sm:block">Semester-wise marks & SGPA tracking</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
          <button onClick={()=>setShowModal(true)}
            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-white bg-gradient-to-r from-emerald-600 to-blue-600 px-3 py-2 rounded-xl hover:scale-[1.02] transition-all shadow-sm">
            <Plus size={13}/>Add Result
          </button>
            <GlobalSearch /><ThemeToggle /><NotificationBell />
          </div>
        </div>

        <motion.main initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:.4}}
          className="flex-1 px-4 md:px-6 py-6 max-w-4xl mx-auto w-full">

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              {icon:TrendingUp,label:'Latest SGPA',value:latestSgpa,g:'from-emerald-500 to-emerald-600'},
              {icon:Award,label:'Best SGPA',value:bestSgpa,g:'from-blue-500 to-indigo-600'},
              {icon:FileText,label:'CGPA',value:cgpa,g:'from-violet-500 to-purple-600'},
            ].map(({icon:Icon,label,value,g},i)=>(
              <motion.div key={label} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:i*.08}}
                whileHover={{y:-3}} className="bg-white/95 border border-emerald-100/30 rounded-2xl p-4 shadow-sm">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${g} flex items-center justify-center mb-2`}>
                  <Icon size={16} className="text-white"/>
                </div>
                <p className="text-[9px] font-black uppercase tracking-wider text-blue-900/40">{label}</p>
                <p className="text-xl font-black text-emerald-600 mt-0.5">{value}</p>
              </motion.div>
            ))}
          </div>

          {/* Results list */}
          {loading ? (
            <div className="space-y-3">{[...Array(3)].map((_,i)=><div key={i} className="h-16 bg-white/80 rounded-2xl animate-pulse"/>)}</div>
          ) : results.length===0 ? (
            <div className="bg-white/95 border border-emerald-100/30 rounded-2xl p-12 text-center shadow-sm">
              <FileText size={40} className="text-gray-200 mx-auto mb-3"/>
              <p className="text-sm font-bold text-blue-900/40 mb-2">No results added yet</p>
              <button onClick={()=>setShowModal(true)}
                className="text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-emerald-600 to-blue-600 px-4 py-2 rounded-xl shadow-md hover:scale-[1.02] transition-all">
                Add Your First Result
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((r,i)=>(
                <motion.div key={r._id} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:i*.06}}
                  className="bg-white/95 border border-emerald-100/30 rounded-2xl shadow-sm overflow-hidden">
                  <button onClick={()=>setExpanded(expanded===r._id?null:r._id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-emerald-50/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center text-white text-xs font-black">
                        S{r.semester}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-black text-blue-900">Semester {r.semester} — {r.examType==='final'?'End Sem':r.examType.charAt(0).toUpperCase()+r.examType.slice(1)}</p>
                        <p className="text-[10px] text-blue-900/40 font-medium">{r.academicYear} · {r.subjects?.length||0} subjects</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {r.sgpa&&<span className="text-sm font-black text-emerald-600">SGPA: {r.sgpa.toFixed(2)}</span>}
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${r.isApproved?'bg-emerald-50 text-emerald-700 border-emerald-200':'bg-amber-50 text-amber-700 border-amber-200'}`}>
                        {r.isApproved?'Verified':'Pending'}
                      </span>
                      {expanded===r._id?<ChevronUp size={14} className="text-blue-900/40"/>:<ChevronDown size={14} className="text-blue-900/40"/>}
                    </div>
                  </button>
                  <AnimatePresence>
                    {expanded===r._id&&(
                      <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}}
                        className="overflow-hidden border-t border-emerald-50">
                        <div className="p-4 overflow-x-auto">
                          <table className="w-full min-w-[500px]">
                            <thead>
                              <tr className="bg-gradient-to-r from-emerald-50/60 to-blue-50/40">
                                {['Subject','Internal','External','Total','Max','Grade','Credits','Status'].map(h=>(
                                  <th key={h} className="px-3 py-2 text-left text-[9px] font-black uppercase tracking-widest text-blue-900/40">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-emerald-50">
                              {(r.subjects||[]).map((s,si)=>(
                                <tr key={si} className="hover:bg-emerald-50/20 transition-colors">
                                  <td className="px-3 py-2 text-xs font-bold text-blue-900">{s.subjectName||'—'}</td>
                                  <td className="px-3 py-2 text-xs text-blue-900/60">{s.internalMarks??'—'}</td>
                                  <td className="px-3 py-2 text-xs text-blue-900/60">{s.externalMarks??'—'}</td>
                                  <td className="px-3 py-2 text-xs font-bold text-blue-900">{s.totalMarks??'—'}</td>
                                  <td className="px-3 py-2 text-xs text-blue-900/40">{s.maxMarks||100}</td>
                                  <td className="px-3 py-2">
                                    {s.grade&&<span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${gradeColor(s.grade)}`}>{s.grade}</span>}
                                  </td>
                                  <td className="px-3 py-2 text-xs text-blue-900/40">{s.credits||3}</td>
                                  <td className="px-3 py-2">
                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${s.status==='pass'?'bg-emerald-50 text-emerald-700':'bg-red-50 text-red-700'}`}>
                                      {s.status||'—'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          )}
        </motion.main>
      </div>
      <AnimatePresence>
        {showModal&&<AddResultModal onClose={()=>setShowModal(false)} onAdd={handleAdd} loading={addLoading}/>}
      </AnimatePresence>
    </div>
  );
};

export default ResultsPage;
