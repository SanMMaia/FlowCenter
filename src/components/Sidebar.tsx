import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  FaHome, FaClipboard, FaCalendarAlt, FaClipboardList, FaCog, FaSignOutAlt, FaHeadset,
  FaChevronLeft, FaChevronRight, FaQuestionCircle, FaChartLine 
} from 'react-icons/fa';
import { checkUserRole } from '@/lib/auth';

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState) {
      setCollapsed(JSON.parse(savedState));
    }
  }, []);

  useEffect(() => {
    const checkAdmin = async () => {
      console.log('Verificando permissões...');
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Usuário:', user?.email);
      
      if (user) {
        const adminStatus = await checkUserRole('admin');
        console.log('É admin?', adminStatus);
        setIsAdmin(adminStatus);
      }
    };
    
    checkAdmin();
  }, []);

  const toggleSidebar = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth/login';
  };

  const menuItems = [
    { name: 'Dashboard', icon: <FaHome />, path: '/dashboard' },
    { name: 'Sacmais', icon: <FaHeadset />, path: '/sacmais' },
    { name: 'Atendimentos', icon: <FaClipboard />, path: '/services' },
    { name: 'Agendamentos', icon: <FaCalendarAlt />, path: '/schedules' },
    { name: 'Solicitações', icon: <FaClipboardList />, path: '/requests' },
    { name: 'Monitoramento', icon: <FaChartLine />, path: '/admin/monitor' },
    { name: 'Suporte', icon: <FaQuestionCircle />, path: '/suporte' },
    { name: 'Configurações', icon: <FaCog />, path: '/settings' }
  ];

  return (
    <div className={`d-flex flex-column bg-light ${collapsed ? 'sidebar-collapsed' : 'sidebar-expanded'} border-end`} style={{ height: '100vh', transition: 'width 0.3s' }}>
      <div className="p-3 d-flex justify-content-between align-items-center border-bottom">
        {!collapsed && <h5 className="mb-0 text-dark">FlowCenter</h5>}
        <button 
          className="btn btn-sm"
          onClick={toggleSidebar}
        >
          {collapsed ? <FaChevronRight className="text-dark" /> : <FaChevronLeft className="text-dark" />}
        </button>
      </div>
      <div className="flex-grow-1 overflow-auto">
        {menuItems.map((item) => (
          <Link 
            key={item.name} 
            href={item.path}
            className="d-flex align-items-center p-3 text-dark text-decoration-none slide-up hover-scale"
          >
            <span className="me-3">{item.icon}</span>
            {!collapsed && <span>{item.name}</span>}
          </Link>
        ))}
      </div>
      <div className="p-3 border-top">
        <button 
          className="btn btn-sm w-100 d-flex align-items-center text-dark"
          onClick={handleLogout}
        >
          <FaSignOutAlt className="me-2" />
          {!collapsed && 'Sair'}
        </button>
      </div>
    </div>
  );
}
