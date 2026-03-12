/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Search, 
  ShieldCheck, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ChevronRight,
  LogOut,
  MessageSquare,
  HelpCircle,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type FeedbackStatus = 'pending' | 'in-progress' | 'resolved';

interface Feedback {
  id: string;
  content: string;
  category: string;
  status: FeedbackStatus;
  admin_reply: string | null;
  created_at: string;
}

export default function App() {
  const [view, setView] = useState<'user' | 'admin' | 'track'>('user');
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [trackingId, setTrackingId] = useState('');
  const [trackedFeedback, setTrackedFeedback] = useState<Feedback | null>(null);
  const [editingReply, setEditingReply] = useState<{ id: string, text: string } | null>(null);
  
  // Form states
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('problem');
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin) {
      fetchFeedbacks();
    }
  }, [isAdmin]);

  const fetchFeedbacks = async () => {
    try {
      const res = await fetch('/api/admin/feedback');
      const data = await res.json();
      setFeedbacks(data);
    } catch (err) {
      console.error('Failed to fetch feedbacks');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, category }),
      });
      const data = await res.json();
      setSubmittedId(data.id);
      setContent('');
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการส่งข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/feedback/${trackingId}`);
      if (!res.ok) throw new Error('ไม่พบรหัสติดตามนี้');
      const data = await res.json();
      setTrackedFeedback(data);
    } catch (err: any) {
      setError(err.message);
      setTrackedFeedback(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPassword }),
      });
      if (res.ok) {
        setIsAdmin(true);
        setAdminPassword('');
      } else {
        setError('รหัสผ่านไม่ถูกต้อง');
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: FeedbackStatus) => {
    try {
      await fetch(`/api/admin/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      fetchFeedbacks();
    } catch (err) {
      console.error('Failed to update status');
    }
  };

  const submitReply = async (id: string) => {
    if (!editingReply) return;
    try {
      await fetch(`/api/admin/feedback/${id}/reply`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: editingReply.text }),
      });
      setEditingReply(null);
      fetchFeedbacks();
    } catch (err) {
      console.error('Failed to submit reply');
    }
  };

  const clearContent = async (id: string) => {
    if (!confirm('ยืนยันการลบข้อความในโพสต์นี้? (รหัสติดตามจะยังคงอยู่)')) return;
    try {
      await fetch(`/api/admin/feedback/${id}/clear`, { method: 'PATCH' });
      fetchFeedbacks();
    } catch (err) {
      console.error('Failed to clear content');
    }
  };

  const deleteFeedback = async (id: string) => {
    if (!confirm('ยืนยันการลบข้อมูลนี้ทั้งหมดออกจากระบบ?')) return;
    try {
      await fetch(`/api/admin/feedback/${id}`, { method: 'DELETE' });
      fetchFeedbacks();
    } catch (err) {
      console.error('Failed to delete feedback');
    }
  };

  const getStatusBadge = (status: FeedbackStatus) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs flex items-center gap-1"><Clock size={12} /> รอดำเนินการ</span>;
      case 'in-progress':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs flex items-center gap-1"><AlertCircle size={12} /> กำลังดำเนินการ</span>;
      case 'resolved':
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs flex items-center gap-1"><CheckCircle2 size={12} /> แก้ไขแล้ว</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => { setView('user'); setSubmittedId(null); setTrackedFeedback(null); }}
          >
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <MessageSquare size={20} />
            </div>
            <span className="font-bold text-lg tracking-tight">VibeFeedback</span>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setView('track')}
              className={`text-sm font-medium px-3 py-2 rounded-md transition-colors ${view === 'track' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              ติดตามสถานะ
            </button>
            {isAdmin ? (
              <button 
                onClick={() => setIsAdmin(false)}
                className="flex items-center gap-2 text-sm font-medium text-red-600 px-3 py-2 hover:bg-red-50 rounded-md transition-colors"
              >
                <LogOut size={16} /> ออกจากระบบ
              </button>
            ) : (
              <button 
                onClick={() => setView('admin')}
                className={`flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-md transition-colors ${view === 'admin' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <ShieldCheck size={16} /> สำหรับเจ้าหน้าที่
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-12">
        <AnimatePresence mode="wait">
          {/* User Submission View */}
          {view === 'user' && !submittedId && (
            <motion.div 
              key="user-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto"
            >
              <div className="text-center mb-10">
                <h1 className="text-4xl font-bold mb-4">ส่งความคิดเห็นของคุณ</h1>
                <p className="text-gray-500">เราพร้อมรับฟังปัญหาและช่วยเหลือคุณอย่างเต็มที่ ข้อมูลของคุณจะถูกเก็บเป็นความลับ</p>
              </div>

              <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <div className="mb-6">
                  <label className="block text-sm font-semibold mb-2 text-gray-700">ประเภทเรื่อง</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setCategory('problem')}
                      className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${category === 'problem' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-gray-100 hover:border-gray-200'}`}
                    >
                      <AlertCircle size={20} />
                      <span>แจ้งปัญหา</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCategory('help')}
                      className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${category === 'help' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-gray-100 hover:border-gray-200'}`}
                    >
                      <HelpCircle size={20} />
                      <span>ขอความช่วยเหลือ</span>
                    </button>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold mb-2 text-gray-700">รายละเอียด</label>
                  <textarea
                    required
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="เล่ารายละเอียดปัญหาหรือสิ่งที่คุณต้องการให้เราช่วย..."
                    className="w-full h-40 p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'กำลังส่ง...' : <><Send size={20} /> ส่งข้อมูล</>}
                </button>
              </form>
            </motion.div>
          )}

          {/* Success Submission View */}
          {submittedId && (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md mx-auto text-center bg-white p-10 rounded-3xl shadow-xl border border-indigo-50"
            >
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={40} />
              </div>
              <h2 className="text-2xl font-bold mb-2">ส่งข้อมูลเรียบร้อยแล้ว!</h2>
              <p className="text-gray-500 mb-8">กรุณาจดบันทึกรหัสติดตามเพื่อใช้ตรวจสอบสถานะในภายหลัง</p>
              
              <div className="bg-indigo-50 p-6 rounded-2xl mb-8">
                <span className="text-xs text-indigo-400 uppercase font-bold tracking-widest block mb-1">รหัสติดตามของคุณ</span>
                <span className="text-4xl font-mono font-bold text-indigo-600 tracking-wider">{submittedId}</span>
              </div>

              <button 
                onClick={() => { setSubmittedId(null); setView('track'); setTrackingId(submittedId); }}
                className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-colors"
              >
                ไปหน้าติดตามสถานะ
              </button>
            </motion.div>
          )}

          {/* Tracking View */}
          {view === 'track' && (
            <motion.div 
              key="track"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto"
            >
              <div className="text-center mb-10">
                <h1 className="text-3xl font-bold mb-4">ติดตามสถานะ Feedback</h1>
                <p className="text-gray-500">ใส่รหัสติดตามที่คุณได้รับเพื่อดูความคืบหน้า</p>
              </div>

              <form onSubmit={handleTrack} className="flex gap-2 mb-8">
                <input
                  required
                  type="text"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value.toUpperCase())}
                  placeholder="ใส่รหัสติดตาม (เช่น 7X9A2B...)"
                  className="flex-1 p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none uppercase font-mono"
                />
                <button 
                  type="submit"
                  disabled={loading}
                  className="bg-indigo-600 text-white px-8 rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  <Search size={20} />
                </button>
              </form>

              {error && <p className="text-red-500 text-center mb-4">{error}</p>}

              {trackedFeedback && (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">รหัส: {trackedFeedback.id}</span>
                      <h3 className="text-xl font-bold mt-1">
                        {trackedFeedback.category === 'problem' ? 'แจ้งปัญหา' : 'ขอความช่วยเหลือ'}
                      </h3>
                    </div>
                    {getStatusBadge(trackedFeedback.status)}
                  </div>
                  <div className="bg-gray-50 p-6 rounded-xl mb-6 text-gray-700 whitespace-pre-wrap border-l-4 border-indigo-200">
                    {trackedFeedback.content}
                  </div>
                  
                  {trackedFeedback.admin_reply && (
                    <div className="bg-indigo-50 p-6 rounded-xl mb-6 border-l-4 border-indigo-600">
                      <div className="flex items-center gap-2 mb-2 text-indigo-600 font-bold text-sm">
                        <ShieldCheck size={16} /> การตอบกลับจากเจ้าหน้าที่
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{trackedFeedback.admin_reply}</p>
                    </div>
                  )}

                  <div className="text-xs text-gray-400">
                    ส่งเมื่อ: {new Date(trackedFeedback.created_at).toLocaleString('th-TH')}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Admin Login View */}
          {view === 'admin' && !isAdmin && (
            <motion.div 
              key="admin-login"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md mx-auto"
            >
              <div className="bg-white p-10 rounded-3xl shadow-xl border border-gray-100 text-center">
                <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <ShieldCheck size={32} />
                </div>
                <h2 className="text-2xl font-bold mb-8">เข้าสู่ระบบเจ้าหน้าที่</h2>
                <form onSubmit={handleAdminLogin}>
                  <input
                    required
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="รหัสผ่าน"
                    className="w-full p-4 rounded-xl border border-gray-200 mb-4 focus:ring-2 focus:ring-indigo-500 outline-none text-center"
                  />
                  {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-colors"
                  >
                    {loading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* Admin Dashboard View */}
          {isAdmin && (
            <motion.div 
              key="admin-dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h1 className="text-3xl font-bold">จัดการ Feedback</h1>
                  <p className="text-gray-500">รายการทั้งหมดจากผู้ใช้งาน</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium">
                  ทั้งหมด {feedbacks.length} รายการ
                </div>
              </div>

              <div className="grid gap-6">
                {feedbacks.map((f) => (
                  <div key={f.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">{f.id}</span>
                          <span className={`text-xs font-bold px-2 py-1 rounded ${f.category === 'problem' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                            {f.category === 'problem' ? 'แจ้งปัญหา' : 'ขอความช่วยเหลือ'}
                          </span>
                          <span className="text-xs text-gray-400">{new Date(f.created_at).toLocaleString('th-TH')}</span>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap mb-4 font-medium">{f.content}</p>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(f.status)}
                        </div>
                      </div>
                      
                      <div className="flex md:flex-col justify-end gap-2 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                        <div className="flex flex-wrap gap-2">
                          <button 
                            onClick={() => updateStatus(f.id, 'pending')}
                            className={`p-2 rounded-lg transition-colors ${f.status === 'pending' ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                            title="รอดำเนินการ"
                          >
                            <Clock size={18} />
                          </button>
                          <button 
                            onClick={() => updateStatus(f.id, 'in-progress')}
                            className={`p-2 rounded-lg transition-colors ${f.status === 'in-progress' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                            title="กำลังดำเนินการ"
                          >
                            <AlertCircle size={18} />
                          </button>
                          <button 
                            onClick={() => updateStatus(f.id, 'resolved')}
                            className={`p-2 rounded-lg transition-colors ${f.status === 'resolved' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                            title="แก้ไขแล้ว"
                          >
                            <CheckCircle2 size={18} />
                          </button>
                          <button 
                            onClick={() => clearContent(f.id)}
                            className="p-2 rounded-lg bg-orange-50 text-orange-400 hover:bg-orange-500 hover:text-white transition-colors"
                            title="ลบข้อความในโพสต์"
                          >
                            <Trash2 size={18} />
                          </button>
                          <button 
                            onClick={() => deleteFeedback(f.id)}
                            className="p-2 rounded-lg bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                            title="ลบข้อมูลทั้งหมด"
                          >
                            <Settings size={18} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Reply Section */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      {editingReply?.id === f.id ? (
                        <div className="space-y-3">
                          <textarea
                            value={editingReply.text}
                            onChange={(e) => setEditingReply({ ...editingReply, text: e.target.value })}
                            placeholder="พิมพ์ข้อความตอบกลับ..."
                            className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm min-h-[100px]"
                          />
                          <div className="flex gap-2">
                            <button 
                              onClick={() => submitReply(f.id)}
                              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors"
                            >
                              บันทึกการตอบกลับ
                            </button>
                            <button 
                              onClick={() => setEditingReply(null)}
                              className="bg-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-300 transition-colors"
                            >
                              ยกเลิก
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">การตอบกลับ:</span>
                            <p className={`text-sm ${f.admin_reply ? 'text-gray-700' : 'text-gray-400 italic'}`}>
                              {f.admin_reply || 'ยังไม่มีการตอบกลับ'}
                            </p>
                          </div>
                          <button 
                            onClick={() => setEditingReply({ id: f.id, text: f.admin_reply || '' })}
                            className="text-indigo-600 text-sm font-bold hover:underline"
                          >
                            {f.admin_reply ? 'แก้ไขการตอบกลับ' : 'ตอบกลับ'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {feedbacks.length === 0 && (
                  <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                    <p className="text-gray-400">ยังไม่มีข้อมูล Feedback ในขณะนี้</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-4 py-12 border-t border-gray-200 text-center">
        <p className="text-gray-400 text-sm">© 2026 VibeFeedback. ข้อมูลของคุณปลอดภัยและเป็นความลับ</p>
      </footer>
    </div>
  );
}
