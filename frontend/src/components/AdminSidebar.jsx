import React from 'react';
import {
  Package,
  Receipt,
  FolderTree,
  TrendingUp,
  FileSpreadsheet,
  Plus,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sparkles
} from 'lucide-react';

export default function AdminSidebar({
  activeTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
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
      id: 'categories',
      label: 'Categories',
      subtitle: 'Product Groups',
      icon: FolderTree,
      badge: categoriesCount !== undefined ? `${categoriesCount}` : null,
      badgeColor: 'slate'
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
    <aside className={`admin-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Sidebar Header */}
      <div className="admin-sidebar-header">
        {!isCollapsed && (
          <div className="admin-sidebar-brand">
            <div>
              <span className="admin-brand-title">Admin Hub</span>
              <span className="admin-brand-subtitle">Control Center</span>
            </div>
          </div>
        )}
        <button
          className="admin-collapse-toggle"
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Quick Action Button: Add New Item */}
      {!isCollapsed ? (
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
      ) : (
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <button
            className="admin-collapse-action-btn"
            onClick={onOpenAddModal}
            title="Add New Item"
          >
            <Plus size={18} />
          </button>
        </div>
      )}

      {/* Navigation Section */}
      <div className="admin-sidebar-section-label">
        {!isCollapsed ? 'Navigation' : '•••'}
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
              title={isCollapsed ? `${item.label} — ${item.subtitle}` : undefined}
            >
              <div className="admin-nav-item-left">
                <span className={`admin-nav-icon-wrap ${isActive ? 'active' : ''}`}>
                  <Icon size={18} />
                </span>
                {!isCollapsed && (
                  <div className="admin-nav-text">
                    <span className="admin-nav-label">{item.label}</span>
                    <span className="admin-nav-sub">{item.subtitle}</span>
                  </div>
                )}
              </div>

              {!isCollapsed && item.badge && (
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
          {!isCollapsed && (
            <div className="admin-user-info">
              <span className="admin-user-name">
                {adminUser?.fullName || adminUser?.username || 'Administrator'}
              </span>
              <span className="admin-user-role">Store Manager</span>
            </div>
          )}
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
