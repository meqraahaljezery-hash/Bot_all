import React, { useState } from 'react';
import { SupportTicket } from '../types';
import { MessageSquare, Send, CheckCircle2, Phone, Mail, Clock } from 'lucide-react';

interface SupportManagerProps {
  tickets: SupportTicket[];
  onReplyTicket: (ticketId: string, replyText: string) => void;
  onResolveTicket: (ticketId: string) => void;
}

export const SupportManager: React.FC<SupportManagerProps> = ({
  tickets,
  onReplyTicket,
  onResolveTicket,
}) => {
  const [selectedTicketId, setSelectedTicketId] = useState<string>(tickets[0]?.id || '');
  const [replyInput, setReplyInput] = useState('');

  const activeTicket = tickets.find((t) => t.id === selectedTicketId);

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !replyInput.trim()) return;

    onReplyTicket(activeTicket.id, replyInput.trim());
    setReplyInput('');
  };

  return (
    <div className="space-y-6">
      
      {/* Header with Official Info */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 font-['Amiri',serif]">
            تذاكر الدعم الفني وخدمة المستفيدين
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            الرد المباشر على استفسارات الطلاب ومتابعة حل المشاكل الفنية والأكاديمية
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs bg-emerald-50 text-emerald-900 px-3.5 py-2 rounded-xl border border-emerald-200">
          <div className="flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-emerald-700" />
            <span dir="ltr" className="font-bold">0990161372</span>
          </div>
          <div className="w-px h-3 bg-emerald-300"></div>
          <div className="flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-emerald-700" />
            <span dir="ltr" className="font-bold">kalidahd7@gmil.com</span>
          </div>
        </div>
      </div>

      {/* Split View: Tickets List on Right, Chat on Left */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[550px]">
        
        {/* Ticket List */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-y-auto divide-y divide-stone-100">
          {tickets.map((tkt) => {
            const isSelected = tkt.id === selectedTicketId;
            return (
              <div
                key={tkt.id}
                onClick={() => setSelectedTicketId(tkt.id)}
                className={`p-4 cursor-pointer transition-colors text-right ${
                  isSelected ? 'bg-emerald-50/60 border-r-4 border-r-[#105C3B]' : 'hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs font-bold text-stone-500">{tkt.ticket_number}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      tkt.status === 'open'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {tkt.status === 'open' ? 'مفتوحة' : 'تم الحل'}
                  </span>
                </div>
                <h4 className="font-bold text-stone-900 text-sm mb-1">{tkt.subject}</h4>
                <div className="flex items-center justify-between text-xs text-stone-400">
                  <span>{tkt.student_name}</span>
                  <span>{tkt.created_at}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Conversation Thread */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-stone-200 shadow-xs flex flex-col justify-between overflow-hidden">
          {activeTicket ? (
            <>
              {/* Thread Header */}
              <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-emerald-700">{activeTicket.ticket_number}</span>
                    <h3 className="font-bold text-stone-900 text-sm">{activeTicket.subject}</h3>
                  </div>
                  <div className="text-xs text-stone-500 mt-0.5">
                    الطالب: <strong className="text-stone-800">{activeTicket.student_name}</strong> (TG: {activeTicket.telegram_id})
                  </div>
                </div>

                {activeTicket.status === 'open' && (
                  <button
                    onClick={() => onResolveTicket(activeTicket.id)}
                    className="text-xs bg-stone-100 hover:bg-emerald-50 text-stone-700 hover:text-emerald-700 px-3 py-1.5 rounded-lg border border-stone-200 cursor-pointer transition-colors flex items-center gap-1 font-semibold"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>إغلاق التذكرة كـ "محلولة"</span>
                  </button>
                )}
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-stone-50/20">
                {activeTicket.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[80%] ${
                      msg.is_admin ? 'mr-auto items-start' : 'ml-auto items-end'
                    }`}
                  >
                    <div className="text-[11px] font-semibold text-stone-400 mb-1 px-1">
                      {msg.sender} • {msg.time}
                    </div>
                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed shadow-xs ${
                        msg.is_admin
                          ? 'bg-[#105C3B] text-white rounded-tr-xs'
                          : 'bg-white text-stone-800 border border-stone-200 rounded-tl-xs'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendReply} className="p-3 border-t border-stone-100 bg-white flex items-center gap-2">
                <input
                  type="text"
                  placeholder="اكتب ردك على الطالب وسيصل إليه كإشعار في تيليجرام..."
                  value={replyInput}
                  onChange={(e) => setReplyInput(e.target.value)}
                  className="flex-1 text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
                <button
                  type="submit"
                  disabled={!replyInput.trim()}
                  className="bg-[#105C3B] hover:bg-[#18794E] disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>إرسال الرد</span>
                </button>
              </form>
            </>
          ) : (
            <div className="p-8 text-center text-stone-400">
              اختر تذكرة من القائمة لمشاهدة المحادثة.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
