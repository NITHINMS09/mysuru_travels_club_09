'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiOutlineChatAlt2, HiOutlinePaperAirplane, HiOutlineDotsVertical, 
  HiOutlineEmojiHappy, HiOutlineMicrophone, HiOutlinePhotograph, 
  HiOutlinePaperClip, HiOutlineX, HiOutlineReply, HiOutlineTrash, HiOutlineStop
} from 'react-icons/hi';
import { getSocket } from '@/lib/socket';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import EmojiPicker from 'emoji-picker-react';

export default function TripChat() {
  const { id } = useParams();
  const router = useRouter();
  
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [trip, setTrip] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  
  // Advanced Chat States
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [showEmojis, setShowEmojis] = useState(false);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  
  // Voice Recording
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Refs
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const socket = getSocket();
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    const savedUser = localStorage.getItem('tripnova_user') || localStorage.getItem('tripnova_admin_token');
    let userData = {
      name: 'Explorer_' + Math.floor(Math.random() * 1000),
      email: 'guest@tripnova.com',
      avatar: ''
    };
    if (savedUser && savedUser.startsWith('{')) {
      userData = JSON.parse(savedUser);
    }
    setUser(userData);

    const fetchData = async () => {
      try {
        const tripData = await api.trips.getById(id as string);
        setTrip(tripData);
        const history = await api.chat.getMessages(id as string);
        setMessages(history.messages || []);
      } catch (err) {
        toast.error('Failed to load chat history');
      }
    };
    fetchData();

    // Connect socket before emitting
    if (!socket.connected) {
      socket.connect();
    }

    socket.emit('join_trip_chat', { tripId: id, userName: userData.name, userEmail: userData.email });

    socket.on('new_message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on('online_users', (users) => setOnlineUsers(users));
    
    socket.on('user_typing', ({ userName }) => {
      if (userName !== userData.name) {
        setTypingUsers(prev => Array.from(new Set([...prev, userName])));
      }
    });

    socket.on('user_stop_typing', ({ userName }) => {
      setTypingUsers(prev => prev.filter(u => u !== userName));
    });

    socket.on('message_deleted', ({ messageId }) => {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, deleted: true, content: 'This message was deleted' } : m));
    });

    socket.on('message_edited', (msg) => {
      setMessages(prev => prev.map(m => m.id === msg.id ? msg : m));
    });

    return () => {
      socket.off('new_message');
      socket.off('online_users');
      socket.off('user_typing');
      socket.off('user_stop_typing');
      socket.off('message_deleted');
      socket.off('message_edited');
    };
  }, [id, router]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', { tripId: id, userName: user.name });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('stop_typing', { tripId: id, userName: user.name });
    }, 2000);
  };

  const handleSendText = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !user) return;

    socket.emit('send_message', {
      tripId: id,
      content: newMessage,
      senderName: user.name,
      senderEmail: user.email,
      type: 'TEXT',
      replyToId: replyingTo?.id || null
    });

    setNewMessage('');
    setReplyingTo(null);
    setShowEmojis(false);
    socket.emit('stop_typing', { tripId: id, userName: user.name });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading('Uploading media...');
    try {
      const res = await api.upload.single(file);
      socket.emit('send_message', {
        tripId: id,
        content: file.type.startsWith('image/') ? '📷 Image' : '📎 File',
        senderName: user.name,
        senderEmail: user.email,
        type: file.type.startsWith('image/') ? 'IMAGE' : 'DOCUMENT',
        fileUrl: res.url,
        fileName: res.fileName,
        replyToId: replyingTo?.id || null
      });
      toast.success('Uploaded!', { id: toastId });
      setReplyingTo(null);
    } catch (err) {
      toast.error('Upload failed', { id: toastId });
    }
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([audioBlob], 'voice-note.webm', { type: 'audio/webm' });
        
        const toastId = toast.loading('Sending voice note...');
        try {
          const res = await api.upload.single(file);
          socket.emit('send_message', {
            tripId: id,
            content: '🎤 Voice Note',
            senderName: user.name,
            senderEmail: user.email,
            type: 'AUDIO',
            fileUrl: res.url,
            fileName: 'Voice Note'
          });
          toast.success('Sent!', { id: toastId });
        } catch (err) {
          toast.error('Failed to send voice note', { id: toastId });
        }
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      toast.error('Microphone access denied');
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  if (!trip || !user) return null;

  return (
    <div className="pt-24 h-screen bg-slate-50 flex flex-col overflow-hidden relative">
      
      {/* Chat Header */}
      <div className="px-8 py-4 border-b border-slate-200 bg-white/85 backdrop-blur-xl flex items-center justify-between z-20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-600 flex items-center justify-center font-bold overflow-hidden relative">
            <img src={trip.coverImage} className="absolute inset-0 w-full h-full object-cover opacity-50" />
            <span className="relative z-10 text-white">T</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#FFFFFF]" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>{trip.title}</h1>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <p className="text-xs text-slate-500 font-medium">
                {onlineUsers.length} online
              </p>
            </div>
          </div>
        </div>
        <button className="p-2 text-slate-400 hover:text-slate-800 transition-colors">
          <HiOutlineDotsVertical className="w-6 h-6" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar relative z-10">
        {messages.map((msg, i) => {
          const isMe = msg.senderEmail === user.email;
          const repliedMsg = msg.replyToId ? messages.find(m => m.id === msg.replyToId) : null;
          
          return (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={msg.id || i} 
              className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}
            >
              <div className={`max-w-[80%] md:max-w-[60%] ${isMe ? 'items-end' : 'items-start'} flex flex-col relative`}>
                
                {/* Reply Action */}
                <button 
                  onClick={() => setReplyingTo(msg)}
                  className={`absolute top-2 ${isMe ? '-left-8' : '-right-8'} opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-slate-800`}
                >
                  <HiOutlineReply />
                </button>

                {!isMe && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-2">{msg.senderName}</span>}
                
                <div className={`p-1 rounded-2xl shadow-sm ${isMe ? 'bg-gradient-to-br from-violet-600 to-blue-600 rounded-tr-none' : 'bg-white border border-slate-200/80 rounded-tl-none'}`}>
                  
                  {/* Threaded Reply Reference */}
                  {repliedMsg && (
                    <div className={`p-2 mb-2 rounded-lg text-xs border-l-2 ${isMe ? 'bg-black/10 border-white/30 text-white/90' : 'bg-slate-50 border-violet-500 text-slate-600'}`}>
                      <span className="font-bold opacity-75 block mb-1">{repliedMsg.senderName}</span>
                      <span className="truncate block max-w-[200px]">{repliedMsg.content}</span>
                    </div>
                  )}

                  {/* Message Content */}
                  <div className={`px-3 py-2 text-sm leading-relaxed relative ${isMe ? 'text-white' : 'text-slate-800'}`}>
                    {msg.deleted ? (
                      <span className="italic opacity-55 text-xs">🚫 {msg.content}</span>
                    ) : (
                      <>
                        {msg.type === 'IMAGE' && msg.fileUrl && (
                          <img src={msg.fileUrl.startsWith('http') ? msg.fileUrl : (process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') + msg.fileUrl)} alt="Upload" className="max-w-[250px] rounded-lg mb-2" />
                        )}
                        {msg.type === 'AUDIO' && msg.fileUrl && (
                          <audio controls className="h-10 max-w-[250px] mb-2">
                            <source src={msg.fileUrl.startsWith('http') ? msg.fileUrl : (process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') + msg.fileUrl)} type="audio/webm" />
                          </audio>
                        )}
                        {msg.type === 'DOCUMENT' && msg.fileUrl && (
                          <a href={msg.fileUrl.startsWith('http') ? msg.fileUrl : (process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') + msg.fileUrl)} target="_blank" rel="noreferrer" className={`flex items-center gap-2 p-3 rounded-lg mb-2 transition ${isMe ? 'bg-white/10 hover:bg-white/20' : 'bg-slate-50 border border-slate-100 hover:bg-slate-100'}`}>
                            <HiOutlinePaperClip className={`w-5 h-5 ${isMe ? 'text-white' : 'text-violet-600'}`} />
                            <span className="truncate max-w-[150px] text-xs font-bold">{msg.fileName}</span>
                          </a>
                        )}
                        {msg.type === 'TEXT' && <span>{msg.content}</span>}
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] text-slate-400 uppercase font-bold tracking-tighter">
                    {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {msg.isEdited && <span className="text-[9px] text-slate-400 italic">Edited</span>}
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Typing Indicator */}
        <AnimatePresence>
          {typingUsers.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex justify-start">
              <div className="bg-white border border-slate-200/80 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2 shadow-sm">
                <span className="text-xs text-slate-500 font-medium">{typingUsers.join(', ')} typing</span>
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-violet-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-violet-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-violet-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={scrollRef} />
      </div>

      {/* Reply Banner */}
      <AnimatePresence>
        {replyingTo && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="absolute bottom-[90px] left-0 right-0 px-8 z-20">
            <div className="max-w-4xl mx-auto bg-white border border-slate-200 border-t-2 border-t-violet-600 p-3 flex justify-between items-center rounded-t-xl shadow-lg">
              <div>
                <span className="text-xs text-violet-600 font-bold block mb-1">Replying to {replyingTo.senderName}</span>
                <p className="text-sm text-slate-600 truncate max-w-[300px]">{replyingTo.content}</p>
              </div>
              <button onClick={() => setReplyingTo(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-800"><HiOutlineX /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="p-4 md:p-8 bg-white/80 backdrop-blur-xl border-t border-slate-200 z-20 relative">
        <div className="max-w-4xl mx-auto flex gap-3 items-center">
          
          <div className="flex gap-2 text-slate-400">
            <div className="relative">
              <button onClick={() => setShowEmojis(!showEmojis)} className="p-3 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition">
                <HiOutlineEmojiHappy className="w-6 h-6" />
              </button>
              {showEmojis && (
                <div className="absolute bottom-16 left-0 shadow-xl z-50">
                  <EmojiPicker onEmojiClick={(e) => setNewMessage(p => p + e.emoji)} theme={"light" as any} />
                </div>
              )}
            </div>

            <button onClick={() => fileInputRef.current?.click()} className="p-3 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition">
              <HiOutlinePhotograph className="w-6 h-6" />
            </button>
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="image/*,application/pdf" />
          </div>

          <form onSubmit={handleSendText} className="flex-1">
            <input
              type="text"
              value={newMessage}
              onChange={handleTyping}
              placeholder="Type a message..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl h-14 px-5 text-slate-900 outline-none focus:border-violet-500 focus:bg-white transition-colors"
            />
          </form>

          {newMessage.trim() ? (
            <button onClick={handleSendText} className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center text-white shadow-md hover:shadow-lg transition-all scale-in">
              <HiOutlinePaperAirplane className="w-6 h-6 rotate-90 translate-y-[2px] -translate-x-[2px]" />
            </button>
          ) : (
            <button 
              onMouseDown={startVoiceRecording} 
              onMouseUp={stopVoiceRecording}
              onTouchStart={startVoiceRecording}
              onTouchEnd={stopVoiceRecording}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 text-white shadow-lg scale-110' : 'bg-slate-100 hover:bg-slate-200 text-slate-500'}`}
            >
              {isRecording ? <HiOutlineStop className="w-6 h-6 animate-pulse" /> : <HiOutlineMicrophone className="w-6 h-6" />}
            </button>
          )}

        </div>
      </div>
    </div>
  );
}
