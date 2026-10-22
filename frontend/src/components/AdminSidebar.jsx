import React from 'react';
import {
  Package,
  Receipt,
  TrendingUp,
  FileSpreadsheet,
  Plus,
  LogOut,
  Sparkles
} from 'lucide-react';

export default function AdminSidebar({
  activeTab,
  onSelectTab,
  stats,
  productsCount,
  categoriesCount,
  onOpenAddModal,
  onOpenExcelModal,
  adminUser,
  onLogout
}) {
  const formatCurrency = (val) => {
    return Number(val || 0).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  const navItems = [
    {
      id: 'inventory',
      label: 'Inventory',
      subtitle: 'Products & Pricing',
      icon: Package,
      badge: productsCount !== undefined ? `${productsCount}` : null,
      badgeColor: 'blue'
    },
    {
      id: 'sales',
      label: 'Sales & Orders',
      subtitle: 'Receipts & History',
      icon: Receipt,
      badge: stats?.todaySales ? `₱${formatCurrency(stats.todaySales)}` : null,
      badgeColor: 'green'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      subtitle: 'Valuation & Trends',
      icon: TrendingUp,
      badge: stats?.lowStockCount > 0 ? `${stats.lowStockCount} alert` : null,
      badgeColor: 'red'
    },
    {
      id: 'excel',
      label: 'Import Excel',
      subtitle: 'Bulk Spreadsheet',
      icon: FileSpreadsheet,
      badge: 'Upload',
      badgeColor: 'emerald',
      isAction: true,
      onClick: onOpenExcelModal
    }
  ];

  return (
    <aside className="admin-sidebar">
      {/* Sidebar Header */}
      <div className="admin-sidebar-header">
        <div className="admin-sidebar-brand">
          <div>
            <span className="admin-brand-title">Admin Hub</span>
            <span className="admin-brand-subtitle">Control Center</span>
          </div>
        </div>
      </div>

      {/* Quick Action Button: Add New Item */}
      <div className="admin-sidebar-actions">
        <button
          className="admin-sidebar-primary-btn"
          onClick={onOpenAddModal}
          title="Create new inventory item"
        >
          <Plus size={16} />
          <span>Add New Item</span>
        </button>
      </div>

      {/* Navigation Section */}
      <div className="admin-sidebar-section-label">
        Navigation
      </div>

      <nav className="admin-sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const handleClick = () => {
            if (item.isAction && item.onClick) {
              item.onClick();
            } else {
              onSelectTab(item.id);
            }
          };

          return (
            <button
              key={item.id}
              className={`admin-nav-item ${isActive ? 'active' : ''}`}
              onClick={handleClick}
            >
              <div className="admin-nav-item-left">
                <span className={`admin-nav-icon-wrap ${isActive ? 'active' : ''}`}>
                  <Icon size={18} />
                </span>
                <div className="admin-nav-text">
                  <span className="admin-nav-label">{item.label}</span>
                  <span className="admin-nav-sub">{item.subtitle}</span>
                </div>
              </div>

              {item.badge && (
                <span className={`admin-nav-badge badge-${item.badgeColor || 'slate'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Flexible Spacer */}
      <div style={{ flex: 1, minHeight: '1.5rem' }} />

      {/* Sidebar Footer with Admin Profile & Logout */}
      <div className="admin-sidebar-footer">
        <div className="admin-user-card">
          <div className="admin-user-avatar" title={adminUser?.fullName || adminUser?.username || 'Admin'}>
            {adminUser?.username ? adminUser.username.slice(0, 2).toUpperCase() : 'AD'}
          </div>
          <div className="admin-user-info">
            <span className="admin-user-name">
              {adminUser?.fullName || adminUser?.username || 'Administrator'}
            </span>
            <span className="admin-user-role">Store Manager</span>
          </div>
          <button
            onClick={onLogout}
            className="admin-logout-icon-btn"
            title="Logout from Admin"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
