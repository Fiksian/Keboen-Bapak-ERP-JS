import React from 'react';
import { Mail, Phone, MapPin, Building2, User, Trash2 } from 'lucide-react';

const ContactCard = ({ contact, onDelete }) => {
  const isSupplier = contact.type === 'Supplier';

  return (
    <div className="group bg-white rounded-[32px] md:rounded-4xl border border-gray-100 p-5 md:p-6 shadow-sm hover:shadow-xl hover:border-[#8da070]/20 transition-all duration-300 relative overflow-hidden">
      <div className={`absolute top-0 right-0 px-5 md:px-6 py-2 rounded-bl-3xl text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] ${
        contact.type === 'Customer' ? 'bg-blue-50 text-blue-500' : 'bg-[#8da070]/10 text-[#8da070]'
      }`}>
        {contact.type}
      </div>

      <div className="flex items-start gap-4 mb-6">
        <div className="w-14 h-14 md:w-16 md:h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-[#8da070]/10 group-hover:text-[#8da070] transition-colors shrink-0">
          {isSupplier ? <Building2 size={28} /> : <User size={28} />}
        </div>
        <div className="pr-12 md:pr-16">
          <h3 className="font-black text-gray-900 text-base md:text-lg leading-tight mb-1 truncate">{contact.name}</h3>
          <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-wider">
            PIC: <span className="text-gray-600 italic">{contact.contactPerson || '-'}</span>
          </p>
        </div>
      </div>

      <div className="space-y-3 mb-6 md:mb-8">
        <DetailItem icon={<Mail size={14} />} text={contact.email} />
        <DetailItem icon={<Phone size={14} />} text={contact.phone} />
        <DetailItem icon={<MapPin size={14} />} text={contact.address} />
      </div>

      <div className="flex gap-2 border-t border-gray-50 pt-5 md:pt-6">
        <button 
          onClick={() => onDelete(contact.id, contact.name)}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-50 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all active:scale-95"
        >
          <Trash2 size={14} /> Hapus Kontak
        </button>
      </div>
    </div>
  );
};

const DetailItem = ({ icon, text }) => (
  <div className="flex items-center gap-3 text-xs text-gray-500 font-bold group/item">
    <div className="text-gray-300 group-hover/item:text-[#8da070] transition-colors shrink-0">{icon}</div>
    <span className="truncate">{text || '-'}</span>
  </div>
);

export default ContactCard;