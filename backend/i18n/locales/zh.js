// ============ 中文翻译 ============
module.exports = {
  // ---- 通用 ----
  common: {
    success: '成功',
    error: '错误',
    not_found: '未找到',
    unauthorized: '未授权',
    forbidden: '权限不足',
    validation_failed: '验证失败',
    created: '创建成功',
    updated: '更新成功',
    deleted: '删除成功',
    too_many_requests: '请求过于频繁，请稍后重试',
    server_error: '服务器内部错误',
    bad_request: '请求无效'
  },

  // ---- 认证 ----
  auth: {
    invalid_credentials: '凭据无效',
    no_token: '未提供令牌',
    token_expired: '令牌无效或已过期',
    username_exists: '用户名已存在',
    password_changed: '密码修改成功',
    cannot_delete_self: '不能删除自己的账户',
    login_rate_limit: '登录尝试次数过多，请15分钟后重试',
    required_role: '需要角色: {{roles}}'
  },

  // ---- 物业 ----
  props: {
    not_found: '物业未找到',
    created: '物业创建成功',
    deleted: '物业删除成功'
  },

  // ---- 租户 ----
  tenants: {
    not_found: '租户未找到',
    created: '租户创建成功',
    deleted: '租户删除成功'
  },

  // ---- 工单 ----
  tickets: {
    not_found: '工单未找到',
    created: '工单创建成功',
    deleted: '工单删除成功',
    status_updated: '工单状态已更新为 {{status}}'
  },

  // ---- 账单 ----
  bills: {
    not_found: '账单未找到',
    created: '账单创建成功',
    deleted: '账单删除成功',
    already_paid: '账单已支付',
    paid: '账单支付成功',
    generated: '已生成 {{count}} 张发票'
  },

  // ---- 供应商 ----
  vendors: {
    not_found: '供应商未找到',
    created: '供应商创建成功',
    deleted: '供应商删除成功'
  },

  // ---- 工作指令 ----
  work_orders: {
    not_found: '工作指令未找到',
    created: '工作指令创建成功',
    deleted: '工作指令删除成功',
    status_updated: '工作指令状态已更新为 {{status}}'
  },

  // ---- 潜客 ----
  leads: {
    not_found: '潜客未找到',
    created: '潜客创建成功',
    deleted: '潜客删除成功'
  },

  // ---- 业主 ----
  landlords: {
    not_found: '业主未找到',
    created: '业主创建成功',
    deleted: '业主删除成功'
  },

  // ---- 合同 ----
  contracts: {
    not_found: '合同未找到',
    created: '合同创建成功',
    deleted: '合同删除成功',
    signed: '合同签署成功'
  },

  // ---- 水电账单 ----
  utility_bills: {
    not_found: '水电账单未找到',
    paid: '水电账单已支付',
    generated: '已生成 {{count}} 张水电账单'
  },

  // ---- 物联网 ----
  iot: {
    meter_not_found: '电表未找到',
    lock_not_found: '门锁未找到',
    disconnected: '电表已断开',
    reconnected: '电表已重连',
    lock_toggled: '门锁已切换',
    fingerprint_disabled: '指纹访问已禁用',
    fingerprint_enabled: '指纹访问已启用'
  },

  // ---- 杂项 ----
  misc: {
    record_not_found: '记录未找到',
    notif_not_found: '通知未找到',
    automation_not_found: '自动化未找到',
    config_not_found: '配置未找到',
    data_reset: '所有数据已重置为演示状态',
    data_saved: '数据保存成功'
  },

  // ---- 报表 ----
  reports: {
    owner_report: '业主报表',
    portfolio_report: '资产组合报表',
    generated: '报表已生成',
    no_data: '没有可用于报表的数据'
  },

  // ---- 审计 ----
  audit: {
    create: '创建了 {{entity}}',
    update: '更新了 {{entity}}',
    delete: '删除了 {{entity}}',
    login: '用户登录',
    password_change: '密码已更改',
    data_reset: '系统数据已重置',
    status_change: '状态已更改为 {{status}}'
  }
};
